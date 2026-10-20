import type { VisionAnalysisResult } from "@/lib/visionLlm";
import { parseAndSummarizeDocumentContent } from "@/lib/nlpDocumentAnalyzer";
import { numbersSupported } from "@/lib/documentEvidence";
import type { FarmerFacts } from "@/lib/conversationMemory";
import type { SupportedLanguage } from "@/lib/i18n";

export interface CropAnalysis {
  cropName?: string;
  observations: string[];
  possibleCauses: Array<{ name: string; evidence: string; check: string }>;
  limitations: string[];
  nextSteps: string[];
  questions: string[];
}
const strings = (v: unknown, max = 8): string[] => Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, max).map(s => s.slice(0, 700)) : [];
const chemicalDose = /\d+(?:\.\d+)?\s*(?:ml|mg|kg|grams?|litres?)\s*(?:\/|per)|\b(?:spray|apply|use)\b.*\b(?:imidacloprid|flonicamid|chlorpyrifos|fungicide|pesticide|insecticide)\b/i;
export function normalizeCropAnalysis(value: any): CropAnalysis | undefined {
  if (!value || !Array.isArray(value.observations)) return undefined;
  const possibleCauses = Array.isArray(value.possibleCauses) ? value.possibleCauses.filter((c: any) =>
    typeof c?.name === "string" && typeof c?.evidence === "string" && typeof c?.check === "string")
    .slice(0, 4).map((c: any) => ({ name: c.name.slice(0, 120), evidence: c.evidence.slice(0, 500), check: c.check.slice(0, 500) })) : [];
  return { cropName: typeof value.cropName === "string" ? value.cropName.slice(0, 100) : undefined,
    observations: strings(value.observations), possibleCauses,
    limitations: strings(value.limitations), nextSteps: strings(value.nextSteps).filter(s => !chemicalDose.test(s)), questions: strings(value.questions, 3) };
}

