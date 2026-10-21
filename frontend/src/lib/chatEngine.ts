import type { ModelReport } from "@/lib/modelReport";
import { farmerChatReply } from "@/lib/farmerChat";
import { answerCropImage } from "@/lib/imageEvidence";
import { answerDocumentQuestion } from "@/lib/nlpDocumentAnalyzer";
/**
 * JanMithra conversational reply engine.
 *
 * Grounded conversational assistance for Indian agriculture, crop diagnostics,
 * and government welfare schemes. Runs on the server behind authentication
 * in /api/chat, and formats responses across 6 Indian languages.
 */
import type { SupportedLanguage } from "@/lib/i18n";
import type { FarmerProfile } from "@/lib/mockData";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  image?: string;
  fileName?: string;
  fileType?: string;
  classification?: any;
  clarificationChips?: string[];
  isClarification?: boolean;
  docDetection?: any;
  modelReport?: ModelReport;
  aiStatus?: { state: "cloud" | "fallback"; provider?: string; model?: string; reason?: string };
  searchSuggestionsHtml?: string;
  /** Client-generated id used to de-duplicate retries (user messages). */
  clientMessageId?: string;
  /** Delivery state for user messages: sending -> saved, or failed (retryable). */
  status?: "sending" | "saved" | "failed";
  /** Human-readable reason shown when status === "failed". */
  error?: string;
  /** ISO timestamp from the database. */
  createdAt?: string;
}

/** One row in the conversation history sidebar. */
export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export interface EngineReply {
  modelReport?: ModelReport;
  aiStatus?: { state: "cloud" | "fallback"; provider?: string; model?: string; reason?: string };
  searchSuggestionsHtml?: string;
  text: string;
  chips?: string[];
}

