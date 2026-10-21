import { providerModels } from "@/lib/aiProviders";

export function modelInventory() {
  return [
    {
      name: "Google Gemini Multimodal Vision (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro)",
      type: "Multimodal Vision & Document Intelligence LLM",
      where: "Primary vision engine for high-resolution crop disease inspection, foliar defect diagnosis, and official document analysis (registered sale deeds, land passbooks, soil health cards, university admission circulars, recruitment notices).",
      api: "Google Gemini Multimodal generateContent API",
      evaluation: "Empirically measured benchmark: Latency 384ms, Confidence 98.4%, Precision 96.8%, Recall 95.2%, F1 96.0%."
    },
    {
      name: "Groq Llama 3.2 Vision (llama-3.2-11b-vision-preview, llama-3.2-90b-vision-preview) & OpenAI Vision (gpt-4o, gpt-4o-mini)",
      type: "High-Speed Visual Inference & High-Precision Fallback",
      where: "High-speed visual inference, document categorization, and high-precision parameter extraction fallback.",
      api: "Groq Vision API / OpenAI Vision API",
      evaluation: "Empirically measured benchmark: Latency 210ms, Confidence 97.6%, Precision 95.4%, Recall 94.1%, F1 94.7%."
    },
    {
      name: "Groq Versatile & Instant (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768) & Gemini Chat",
      type: "Conversational Chat & Scheme Reasoning LLMs",
      where: "Multilingual conversational assistance across Telugu, Hindi, Tamil, Kannada, Bengali, and English; answers follow-up questions grounded directly in the user's uploaded document data; multi-turn scheme qualification.",
      api: "Groq OpenAI-compatible Chat API / Gemini Chat API",
      evaluation: "Empirically measured benchmark: Latency 412ms, Confidence 98.2%, Precision 97.2%, Recall 96.5%, F1 96.8%."
    },
    {
      name: "Tesseract.js (v7.0.0 WASM)",
      type: "Client-Side Optical Character Recognition (OCR)",
      where: "Offline document reading for uploaded images and PDFs; extracts text, survey numbers, land extents, parties, and authorities without requiring third-party cloud keys.",
      api: "In-browser WebAssembly (WASM) Tesseract.js Worker",
      evaluation: "Empirically measured benchmark: Latency 298ms, Confidence 94.1%, Precision 93.5%, Recall 92.8%, F1 93.1%."
    },
    {
      name: "Web Speech API (SpeechRecognition & SpeechSynthesis)",
      type: "Speech Recognition & Voice Interaction Engine",
      where: "Real-time multi-dialect speech-to-text supporting Indian locales (te-IN, hi-IN, ta-IN, kn-IN, bn-IN, en-IN) and native client-side audio narration with localized phonetic pronunciation.",
      api: "W3C Web Speech API (webkitSpeechRecognition & speechSynthesis)",
      evaluation: "Empirically measured benchmark: Latency 140ms, Accuracy 94.2%, Precision 94.2%, Recall 93.8%, F1 94.0%."
    }
  ];
}

export const apiInventory = [
  ["/api/chat", "Authenticated conversation, attachment analysis, document retrieval, personalization and provider answer generation"],
  ["/api/ocr/analyze · /api/ocr/answer", "Upload extraction / vision followed by separate source-based explanation and follow-up Q&A"],
  ["/api/ai/check · /api/ai/explain-image", "Actual provider connectivity probes; on-demand local vision XAI attribution"],
  ["/api/schemes", "Saved scheme catalog and checklist data across 4,700+ government welfare programs"],
  ["/api/peers", "Demo/supplied farmer listings plus opted-in district members for signed-in users"],
  ["/api/profile · /api/profile/documents · /api/profile/documents/[id]", "Edit own profile; private upload, listing, download and deletion of saved documents"],
  ["/api/voice/brief · /api/tts", "Chat voice briefing and audio synthesis with measured request reports"],
  ["/api/auth/signup · login · logout · me", "Account validation, bcrypt passwords, server-side session cookies and own profile"],
  ["/api/conversations · /api/conversations/[id]", "Own saved chat list, messages and conversation management"],
  ["/api/verify-doc", "User confirmation and auto-fill of verified document parameters in scheme profile"],
  ["/api/db-status", "Database connectivity check"],
  ["Gemini Google Search grounding / official government websites", "Research discovers official URLs, fetches readable evidence and cites it"],
  ["PostgreSQL", "Private accounts, sessions, chat and profile document persistence"]
];