/** Compare independent readings; a model's self-reported confidence never verifies a document. */
export function reconcileImageEvidence(cloud: VisionAnalysisResult | null, local: VisionAnalysisResult): VisionAnalysisResult {
  if (!cloud || cloud.scopeStatus !== "in_scope") {
    if (local.scopeStatus === "in_scope") return local;
    return cloud?.scopeStatus === "out_of_scope" && cloud.confidenceScore >= 0.85 ? cloud : local;
  }
  if (cloud.docType === "crop_disease") {
    if (local.scopeStatus === "out_of_scope" && local.confidenceScore >= 0.85) {
      return { ...local, scopeStatus: "uncertain", isAgriRelated: false, confidenceScore: 0,
        title: "Image needs a clearer view", extractedData: {}, schemesUnlocked: [],
        detectionSummary: "The visual readings disagree about whether a crop is visible. Please send a close-up with the crop clearly in focus.",
        suggestions: ["Include the whole plant and a close-up of the affected part in good light."] };
    }
    // Readable document content takes precedence over mistaking a poster's plant picture for a crop sample.
    if (local.scopeStatus === "in_scope" && local.docType !== "crop_disease" && (local.extractedTextSnippet || "").length > 80) return local;
    return { ...cloud, schemesUnlocked: [], suggestions: (cloud.cropAnalysis?.nextSteps || cloud.suggestions).filter(s => !chemicalDose.test(s)),
      detectionSummary: cloud.cropAnalysis?.observations.length ? cloud.cropAnalysis.observations.join(" ") : cloud.detectionSummary };
  }
  const visionText = cloud.extractedTextSnippet?.trim() || "";
  const ocrText = local.parsedDetails?.fullOcrText || local.extractedTextSnippet || "";
  if (visionText.length < 25 && local.analysisQuality === "partial") return local;
  const source = visionText.length >= 25 && (local.analysisQuality === "partial" || visionText.length >= ocrText.length) ? visionText : ocrText;
  if (source.length < 25) return { ...cloud, analysisQuality: "partial", extractedData: {}, schemesUnlocked: [],
    detectionSummary: "A relevant document may be visible, but its text is not readable enough to confirm names, amounts, dates or eligibility.",
    suggestions: ["Upload a clear close-up of the relevant section or paste the original text."] };
  const parsed = parseAndSummarizeDocumentContent(source);
  const localFields = parseAndSummarizeDocumentContent(ocrText).extractedParameters;
  const visionFields = parseAndSummarizeDocumentContent(visionText).extractedParameters;
  const conflicts: string[] = [];
  for (const key of ["Owner / Applicant", "Survey Number", "Land Extent", "Consideration Amount", "Schedule / Dates"]) {
    const left = localFields[key]?.toLowerCase().replace(/\s+/g, " ").trim();
    const right = visionFields[key]?.toLowerCase().replace(/\s+/g, " ").trim();
    if (left && right && left !== right) conflicts.push(key);
  }
  const ocrRows = parseAndSummarizeDocumentContent(ocrText).schemeEntries || [];
  for (const row of parseAndSummarizeDocumentContent(visionText).schemeEntries || []) {
    const other = ocrRows.find(r => r.name.toLowerCase() === row.name.toLowerCase());
    if (other && /\d/.test(other.source) && /\d/.test(row.source)
      && (!numbersSupported(row.source, other.source) || !numbersSupported(other.source, row.source))) conflicts.push(`assistance figures for ${row.name}`);
  }
  const extractedData = { ...parsed.extractedParameters };
  for (const [key, value] of Object.entries(cloud.extractedData || {})) {
    const literal = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
    if (literal && source.toLowerCase().includes(literal.toLowerCase())) extractedData[key] = literal;
  }
  if (conflicts.length) {
    return { ...cloud, analysisQuality: "partial", extractedTextSnippet: source, parsedDetails: parsed,
      extractedData: {}, schemesUnlocked: [], readingConflicts: conflicts,
      detectionSummary: `The independent readings disagree on: ${conflicts.join(", ")}. I cannot reliably confirm those values from this copy.`,
      suggestions: ["Upload a sharp close-up of the conflicting fields or check the original document with its issuing office."] };
  }
  return { ...cloud, extractedTextSnippet: source, parsedDetails: parsed, extractedData,
    schemesUnlocked: parsed.unlockedSchemes,
    detectionSummary: numbersSupported(cloud.detectionSummary, source) ? cloud.detectionSummary || parsed.summary : parsed.summary,
    // Suggestions are regenerated from source; unverified cloud checklists must not become evidence.
    suggestions: parsed.actionableSuggestions, analysisQuality: "complete" };
}

