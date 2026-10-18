import { NextResponse } from "next/server";
import { requireUser, serviceUnavailable } from "@/lib/auth";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Confirms an extracted document for the signed-in user (user id comes from the session only). */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      docType = "land_record",
      title = "Verified Document",
      confidenceScore = 0.95,
      extractedData = {},
      previewUrl = "",
    } = body || {};

    const preview = String(previewUrl || "");
    const result = await dbQuery<any>(
      `INSERT INTO document_verifications
       (user_id, doc_type, title, confidence_score, extracted_data, preview_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'verified')`,
      [
        auth.dbId,
        String(docType).slice(0, 50),
        String(title).slice(0, 255),
        Number(confidenceScore) || 0,
        JSON.stringify(extractedData ?? {}),
        preview.startsWith("data:") ? preview.slice(0, 300) + "..." : preview.slice(0, 480),
      ]
    );

    await dbQuery("UPDATE users SET verified_docs_count = verified_docs_count + 1 WHERE id = ?", [auth.dbId]);

    return NextResponse.json({
      success: true,
      message: "Document verification saved to JanMithra database!",
      recordId: result?.insertId,
      dbSaved: true,
    });
  } catch (error: any) {
    console.error("[verify-doc] failed:", error?.message);
    return serviceUnavailable("Could not save the verified document. Please try again.");
  }
}
