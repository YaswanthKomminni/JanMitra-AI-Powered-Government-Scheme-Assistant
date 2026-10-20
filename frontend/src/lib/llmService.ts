/**
 * JANMITRA MULTIMODAL LLM & CO-PILOT SERVICE
 *
 * Provides resilient, state-of-the-art LLM intelligence with seamless multi-tier fallback:
 * 1. Google Gemini (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro)
 * 2. Groq Llama 3 (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768)
 * 3. OpenAI (gpt-4o-mini, gpt-4o)
 * 4. CampusOne-Style Autonomous Intelligence Copilot (100% offline, local NLP & Dense Vector Space)
 *
 * Always responds accurately and grounds advice in real government schemes,
 * agricultural diagnostics, document OCR text, and farmer profile data.
 */

import type { SupportedLanguage } from "@/lib/i18n";
import type { FarmerProfile } from "@/lib/mockData";
import { GUEST_FARMER } from "@/lib/mockData";
import { semanticSearchSchemes } from "@/lib/aiCopilotService";
import { answerDocumentQuestion } from "@/lib/nlpDocumentAnalyzer";
import { generateTextReply } from "@/lib/chatEngine";

export interface LlmChatRequest {
  query: string;
  language: SupportedLanguage;
  profile?: FarmerProfile | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  documentContext?: any;
  customApiKey?: string;
}

export interface LlmChatResponse {
  text: string;
  chips: string[];
  provider: "gemini" | "groq" | "openai" | "campusone_copilot";
  modelUsed?: string;
}

/**
 * Resolve active API key and provider from request, headers, or environment variables.
 */
export function resolveApiKey(customApiKey?: string): { key: string; provider: "gemini" | "groq" | "openai" } | null {
  const trimmed = customApiKey?.trim();
  if (trimmed && trimmed.length > 8) {
    if (trimmed.startsWith("AIza") || trimmed.length === 39) {
      return { key: trimmed, provider: "gemini" };
    }
    if (trimmed.startsWith("gsk_")) {
      return { key: trimmed, provider: "groq" };
    }
    if (trimmed.startsWith("sk-")) {
      return { key: trimmed, provider: "openai" };
    }
  }

  const geminiEnv = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VISION_API_KEY;
  if (geminiEnv?.trim()) {
    return { key: geminiEnv.trim(), provider: "gemini" };
  }

  const groqEnv = process.env.GROQ_API_KEY;
  if (groqEnv?.trim()) {
    return { key: groqEnv.trim(), provider: "groq" };
  }

  const openAiEnv = process.env.OPENAI_API_KEY;
  if (openAiEnv?.trim()) {
    return { key: openAiEnv.trim(), provider: "openai" };
  }

  return null;
}

/**
 * Build rich system prompt with scheme knowledge and grounding instructions.
 */
function buildSystemPrompt(lang: SupportedLanguage, profile?: FarmerProfile | null, documentContext?: any): string {
  const langNames: Record<SupportedLanguage, string> = {
    en: "English",
    te: "Telugu (తెలుగు)",
    hi: "Hindi (हिन्दी)",
    ta: "Tamil (தமிழ்)",
    kn: "Kannada (ಕನ್ನಡ)",
    bn: "Bengali (বাংলা)",
  };

  const farmerInfo = profile
    ? `Farmer Profile: Name: ${profile.name}, Land: ${profile.landSizeAcres} Acres (${profile.soilTypeName || profile.soilType}), Village: ${profile.village}, District: ${profile.district}, Irrigation: ${profile.irrigationTypeName || profile.irrigationType}, Crops: ${(profile.primaryCrops || []).join(", ")}.`
    : `Farmer Profile: Indian agricultural citizen / smallholder farmer.`;

  const docSnippet = documentContext
    ? `ACTIVE VERIFIED DOCUMENT IN SESSION:
Title: ${documentContext.title || "Government / Farm Document"}
Type: ${documentContext.docType || "Document"}
Summary: ${documentContext.detectionSummary || ""}
Extracted Parameters: ${JSON.stringify(documentContext.extractedData || {})}
Unlocked Schemes: ${(documentContext.schemesUnlocked || []).join(", ")}`
    : "";

  return `You are JanMithra (జనమిత్ర / जनमित्रा), India's premier AI Assistant dedicated to Agriculture, Crop Diagnostics, and Government Welfare Schemes (PM-KISAN, PM-KUSUM, Kisan Credit Card, PMFBY, Rythu Bandhu/Bharosa, Soil Health Card, SMAM Subsidies).

You MUST respond strictly in the user's requested language: ${langNames[lang] || "English"}.

${farmerInfo}

${docSnippet}

CORE PRINCIPLES:
1. When asked about a document or image:
   - Provide clear, direct summaries.
   - Give actionable suggestions (agronomic remedies, application steps, nodal offices to visit).
   - Answer the exact question the user asks (who is the owner, what is the survey number, what are the required documents, what is the schedule/date, what are the fees/subsidies).
   - NEVER make up fake details; base all answers strictly on the extracted document parameters.
2. When asked about government schemes:
   - Detail eligibility requirements, direct financial benefit (e.g. ₹6,000/yr for PM-KISAN, 60% subsidy for KUSUM, 4% interest for KCC).
   - Specify the nodal office (AAO, Tahsildar, Krishi Bhavan, Rythu Vedika, CSC Kiosk).
   - List required documents (Aadhaar, Land Patta/Pahani, Bank passbook).
3. When asked about crop pests or plant diseases:
   - Give both organic remedy (e.g., Neem oil spray 10,000 ppm @ 3ml/L) and scientific chemical remedy with dosage.
   - Mention PMFBY 72-hour crop loss intimation if yield damage exceeds 33%.
4. Keep the tone respectful, authoritative, and encouraging. Use clear formatting with bullet points and bold highlights.
5. At the end of your response, provide 3 short, relevant follow-up questions formatted on a single line starting with:
   CHIPS: ["Question 1", "Question 2", "Question 3"]`;
}

