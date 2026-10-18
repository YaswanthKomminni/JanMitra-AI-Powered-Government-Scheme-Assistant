import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { dbQuery, DatabaseError } from "@/lib/db";
import { mapUserRow, PUBLIC_USER_COLUMNS } from "@/lib/userProfile";
import type { FarmerProfile } from "@/lib/mockData";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export const SESSION_COOKIE = "janmitra_session";
const SESSION_TTL_DAYS = Math.max(1, Number(process.env.SESSION_TTL_DAYS) || 7);
const BCRYPT_COST = Math.min(14, Math.max(10, Number(process.env.BCRYPT_COST) || 12));

function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

/** Normalise an Indian mobile number to 10 digits, or return null. */
export function normalizePhone(raw: unknown): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function normalizeEmail(raw: unknown): string | null {
  const e = String(raw ?? "").trim().toLowerCase();
  if (!e) return null;
  if (e.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "invalid";
  return e;
}

/** Returns an error message, or null if the password is acceptable. */
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length === 0) return "Password is required.";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (Buffer.byteLength(pw, "utf8") > 72) return "Password is too long (max 72 characters).";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain at least one letter and one number.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Passwords (bcrypt)                                                  */
/* ------------------------------------------------------------------ */

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
// Used to keep response time similar when the account does not exist.
const DUMMY_HASH = bcrypt.hashSync("janmitra-timing-equaliser", 10);

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_COST);
}

export function isBcryptHash(value: unknown): value is string {
  return typeof value === "string" && BCRYPT_RE.test(value);
}

export async function verifyPassword(pw: string, hash: string | null | undefined): Promise<boolean> {
  if (!isBcryptHash(hash)) {
    await bcrypt.compare(pw, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(pw, hash);
}

/* ------------------------------------------------------------------ */
/* Sessions (opaque random token in an HTTP-only cookie, hash in MySQL) */
/* ------------------------------------------------------------------ */

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number, userAgent: string | null) {
  const token = crypto.randomBytes(32).toString("base64url");
  await dbQuery(
    `INSERT INTO user_sessions (user_id, token_hash, user_agent, expires_at)
     VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY))`,
    [userId, hashToken(token), userAgent ? userAgent.slice(0, 255) : null, SESSION_TTL_DAYS]
  );
  // Opportunistic cleanup of expired sessions for this user.
  dbQuery("DELETE FROM user_sessions WHERE user_id = ? AND expires_at <= CURRENT_TIMESTAMP", [userId]).catch(
    () => undefined
  );
  return { token, maxAgeSeconds: SESSION_TTL_DAYS * 24 * 60 * 60 };
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  await dbQuery("DELETE FROM user_sessions WHERE token_hash = ?", [hashToken(token)]);
}

export function setSessionCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === SESSION_COOKIE) {
      const v = rest.join("=");
      return v && v.length <= 128 ? decodeURIComponent(v) : null;
    }
  }
  return null;
}

export interface AuthUser {
  /** Numeric primary key in `users`. Server-side only; derived from the session. */
  dbId: number;
  profile: FarmerProfile;
}

/**
 * Resolve the signed-in user from the session cookie.
 * Returns null when there is no valid session. Throws DatabaseError if MySQL is down.
 */
export async function getSessionUser(request: Request): Promise<AuthUser | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const rows = await dbQuery<any[]>(
    `SELECT s.id AS session_id, s.last_seen_at, ${PUBLIC_USER_COLUMNS}
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1`,
    [hashToken(token)]
  );
  if (!rows.length) return null;
  const row = rows[0];
  // Touch last_seen_at at most every 5 minutes.
  const lastSeen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
  if (Date.now() - lastSeen > 5 * 60 * 1000) {
    dbQuery("UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?", [row.session_id]).catch(
      () => undefined
    );
  }
  return { dbId: Number(row.id), profile: mapUserRow(row) };
}

/**
 * Guard for protected API routes. Usage:
 *   const auth = await requireUser(request);
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireUser(request: Request): Promise<AuthUser | NextResponse> {
  const originError = checkSameOrigin(request);
  if (originError) return originError;
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "AUTH_REQUIRED",
          message: "Please sign in or create an account to use the JanMithra assistant.",
        },
        { status: 401 }
      );
    }
    return user;
  } catch (err) {
    console.error("[auth] session lookup failed:", (err as Error).message);
    return serviceUnavailable();
  }
}

export function serviceUnavailable(message = "The JanMithra database is unavailable right now. Please try again shortly.") {
  return NextResponse.json({ success: false, code: "DB_UNAVAILABLE", message }, { status: 503 });
}

export function isDbError(err: unknown): err is DatabaseError {
  return err instanceof DatabaseError;
}

/**
 * CSRF defence in depth (cookies are already SameSite=Lax): reject
 * state-changing requests whose Origin header names a different host.
 */
export function checkSameOrigin(request: Request): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    if (host && new URL(origin).host === host) return null;
  } catch {
    /* fall through */
  }
  return NextResponse.json({ success: false, message: "Cross-site request blocked." }, { status: 403 });
}

/* ------------------------------------------------------------------ */
/* Simple in-memory rate limiting (per server process)                 */
/* ------------------------------------------------------------------ */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip")) || "local";
}

/** Returns seconds to wait if the limit is exceeded, otherwise 0. */
export function rateLimit(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      buckets.forEach((v, k) => {
        if (v.resetAt <= now) buckets.delete(k);
      });
    }
    return 0;
  }
  b.count += 1;
  return b.count > limit ? Math.ceil((b.resetAt - now) / 1000) : 0;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
