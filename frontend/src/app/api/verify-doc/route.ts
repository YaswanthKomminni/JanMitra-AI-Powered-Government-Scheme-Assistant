import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId = 1,
      docType = "land_record",
      title = "Verified Document",
      confidenceScore = 0.95,
      extractedData = {},
      previewUrl = "",
    } = body;

    const sql = `
      INSERT INTO document_verifications 
      (user_id, doc_type, title, confidence_score, extracted_data, preview_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'verified')
    `;

    const result = await queryDatabase(sql, [
      userId,
      docType,
      title,
      confidenceScore,
      JSON.stringify(extractedData),
      previewUrl,
    ]);

    // Also update user's verified docs count
    await queryDatabase(
      "UPDATE users SET verified_docs_count = verified_docs_count + 1 WHERE id = ?",
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: "Document verification saved to JanMithra database!",
      recordId: (result.data as any)?.insertId || Date.now(),
      dbSaved: result.success,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
