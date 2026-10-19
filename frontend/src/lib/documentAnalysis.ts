import "server-only";
import { queryDatabase } from "@/lib/db";
import { analyzeImageIntelligently } from "@/lib/visionLlm";

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
 * Vision LLM / OCR + scope check + persistence of a verified document for ONE user.
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

  // 1. Analyze with Vision LLM (Gemini/Groq/OpenAI) or High-Accuracy Local Engine
  const outcome = await analyzeImageIntelligently({
    fileBase64,
    fileName,
    fileType,
    classification,
  });

  // 2. Strict Agricultural & Scheme Scope Enforcement:
  if (!outcome.isAgriRelated || outcome.scopeStatus === "out_of_scope") {
    return {
      success: false,
      isOutOfScope: true,
      scopeStatus: "out_of_scope",
      message: outcome.detectionSummary || "Out of Scope: Image does not appear to be related to agriculture or government schemes.",
      reason:
        outcome.reason ||
        "The uploaded photo does not contain recognizable farming crops, soil samples, or official government welfare documents.",
      suggestions: outcome.suggestions?.length
        ? outcome.suggestions
        : [
            "Capture a clear, focused photo of an affected farm crop leaf or plant for disease diagnosis.",
            "Upload an official agricultural document (Pahani, Land Patta, RoR 1B, Sale Deed, or Soil Health Card).",
            "Ensure good lighting and hold the camera steady.",
          ],
    };
  }

  const resultPayload = {
    ...outcome,
    previewUrl: fileBase64,
    fileName,
  };

  // 3. Persist verified document in PostgreSQL JanMithra (for the signed-in user only)
  try {
    const sql = `
      INSERT INTO document_verifications
      (user_id, doc_type, title, confidence_score, extracted_data, preview_url, status)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'verified')
    `;
    const saved = await queryDatabase(sql, [
      userId,
      resultPayload.docType || "land_record",
      resultPayload.title || "Agricultural Document",
      resultPayload.confidenceScore || 0.95,
      JSON.stringify(resultPayload.extractedData || {}),
      fileBase64.startsWith("data:") ? fileBase64.slice(0, 300) + "..." : fileBase64.slice(0, 480),
    ]);
    if (saved.success) {
      await queryDatabase("UPDATE users SET verified_docs_count = verified_docs_count + 1 WHERE id = $1", [userId]);
    }
  } catch (dbErr) {
    console.warn("[documentAnalysis notice]: Could not persist verification to database:", dbErr);
  }

  return {
    success: true,
    message: "Image analyzed successfully via JanMithra Vision Engine!",
    detection: resultPayload,
  };
}

/** Upper bound for an uploaded attachment (base64 data URL length, ~8 MB file). */
export const MAX_ATTACHMENT_CHARS = 11_500_000;
