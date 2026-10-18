import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { analyzeDocumentComprehensive } from "@/lib/ocrEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fileBase64,
      fileName = "uploaded_document.jpg",
      fileType = "image/jpeg",
      docCategory = "auto_detect",
      userId = 1,
      classification,
    } = body;

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, message: "No image or document data provided." },
        { status: 400 }
      );
    }

    // 1. Comprehensive OCR and Entity Analysis
    const detected = await analyzeDocumentComprehensive(fileBase64, fileName, fileType);

    // 2. Strict Agricultural & Scheme Scope Enforcement:
    // Only reject if OCR did not recognize a valid document AND visual classifier flags non-agri indoor object
    const lowerName = fileName.toLowerCase();
    const isDocumentExt = [".pdf", ".doc", ".docx", ".txt", ".rtf"].some((ext) =>
      lowerName.endsWith(ext)
    );

    const isRecognizedDoc =
      detected &&
      (detected.confidenceScore >= 0.75 ||
        detected.title.toLowerCase().includes("deed") ||
        detected.title.toLowerCase().includes("patta") ||
        detected.title.toLowerCase().includes("dharani") ||
        detected.title.toLowerCase().includes("soil") ||
        detected.title.toLowerCase().includes("kyc"));

    if (!isRecognizedDoc && classification && classification.isAgriRelated === false && !isDocumentExt) {
      const paperRatio = classification.metrics?.documentPaperRatio ?? 0;
      const greenRatio = classification.metrics?.greenVegetationRatio ?? 0;

      if (paperRatio < 10 && greenRatio < 8) {
        return NextResponse.json({
          success: false,
          isOutOfScope: true,
          scopeStatus: "out_of_scope",
          message:
            "Out of Scope: Image does not appear to be related to agriculture or government schemes.",
          reason:
            "The uploaded photo shows everyday indoor/outdoor objects rather than farming crops, soil, or official land documents.",
          suggestions: [
            "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
            "Capture an official land record (Pahani, Land Patta, Soil Health Card, or Farmer Aadhaar KYC).",
            "Ensure good lighting and hold the camera steady.",
          ],
        });
      }
    }

    const resultPayload = {
      ...detected,
      previewUrl: fileBase64,
      fileName,
    };

    // 3. Persist verified document in MySQL JanMithra
    try {
      const sql = `
        INSERT INTO document_verifications 
        (user_id, doc_type, title, confidence_score, extracted_data, preview_url, status)
        VALUES (?, ?, ?, ?, ?, ?, 'verified')
      `;
      await queryDatabase(sql, [
        userId || 1,
        resultPayload.docType,
        resultPayload.title,
        resultPayload.confidenceScore,
        JSON.stringify(resultPayload.extractedData),
        fileBase64.startsWith("data:") ? fileBase64.slice(0, 300) + "..." : fileBase64,
      ]);

      await queryDatabase(
        "UPDATE users SET verified_docs_count = verified_docs_count + 1 WHERE id = ?",
        [userId || 1]
      );
    } catch (dbErr: any) {
      console.warn("MySQL document_verifications insert notice:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Image & document analyzed successfully via Vision OCR engine!",
      detection: resultPayload,
    });
  } catch (error: any) {
    console.error("OCR Analysis error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to analyze document." },
      { status: 500 }
    );
  }
}
