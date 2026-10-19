/**
 * JanMithra Multimodal Vision LLM & Agricultural Document/Crop Analyzer
 *
 * Provides intelligent multimodal image inspection for:
 * 1. Indian Government Land Records & Revenue Deeds (Patta, Pahani, RoR 1B, Dharani Deed, Khasra)
 * 2. Soil Health Cards & ICAR Nutrient Reports
 * 3. Crop Pest & Foliar Disease Diagnostics (Cotton, Paddy, Chilli, etc.)
 * 4. Strict Domain Enforcement: Rejects non-agricultural / everyday indoor images as OUT OF SCOPE.
 *
 * Supports Google Gemini Vision (GEMINI_API_KEY / GOOGLE_API_KEY), Groq Vision (GROQ_API_KEY),
 * and OpenAI Vision (OPENAI_API_KEY), with a built-in high-accuracy local vision heuristics engine
 * when no cloud API keys are present.
 */

import { analyzeDocumentComprehensive, type ExtractedDocumentResult } from "@/lib/ocrEngine";

export interface VisionAnalysisResult {
  isAgriRelated: boolean;
  scopeStatus: "in_scope" | "out_of_scope";
  docType?: "crop_disease" | "soil_health_card" | "land_record" | "identity_card";
  title?: string;
  confidenceScore: number;
  detectionSummary: string;
  reason?: string;
  extractedTextSnippet?: string;
  extractedData?: Record<string, any>;
  boundingBoxes?: Array<{
    id: string;
    label: string;
    text: string;
    box: { top: number; left: number; width: number; height: number };
    confidence: number;
  }>;
  schemesUnlocked?: string[];
  suggestions: string[];
}

/**
 * Call Google Gemini Vision multimodal API.
 */
