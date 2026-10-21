import type { SupportedLanguage } from "@/lib/i18n";
import type { ExtractedBoundingBox } from "@/lib/ocrEngine";
import { retrieveDocumentEvidence } from "@/lib/documentEvidence";
import { partialDocumentSource } from "@/lib/partialDocument";

export type DocumentGenre = "sale_deed" | "education_admission" | "recruitment_notice" | "research_publication" | "land_record" | "soil_health" | "crop_disease" | "identity_card" | "general_document" | "out_of_scope";
export interface ParsedDocumentDetails {
  genre: DocumentGenre; title: string; summary: string;
  extractedParameters: Record<string, string>;
  requiredDocuments?: string[]; scheduleDates?: string; reportingVenue?: string;
  unlockedSchemes: string[]; actionableSuggestions: string[];
  boundingBoxes: ExtractedBoundingBox[]; fullOcrText: string;
  schemeEntries?: Array<{ name: string; source: string }>;
}

export function extractAgriculturalEntries(text: string): Array<{ name: string; source: string }> {
  const pattern = /certified\s+seeds?(?:\s+of\s+(?:maize|rice|paddy))?|gypsum|(?:manually\s+operated\s+)?plant\s+protection\s+equipment|mini\s*kits?(?:\s+of\s+maize)?|(?:knapsack|power)\s+sprayer/gi;
  const positions: Array<{ name: string; index: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const name = match[0];
    if (!positions.some((item) => item.name.toLowerCase() === name.toLowerCase())) positions.push({ name, index: match.index });
  }
  return positions.map((item, index) => ({ name: item.name,
    source: text.slice(item.index, positions[index + 1]?.index || text.length).trim().slice(0, 1000) }));
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
  const schemeEntries = extractAgriculturalEntries(text);
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
  const checklistStart = lines.findIndex(line => /required documents|documents required|documents to (?:submit|bring)|checklist|enclosures|పత్రాలు|दस्तावेज/i.test(line));
  const inlineChecklist = checklistStart >= 0 ? lines[checklistStart].match(/[:：]\s*(.+)$/)?.[1] : undefined;
  const checklistLines = checklistStart >= 0 ? [...(inlineChecklist ? [inlineChecklist] : []), ...lines.slice(checklistStart + 1).slice(0, 20)] : [];
  const requiredDocuments = checklistLines.filter((line) => /certificate|marksheet|mark sheet|passbook|aadha?ar|photocop|allotment letter|admit card|CLC\s*\/\s*SLC|photograph|proof|పత్ర|ధ్రువ|प्रमाण/i.test(line)
    && !/not required|not necessary|optional|నవసరం లేదు|आवश्यक नहीं/i.test(line));
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
  if (genre === "sale_deed" || genre === "land_record") actionableSuggestions.splice(0, actionableSuggestions.length,
    "Compare the readable owner/buyer/seller names, survey number and land extent with the original revenue record; a deed and a current land record serve different purposes.",
    "Ask the issuing revenue or registration office to clarify missing fields or discrepancies. Reading this copy does not establish title, authenticity, current ownership or scheme eligibility.");
  if (genre === "soil_health") actionableSuggestions.splice(0, actionableSuggestions.length,
    "Check the sample date, field identifier, pH, EC and nutrient readings together with their units and the laboratory's reference ranges.",
    "Share the crop, growth stage and fertilizers already used. Use the laboratory's crop-specific recommendation; a photo or an isolated nutrient value is insufficient to calculate a fertilizer dose.");
  if (genre === "identity_card") actionableSuggestions.splice(0, actionableSuggestions.length,
    "Check the readable name and issuing authority against the original card; an image cannot verify the identity or authenticity of its holder.",
    "Use the issuing authority's official correction process for mismatches. Keep full identity numbers and OTPs private.");
  if (genre === "research_publication") actionableSuggestions.splice(0, actionableSuggestions.length,
    "Identify the crop, location and experimental conditions before applying the publication's findings to your farm.",
    "Ask for a summary of the relevant section and discuss locally applicable practices with your agricultural extension officer.");
  const tableSummary = schemeEntries.length >= 2
    ? `This document lists agricultural support for ${schemeEntries.map((item) => item.name).join(", ")}. The entries below quote the readable text; verify unclear figures and current availability with the issuing agriculture office.\n\n${schemeEntries.map((item) => `• ${item.source}`).join("\n\n")}` : summary;
  return { genre, title, summary: tableSummary, extractedParameters: parameters, requiredDocuments, schemeEntries,
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

const answerWords: Record<SupportedLanguage, {
  chips: string[]; source: string; current: string; verifySource: string; deadline: (value?: string) => string;
  checklist: string; closeup: string; land: string; soil: string; identity: string; research: string;
  fieldNames: Record<string, string>;
}> = {
  en: {
    chips: ["Summarize this document", "Give me suggestions", "What documents are required?"], source: "Readable source text",
    current: "Check current availability and any unclear figures with the agriculture office listed in the document.",
    verifySource: "Check the issuing department and its official portal before applying.",
    deadline: (value) => value ? `Check the stated schedule: ${value}. Confirm it is still current.` : "Confirm the current deadline with the issuing office; it was not identified in the readable text.",
    checklist: "Use the document's explicit checklist; ask the issuing office about any missing requirements.",
    closeup: "Send a close-up of the relevant scheme panel so its conditions and benefits can be read.",
    land: "Compare the names, survey number and land extent with the original land record. This copy alone does not establish ownership or eligibility.",
    soil: "Check the sample date, units, reference ranges and laboratory recommendation before choosing a fertilizer dose.",
    identity: "Compare the name and issuing authority with the original card. Keep identity numbers and OTPs private.",
    research: "Check whether the crop, location and study conditions match your farm before using the findings.",
    fieldNames: {},
  },
  hi: {
    chips: ["दस्तावेज़ का सार बताएं", "अगले कदम बताएं", "कौन से दस्तावेज़ चाहिए?"], source: "पढ़ा जा सकने वाला मूल पाठ",
    current: "इस दस्तावेज़ के कृषि कार्यालय से वर्तमान उपलब्धता और अस्पष्ट आँकड़ों की पुष्टि करें।",
    verifySource: "आवेदन से पहले जारी करने वाले विभाग और उसकी आधिकारिक वेबसाइट की जाँच करें।",
    deadline: (value) => value ? `दस्तावेज़ में दी गई तारीख/समय-सारणी: ${value}। इसके वर्तमान होने की पुष्टि करें।` : "पढ़े जा सकने वाले हिस्से में अंतिम तारीख नहीं मिली; जारी करने वाले कार्यालय से पूछें।",
    checklist: "दस्तावेज़ में दी गई सूची के कागज़ तैयार करें; अन्य ज़रूरतें जारी करने वाले कार्यालय से पूछें।",
    closeup: "शर्तें और लाभ पढ़ने के लिए संबंधित योजना वाले हिस्से की पास से स्पष्ट तस्वीर भेजें।",
    land: "नाम, सर्वे नंबर और भूमि क्षेत्र मूल राजस्व रिकॉर्ड से मिलाएं। यह प्रति अकेले स्वामित्व या पात्रता साबित नहीं करती।",
    soil: "खाद की मात्रा तय करने से पहले नमूने की तारीख, इकाइयाँ, संदर्भ सीमा और प्रयोगशाला की सलाह देखें।",
    identity: "नाम और जारीकर्ता को मूल कार्ड से मिलाएं। पहचान संख्या और ओटीपी गोपनीय रखें।",
    research: "नतीजे अपनाने से पहले देखें कि फसल, स्थान और अध्ययन की परिस्थितियाँ आपके खेत से मिलती हैं या नहीं।",
    fieldNames: { "Owner / Applicant": "मालिक / आवेदक", "Survey Number": "सर्वे नंबर", "Land Extent": "भूमि क्षेत्र", "Schedule / Dates": "तारीखें", "Venue": "स्थान", "Consideration Amount": "राशि" },
  },
  te: {
    chips: ["పత్రాన్ని సంక్షిప్తంగా చెప్పండి", "తదుపరి చర్యలు చెప్పండి", "ఏ పత్రాలు కావాలి?"], source: "చదవగలిగిన అసలు పాఠ్యం",
    current: "ఈ పత్రంలో తెలిపిన వ్యవసాయ కార్యాలయంలో ప్రస్తుత లభ్యత, అస్పష్టమైన సంఖ్యలను నిర్ధారించండి.",
    verifySource: "దరఖాస్తుకు ముందు జారీ చేసిన శాఖను, అధికారిక వెబ్‌సైట్‌ను తనిఖీ చేయండి.",
    deadline: (value) => value ? `పత్రంలో పేర్కొన్న తేదీలు: ${value}. ఇవి ఇప్పటికీ వర్తిస్తాయో నిర్ధారించండి.` : "చదవగలిగిన భాగంలో చివరి తేదీ కనిపించలేదు; జారీ చేసిన కార్యాలయాన్ని అడగండి.",
    checklist: "పత్రంలో స్పష్టంగా ఇచ్చిన జాబితా ప్రకారం పత్రాలను సిద్ధం చేయండి; మిగిలిన అవసరాలు జారీ చేసిన కార్యాలయాన్ని అడగండి.",
    closeup: "అర్హత, ప్రయోజనాలు చదవడానికి సంబంధిత పథకం భాగాన్ని దగ్గరగా స్పష్టంగా ఫోటో తీయండి.",
    land: "పేరు, సర్వే నంబర్, భూమి విస్తీర్ణాన్ని అసలు రెవెన్యూ రికార్డుతో పోల్చండి. ఈ కాపీతోనే యాజమాన్యం లేదా అర్హత నిర్ధారించలేం.",
    soil: "ఎరువు మోతాదు నిర్ణయించే ముందు నమూనా తేదీ, యూనిట్లు, ప్రమాణాలు, ప్రయోగశాల సూచన చూడండి.",
    identity: "పేరు, జారీ చేసిన సంస్థను అసలు కార్డుతో పోల్చండి. గుర్తింపు సంఖ్యలు, OTPలను రహస్యంగా ఉంచండి.",
    research: "సూచనలు అమలు చేసే ముందు పంట, ప్రాంతం, అధ్యయన పరిస్థితులు మీ పొలానికి సరిపోతాయో చూడండి.",
    fieldNames: { "Owner / Applicant": "యజమాని / దరఖాస్తుదారు", "Survey Number": "సర్వే నంబర్", "Land Extent": "భూమి విస్తీర్ణం", "Schedule / Dates": "తేదీలు", "Venue": "స్థలం", "Consideration Amount": "మొత్తం" },
  },
  ta: {
    chips: ["ஆவணத்தைச் சுருக்கவும்", "அடுத்த படிகளைச் சொல்லவும்", "எந்த ஆவணங்கள் தேவை?"], source: "படிக்க முடிந்த அசல் உரை",
    current: "இந்த ஆவணத்தில் உள்ள வேளாண் அலுவலகத்தில் தற்போதைய நிலையும் தெளிவற்ற எண்களும் சரிபார்க்கவும்.",
    verifySource: "விண்ணப்பிக்கும் முன் வழங்கிய துறையையும் அதன் அதிகாரப்பூர்வ இணையதளத்தையும் சரிபார்க்கவும்.",
    deadline: (value) => value ? `ஆவணத்தில் உள்ள தேதிகள்: ${value}. இவை இன்னும் பொருந்துகிறதா உறுதிப்படுத்தவும்.` : "படிக்க முடிந்த பகுதியில் கடைசி தேதி இல்லை; வழங்கிய அலுவலகத்தில் கேளுங்கள்.",
    checklist: "ஆவணத்தில் தெளிவாகக் கூறிய சான்றுகளைத் தயாரிக்கவும்; கூடுதல் தேவைகளை வழங்கிய அலுவலகத்தில் கேளுங்கள்.",
    closeup: "நிபந்தனைகளையும் பலன்களையும் படிக்க, தொடர்புடைய திட்டப் பகுதியின் தெளிவான நெருக்கப் படத்தை அனுப்பவும்.",
    land: "பெயர், சர்வே எண், நில அளவை அசல் வருவாய் பதிவுடன் ஒப்பிடவும். இந்த நகல் மட்டும் உரிமை அல்லது தகுதியை உறுதிசெய்யாது.",
    soil: "உர அளவை முடிவு செய்யும் முன் மாதிரி தேதி, அலகுகள், குறிப்பு வரம்புகள், ஆய்வகப் பரிந்துரை ஆகியவற்றைப் பார்க்கவும்.",
    identity: "பெயரையும் வழங்கிய அலுவலகத்தையும் அசல் அட்டையுடன் ஒப்பிடவும். அடையாள எண்களையும் OTP-யையும் ரகசியமாக வைக்கவும்.",
    research: "முடிவுகளைப் பயன்படுத்தும் முன் பயிர், இடம், ஆய்வின் சூழல் உங்கள் வயலுக்குப் பொருந்துகிறதா பார்க்கவும்.",
    fieldNames: { "Owner / Applicant": "உரிமையாளர் / விண்ணப்பதாரர்", "Survey Number": "சர்வே எண்", "Land Extent": "நில அளவு", "Schedule / Dates": "தேதிகள்", "Venue": "இடம்", "Consideration Amount": "தொகை" },
  },
  kn: {
    chips: ["ದಾಖಲೆಯನ್ನು ಸಾರಾಂಶ ಮಾಡಿ", "ಮುಂದಿನ ಕ್ರಮ ತಿಳಿಸಿ", "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?"], source: "ಓದಬಹುದಾದ ಮೂಲ ಪಠ್ಯ",
    current: "ದಾಖಲೆಯಲ್ಲಿ ತಿಳಿಸಿದ ಕೃಷಿ ಕಚೇರಿಯಲ್ಲಿ ಪ್ರಸ್ತುತ ಲಭ್ಯತೆ ಮತ್ತು ಅಸ್ಪಷ್ಟ ಅಂಕಿಗಳನ್ನು ಖಚಿತಪಡಿಸಿ.",
    verifySource: "ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ನೀಡಿದ ಇಲಾಖೆ ಮತ್ತು ಅದರ ಅಧಿಕೃತ ಜಾಲತಾಣ ಪರಿಶೀಲಿಸಿ.",
    deadline: (value) => value ? `ದಾಖಲೆಯಲ್ಲಿರುವ ದಿನಾಂಕಗಳು: ${value}. ಇವು ಈಗಲೂ ಅನ್ವಯಿಸುತ್ತವೆಯೇ ಖಚಿತಪಡಿಸಿ.` : "ಓದಬಹುದಾದ ಭಾಗದಲ್ಲಿ ಕೊನೆಯ ದಿನಾಂಕ ಸಿಗಲಿಲ್ಲ; ನೀಡಿದ ಕಚೇರಿಯಲ್ಲಿ ಕೇಳಿ.",
    checklist: "ದಾಖಲೆಯಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೊಟ್ಟ ಪಟ್ಟಿಯ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ; ಇತರ ಅಗತ್ಯಗಳನ್ನು ನೀಡಿದ ಕಚೇರಿಯಲ್ಲಿ ಕೇಳಿ.",
    closeup: "ಷರತ್ತು ಮತ್ತು ಪ್ರಯೋಜನ ಓದಲು ಸಂಬಂಧಿಸಿದ ಯೋಜನೆಯ ಸ್ಪಷ್ಟ ಹತ್ತಿರದ ಚಿತ್ರ ಕಳುಹಿಸಿ.",
    land: "ಹೆಸರು, ಸರ್ವೆ ಸಂಖ್ಯೆ, ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣವನ್ನು ಮೂಲ ಕಂದಾಯ ದಾಖಲೆಯೊಂದಿಗೆ ಹೋಲಿಸಿ. ಈ ಪ್ರತಿಯಿಂದ ಮಾತ್ರ ಮಾಲೀಕತ್ವ ಅಥವಾ ಅರ್ಹತೆ ಖಚಿತವಾಗುವುದಿಲ್ಲ.",
    soil: "ಗೊಬ್ಬರ ಪ್ರಮಾಣ ತೀರ್ಮಾನಿಸುವ ಮುನ್ನ ಮಾದರಿಯ ದಿನಾಂಕ, ಅಳತೆ ಘಟಕ, ಮಾನದಂಡ ಮತ್ತು ಪ್ರಯೋಗಾಲಯದ ಸಲಹೆ ನೋಡಿ.",
    identity: "ಹೆಸರು ಮತ್ತು ನೀಡಿದ ಪ್ರಾಧಿಕಾರವನ್ನು ಮೂಲ ಕಾರ್ಡಿನೊಂದಿಗೆ ಹೋಲಿಸಿ. ಗುರುತಿನ ಸಂಖ್ಯೆ ಮತ್ತು OTP ರಹಸ್ಯವಾಗಿರಲಿ.",
    research: "ಫಲಿತಾಂಶ ಬಳಸುವ ಮುನ್ನ ಬೆಳೆ, ಸ್ಥಳ, ಅಧ್ಯಯನದ ಪರಿಸ್ಥಿತಿಗಳು ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆಯೇ ನೋಡಿ.",
    fieldNames: { "Owner / Applicant": "ಮಾಲೀಕ / ಅರ್ಜಿದಾರ", "Survey Number": "ಸರ್ವೆ ಸಂಖ್ಯೆ", "Land Extent": "ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ", "Schedule / Dates": "ದಿನಾಂಕಗಳು", "Venue": "ಸ್ಥಳ", "Consideration Amount": "ಮೊತ್ತ" },
  },
  bn: {
    chips: ["নথির সারাংশ বলুন", "পরের পদক্ষেপ বলুন", "কোন নথি লাগবে?"], source: "পড়া যায় এমন মূল লেখা",
    current: "নথিতে উল্লিখিত কৃষি দপ্তরে বর্তমান প্রাপ্যতা ও অস্পষ্ট সংখ্যাগুলি যাচাই করুন।",
    verifySource: "আবেদনের আগে প্রকাশক দপ্তর ও তার সরকারি ওয়েবসাইট যাচাই করুন।",
    deadline: (value) => value ? `নথিতে দেওয়া তারিখ: ${value}। এখনও কার্যকর কি না নিশ্চিত করুন।` : "পড়া যায় এমন অংশে শেষ তারিখ পাওয়া যায়নি; প্রকাশক দপ্তরে জিজ্ঞাসা করুন।",
    checklist: "নথিতে স্পষ্ট তালিকাভুক্ত কাগজগুলি প্রস্তুত করুন; অন্য প্রয়োজন প্রকাশক দপ্তরে জিজ্ঞাসা করুন।",
    closeup: "শর্ত ও সুবিধা পড়ার জন্য সংশ্লিষ্ট প্রকল্পের অংশের স্পষ্ট কাছ থেকে ছবি পাঠান।",
    land: "নাম, সার্ভে নম্বর ও জমির পরিমাণ মূল ভূমি রেকর্ডের সঙ্গে মেলান। শুধু এই কপি মালিকানা বা যোগ্যতা প্রমাণ করে না।",
    soil: "সারের মাত্রা ঠিক করার আগে নমুনার তারিখ, একক, মানদণ্ড ও পরীক্ষাগারের পরামর্শ দেখুন।",
    identity: "নাম ও প্রদানকারী দপ্তর মূল কার্ডের সঙ্গে মেলান। পরিচয় নম্বর ও OTP গোপন রাখুন।",
    research: "ফল প্রয়োগের আগে ফসল, স্থান ও গবেষণার অবস্থা আপনার খেতের সঙ্গে মেলে কি না দেখুন।",
    fieldNames: { "Owner / Applicant": "মালিক / আবেদনকারী", "Survey Number": "সার্ভে নম্বর", "Land Extent": "জমির পরিমাণ", "Schedule / Dates": "তারিখ", "Venue": "স্থান", "Consideration Amount": "টাকার পরিমাণ" },
  },
};

export function answerDocumentQuestion(query: string, detection: any, lang: SupportedLanguage): { text: string; chips: string[] } {
  const partial = detection?.analysisQuality === "partial";
  const source = partial ? partialDocumentSource(detection) : detection?.parsedDetails?.fullOcrText || detection?.extractedTextSnippet || "";
  const currentQuestion = query.split("Current question:").pop() || query;
  const scoped = source.length > 12000 && /documents?|checklist|apply|application|eligib|deadline|last date|amount|benefit|owner|applicant|survey|buyer|seller/i.test(currentQuestion);
  const relevant = scoped ? retrieveDocumentEvidence(query, source, 6).map(passage => passage.text).join("\n\n") : "";
  const base = relevant ? parseAndSummarizeDocumentContent(relevant) : (!partial && detection?.parsedDetails) || parseAndSummarizeDocumentContent(source);
  // Preserve structured cloud facts and its actual summary; never reparse JSON as OCR prose.
  const p: Record<string, any> = { ...base.extractedParameters, ...(!partial && !scoped ? detection?.extractedData || {} : {}) };
  const summary = partial && source ? base.summary : detection?.detectionSummary || base.summary;
  const suggestions: string[] = !partial && detection?.suggestions?.length ? detection.suggestions : base.actionableSuggestions;
  const schemes: string[] = !partial && detection?.schemesUnlocked || base.unlockedSchemes;
  const q = currentQuestion.toLowerCase();
  const l = labels[lang] || labels.en;
  const words = answerWords[lang] || answerWords.en;
  const chips = words.chips;
  const localSuggestions = lang === "en" ? suggestions : [
    ...(/schemes? and policies|scheme.*poster/i.test(source) ? [words.closeup] : []),
    ...(base.genre === "sale_deed" || base.genre === "land_record" ? [words.land] : []),
    ...(base.genre === "soil_health" ? [words.soil] : []),
    ...(base.genre === "identity_card" ? [words.identity] : []),
    ...(base.genre === "research_publication" ? [words.research] : []),
    words.verifySource,
    words.deadline(base.scheduleDates),
    words.checklist,
  ];
  if (partial && !source) {
    return { text: `**${l.summary}**\n${summary}\n\n**${l.suggestions}**\n${localSuggestions.map((item) => `• ${item}`).join("\n")}`, chips };
  }
  const bullets = (entries: Array<[string, any]>) => entries.map(([key, value]) => `• **${words.fieldNames[key] || key}:** ${typeof value === "object" ? JSON.stringify(value) : value}`).join("\n") || l.missing;
  const select = (pattern: RegExp) => Object.entries(p).filter(([key]) => pattern.test(key));
  const literalAnswer = () => {
    const passages = retrieveDocumentEvidence(query, source, 2);
    return passages.length ? `${lang === "en" ? "" : `**${words.source}**\n`}${passages.map(p => p.text).join("\n\n")}` : l.missing;
  };
  const suggestedText = `**${l.suggestions}**\n${localSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**${l.schemes}**\n${schemes.join("\n") || l.missing}`;
  if (base.schemeEntries?.length && /subsid|benefit|eligible|maize|seed|gypsum|sprayer|minikit|equipment|how much|amount/i.test(q)) {
    const queryWords = q.match(/[a-z]{4,}/g) || [];
    const matched = base.schemeEntries.filter((entry: { name: string }) => queryWords.some((word) => entry.name.toLowerCase().includes(word)));
    const entries = matched.length ? matched : base.schemeEntries;
    return { text: `${entries.map((entry: { name: string; source: string }) => `**${entry.name}**\n${entry.source}`).join("\n\n")}\n\n${words.current}`, chips };
  }
  // Specific intents precede summary. Short questions are still questions.
  if (/suggest|recommend|advice|next step|సలహా|సూచన|सुझाव|सलाह|பரிந்துரை|ಸಲಹೆ|পরামর্শ/i.test(q)) {
    const targeted = /cotton|chilli|mirchi|crop|financial|agricultur/i.test(q) && source.length > 12000;
    return { text: targeted ? `${literalAnswer()}\n\n${words.current}` : suggestedText, chips };
  }
  if (/what.*documents?.*(required|need|submit|bring|carry)|which.*documents?.*(required|need|submit|bring|carry)|required documents?|documents? (required|needed)|checklist|what to (bring|carry)|కావలసిన పత్ర|आवश्यक दस्तावेज|தேவையான ஆவண|ಅಗತ್ಯ ದಾಖಲೆ|প্রয়োজনীয় নথি/i.test(q)) {
    const checklist = (!scoped && detection?.extractedData?.requiredDocuments) || base.requiredDocuments;
    return { text: Array.isArray(checklist) && checklist.length ? checklist.map((item: string) => `• ${item}`).join("\n") : l.missing, chips };
  }
  const intentFields: Array<[RegExp, RegExp]> = [
    [/seller|vendor/i, /seller|vendor/i],
    [/buyer|vendee|purchaser/i, /buyer|vendee|purchaser/i],
    [/department|institution|issuing authority/i, /institution|department|authority/i],
    [/owner|applicant|whose|who|name|యజమాని|పేరు|मालिक|नाम|உரிமையாளர்|ಮಾಲೀಕ|মালিক/i, /owner|applicant|beneficiary|name|author/i],
    [/survey|extent|acre|hectare|land area|సర్వే|విస్తీర్ణ|सर्वे|रकबा/i, /survey|extent|acre|hectare|land.?area|khata|khasra/i],
    [/amount|fee|cost|consideration|valuation|ధర|మొత్తం|राशि|कीमत/i, /amount|fee|cost|consideration|valuation/i],
    [/venue|where/i, /venue|location/i],
    [/when|date|schedule|deadline|తేదీ|समय|தேதி|ದಿನಾಂಕ|তারিখ/i, /date|schedule|deadline/i],
  ];
  for (const [intent, fields] of intentFields) if (intent.test(q)) {
    const selected = select(fields);
    return { text: selected.length ? bullets(selected) : /amount|fee|cost|when|date|deadline/i.test(q) ? literalAnswer() : l.missing, chips };
  }
  if (/how.*apply|application.*process|దరఖాస్తు|आवेदन|விண்ணப்ப|ಅರ್ಜಿ|আবেদন/i.test(q)) {
    const instructions = select(/apply|application|submission|portal|url|website|procedure|instructions/i);
    return { text: `${bullets(instructions)}\n\n${suggestedText}`, chips };
  }
  if (/(?:what|which).*(?:related to|subject|purpose|topic)|what is (?:it|this|that) about/i.test(q)) {
    return { text: `**${l.summary}**\n${summary}`, chips };
  }
  if (/summar|analy|overview|explain|brief|tell me about|inspect|read this|attached|what.*(?:show|contain|say|about)|సారాంశ|सारांश|சுருக்க|ಸಾರಾಂಶ|সারসংক্ষেপ/i.test(q) || !q.trim()) {
    return { text: `**${l.summary}**\n${summary}\n\n**${l.details}**\n${bullets(Object.entries(p).slice(0, source.length > 12000 ? 5 : 20))}\n\n${suggestedText}`, chips };
  }
  if (/scheme|subsid|eligible|benefit|పథక|योजना|திட்ட|ಯೋಜನೆ|প্রকল্প/i.test(q)) return { text: `**${l.schemes}**\n${schemes.join("\n") || summary}\n\n${suggestedText}`, chips };
  // Unknown questions retrieve literal source lines rather than inventing an answer.
  return { text: literalAnswer(), chips };
}