/**
 * Call Google Gemini LLM API (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro)
 */
async function callGeminiText(
  apiKey: string,
  prompt: string,
  systemPrompt: string
): Promise<{ text: string; chips: string[]; model: string } | null> {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1200,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(18000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const { text, chips } = parseReplyAndChips(raw);
      return { text, chips, model };
    } catch {
      // Try next Gemini model
    }
  }

  return null;
}

/**
 * Call Groq LLM API (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768)
 */
async function callGroqText(
  apiKey: string,
  prompt: string,
  systemPrompt: string
): Promise<{ text: string; chips: string[]; model: string } | null> {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];

  for (const model of models) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const payload = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(18000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) continue;

      const { text, chips } = parseReplyAndChips(raw);
      return { text, chips, model };
    } catch {
      // Try next model
    }
  }

  return null;
}

/**
 * Call OpenAI API (gpt-4o-mini, gpt-4o)
 */
async function callOpenAiText(
  apiKey: string,
  prompt: string,
  systemPrompt: string
): Promise<{ text: string; chips: string[]; model: string } | null> {
  const models = ["gpt-4o-mini", "gpt-4o"];

  for (const model of models) {
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const payload = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(18000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) continue;

      const { text, chips } = parseReplyAndChips(raw);
      return { text, chips, model };
    } catch {
      // Try next model
    }
  }

  return null;
}

/**
 * Helper to split out trailing CHIPS: ["..."] metadata from LLM output.
 */
function parseReplyAndChips(raw: string): { text: string; chips: string[] } {
  const chipMatch = raw.match(/CHIPS:\s*(\[[^\]]+\])/i);
  let chips: string[] = [];
  let text = raw;

  if (chipMatch) {
    try {
      chips = JSON.parse(chipMatch[1]);
      text = raw.replace(/CHIPS:\s*\[[^\]]+\]/i, "").trim();
    } catch {
      // fallback
    }
  }

  if (chips.length === 0) {
    chips = [
      "PM-KISAN ₹6,000 Status",
      "Kisan Credit Card (KCC) 4%",
      "PM-KUSUM 60% Solar Pump",
    ];
  }

  return { text, chips: chips.slice(0, 4) };
}

/**
 * Unified Conversational LLM Engine with CampusOne-Style Local Fallback
 */
export async function generateIntelligentChatReply(
  req: LlmChatRequest
): Promise<LlmChatResponse> {
  const { query, language, profile, documentContext, customApiKey } = req;
  const systemPrompt = buildSystemPrompt(language, profile, documentContext);

  // 1. Try Cloud LLM (Gemini, Groq, OpenAI) if key is provided or present in environment
  const apiInfo = resolveApiKey(customApiKey);

  if (apiInfo) {
    try {
      if (apiInfo.provider === "gemini") {
        const res = await callGeminiText(apiInfo.key, query, systemPrompt);
        if (res) {
          return {
            text: res.text,
            chips: res.chips,
            provider: "gemini",
            modelUsed: res.model,
          };
        }
      } else if (apiInfo.provider === "groq") {
        const res = await callGroqText(apiInfo.key, query, systemPrompt);
        if (res) {
          return {
            text: res.text,
            chips: res.chips,
            provider: "groq",
            modelUsed: res.model,
          };
        }
      } else if (apiInfo.provider === "openai") {
        const res = await callOpenAiText(apiInfo.key, query, systemPrompt);
        if (res) {
          return {
            text: res.text,
            chips: res.chips,
            provider: "openai",
            modelUsed: res.model,
          };
        }
      }
    } catch (llmErr) {
      console.warn("[llmService notice]: Cloud LLM failed, using CampusOne Copilot Engine:", (llmErr as Error).message);
    }
  }

  // 2. CampusOne-Style Autonomous Intelligence Copilot (100% Offline, Local ML & Vector Search)
  // If the user has a document in context, use grounded document question answering:
  if (documentContext) {
    const answered = answerDocumentQuestion(query, documentContext, language);
    return {
      text: answered.text,
      chips: answered.chips,
      provider: "campusone_copilot",
      modelUsed: "JanMithra-NLP Suite (BERT + HMM + CRF + TF-IDF)",
    };
  }

  // Otherwise, use semantic scheme matching & rule-based conversational copilot:
  const textReply = generateTextReply(query, language, profile || GUEST_FARMER);
  return {
    text: textReply.text,
    chips: textReply.chips || [
      "PM-KISAN ₹6,000",
      "KCC 4% Loan",
      "PM-KUSUM 60% Solar Pump",
    ],
    provider: "campusone_copilot",
    modelUsed: "JanMithra-DenseVectorMiniLM (128-Dim Cosine)",
  };
}
