import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import {
  checkSameOrigin,
  clientIp,
  createSession,
  hashPassword,
  isDbError,
  normalizeEmail,
  normalizePhone,
  passwordProblem,
  rateLimit,
  serviceUnavailable,
  setSessionCookie,
} from "@/lib/auth";
import {
  DEFAULT_AVATAR,
  IRRIGATION_TYPES,
  LANGUAGE_CODES,
  PUBLIC_USER_COLUMNS,
  SOIL_TYPES,
  mapUserRow,
} from "@/lib/userProfile";

export const dynamic = "force-dynamic";

function bad(message: string, field?: string, status = 400) {
  return NextResponse.json({ success: false, message, field }, { status });
}

function optionalText(v: unknown, max: number): string | null | undefined {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? undefined : s;
}

export async function POST(request: Request) {
  const originError = checkSameOrigin(request);
  if (originError) return originError;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  // ---- Required fields -------------------------------------------------
  const name = String(body?.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2) return bad("Please enter your full name.", "name");
  if (name.length > 100) return bad("Name is too long (max 100 characters).", "name");

  const phone = normalizePhone(body?.phone);
  if (!phone) return bad("Please enter a valid 10-digit Indian mobile number.", "phone");

  const email = normalizeEmail(body?.email);
  if (email === "invalid") return bad("Please enter a valid email address, or leave it empty.", "email");

  const password = body?.password;
  const pwError = passwordProblem(password);
  if (pwError) return bad(pwError, "password");
  if (password !== body?.confirmPassword) return bad("Passwords do not match.", "confirmPassword");

  // ---- Optional farmer profile fields ---------------------------------
  const state = optionalText(body?.state, 60);
  const district = optionalText(body?.district, 60);
  const village = optionalText(body?.village, 100);
  const primaryCrops = optionalText(
    Array.isArray(body?.primaryCrops) ? body.primaryCrops.join(", ") : body?.primaryCrops,
    255
  );
  const incomeSlab = optionalText(body?.annualIncomeSlab, 50);
  if ([state, district, village, primaryCrops, incomeSlab].includes(undefined)) {
    return bad("One of the profile fields is too long.");
  }

  let landSize: number | null = null;
  if (body?.landSizeAcres !== undefined && body?.landSizeAcres !== null && String(body.landSizeAcres).trim() !== "") {
    landSize = Number(body.landSizeAcres);
    if (!Number.isFinite(landSize) || landSize < 0 || landSize > 999) {
      return bad("Land size must be a number between 0 and 999 acres.", "landSizeAcres");
    }
    landSize = Math.round(landSize * 100) / 100;
  }

  const soilType = body?.soilType ? String(body.soilType) : null;
  if (soilType && !(SOIL_TYPES as readonly string[]).includes(soilType)) return bad("Unknown soil type.", "soilType");
  const irrigationType = body?.irrigationType ? String(body.irrigationType) : null;
  if (irrigationType && !(IRRIGATION_TYPES as readonly string[]).includes(irrigationType)) {
    return bad("Unknown irrigation type.", "irrigationType");
  }
  const preferredLanguage = (LANGUAGE_CODES as readonly string[]).includes(body?.preferredLanguage)
    ? String(body.preferredLanguage)
    : "en";

  // Only well-formed attempts count, so typos don't lock anyone out. Shared
  // kiosks (e.g. a CSC centre) sit behind one IP, hence a configurable limit.
  const perHour = Math.max(1, Number(process.env.SIGNUP_RATE_LIMIT_PER_HOUR) || 30);
  const wait = rateLimit(`signup:${clientIp(request)}`, perHour, 60 * 60 * 1000);
  if (wait) {
    return bad(`Too many sign-up attempts from this network. Please try again in ${Math.ceil(wait / 60)} minutes.`, undefined, 429);
  }

  try {
    // ---- Duplicate checks (friendly messages) --------------------------
    const existing = await dbQuery<any[]>(
      "SELECT phone, email FROM users WHERE phone = ? OR (? IS NOT NULL AND email = ?) LIMIT 2",
      [phone, email, email]
    );
    if (existing.some((r) => r.phone === phone)) {
      return bad("An account with this mobile number already exists. Please sign in instead.", "phone", 409);
    }
    if (email && existing.some((r) => String(r.email || "").toLowerCase() === email)) {
      return bad("An account with this email address already exists. Please sign in instead.", "email", 409);
    }

    const passwordHash = await hashPassword(password);

    let insertId: number;
    try {
      const result = await dbQuery<any>(
        `INSERT INTO users (
           name, phone, email, password_hash, role,
           state, district, village, land_size_acres,
           soil_type, irrigation_type, primary_crops,
           annual_income_slab, preferred_language, verified_docs_count, avatar_url, last_login_at
         ) VALUES (?, ?, ?, ?, 'farmer', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          name,
          phone,
          email,
          passwordHash,
          state,
          district,
          village,
          landSize,
          soilType,
          irrigationType,
          primaryCrops,
          incomeSlab,
          preferredLanguage,
          DEFAULT_AVATAR,
        ]
      );
      insertId = Number(result.insertId);
    } catch (err: any) {
      // Two sign-ups racing for the same phone/email.
      if (err?.code === "ER_DUP_ENTRY") {
        return bad("An account with these details already exists. Please sign in instead.", undefined, 409);
      }
      throw err;
    }

    const rows = await dbQuery<any[]>(`SELECT ${PUBLIC_USER_COLUMNS} FROM users u WHERE u.id = ?`, [insertId]);
    const session = await createSession(insertId, request.headers.get("user-agent"));

    const res = NextResponse.json(
      {
        success: true,
        message: "Your JanMithra account has been created and you are now signed in.",
        user: mapUserRow(rows[0]),
      },
      { status: 201 }
    );
    setSessionCookie(res, session.token, session.maxAgeSeconds);
    return res;
  } catch (err) {
    console.error("[signup] failed:", (err as Error).message);
    if (isDbError(err)) {
      return serviceUnavailable("We could not save your account because the database is unavailable. Please try again.");
    }
    return bad("Registration failed due to a server error. Please try again.", undefined, 500);
  }
}
