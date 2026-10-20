import { NextResponse } from "next/server";
import { requireUser, serviceUnavailable } from "@/lib/auth";
import { withTransaction } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Confirm only a server-generated analysis owned by this user; client fields are never evidence. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 }); }
  const id = body?.analysisRecordId;
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ success: false, message: "Analyze the upload before confirming it." }, { status: 400 });
  try {
    const result = await withTransaction(async client => {
      const record = await client.query(`SELECT id, status FROM document_verifications WHERE id = $1 AND user_id = $2 FOR UPDATE`, [id, auth.dbId]);
      if (!record.rows.length) return null;
      if (record.rows[0].status === "analyzed") {
        await client.query("UPDATE document_verifications SET status = 'user_confirmed' WHERE id = $1 AND user_id = $2", [id, auth.dbId]);
        await client.query("UPDATE users SET verified_docs_count = verified_docs_count + 1 WHERE id = $1", [auth.dbId]);
      }
      return { id };
    });
    if (!result) return NextResponse.json({ success: false, message: "Analysis not found." }, { status: 404 });
    return NextResponse.json({ success: true, recordId: result.id, message: "Your review was saved. This does not certify authenticity or eligibility.", dbSaved: true });
  } catch {
    return serviceUnavailable("Could not save your review. Please try again.");
  }
}
