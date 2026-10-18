import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import {
  checkSameOrigin,
  clientIp,
  createSession,
  isBcryptHash,
  isDbError,
  normalizePhone,
  rateLimit,
  resetRateLimit,
  serviceUnavailable,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { PUBLIC_USER_COLUMNS, mapUserRow } from "@/lib/userProfile";

export const dynamic = "force-dynamic";

const INVALID = "Incorrect mobile number or password.";

export async function POST(request: Request) {
  const originError = checkSameOrigin(request);
  if (originError) return originError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const phone = normalizePhone(body?.phone);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!phone) {
    return NextResponse.json(
      { success: false, message: "Please enter your 10-digit mobile number.", field: "phone" },
      { status: 400 }
    );
  }
  if (!password) {
    return NextResponse.json(
      { success: false, message: "Please enter your password.", field: "password" },
      { status: 400 }
    );
  }

  const ip = clientIp(request);
  const limitKey = `login:${ip}:${phone}`;
  const wait = Math.max(rateLimit(limitKey, 8, 15 * 60 * 1000), rateLimit(`login-ip:${ip}`, 60, 15 * 60 * 1000));
  if (wait) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many sign-in attempts. Please wait ${Math.ceil(wait / 60)} minutes and try again.`,
      },
      { status: 429 }
    );
  }

  try {
    const rows = await dbQuery<any[]>(
      `SELECT u.password_hash, ${PUBLIC_USER_COLUMNS} FROM users u WHERE u.phone = ? LIMIT 1`,
      [phone]
    );
    const row = rows[0];

    if (row && !isBcryptHash(row.password_hash)) {
      // Account created before real authentication existed (its plaintext
      // password was cleared by the migration). It cannot be used until an
      // administrator sets a password.
      await verifyPassword(password, null);
      return NextResponse.json(
        {
          success: false,
          code: "PASSWORD_NOT_SET",
          message:
            "This account was created before passwords were required. Please ask the JanMithra administrator to set a password for it.",
        },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, row?.password_hash);
    if (!row || !ok) {
      return NextResponse.json({ success: false, message: INVALID }, { status: 401 });
    }

    resetRateLimit(limitKey);
    const userId = Number(row.id);
    const session = await createSession(userId, request.headers.get("user-agent"));
    dbQuery("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]).catch(() => undefined);

    const res = NextResponse.json({
      success: true,
      message: `Welcome back, ${row.name}!`,
      user: mapUserRow(row),
    });
    setSessionCookie(res, session.token, session.maxAgeSeconds);
    return res;
  } catch (err) {
    console.error("[login] failed:", (err as Error).message);
    if (isDbError(err)) {
      return serviceUnavailable("Sign-in is unavailable because the database cannot be reached. Please try again.");
    }
    return NextResponse.json({ success: false, message: "Sign-in failed due to a server error." }, { status: 500 });
  }
}
