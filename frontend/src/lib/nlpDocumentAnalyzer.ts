import type { SupportedLanguage } from "@/lib/i18n";
import type { ExtractedBoundingBox } from "@/lib/ocrEngine";

export type DocumentGenre = "sale_deed" | "education_admission" | "recruitment_notice" | "research_publication" | "land_record" | "soil_health" | "crop_disease" | "identity_card" | "general_document" | "out_of_scope";
export interface ParsedDocumentDetails {
  genre: DocumentGenre; title: string; summary: string;
  extractedParameters: Record<string, string>;
  requiredDocuments?: string[]; scheduleDates?: string; reportingVenue?: string;
  unlockedSchemes: string[]; actionableSuggestions: string[];
  boundingBoxes: ExtractedBoundingBox[]; fullOcrText: string;
}

// Local extraction is deliberately literal: never substitute a remembered sample notice.
export function parseAndSummarizeDocumentContent(ocrText: string, _fileName = "document.jpg", _classification?: any): ParsedDocumentDetails {
  const text = (ocrText || "").trim();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const genre: DocumentGenre = /sale deed|deed of sale|\bvendor\b|\bvendee\b/i.test(text) ? "sale_deed"
    : /admission|counsell?ing/i.test(text) ? "education_admission"
    : /recruitment|vacanc|extension assistant/i.test(text) ? "recruitment_notice"
    : /\bicar\b|\bdare\b|foreword|research publication/i.test(text) ? "research_publication"
    : /soil health|soil test/i.test(text) ? "soil_health"
    : /aadhaar|identity card|voter id|ration card/i.test(text) ? "identity_card"
    : /patta|pahani|land record|khasra/i.test(text) ? "land_record" : "general_document";
  const parameters: Record<string, string> = {};
  const fields: Array<[string, RegExp]> = [
    ["Vendor (Seller)", /^(?:vendor(?:\s*\(seller\))?|seller)\s*[:=-]\s*(.+)$/im],
    ["Vendee (Purchaser)", /^(?:vendee(?:\s*\(purchaser\))?|buyer|purchaser)\s*[:=-]\s*(.+)$/im],
    ["Owner / Applicant", /^(?:owner(?:\s*name)?|applicant(?:\s*name)?|name of (?:the )?(?:farmer|owner|applicant)|beneficiary(?:\s*name)?)\s*[:=-]\s*(.+)$/im],
    ["Survey Number", /(?:survey|khasra|khata)\s*(?:no\.?|number)?\s*[:=-]?\s*(\d[\w/-]*)/i],
    ["Land Extent", /(\d+(?:\.\d+)?\s*(?:acres?|hectares?|guntas?|bigha|cents?)\b)/i],
    ["Consideration Amount", /(?:consideration(?:\s*amount)?|valuation|fee|amount)\s*[:=-]?\s*((?:Rs\.?|INR|₹)?\s*\d[\d,]*(?:\.\d+)?)/i],
    ["Institution / Department", /^([^\n]*(?:university|directorate|department|ministry)[^\n]*)$/im],
    ["Venue", /^(?:venue|reporting venue|location)\s*[:=-]\s*(.+)$/im],
    ["Schedule / Dates", /^(?:date|dates|schedule|reporting date|last date|deadline)\s*[:=-]\s*(.+)$/im],
  ];
  for (const [name, pattern] of fields) {
    const value = text.match(pattern)?.[1]?.trim();
    if (value) parameters[name] = value;
  }
  const dates = text.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g);
  if (dates?.length && !parameters["Schedule / Dates"]) parameters["Schedule / Dates"] = Array.from(new Set(dates)).join(", ");
  // Preserve labelled fields in unfamiliar government notices, in any supported script.
  for (const line of lines) {
    const match = line.match(/^([^:]{2,65}):\s*(.{1,300})$/);
    if (match && !parameters[match[1]]) parameters[match[1]] = match[2];
  }
  const requiredDocuments = lines.filter((line) => /certificate|marksheet|mark sheet|passbook|aadha?ar|photocop|allotment letter|admit card|CLC\s*\/\s*SLC|photograph/i.test(line));
  // Scheme names are suggestions only when explicitly mentioned in the source.
  const unlockedSchemes = Array.from(new Set(text.match(/PM[-\s]?KISAN|PMFBY|PM[-\s]?KUSUM|Kisan Credit Card|Soil Health Card|\bSMAM\b|Maha\s*lakshmi|Rythu\s*Bharosa|Gruha\s*Jyothi|Indiramma\s*(?:Indlu|Housing)|Cheyutha|మహాలక్ష్మి|రైతు భరోసా|గృహ జ్యోతి|ఇందిరమ్మ ఇండ్లు|చేయూత/gi) || []));
  const heading = lines.find((line) => /government|govt|schemes? and policies|agricultur|admission|directorate|sale deed|soil health|ప్రభుత్వ|పథకాల/i.test(line));
  const title = (heading || lines[0])?.slice(0, 160) || "Unreadable upload";
  const isPoster = /schemes? and policies|scheme.*poster/i.test(text);
  const summary = isPoster
    ? `This image is a government scheme information poster headed "${title}".${unlockedSchemes.length ? ` Readable scheme names: ${unlockedSchemes.join(", ")}.` : " The individual scheme names and conditions could not all be read reliably at this resolution."} Small or unclear amounts, eligibility conditions and deadlines must be checked from a clear close-up or the official notice.`
    : text ? lines.slice(0, 10).join(" ").slice(0, 1800) : "I could not read this upload. Please send a clearer image or paste the document text.";
  const actionableSuggestions = text ? [
    "Check the issuing department and official portal shown in the document before submitting an application.",
    parameters["Schedule / Dates"] ? `Check the stated schedule: ${parameters["Schedule / Dates"]}. Confirm that the notice is still current.` : "Confirm the current application deadline with the issuing office; it was not identified in the readable text.",
    requiredDocuments.length ? "Prepare the documents listed in this notice and confirm any missing requirements with its issuing office." : "Ask the issuing office for the application checklist; no explicit checklist was identified in the readable text.",
  ] : ["Upload a sharp, well-lit image of the entire page, or paste its text."];
  if (isPoster) actionableSuggestions.unshift("Send a close-up of the specific scheme panel you are interested in so its benefits, eligibility and application instructions can be read accurately.");
  return { genre, title, summary, extractedParameters: parameters, requiredDocuments,
    scheduleDates: parameters["Schedule / Dates"], reportingVenue: parameters.Venue,
    unlockedSchemes, actionableSuggestions, boundingBoxes: [], fullOcrText: text };
}