const cropWords: Record<SupportedLanguage, {
  context: string; visible: string; causes: string; noCause: string; next: string; check: string;
  yellow: string; warning: string; questionCrop: string; questionExtent: string;
  identity: (name: string) => string; unknown: string; savedCrop: (crop: string) => string;
  chips: string[];
}> = {
  en: {
    context: "Using the farm details you shared", visible: "What is visible", causes: "Possible causes to check",
    noCause: "The image alone does not identify a disease or nutrient deficiency.", next: "Next steps", check: "Check",
    yellow: "Compare older and younger leaves, uniform yellowing versus green veins, and wet versus dry root-zone soil. Root stress can resemble nutrient deficiency; check the soil report before adding fertilizer.",
    warning: "A photo cannot confirm soil nutrient levels or a crop diagnosis. Match any treatment to the identified problem, crop and authorised label with a local agricultural officer.",
    questionCrop: "What crop is this?", questionExtent: "How much of the field is affected, and when did it start?",
    identity: (name) => `The image may show ${name}. This is a tentative visual identification; confirm with the whole plant, leaves and farmer's crop information.`,
    unknown: "I cannot reliably identify the crop from this image.",
    savedCrop: (crop) => `You told me you grow ${crop}; that does not by itself confirm the pictured plant.`,
    chips: ["How do I check the possible causes?", "What can I safely do now?", "I can share the crop age and symptoms"],
  },
  hi: {
    context: "आपके बताए खेत के विवरण", visible: "तस्वीर में क्या दिख रहा है", causes: "जाँचने योग्य संभावित कारण",
    noCause: "सिर्फ तस्वीर से रोग या पोषक तत्व की कमी की पुष्टि नहीं होती।", next: "अगले कदम", check: "जाँचें",
    yellow: "पुरानी और नई पत्तियों की तुलना करें; देखें पीलापन समान है या नसें हरी हैं, और जड़ों के पास मिट्टी बहुत गीली या सूखी तो नहीं। खाद डालने से पहले मिट्टी की रिपोर्ट देखें।",
    warning: "तस्वीर से मिट्टी के पोषक तत्व या रोग की पक्की पहचान नहीं होती। उपचार से पहले समस्या, फसल और स्वीकृत लेबल की पुष्टि स्थानीय कृषि अधिकारी से करें।",
    questionCrop: "यह कौन सी फसल है?", questionExtent: "खेत का कितना भाग प्रभावित है और यह कब शुरू हुआ?",
    identity: (name) => `तस्वीर में ${name} हो सकता है। यह केवल संभावित पहचान है; पूरे पौधे और पत्तियों से पुष्टि करें।`,
    unknown: "इस तस्वीर से फसल की भरोसेमंद पहचान नहीं हो रही है।",
    savedCrop: (crop) => `आपने बताया कि आप ${crop} उगाते हैं; इससे यह साबित नहीं होता कि तस्वीर में वही फसल है।`,
    chips: ["संभावित कारण कैसे जाँचें?", "अब सुरक्षित रूप से क्या करूँ?", "फसल की उम्र और लक्षण बताऊँ"],
  },
  te: {
    context: "మీరు చెప్పిన పొలం వివరాల ప్రకారం", visible: "చిత్రంలో కనిపిస్తున్నది", causes: "పరిశీలించాల్సిన సాధ్యమైన కారణాలు",
    noCause: "చిత్రం ఒక్కటితో వ్యాధి లేదా పోషక లోపాన్ని నిర్ధారించలేం.", next: "తదుపరి చర్యలు", check: "పరిశీలించండి",
    yellow: "పాత, కొత్త ఆకులను పోల్చండి; పసుపు రంగు అంతటా ఉందా లేదా నరాలు ఆకుపచ్చగా ఉన్నాయా చూడండి. వేర్ల దగ్గర నేల తడిగా లేదా పొడిగా ఉందా చూడండి. ఎరువు వేయడానికి ముందు మట్టి పరీక్ష నివేదికను చూడండి.",
    warning: "చిత్రం ద్వారా మట్టిలో పోషకాలు లేదా పంట వ్యాధిని ఖచ్చితంగా నిర్ధారించలేం. చికిత్సకు ముందు సమస్య, పంట, ఆమోదిత లేబుల్ గురించి స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.",
    questionCrop: "ఇది ఏ పంట?", questionExtent: "పొలంలో ఎంత భాగం ప్రభావితమైంది? ఎప్పటి నుంచి?",
    identity: (name) => `చిత్రంలో ${name} ఉండవచ్చు. ఇది తాత్కాలిక గుర్తింపు మాత్రమే; పూర్తి మొక్క, ఆకులతో నిర్ధారించండి.`,
    unknown: "ఈ చిత్రంతో పంటను నమ్మకంగా గుర్తించలేకపోతున్నాను.",
    savedCrop: (crop) => `మీరు ${crop} పండిస్తున్నారని చెప్పారు; అందువల్ల చిత్రంలోనూ అదే పంట ఉందని నిర్ధారించలేం.`,
    chips: ["కారణాలను ఎలా పరిశీలించాలి?", "ఇప్పుడు సురక్షితంగా ఏం చేయాలి?", "పంట వయసు, లక్షణాలు చెబుతాను"],
  },
  ta: {
    context: "நீங்கள் பகிர்ந்த வயல் விவரங்களின்படி", visible: "படத்தில் தெரிவது", causes: "சரிபார்க்க வேண்டிய சாத்தியமான காரணங்கள்",
    noCause: "படம் மட்டும் நோயையோ ஊட்டச்சத்து குறைபாட்டையோ உறுதிப்படுத்தாது.", next: "அடுத்த படிகள்", check: "சரிபார்க்கவும்",
    yellow: "பழைய மற்றும் புதிய இலைகளை ஒப்பிடுங்கள்; மஞ்சள் நிறம் சீராக உள்ளதா, நரம்புகள் பச்சையாக உள்ளனவா, வேர் அருகே மண் ஈரமாகவோ வறண்டதாகவோ உள்ளதா பார்க்கவும். உரம் இடும் முன் மண் பரிசோதனை அறிக்கையைப் பாருங்கள்.",
    warning: "படம் மூலம் மண்ணின் ஊட்டச்சத்து அளவையோ பயிர் நோயையோ உறுதி செய்ய முடியாது. சிகிச்சைக்கு முன் பயிர், பிரச்சினை மற்றும் அங்கீகரிக்கப்பட்ட லேபிளை உள்ளூர் வேளாண் அலுவலருடன் சரிபார்க்கவும்.",
    questionCrop: "இது எந்தப் பயிர்?", questionExtent: "வயலின் எவ்வளவு பகுதி பாதிக்கப்பட்டுள்ளது? எப்போது தொடங்கியது?",
    identity: (name) => `படத்தில் ${name} இருக்கலாம். இது உறுதியான அடையாளம் அல்ல; முழுத் தாவரமும் இலைகளும் பார்த்து உறுதிப்படுத்தவும்.`,
    unknown: "இந்தப் படத்தில் பயிரை நம்பகமாக அடையாளம் காண முடியவில்லை.",
    savedCrop: (crop) => `நீங்கள் ${crop} வளர்ப்பதாகக் கூறினீர்கள்; படத்தில் அதே பயிர் உள்ளது என்பதற்கு அது சான்றல்ல.`,
    chips: ["காரணங்களை எப்படிச் சரிபார்ப்பது?", "இப்போது பாதுகாப்பாக என்ன செய்யலாம்?", "பயிர் வயதும் அறிகுறிகளும் சொல்கிறேன்"],
  },
  kn: {
    context: "ನೀವು ತಿಳಿಸಿದ ಹೊಲದ ವಿವರಗಳ ಪ್ರಕಾರ", visible: "ಚಿತ್ರದಲ್ಲಿ ಕಾಣುವುದು", causes: "ಪರಿಶೀಲಿಸಬೇಕಾದ ಸಾಧ್ಯ ಕಾರಣಗಳು",
    noCause: "ಚಿತ್ರ ಮಾತ್ರದಿಂದ ರೋಗ ಅಥವಾ ಪೋಷಕಾಂಶ ಕೊರತೆಯನ್ನು ದೃಢಪಡಿಸಲಾಗದು.", next: "ಮುಂದಿನ ಕ್ರಮಗಳು", check: "ಪರಿಶೀಲಿಸಿ",
    yellow: "ಹಳೆಯ ಮತ್ತು ಹೊಸ ಎಲೆಗಳನ್ನು ಹೋಲಿಸಿ; ಹಳದಿ ಬಣ್ಣ ಸಮವಾಗಿದೆಯೇ, ನರಗಳು ಹಸಿರಾಗಿವೆಯೇ, ಬೇರುಗಳ ಬಳಿಯ ಮಣ್ಣು ಹೆಚ್ಚು ಒದ್ದೆಯೇ ಅಥವಾ ಒಣಗಿದೆಯೇ ನೋಡಿ. ಗೊಬ್ಬರ ಹಾಕುವ ಮುನ್ನ ಮಣ್ಣಿನ ವರದಿ ನೋಡಿ.",
    warning: "ಚಿತ್ರದಿಂದ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಅಥವಾ ಬೆಳೆ ರೋಗವನ್ನು ಖಚಿತಪಡಿಸಲಾಗದು. ಚಿಕಿತ್ಸೆಗೆ ಮುನ್ನ ಸಮಸ್ಯೆ, ಬೆಳೆ ಮತ್ತು ಅನುಮೋದಿತ ಲೇಬಲ್ ಬಗ್ಗೆ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    questionCrop: "ಇದು ಯಾವ ಬೆಳೆ?", questionExtent: "ಹೊಲದ ಎಷ್ಟು ಭಾಗಕ್ಕೆ ಪರಿಣಾಮವಾಗಿದೆ? ಯಾವಾಗ ಆರಂಭವಾಯಿತು?",
    identity: (name) => `ಚಿತ್ರದಲ್ಲಿ ${name} ಇರಬಹುದು. ಇದು ತಾತ್ಕಾಲಿಕ ಗುರುತು ಮಾತ್ರ; ಪೂರ್ಣ ಸಸ್ಯ ಮತ್ತು ಎಲೆಗಳನ್ನು ನೋಡಿ ಖಚಿತಪಡಿಸಿ.`,
    unknown: "ಈ ಚಿತ್ರದಿಂದ ಬೆಳೆಯನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಗುರುತಿಸಲಾಗುತ್ತಿಲ್ಲ.",
    savedCrop: (crop) => `ನೀವು ${crop} ಬೆಳೆಯುತ್ತೀರಿ ಎಂದು ಹೇಳಿದ್ದೀರಿ; ಅದರಿಂದ ಚಿತ್ರದಲ್ಲೂ ಅದೇ ಬೆಳೆ ಎಂದು ಖಚಿತವಾಗುವುದಿಲ್ಲ.`,
    chips: ["ಕಾರಣಗಳನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸಲಿ?", "ಈಗ ಸುರಕ್ಷಿತವಾಗಿ ಏನು ಮಾಡಲಿ?", "ಬೆಳೆಯ ವಯಸ್ಸು ಮತ್ತು ಲಕ್ಷಣ ಹೇಳುತ್ತೇನೆ"],
  },
  bn: {
    context: "আপনার দেওয়া খেতের তথ্য অনুযায়ী", visible: "ছবিতে যা দেখা যাচ্ছে", causes: "যে সম্ভাব্য কারণগুলি যাচাই করতে হবে",
    noCause: "শুধু ছবি দেখে রোগ বা পুষ্টির ঘাটতি নিশ্চিত করা যায় না।", next: "পরবর্তী পদক্ষেপ", check: "যাচাই করুন",
    yellow: "পুরোনো ও নতুন পাতার তুলনা করুন; হলুদ রং সব জায়গায় সমান কি না, শিরা সবুজ কি না এবং শিকড়ের কাছে মাটি ভেজা না শুকনো দেখুন। সার দেওয়ার আগে মাটির পরীক্ষার রিপোর্ট দেখুন।",
    warning: "ছবি থেকে মাটির পুষ্টির মাত্রা বা ফসলের রোগ নিশ্চিত করা যায় না। চিকিৎসার আগে সমস্যা, ফসল ও অনুমোদিত লেবেল স্থানীয় কৃষি কর্মকর্তার সঙ্গে যাচাই করুন।",
    questionCrop: "এটি কোন ফসল?", questionExtent: "খেতের কতটা অংশ আক্রান্ত? কখন থেকে শুরু হয়েছে?",
    identity: (name) => `ছবিতে ${name} থাকতে পারে। এটি প্রাথমিক ধারণা; পুরো গাছ ও পাতা দেখে নিশ্চিত করুন।`,
    unknown: "এই ছবি থেকে ফসল নির্ভরযোগ্যভাবে শনাক্ত করা যাচ্ছে না।",
    savedCrop: (crop) => `আপনি বলেছেন ${crop} চাষ করেন; তার মানে ছবিতেও সেই ফসল আছে, তা নিশ্চিত নয়।`,
    chips: ["সম্ভাব্য কারণ কীভাবে যাচাই করব?", "এখন নিরাপদে কী করব?", "ফসলের বয়স ও লক্ষণ জানাব"],
  },
};

