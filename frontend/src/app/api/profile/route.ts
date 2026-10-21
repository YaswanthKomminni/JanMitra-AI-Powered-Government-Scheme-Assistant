import { NextResponse } from "next/server";
import { requireUser, normalizeEmail, normalizePhone } from "@/lib/auth";
import { dbQuery, withTransaction, isUniqueViolation } from "@/lib/db";
import { PUBLIC_USER_COLUMNS, mapUserRow, SOIL_TYPES, IRRIGATION_TYPES, LANGUAGE_CODES } from "@/lib/userProfile";
import { ensureProfileStorage } from "@/lib/profileStorage";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const auth = await requireUser(request); if (auth instanceof NextResponse) return auth;
  try {
    await ensureProfileStorage();
    const rows = await dbQuery<any[]>("SELECT share_contact FROM farmer_preferences WHERE user_id=$1", [auth.dbId]);
    return NextResponse.json({ user: auth.profile, shareContact: rows[0]?.share_contact === true }, { headers });
  } catch { return NextResponse.json({ message: "Profile settings could not load. Please retry." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  const auth = await requireUser(request); if (auth instanceof NextResponse) return auth;
  try {
    const b = await request.json();
    const text = (v: unknown, max: number) => { if (typeof v !== "string" || v.length > max) throw new Error("Invalid profile field."); return v.trim(); };
    const name = text(b.name, 100), phone = normalizePhone(b.phone), email = normalizeEmail(b.email);
    if (name.length < 2 || !phone || email === "invalid") throw new Error("Enter your name, a valid Indian mobile number and an optional valid email.");
    const state = text(b.state, 60), district = text(b.district, 60), village = text(b.village, 100);
    const crops = text(b.primaryCrops, 255), income = text(b.annualIncomeSlab, 50);
    const land = b.landSizeAcres === "" || b.landSizeAcres == null ? null : Number(b.landSizeAcres);
    if (land !== null && (!Number.isFinite(land) || land < 0 || land > 999)) throw new Error("Land size must be between 0 and 999 acres, or blank.");
    const soil = b.soilType || "", irrigation = b.irrigationType || "", language = b.preferredLanguage;
    if ((soil && !(SOIL_TYPES as readonly string[]).includes(soil)) || (irrigation && !(IRRIGATION_TYPES as readonly string[]).includes(irrigation)) || !(LANGUAGE_CODES as readonly string[]).includes(language) || typeof b.shareContact !== "boolean") throw new Error("Choose valid profile options.");
    if (b.shareContact && (!state || !district)) throw new Error("Add a state and district before joining the farmer directory.");
    await ensureProfileStorage();
    await withTransaction(async c => {
      await c.query(`UPDATE users SET name=$2,phone=$3,email=$4,state=$5,district=$6,village=$7,
        primary_crops=$8,land_size_acres=$9,soil_type=$10,irrigation_type=$11,annual_income_slab=$12,preferred_language=$13 WHERE id=$1`,
      [auth.dbId,name,phone,email,state,district,village,crops,land,soil || null,irrigation || null,income,language]);
      await c.query(`INSERT INTO farmer_preferences(user_id,share_contact) VALUES($1,$2)
        ON CONFLICT(user_id) DO UPDATE SET share_contact=EXCLUDED.share_contact`, [auth.dbId,b.shareContact]);
    });
    const rows = await dbQuery<any[]>(`SELECT ${PUBLIC_USER_COLUMNS} FROM users u WHERE u.id=$1`, [auth.dbId]);
    return NextResponse.json({ user: mapUserRow(rows[0]), shareContact: b.shareContact }, { headers });
  } catch (e) {
    if (isUniqueViolation(e)) return NextResponse.json({ message: "That mobile number or email already belongs to another account." }, { status: 409 });
    const message = e instanceof Error && /^(Invalid|Enter|Land size|Choose|Add a state)/.test(e.message) ? e.message : "Profile could not be saved. Please retry.";
    return NextResponse.json({ message }, { status: message.startsWith("Profile") ? 503 : 400 });
  }
}