export function analyzeDocumentWithNlpSuite(text: string, fileName = "document.jpg", classification?: any) {
  const parsed = parseAndSummarizeDocumentContent(text, fileName, classification);
  const docType = parsed.genre === "soil_health" ? "soil_health_card" as const
    : parsed.genre === "identity_card" ? "identity_card" as const : "land_record" as const;
  return { docType, title: parsed.title, confidenceScore: text ? 0.65 : 0,
    detectionSummary: parsed.summary, extractedData: parsed.extractedParameters,
    boundingBoxes: [], schemesUnlocked: parsed.unlockedSchemes,
    suggestions: parsed.actionableSuggestions, parsedDetails: parsed };
}

const labels: Record<SupportedLanguage, { summary: string; details: string; suggestions: string; missing: string; schemes: string }> = {
  en: { summary: "Document summary", details: "Details read from the document", suggestions: "Suggested next steps", missing: "Not specified in the readable document.", schemes: "Schemes mentioned (eligibility must be checked)" },
  te: { summary: "పత్రం సారాంశం", details: "పత్రంలోని వివరాలు", suggestions: "తదుపరి చర్యల సూచనలు", missing: "చదవగలిగిన పత్రంలో పేర్కొనబడలేదు.", schemes: "పత్రంలో పేర్కొన్న పథకాలు (అర్హత నిర్ధారించాలి)" },
  hi: { summary: "दस्तावेज़ सारांश", details: "दस्तावेज़ से पढ़े गए विवरण", suggestions: "अगले कदम", missing: "पढ़ने योग्य दस्तावेज़ में निर्दिष्ट नहीं है।", schemes: "उल्लिखित योजनाएं (पात्रता की जांच आवश्यक है)" },
  ta: { summary: "ஆவணச் சுருக்கம்", details: "ஆவணத்தில் உள்ள விவரங்கள்", suggestions: "அடுத்த படிகள்", missing: "படிக்கக்கூடிய ஆவணத்தில் குறிப்பிடப்படவில்லை.", schemes: "குறிப்பிடப்பட்ட திட்டங்கள் (தகுதியைச் சரிபார்க்கவும்)" },
  kn: { summary: "ದಾಖಲೆಯ ಸಾರಾಂಶ", details: "ದಾಖಲೆಯ ವಿವರಗಳು", suggestions: "ಮುಂದಿನ ಕ್ರಮಗಳು", missing: "ಓದಬಹುದಾದ ದಾಖಲೆಯಲ್ಲಿ ತಿಳಿಸಿಲ್ಲ.", schemes: "ಉಲ್ಲೇಖಿಸಿದ ಯೋಜನೆಗಳು (ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ)" },
  bn: { summary: "নথির সারাংশ", details: "নথি থেকে পড়া তথ্য", suggestions: "পরবর্তী পদক্ষেপ", missing: "পাঠযোগ্য নথিতে উল্লেখ নেই।", schemes: "উল্লিখিত প্রকল্প (যোগ্যতা যাচাই করুন)" },
};