export function answerCropImage(query: string, detection: any, facts: FarmerFacts = {}, lang: SupportedLanguage = "en"): { text: string; chips: string[] } {
  const l = cropWords[lang] || cropWords.en;
  const analysis: CropAnalysis | undefined = normalizeCropAnalysis(detection.cropAnalysis);
  const observations = analysis?.observations.length ? analysis.observations : [detection.detectionSummary || l.noCause];
  const causes = analysis?.possibleCauses || [];
  const steps = analysis?.nextSteps.length ? analysis.nextSteps : (detection.suggestions || []).filter((s: string) => !chemicalDose.test(s));
  const known = [facts.crop, facts.cropAge, facts.soil, facts.irrigation, facts.district || facts.state].filter(Boolean).join("; ");
  const yellow = /yellow|chlorosis|पीले|पीलापन|పసుపు|மஞ்சள்|ಹಳದಿ|হলুদ/i.test(observations.join(" "));
  const checks = yellow ? l.yellow : "";
  const question = analysis?.questions.find(q => !(facts.crop && /what crop|which crop|कौन.*फसल|ఏ పంట|எந்தப் பயிர்|ಯಾವ ಬೆಳೆ|কোন ফসল/i.test(q))
    && !(facts.cropAge && /how old|crop age|फसल.*उम्र|పంట.*వయసు|பயிர்.*வயது|ಬೆಳೆ.*ವಯಸ್ಸು|ফসলের.*বয়স/i.test(q)))
    || (!facts.crop ? l.questionCrop : l.questionExtent);
  const cropIdentity = /(?:what|which).*(?:crop|plant)|(?:crop|plant) name|identify (?:the |this )?(?:crop|plant)|कौन.*(?:फसल|पौधा)|ఏ పంట|எந்தப் பயிர்|ಯಾವ ಬೆಳೆ|কোন ফসল/i.test(query);
  if (cropIdentity) return { text: analysis?.cropName
    ? l.identity(analysis.cropName)
    : `${l.unknown} ${facts.crop ? l.savedCrop(facts.crop) : l.questionCrop}`, chips: l.chips.slice(0, 2) };
  const actionsOnly = /suggest|recommend|next|should i do|safely do|treat|remed|what can i do|check.*causes|क्या करूँ|ఏం చేయాలి|என்ன செய்ய|ಏನು ಮಾಡ|কী করব/i.test(query);
  const text = [
    ...(known ? [`${l.context}: ${known}.`] : []),
    `**${l.visible}**\n${observations.map(s => `• ${s}`).join("\n")}`,
    causes.length ? `**${l.causes}**\n${causes.map(c => `• ${c.name}: ${actionsOnly ? c.check : `${c.evidence} ${l.check}: ${c.check}`}`).join("\n")}` : l.noCause,
    `**${l.next}**\n${steps.length ? steps.map((s: string) => `• ${s}`).join("\n") : l.noCause}`,
    ...(checks ? [checks, "https://ipm.ucanr.edu/home-and-landscape/common-nutrient-deficiency-symptoms/"] : []),
    ...(analysis?.limitations || []),
    l.warning,
    question,
  ].join("\n\n");
  return { text, chips: l.chips };
}
