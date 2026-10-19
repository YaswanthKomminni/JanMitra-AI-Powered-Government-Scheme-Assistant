import "server-only";
import { queryDatabase } from "@/lib/db";
import { analyzeDocumentComprehensive } from "@/lib/ocrEngine";

export type DocumentAnalysisOutcome =
  | {
      success: false;
      isOutOfScope: true;
      scopeStatus: "out_of_scope";
      message: string;
      reason: string;
      suggestions: string[];
    }
  | { success: true; message: string; detection: any };

/**
 * OCR + scope check + persistence of a verified document for ONE user.
 * Extracted unchanged from /api/ocr/analyze so the chat route can reuse it.
 * `userId` must come from the authenticated session, never from the request body.
 */
export async function analyzeAndRecordDocument(opts: {
  userId: number;
  fileBase64: string;
  fileName?: string;
  fileType?: string;
  classification?: any;
}): Promise<DocumentAnalysisOutcome> {
  const { userId, fileBase64, classification } = opts;
  const fileName = opts.fileName || "uploaded_document.jpg";
  const fileType = opts.fileType || "image/jpeg";

  // 1. Comprehensive OCR and Entity Analysis
  const detected = await analyzeDocumentComprehensive(fileBase64, fileName, fileType);

  // 2. Strict Agricultural & Scheme Scope Enforcement:
  // Only reject if OCR did not recognize a valid document AND visual classifier flags non-agri indoor object
  const lowerName = fileName.toLowerCase();
  const isDocumentExt = [".pdf", ".doc", ".docx", ".txt", ".rtf"].some((ext) => lowerName.endsWith(ext));

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
      return {
        success: false,
        isOutOfScope: true,
        scopeStatus: "out_of_scope",
        message: "Out of Scope: Image does not appear to be related to agriculture or government schemes.",
        reason:
          "The uploaded photo shows everyday indoor/outdoor objects rather than farming crops, soil, or official land documents.",
        suggestions: [
          "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
          "Capture an official land record (Pahani, Land Patta, Soil Health Card, or Farmer Aadhaar KYC).",
          "Ensure good lighting and hold the camera steady.",
        ],
      };
    }
  }

  const resultPayload = {
    ...detected,
    previewUrl: fileBase64,
    fileName,
  };

  // 3. Persist verified document in PostgreSQL JanMithra (for the signed-in user only)
  const sql = `
    INSERT INTO document_verifications
    (user_id, doc_type, title, confidence_score, extracted_data, preview_url, status)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'verified')
  `;
  const saved = await queryDatabase(sql, [
    userId,
    resultPayload.docType,
    resultPayload.title,
    resultPayload.confidenceScore,
    JSON.stringify(resultPayload.extractedData),
    fileBase64.startsWith("data:") ? fileBase64.slice(0, 300) + "..." : fileBase64.slice(0, 480),
  ]);
  if (saved.success) {
    await queryDatabase("UPDATE users SET verified_docs_count = verified_docs_count + 1 WHERE id = $1", [userId]);
  }

  return {
    success: true,
    message: "Image & document analyzed successfully via Vision OCR engine!",
    detection: resultPayload,
  };
}

/** Upper bound for an uploaded attachment (base64 data URL length, ~8 MB file). */
export const MAX_ATTACHMENT_CHARS = 11_500_000;