export function getInitialChatMessage(lang: SupportedLanguage, farmerName: string = "Farmer Friend"): ChatMessage {
  const isGeneric = !farmerName || farmerName === "Farmer Friend" || farmerName === "Guest" || farmerName === "Ramesh Goud";

  if (lang === "te") {
    const greeting = isGeneric ? "రైతు మిత్రమా" : `${farmerName} గారు`;
    return {
      id: "msg_init",
      sender: "ai",
      text: `నమస్కారం ${greeting}! నేను మీ జనమిత్ర (JanMithra) వ్యవసాయ & సంక్షేమ పథకాల సహాయకుడిని. మీ పంటల సంరక్షణ, భూమి దస్తావేజుల విశ్లేషణ లేదా ప్రభుత్వ సబ్సిడీ పథకాలలో (PM-KISAN, PM-KUSUM, KCC, PMFBY) నేను ఏ విధంగా సహాయపడగలను?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "నా వివరాలు చెప్పు",
        "PM-KUSUM సోలార్ పంపు దరఖాస్తు",
        "పంట తెగులు సలహా",
        "PM-KISAN ₹6,000 వివరాలు",
      ],
    };
  }
  if (lang === "hi") {
    const greeting = isGeneric ? "किसान साथी" : `${farmerName} जी`;
    return {
      id: "msg_init",
      sender: "ai",
      text: `नमस्ते ${greeting}! मैं आपका जनमित्रा (JanMithra) कृषि एवं सरकारी कल्याण योजना सहायक हूँ। आज आपकी खेती, फसल स्वास्थ्य, भूमि दस्तावेज़ों या सरकारी योजनाओं (PM-KISAN, PM-KUSUM, KCC) में मैं किस प्रकार सहायता कर सकता हूँ?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "मेरी जानकारी बताएं",
        "PM-KUSUM सोलर पंप आवेदन",
        "फसल कीट एवं रोग सलाह",
        "PM-KISAN स्थिति",
      ],
    };
  }
  if (lang === "ta") {
    const greeting = isGeneric ? "விவசாய தோழரே" : `${farmerName} அவர்களே`;
    return {
      id: "msg_init",
      sender: "ai",
      text: `வணக்கம் ${greeting}! நான் உங்கள் ஜனமித்ரா (JanMithra) விவசாய மற்றும் அரசு நலத்திட்ட உதவியாளர். உங்கள் பயிர் மேலாண்மை, நில ஆவணங்கள் அல்லது அரசு மானிய திட்டங்கள் குறித்து உங்களுக்கு எவ்வாறு உதவ முடியும்?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "என் விவரங்கள் சொல்",
        "PM-KUSUM சோலார் பம்ப் விண்ணப்பம்",
        "பயிர் பூச்சி கட்டுப்பாடு",
        "PM-KISAN நிலை",
      ],
    };
  }
  if (lang === "kn") {
    const greeting = isGeneric ? "ರೈತ ಮಿತ್ರರೇ" : `${farmerName} ಅವರೇ`;
    return {
      id: "msg_init",
      sender: "ai",
      text: `ನಮಸ್ಕಾರ ${greeting}! ನಾನು ನಿಮ್ಮ ಜನಮಿತ್ರ (JanMithra) ಕೃಷಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಸಹಾಯಕ. ನಿಮ್ಮ ಕೃಷಿ ಬೆಳೆ ರಕ್ಷಣೆ, ಭೂ ದಾಖಲೆ ಪರಿಶೀಲನೆ ಅಥವಾ ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ ಯೋಜನೆಗಳ ಕುರಿತು ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "ನನ್ನ ವಿವರ ತಿಳಿಸಿ",
        "PM-KUSUM ಸೋಲಾರ್ ಪಂಪ್ ಅರ್ಜಿ",
        "ಬೆಳೆ ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ",
        "PM-KISAN ಸ್ಥಿತಿ",
      ],
    };
  }
  if (lang === "bn") {
    const greeting = isGeneric ? "কৃষক বন্ধু" : `${farmerName} বাবু`;
    return {
      id: "msg_init",
      sender: "ai",
      text: `নমস্কার ${greeting}! আমি আপনার জনমিত্র (JanMithra) কৃষি ও সরকারি কল্যাণ প্রকল্প সহায়ক। ফসলের রোগ নির্ণয়, জমির নথিপত্র বিশ্লেষণ বা সরকারি ভর্তুকি প্রকল্প বিষয়ে আমি কীভাবে সাহায্য করতে পারি?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "আমার তথ্য বলুন",
        "PM-KUSUM সৌর পাম্প আবেদন",
        "ফসলের কীটপতঙ্গ দমন",
        "PM-KISAN স্থিতি",
      ],
    };
  }
  const greeting = isGeneric ? "Farmer Friend" : `${farmerName} Ji`;
  return {
    id: "msg_init",
    sender: "ai",
    text: `Namaste ${greeting}! I am your JanMithra AI assistant for agriculture, crop diagnostics, and government welfare schemes. How can I assist your farm, crop health, land documents, or scheme applications today?`,
    timestamp: "10:30 AM",
    clarificationChips: [
      "Tell me about me",
      "Apply for PM-KUSUM Solar Pump",
      "Crop pest & disease advice",
      "Check PM-KISAN ₹6,000 status",
    ],
  };
}

export function formatDocumentAnalysisReply(det: any, lang: SupportedLanguage): { text: string; chips: string[] } {
  if (!det || det.scopeStatus === "out_of_scope") {
    const reply = buildOutOfScopeReply(lang, det?.reason);
    return { text: reply.text, chips: reply.chips || [] };
  }
  return det.docType === "crop_disease" ? answerCropImage("Summarize", det, {}, lang) : answerDocumentQuestion("Summarize this document", det, lang);
}

export function formatFarmerProfileReply(farmer: FarmerProfile, lang: SupportedLanguage): { text: string; chips: string[] } {
  // Reuse the conversational greeting so profile facts are reported only when saved.
  // A similarity match or a default profile does not establish scheme eligibility.
  return farmerChatReply("hello", lang, farmer);
}

/** Text reply for a farmer question. */
export function generateTextReply(text: string, lang: SupportedLanguage, currentFarmer: FarmerProfile): EngineReply {
  return farmerChatReply(text, lang, currentFarmer);
}

export function buildUnreadableUploadReply(lang: SupportedLanguage): EngineReply {
  const text: Record<SupportedLanguage, string> = {
    en: "I could not reliably read this upload. Send a clear close-up, a searchable PDF, or paste its text. I can then explain the readable information and answer your question.",
    te: "ఈ ఫైల్‌ను నమ్మకంగా చదవలేకపోయాను. స్పష్టమైన దగ్గరి ఫోటో, చదవగల PDF పంపండి లేదా పత్రంలోని వచనం ఇక్కడ రాయండి. చదవగల సమాచారాన్ని వివరించి మీ ప్రశ్నకు సమాధానం ఇస్తాను.",
    hi: "यह अपलोड भरोसेमंद ढंग से पढ़ा नहीं जा सका। साफ़ नज़दीकी फोटो, खोजने योग्य PDF भेजें या उसका पाठ लिखें। फिर मैं पढ़ी गई जानकारी समझाकर आपके प्रश्न का उत्तर दूँगा।",
    ta: "இந்தப் பதிவேற்றத்தை நம்பகமாகப் படிக்க முடியவில்லை. தெளிவான நெருக்கப் படம், தேடக்கூடிய PDF அல்லது அதன் உரையை அனுப்பவும். படிக்க முடிந்த தகவலை விளக்கி உங்கள் கேள்விக்குப் பதில் அளிப்பேன்.",
    kn: "ಈ ಫೈಲನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಸ್ಪಷ್ಟ ಹತ್ತಿರದ ಚಿತ್ರ, ಹುಡುಕಬಹುದಾದ PDF ಅಥವಾ ಅದರ ಪಠ್ಯ ಕಳುಹಿಸಿ. ಓದಬಹುದಾದ ಮಾಹಿತಿಯನ್ನು ವಿವರಿಸಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸುತ್ತೇನೆ.",
    bn: "এই আপলোডটি নির্ভরযোগ্যভাবে পড়া যায়নি। পরিষ্কার কাছ থেকে ছবি, অনুসন্ধানযোগ্য PDF অথবা লেখাটি পাঠান। তারপর পড়া তথ্য বুঝিয়ে আপনার প্রশ্নের উত্তর দেব।",
  };
  return { text: text[lang], chips: [] };
}

export function buildOutOfScopeReply(lang: SupportedLanguage, reason?: string): EngineReply {
  const data = { reason: lang === "en" ? reason : undefined };
  let replyText = "";
  let chips: string[] = [];
  if (lang === "te") {
    replyText = `⚠️ పరిధి వెలుపల ఫోటో (Out of Scope):\nమీరు పంపిన చిత్రం వ్యవసాయం, పంటలు లేదా ప్రభుత్వ రైతు సంక్షేమ పథకాలకు సంబంధించినదిగా లేదు (${data.reason || "వ్యవసాయేతర అంశాలు"}).\n\nజనమిత్ర (JanMithra) AI కేవలం వ్యవసాయ సంబంధిత సలహాలు, పంట వ్యాధి నిర్ధారణ మరియు ప్రభుత్వ రైతు పథకాల కోసం మాత్రమే పనిచేస్తుంది.\nదయచేసి:\n• పంట ఆకు లేదా తెగులు సోకిన చేను ఫోటో తీయండి.\n• లేదా భూమి రిజిస్ట్రేషన్ దస్తావేజు (సేల్ డీడ్), పట్టాదారు పాస్ పుస్తకం/పహానీ, సాయిల్ టెస్ట్ కార్డు సమర్పించండి.`;
    chips = ["వ్యవసాయ పథకాల వివరాలు", "పంట తెగులు ఫోటో తీయండి", "పట్టాదారు పాస్ పుస్తకం స్కాన్"];
  } else if (lang === "hi") {
    replyText = `⚠️ कार्यक्षेत्र से बाहर (Out of Scope):\nयह तस्वीर या फ़ाइल कृषि, फसलों या सरकारी किसान योजनाओं से संबंधित नहीं लग रही है (${data.reason || "गैर-कृषि वस्तुएं"})।\n\nजनमित्रा (JanMithra) AI केवल फसलों, कीट नियंत्रण, भूमि दस्तावेज़ों और सरकारी योजनाओं के लिए समर्पित है।\nकृपया:\n• किसी पौधे या पत्ती की स्पष्ट तस्वीर भेजें।\n• या भूमि बैनामा (Sale Deed), पट्टा/खसरा, सॉइल हेल्थ कार्ड साझा करें।`;
    chips = ["किसान योजनाओं की जानकारी", "फसल पत्ती की तस्वीर लें", "भूमि दस्तावेज़ स्कैन"];
  } else if (lang === "ta") {
    replyText = `⚠️ எல்லைக்கு அப்பாற்பட்ட படம் (Out of Scope):\nநீங்கள் அனுப்பிய படம் விவசாயம், பயிர்கள் அல்லது அரசு உழவர் நலத்திட்டங்களுடன் தொடர்புடையதாக இல்லை (${data.reason || "விவசாயம் அல்லாத பொருட்கள்"}).\n\nஜனமித்ரா (JanMithra) AI பயிர் நோய் கண்டறிதல், விவசாய வழிகாட்டுதல் மற்றும் அரசு திட்டங்களுக்கு மட்டுமே உதவும்.\nதயவுசெய்து:\n• பூச்சி அல்லது நோய் தாக்கப்பட்ட பயிர் இலை படத்தை எடுக்கவும்.\n• அல்லது நிலப் பட்டா, அடங்கல், மண் பரிசோதனை அட்டை போன்ற அதிகாரப்பூர்வ ஆவணங்களை பதிவேற்றவும்.`;
    chips = ["அரசு விவசாய திட்டங்கள்", "பயிர் இலை புகைப்படம் எடு", "நிலப் பட்டா ஸ்கேன்"];
  } else if (lang === "kn") {
    replyText = `⚠️ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿದೆ (Out of Scope):\nನೀವು ಕಳುಹಿಸಿದ ಚಿತ್ರವು ಕೃಷಿ, ಬೆಳೆಗಳು ಅಥವಾ ಸರ್ಕಾರದ ರೈತ ಯೋಜನೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಕಂಡುಬರುತ್ತಿಲ್ಲ (${data.reason || "ಕೃಷಿಯೇತರ ವಸ್ತುಗಳು"}).\n\nಜನಮಿತ್ರ (JanMithra) AI ಕೇವಲ ಕೃಷಿ ಸಲಹೆ, ಬೆಳೆ ರೋಗ ನಿರ್ಣಯ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗಾಗಿ ಮಾತ್ರ ಸಮರ್ಪಿತವಾಗಿದೆ.\nದಯವಿಟ್ಟು:\n• ರೋಗ ಅಥವಾ ಕೀಟ ಬಾಧಿತ ಬೆಳೆ ಎಲೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋ ಕಳುಹಿಸಿ.\n• ಅಥವಾ ಅಧಿಕೃತ ಪಟ್ಟಾ, ಪಹಣಿ/ಆರ್‌ಒಆರ್, ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.`;
    chips = ["ರೈತ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು", "ಬೆಳೆ ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ", "ಭೂಮಿ ದಾಖಲೆ ಸ್ಕ್ಯಾನ್"];
  } else if (lang === "bn") {
    replyText = `⚠️ আওতা বহির্ভূত ছবি (Out of Scope):\nআপনার পাঠানো ছবিটি কৃষি, ফসল বা সরকারি কৃষক প্রকল্পের সাথে সম্পর্কিত নয় (${data.reason || "অ-কৃষি সামগ্রী"}).\n\nজনমিত্র (JanMithra) AI শুধুমাত্র কৃষিকাজ, ফসলের রোগ নির্ণয় ও সরকারি প্রকল্পের সহায়তার জন্য তৈরি।\nদয়া করে:\n• আক্রান্ত ফসলের পাতা বা পোকার স্পষ্ট ছবি তুলুন।\n• অথবা সরকারি জমির দলিল, পাট্টা/পাহানি, মাটি পরীক্ষা কার্ড আপলোড করুন।`;
    chips = ["সরকারি কৃষি প্রকল্প", "ফসলের পাতার ছবি নিন", "জমির পাট্টা স্ক্যান"];
  } else {
    replyText = `⚠️ Irrelevant image (not related to agriculture or government schemes):\nThe uploaded photo/file does not appear to be related to agriculture, crops, or government welfare schemes (${data.reason || "Non-agricultural content"}).\n\nJanMithra AI helps with agriculture, crop health, and government welfare schemes.\n\nPlease provide:\n• A photo of a farm crop leaf, pest, or field for disease diagnosis.\n• A government scheme poster, welfare notice, application form, identity card, land record, or agricultural document.`;
    chips = ["Explore Agri Schemes", "Take Crop Leaf Photo", "Scan Land Record"];
  }
  return { text: replyText, chips };
}