export function answerDocumentQuestion(query: string, detection: any, lang: SupportedLanguage): { text: string; chips: string[] } {
  const source = detection?.parsedDetails?.fullOcrText || detection?.extractedTextSnippet || "";
  const base = detection?.parsedDetails || parseAndSummarizeDocumentContent(source);
  // Preserve structured cloud facts and its actual summary; never reparse JSON as OCR prose.
  const p: Record<string, any> = { ...base.extractedParameters, ...(detection?.extractedData || {}) };
  const summary = detection?.detectionSummary || base.summary;
  const suggestions: string[] = detection?.suggestions?.length ? detection.suggestions : base.actionableSuggestions;
  const schemes: string[] = detection?.schemesUnlocked || base.unlockedSchemes;
  const q = query.toLowerCase();
  const l = labels[lang] || labels.en;
  const chips = ["Summarize this document", "Give me suggestions", "What documents are required?"];
  const bullets = (entries: Array<[string, any]>) => entries.map(([key, value]) => `• **${key}:** ${typeof value === "object" ? JSON.stringify(value) : value}`).join("\n") || l.missing;
  const select = (pattern: RegExp) => Object.entries(p).filter(([key]) => pattern.test(key));
  const suggestedText = `**${l.suggestions}**\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**${l.schemes}**\n${schemes.join("\n") || l.missing}`;
  // Specific intents precede summary. Short questions are still questions.
  if (/suggest|recommend|advice|next step|సలహా|సూచన|सुझाव|सलाह|பரிந்துரை|ಸಲಹೆ|পরামর্শ/i.test(q)) return { text: suggestedText, chips };
  if (/what.*documents?.*(required|need|submit|bring|carry)|which.*documents?.*(required|need|submit|bring|carry)|required documents?|documents? (required|needed)|checklist|what to (bring|carry)|కావలసిన పత్ర|आवश्यक दस्तावेज|தேவையான ஆவண|ಅಗತ್ಯ ದಾಖಲೆ|প্রয়োজনীয় নথি/i.test(q)) {
    const checklist = detection?.extractedData?.requiredDocuments || base.requiredDocuments;
    return { text: Array.isArray(checklist) && checklist.length ? checklist.map((item: string) => `• ${item}`).join("\n") : l.missing, chips };
  }
  const intentFields: Array<[RegExp, RegExp]> = [
    [/owner|buyer|seller|vendor|vendee|applicant|whose|who|name|యజమాని|పేరు|मालिक|नाम|உரிமையாளர்|ಮಾಲೀಕ|মালিক/i, /owner|buyer|seller|vendor|vendee|purchaser|applicant|beneficiary|name|author|institution|department/i],
    [/survey|extent|acre|hectare|land area|సర్వే|విస్తీర్ణ|सर्वे|रकबा/i, /survey|extent|acre|hectare|land.?area|khata|khasra/i],
    [/amount|fee|cost|consideration|valuation|ధర|మొత్తం|राशि|कीमत/i, /amount|fee|cost|consideration|valuation/i],
    [/when|date|schedule|deadline|venue|where|తేదీ|समय|தேதி|ದಿನಾಂಕ|তারিখ/i, /date|schedule|deadline|venue|location/i],
  ];
  for (const [intent, fields] of intentFields) if (intent.test(q)) return { text: bullets(select(fields)), chips };
  if (/how.*apply|application.*process|దరఖాస్తు|आवेदन|விண்ணப்ப|ಅರ್ಜಿ|আবেদন/i.test(q)) {
    const instructions = select(/apply|application|submission|portal|url|website|procedure|instructions/i);
    return { text: `${bullets(instructions)}\n\n${suggestedText}`, chips };
  }
  if (/summar|analy|overview|explain|brief|tell me about|సారాంశ|सारांश|சுருக்க|ಸಾರಾಂಶ|সারসংক্ষেপ/i.test(q) || !q.trim()) {
    return { text: `**${l.summary}**\n${summary}\n\n**${l.details}**\n${bullets(Object.entries(p))}\n\n${suggestedText}`, chips };
  }
  if (/scheme|subsid|eligible|benefit|పథక|योजना|திட்ட|ಯೋಜನೆ|প্রকল্প/i.test(q)) return { text: `**${l.schemes}**\n${schemes.join("\n") || summary}\n\n${suggestedText}`, chips };
  // Unknown questions retrieve literal source lines rather than inventing an answer.
  const terms = q.match(/[a-zA-Z0-9\u0900-\u0d7f]{4,}/g) || [];
  const lines = source.split(/\r?\n/).filter((line: string) => terms.some((term) => line.toLowerCase().includes(term))).slice(0, 8);
  return { text: lines.length ? lines.join("\n") : l.missing, chips };
}
