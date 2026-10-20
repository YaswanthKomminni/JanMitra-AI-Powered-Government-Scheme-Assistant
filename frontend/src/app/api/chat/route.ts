import { NextResponse } from "next/server";
import { requireUser, serviceUnavailable, isDbError } from "@/lib/auth";
import { isUniqueViolation, dbQuery } from "@/lib/db";
import { answerDocumentQuestion } from "@/lib/nlpDocumentAnalyzer";
import { generateIntelligentChatReply } from "@/lib/llmService";
import type { SupportedLanguage } from "@/lib/i18n";
import { LANGUAGE_CODES } from "@/lib/userProfile";
import {
  buildOutOfScopeReply,
  formatDocumentAnalysisReply,
  generateTextReply,
  type EngineReply,
} from "@/lib/chatEngine";
import { analyzeAndRecordDocument, MAX_ATTACHMENT_CHARS } from "@/lib/documentAnalysis";
import {
  findReplyFor,
  findUserMessageByClientId,
  getConversationSummary,
  isClientMessageId,
  isConversationId,
  makeTitle,
  mapMessageRow,
  saveAiMessage,
  saveUserMessage,
} from "@/lib/chatHistory";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TEXT = 4000;
const REPLY_TIMEOUT_MS = 45_000;

function fail(status: number, message: string, extra: Record<string, any> = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("The assistant took too long to respond.")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** Strip large/binary fields before storing a detection result as message metadata. */
function compactDetection(det: any) {
  if (!det) return undefined;
  const { previewUrl, ...rest } = det;
  return rest;
}

/**
 * POST /api/chat
 * Body: { conversationId?: string|null, clientMessageId: string, text: string,
 *         language?: string, attachment?: { data: string, fileName?: string, fileType?: string } }
 *
 * 1. Saves the user's message (creating the conversation if needed).
 * 2. Generates the reply with the existing JanMithra engine / Vision OCR.
 * 3. Saves the reply. A retry with the same clientMessageId never duplicates
 *    the question, and returns the stored reply if one already exists.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.dbId;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid request body.");
  }

  const clientMessageId = body?.clientMessageId;
  if (!isClientMessageId(clientMessageId)) return fail(400, "Missing or invalid clientMessageId.");

  const conversationId = body?.conversationId ?? null;
  if (conversationId !== null && !isConversationId(conversationId)) {
    return fail(400, "Invalid conversation id.");
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return fail(400, "Please type a question.");
  if (text.length > MAX_TEXT) return fail(400, `Your message is too long (max ${MAX_TEXT} characters).`);

  const language = ((LANGUAGE_CODES as readonly string[]).includes(body?.language) ? body.language : "en") as SupportedLanguage;

  const attachment = body?.attachment;
  let fileName: string | undefined;
  let fileType: string | undefined;
  let classification: any = undefined;
  if (attachment) {
    if (typeof attachment.data !== "string" || !attachment.data) return fail(400, "Attachment is empty.");
    if (attachment.data.length > MAX_ATTACHMENT_CHARS) return fail(413, "Attachment is too large (max ~8 MB).");
    fileName = String(attachment.fileName || "uploaded_document.png").slice(0, 200);
    fileType = String(attachment.fileType || "image/png").slice(0, 100);
    classification = attachment.classification;
  }

  try {
    // ---- 1. Persist (or find) the user's message ----------------------
    let userRow = await findUserMessageByClientId(userId, clientMessageId);
    let convId: string;

    if (userRow) {
      convId = userRow.conversation_id;
      const existingReply = await findReplyFor(userId, clientMessageId);
      if (existingReply) {
        return NextResponse.json({
          success: true,
          deduplicated: true,
          conversation: await getConversationSummary(userId, convId),
          userMessage: mapMessageRow(userRow),
          aiMessage: mapMessageRow(existingReply),
        });
      }
    } else {
      let saved;
      try {
        saved = await saveUserMessage({
          userId,
          conversationId,
          clientMessageId,
          text,
          language,
          metadata: attachment ? { fileName, fileType, hasAttachment: true } : {},
          title: makeTitle(text, fileName),
        });
      } catch (err: any) {
        // A concurrent retry stored it first.
        if (isUniqueViolation(err, "uq_chat_client_msg")) {
          userRow = await findUserMessageByClientId(userId, clientMessageId);
          if (!userRow) throw err;
          saved = { conversationId: userRow.conversation_id, row: userRow };
        } else {
          throw err;
        }
      }
      if (!saved) {
        // Not found OR owned by someone else: same response, no information leak.
        return fail(404, "Conversation not found.", { code: "CONVERSATION_NOT_FOUND" });
      }
      convId = saved.conversationId;
      userRow = saved.row;
    }

    const userMessage = mapMessageRow(userRow);
    const storedText = userMessage.text;

    // ---- 2. Generate the reply -----------------------------------------
    let reply: EngineReply & { docDetection?: any };
    try {
      if (process.env.NODE_ENV !== "production" && process.env.JANMITRA_SIMULATE_AI_FAILURE === "1") {
        throw new Error("Simulated assistant failure (JANMITRA_SIMULATE_AI_FAILURE=1).");
      }
      reply = await withTimeout(
        (async () => {
          const customApiKey =
            attachment?.customApiKey ||
            body?.customApiKey ||
            request.headers.get("x-vision-api-key") ||
            undefined;

          if (attachment) {
            try {
              const outcome = await analyzeAndRecordDocument({
                userId,
                fileBase64: attachment.data,
                fileName,
                fileType,
                classification,
                customApiKey,
              });
              if (!outcome.success && outcome.isOutOfScope) {
                return buildOutOfScopeReply(language, outcome.reason);
              }
              if (!outcome.success) {
                return { text: outcome.message, chips: ["Upload a clearer image", "Paste the document text"] };
              }
              if (outcome.success && outcome.detection) {
                // Grounded Question-Answering, Summaries & Actionable Suggestions via Multimodal LLM / CampusOne Copilot:
                const llmAnswer = await generateIntelligentChatReply({
                  query: storedText,
                  language,
                  profile: auth.profile,
                  documentContext: outcome.detection,
                  customApiKey,
                });
                return {
                  text: llmAnswer.text,
                  chips: llmAnswer.chips,
                  docDetection: compactDetection(outcome.detection),
                };
              }
            } catch (ocrErr) {
              console.warn("[chat] document analysis failed:", (ocrErr as Error).message);
              return { text: "I could not read this upload. Please send a clearer image, a searchable PDF, or paste its text so I can answer your question.", chips: [] };
            }
          }

          // Use the latest analyzed attachment in THIS conversation, preserving its OCR and facts.
          // Never attach another chat's most recent land record or inject default scheme benefits.
          let activeDocContext: any = undefined;
          try {
            const recent = await dbQuery<any[]>(
              `SELECT metadata FROM chat_logs
               WHERE user_id = $1 AND conversation_id = $2 AND sender = 'ai'
                 AND metadata->'docDetection' IS NOT NULL
               ORDER BY id DESC LIMIT 1`,
              [userId, convId]
            );
            const metadata = recent[0]?.metadata;
            const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
            activeDocContext = parsed?.docDetection;
          } catch (error) {
            console.warn("[chat] document context lookup failed:", (error as Error).message);
          }

          // Unified Conversational LLM Engine (Gemini 2.0 / Groq Llama 3 / OpenAI with CampusOne Copilot Fallback):
          const llmReply = await generateIntelligentChatReply({
            query: storedText,
            language,
            profile: auth.profile,
            documentContext: activeDocContext,
            customApiKey,
          });

          return {
            text: llmReply.text,
            chips: llmReply.chips,
            docDetection: activeDocContext,
          };
        })(),
        REPLY_TIMEOUT_MS
      );
    } catch (aiErr) {
      console.error("[chat] reply generation failed:", (aiErr as Error).message);
      return NextResponse.json(
        {
          success: false,
          code: "AI_FAILED",
          retryable: true,
          message: "Your question was saved, but the assistant could not answer right now. Please tap Retry.",
          conversation: await getConversationSummary(userId, convId).catch(() => null),
          userMessage,
        },
        { status: 502 }
      );
    }

    // ---- 3. Persist the reply ------------------------------------------
    let aiRow;
    try {
      aiRow = await saveAiMessage({
        userId,
        conversationId: convId,
        clientMessageId,
        text: reply.text,
        language,
        metadata: { chips: reply.chips || [], docDetection: reply.docDetection, replyTo: userRow.id },
      });
    } catch (err: any) {
      if (isUniqueViolation(err, "uq_chat_client_msg")) {
        aiRow = await findReplyFor(userId, clientMessageId);
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      conversation: await getConversationSummary(userId, convId),
      userMessage,
      aiMessage: mapMessageRow(aiRow),
    });
  } catch (err) {
    console.error("[chat] failed:", (err as Error).message);
    if (isDbError(err)) {
      return serviceUnavailable(
        "Your message could not be saved because the database is unavailable. Nothing was lost on your screen — please retry."
      );
    }
    return fail(500, "Something went wrong while sending your message. Please retry.");
  }
}
