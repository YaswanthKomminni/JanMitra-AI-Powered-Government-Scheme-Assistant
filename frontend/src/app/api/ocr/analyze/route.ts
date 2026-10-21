import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeAndRecordDocument, MAX_ATTACHMENT_CHARS } from "@/lib/documentAnalysis";
import { LANGUAGE_CODES } from "@/lib/userProfile";
import type { SupportedLanguage } from "@/lib/i18n";
import { explainDocument } from "@/lib/documentChat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vision OCR document / crop-photo analysis (used by the Document Verification modal).
 * Requires a signed-in user; the verification is recorded for the SESSION user
 * (any `userId` sent by the client is ignored).
 */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      fileBase64,
      fileName = "uploaded_document.jpg",
      fileType = "image/jpeg",
      classification,
      customApiKey,
    } = body || {};

    if (!fileBase64 || typeof fileBase64 !== "string") {
      return NextResponse.json(
        { success: false, message: "No image or document data provided." },
        { status: 400 }
      );
    }
    if (fileBase64.length > MAX_ATTACHMENT_CHARS) {
      return NextResponse.json({ success: false, message: "File is too large (max ~8 MB)." }, { status: 413 });
    }

    const outcome = await analyzeAndRecordDocument({
      userId: auth.dbId,
      fileBase64,
      fileName: String(fileName).slice(0, 200),
      fileType: String(fileType).slice(0, 100),
      classification,
      customApiKey: customApiKey || request.headers.get("x-vision-api-key") || undefined,
      language: ((LANGUAGE_CODES as readonly string[]).includes(body?.language) ? body.language : "en") as SupportedLanguage,
    });
    if (outcome.success) {
      const reply = await explainDocument({ query: "Summarize this upload in simple language. Explain the main contents and the useful next steps. Distinguish what was actually read from missing details.",
        language: ((LANGUAGE_CODES as readonly string[]).includes(body?.language) ? body.language : "en") as SupportedLanguage,
        profile: auth.profile, documentContext: outcome.detection, customApiKey: customApiKey || request.headers.get("x-vision-api-key") || undefined });
      outcome.detection.assistantAnalysis = reply.text;
      outcome.detection.aiStatus = reply.aiStatus;
    }
    return NextResponse.json(outcome);
  } catch (error: any) {
    console.error("OCR Analysis error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to analyze document." },
      { status: 500 }
    );
  }
}
