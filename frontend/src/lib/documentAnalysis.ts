import "server-only";
import { queryDatabase } from "@/lib/db";
import { analyzeImageIntelligently } from "@/lib/visionLlm";
import type { SupportedLanguage } from "@/lib/i18n";

export type DocumentAnalysisOutcome =
  | {
      success: false;
      isOutOfScope: true;
      scopeStatus: "out_of_scope";
      message: string;
      reason: string;
      suggestions: string[];
    }
  | { success: false; isOutOfScope: false; scopeStatus: "uncertain"; message: string; reason: string; suggestions: string[] }
  | { success: true; message: string; detection: any };

/**
 * Vision LLM / OCR + scope check + persistence of an analyzed document for ONE user.
 * `userId` must come from the authenticated session, never from the request body.
 */
export async function analyzeAndRecordDocument(opts: {
  userId: number;
  fileBase64: string;
  fileName?: string;
  fileType?: string;
  classification?: any;
  customApiKey?: string;
  language?: SupportedLanguage;
}): Promise<DocumentAnalysisOutcome> {
  const { userId, fileBase64, classification, customApiKey } = opts;
  const fileName = opts.fileName || "uploaded_document.jpg";
  const fileType = opts.fileType || "image/jpeg";

  // 1. Analyze with Vision LLM (Gemini/Groq/OpenAI) or High-Accuracy Local Dynamic Engine
  const outcome = await analyzeImageIntelligently({
    fileBase64,
    fileName,
    fileType,
    classification,
    customApiKey,
    language: opts.language,
  });

  // 2. Reject only content positively identified as unrelated.
  if (outcome.scopeStatus === "out_of_scope") {
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

  if (outcome.analysisQuality === "partial") {
    return { success: true, message: "Document recognized; fine print needs a clearer view.", detection: { ...outcome, previewUrl: fileBase64, fileName } };
  }
  if (outcome.scopeStatus === "uncertain") {
    return { success: false, isOutOfScope: false, scopeStatus: "uncertain",
      message: outcome.detectionSummary, reason: outcome.reason || outcome.detectionSummary,
      suggestions: outcome.suggestions };
  }

  const resultPayload: Record<string, any> = {
    ...outcome,
    previewUrl: fileBase64,
    fileName,
  };

  // 3. Save the server analysis. Reading a document does not verify authenticity or update a farmer profile.
  try {
    const sql = `
      INSERT INTO document_verifications
      (user_id, doc_type, title, confidence_score, extracted_data, preview_url, status)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'analyzed') RETURNING id
    `;
    const saved = await queryDatabase(sql, [
      userId,
      resultPayload.docType || "land_record",
      resultPayload.title || "Agricultural Document",
      resultPayload.confidenceScore || 0,
      JSON.stringify(resultPayload.extractedData || {}),
      fileBase64.startsWith("data:") ? fileBase64.slice(0, 300) + "..." : fileBase64.slice(0, 480),
    ]);
    if (saved.success && saved.data?.[0]?.id) resultPayload.analysisRecordId = saved.data[0].id;
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