async function callGeminiVision(
  fileBase64: string,
  apiKey: string,
  fileName: string = ""
): Promise<VisionAnalysisResult | null> {
  const pureBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
  const mimeMatch = fileBase64.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const systemPrompt = `You are JanMithra's expert Agricultural Vision & Government Welfare Assistant for Indian rural citizens and farmers.
Your job is to analyze the image carefully.

CRITICAL TASK 1 - STRICT RELEVANCE CHECK:
Determine whether the image is genuinely related to:
- Agriculture, farming, crops, plant leaves, crop pests, plant diseases, farmland, or farm equipment.
- Soil health, ICAR laboratory testing, or fertilizers.
- Official Indian government welfare or land revenue documents (e.g. Land Patta, Pahani, RoR 1B, Registered Deed of Sale, Soil Health Card, Kisan Credit Card, Farmer Aadhaar/ID, PM-KISAN, State Agriculture Dept notices).

IF THE IMAGE IS IRRELEVANT (e.g. human selfies, indoor rooms, furniture, clothing, shoes, laptops, cars, street photos, pets, random food, memes):
You MUST reject it:
{
  "isAgriRelated": false,
  "scopeStatus": "out_of_scope",
  "confidenceScore": 0.95,
  "detectedObject": "<short description of what was actually detected, e.g. indoor bedroom / laptop / person selfie>",
  "message": "Out of Scope: Image does not appear to be related to agriculture or government schemes.",
  "reason": "The uploaded photo shows <detectedObject> rather than farming crops, soil, or official government documents.",
  "suggestions": [
    "Capture a clear, well-lit photo of an affected crop leaf or plant showing pest or disease symptoms.",
    "Upload an official agricultural document (Land Patta, Pahani, RoR 1B, Sale Deed, or Soil Health Card).",
    "Ensure good lighting and hold the camera steady."
  ]
}

IF THE IMAGE IS RELATED TO AGRICULTURE OR GOVERNMENT SCHEMES:
{
  "isAgriRelated": true,
  "scopeStatus": "in_scope",
  "docType": "crop_disease" | "soil_health_card" | "land_record" | "identity_card",
  "title": "<Official title or diagnosis headline>",
  "confidenceScore": 0.96,
  "detectionSummary": "<2-3 sentence technical and practical summary>",
  "extractedData": {
    // If crop disease: include cropName, pestOrDisease, symptoms, severity, organicRemedy, chemicalTreatment, recommendedAction
    // If land record: include ownerName, surveyNumber, landAreaAcres, districtMandal, revenueStatus, recommendedAction
    // If soil health: include soilPh, nitrogenStatus, phosphorusStatus, potassiumStatus, recommendedAction
    // If ID card: include idType, name, idNumberMasked, recommendedAction
  },
  "schemesUnlocked": [
    "<Relevant Indian scheme e.g. PM-KISAN, PMFBY Crop Insurance, PM-KUSUM Solar Pump, Soil Health Card Scheme, KCC 4% Loan>"
  ],
  "suggestions": [
    "<Actionable agricultural suggestion 1>",
    "<Actionable agricultural suggestion 2>",
    "<Actionable agricultural suggestion 3>"
  ]
}

Output strictly valid JSON matching this schema with no markdown code blocks.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt + (fileName ? `\nFilename: ${fileName}` : "") },
          {
            inlineData: {
              mimeType,
              data: pureBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.15,
      responseMimeType: "application/json",
    },
  };

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        isAgriRelated: parsed.isAgriRelated ?? true,
        scopeStatus: parsed.scopeStatus ?? (parsed.isAgriRelated ? "in_scope" : "out_of_scope"),
        docType: parsed.docType,
        title: parsed.title || (parsed.isAgriRelated ? "Agricultural Inspection" : "Out of Scope"),
        confidenceScore: parsed.confidenceScore || 0.95,
        detectionSummary: parsed.detectionSummary || parsed.message || "",
        reason: parsed.reason,
        extractedData: parsed.extractedData || {},
        schemesUnlocked: parsed.schemesUnlocked || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (e) {
      console.warn(`[Gemini Vision ${model} notice]:`, (e as Error).message);
    }
  }

  return null;
}

/**
 * Call Groq Llama 3.2 Vision API (llama-3.2-11b-vision-preview).
 */
async function callGroqVision(fileBase64: string, apiKey: string): Promise<VisionAnalysisResult | null> {
  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Determine if this image is strictly related to Indian agriculture, crops, soil, or government welfare land records. If not, reject with { isAgriRelated: false, scopeStatus: 'out_of_scope', reason: '...', suggestions: [...] }. If yes, return { isAgriRelated: true, scopeStatus: 'in_scope', docType: 'crop_disease'|'soil_health_card'|'land_record'|'identity_card', title: '...', detectionSummary: '...', extractedData: {...}, schemesUnlocked: [...], suggestions: [...] }. Return JSON only.",
              },
              {
                type: "image_url",
                image_url: { url: fileBase64 },
              },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      isAgriRelated: parsed.isAgriRelated ?? true,
      scopeStatus: parsed.scopeStatus ?? (parsed.isAgriRelated ? "in_scope" : "out_of_scope"),
      docType: parsed.docType,
      title: parsed.title,
      confidenceScore: parsed.confidenceScore || 0.95,
      detectionSummary: parsed.detectionSummary || "",
      reason: parsed.reason,
      extractedData: parsed.extractedData || {},
      schemesUnlocked: parsed.schemesUnlocked || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (e) {
    console.warn("[Groq Vision notice]:", (e as Error).message);
    return null;
  }
}

/**
 * Call OpenAI Vision API (gpt-4o-mini / gpt-4o).
 */
async function callOpenAiVision(fileBase64: string, apiKey: string): Promise<VisionAnalysisResult | null> {
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Determine if this image is strictly related to Indian agriculture, crops, soil, or government welfare land records. If not, reject with { isAgriRelated: false, scopeStatus: 'out_of_scope', reason: '...', suggestions: [...] }. If yes, return { isAgriRelated: true, scopeStatus: 'in_scope', docType: 'crop_disease'|'soil_health_card'|'land_record'|'identity_card', title: '...', detectionSummary: '...', extractedData: {...}, schemesUnlocked: [...], suggestions: [...] }. Return JSON only.",
              },
              {
                type: "image_url",
                image_url: { url: fileBase64 },
              },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      isAgriRelated: parsed.isAgriRelated ?? true,
      scopeStatus: parsed.scopeStatus ?? (parsed.isAgriRelated ? "in_scope" : "out_of_scope"),
      docType: parsed.docType,
      title: parsed.title,
      confidenceScore: parsed.confidenceScore || 0.95,
      detectionSummary: parsed.detectionSummary || "",
      reason: parsed.reason,
      extractedData: parsed.extractedData || {},
      schemesUnlocked: parsed.schemesUnlocked || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (e) {
    console.warn("[OpenAI Vision notice]:", (e as Error).message);
    return null;
  }
}

/**
 * Main Vision Analysis Entrypoint.
 *
 * 1. Checks if Cloud Vision LLM keys (Gemini, Groq, OpenAI) are available and calls them.
 * 2. If no cloud LLM key is configured or API fails, executes the built-in local vision OCR engine.
 */
export async function analyzeImageIntelligently(opts: {
  fileBase64: string;
  fileName?: string;
  fileType?: string;
  classification?: any;
}): Promise<VisionAnalysisResult> {
  const { fileBase64, classification } = opts;
  const fileName = opts.fileName || "uploaded_document.jpg";
  const fileType = opts.fileType || "image/jpeg";

  // 1. Try Gemini Vision LLM if API key is present
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VISION_API_KEY;
  if (geminiKey) {
    const geminiResult = await callGeminiVision(fileBase64, geminiKey, fileName);
    if (geminiResult) return geminiResult;
  }

  // 2. Try Groq Vision LLM if GROQ_API_KEY is present
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const groqResult = await callGroqVision(fileBase64, groqKey);
    if (groqResult) return groqResult;
  }

  // 3. Try OpenAI Vision LLM if OPENAI_API_KEY is present
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    const openAiResult = await callOpenAiVision(fileBase64, openAiKey);
    if (openAiResult) return openAiResult;
  }

  // 4. High-Accuracy Local Vision & OCR Analysis
  const localDetected = await analyzeDocumentComprehensive(fileBase64, fileName, fileType, classification);

  // If local engine flagged out-of-scope
  if ((localDetected as any).isAgriRelated === false || (localDetected as any).scopeStatus === "out_of_scope") {
    return {
      isAgriRelated: false,
      scopeStatus: "out_of_scope",
      confidenceScore: 0.95,
      detectionSummary: "Image does not appear to be related to agriculture or government schemes.",
      reason:
        (localDetected as any).reason ||
        "The uploaded photo shows non-agricultural objects rather than farming crops, soil, or official government documents.",
      suggestions: [
        "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
        "Upload an official agricultural document (Land Patta, Pahani, RoR 1B, Sale Deed, or Soil Health Card).",
        "Ensure good lighting and hold the camera steady.",
      ],
    };
  }

  // Convert local OCR result to unified VisionAnalysisResult
  return {
    isAgriRelated: true,
    scopeStatus: "in_scope",
    docType: localDetected.docType,
    title: localDetected.title,
    confidenceScore: localDetected.confidenceScore,
    detectionSummary: localDetected.detectionSummary,
    extractedTextSnippet: localDetected.extractedTextSnippet,
    extractedData: localDetected.extractedData,
    boundingBoxes: localDetected.boundingBoxes,
    schemesUnlocked: localDetected.schemesUnlocked,
    suggestions: [
      localDetected.extractedData?.recommendedAction || "Proceed with scheme verification and title linkage.",
      ...(localDetected.schemesUnlocked || []).slice(0, 3).map((s) => `Apply for ${s}`),
    ],
  };
}
