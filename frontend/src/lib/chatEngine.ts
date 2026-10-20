import { semanticSearchSchemes } from "@/lib/aiCopilotService";
/**
 * JanMithra conversational reply engine.
 *
 * Grounded conversational assistance for Indian agriculture, crop diagnostics,
 * and government welfare schemes. Runs on the server behind authentication
 * in /api/chat, and formats responses across 6 Indian languages.
 */
import type { SupportedLanguage } from "@/lib/i18n";
import type { FarmerProfile } from "@/lib/mockData";
import { GUEST_FARMER } from "@/lib/mockData";

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
  if (!det || det.isAgriRelated === false || det.scopeStatus === "out_of_scope") {
    const oos = buildOutOfScopeReply(lang, det?.reason);
    return { text: oos.text, chips: oos.chips || [] };
  }

  const ext = det.extractedData || {};

  // 1A. Seed, Gypsum, & Agricultural Equipment Subsidy Schemes
  const isSeedSubsidy =
    det.title?.toLowerCase().includes("seed subsidy") ||
    det.title?.toLowerCase().includes("input subsidy") ||
    det.title?.toLowerCase().includes("పరికరాల సబ్సిడీ") ||
    Boolean(ext.certifiedSeedsSubsidy) ||
    Boolean(ext.freeMinikitsAllocation) ||
    (ext.schemeTitle && String(ext.schemeTitle).toLowerCase().includes("seed"));

  if (isSeedSubsidy) {
    if (lang === "te") {
      return {
        text: `🏛️ **వ్యవసాయ శాఖ - విత్తనాలు, జిప్సం & పరికరాల సబ్సిడీ పథకం వివరాలు:**\n\n📋 **ధృవీకరించబడిన సబ్సిడీ వివరాలు:**\n• **ధృవీకరించిన విత్తనాల పంపిణీ (Certified Seeds):** 50% సబ్సిడీ (క్వింటాల్‌కు గరిష్టంగా ₹1,200/- వరకు)\n• **జిప్సం పంపిణీ (Gypsum):** 50% సబ్సిడీ (హెక్టారుకు ₹750/- వరకు నేల నాణ్యత మెరుగుదలకు)\n• **సస్యరక్షణ పరికరాలు (Plant Protection Sprayers):** 50% సబ్సిడీ (చేతితో నడిపే స్ప్రేయర్లు గరిష్టంగా ₹800/- వరకు)\n• **ఉచిత విత్తన మినికిట్ల పంపిణీ (Minikits):** 100% ఉచితంగా ఎంపిక చేసిన రైతులకు పంపిణీ\n\n📍 **దరఖాస్తు & సమర్పించాల్సిన అధికారి:**\nగ్రామ స్థాయిలో **సహాయ వ్యవసాయ అధికారి (Assistant Agricultural Officer - AAO) / రైతు వేదిక** వద్ద సమర్పించాలి.\n\n📄 **కావలసిన పత్రాలు:**\n1. ఆధార్ కార్డు\n2. పట్టాదారు పాస్ పుస్తకం / పహానీ నకలు\n3. బ్యాంక్ ఖాతా వివరాలు`,
        chips: ["విత్తన సబ్సిడీ దరఖాస్తు", "రైతు వేదిక అధికారి వివరాలు", "ఉచిత మినికిట్ అర్హత", "సస్యరక్షణ పరికరాల బుకింగ్"],
      };
    }
    if (lang === "hi") {
      return {
        text: `🏛️ **कृषि विभाग - प्रमाणित बीज, जिप्सम एवं कृषि यंत्र सब्सिडी योजना:**\n\n📋 **स्वीकृत सब्सिडी एवं सहायता विवरण:**\n• **प्रमाणित बीज वितरण (Certified Seeds):** 50% सब्सिडी (अधिकतम ₹1,200/- प्रति क्विंटल)\n• **जिप्सम वितरण (Gypsum):** 50% सब्सिडी (अधिकतम ₹750/- प्रति हेक्टेयर भूमि सुधार हेतु)\n• **पादप संरक्षण उपकरण (Plant Protection Sprayers):** 50% सब्सिडी (हस्तचालित स्प्रेयर अधिकतम ₹800/- तक)\n• **निःशुल्क बीज मिनीकिट (Minikits):** 100% निःशुल्क वितरण (पात्र किसानों के लिए)\n\n📍 **आवेदन एवं नोडल अधिकारी:**\nग्राम स्तर पर **सहायक कृषि अधिकारी (Assistant Agricultural Officer - AAO) / किसान सेवा केंद्र** पर आवेदन जमा करें।\n\n📄 **आवश्यक दस्तावेज़:**\n1. आधार कार्ड\n2. भूमि पट्टा / खसरा खतौनी नकल\n3. बैंक पासबुक`,
        chips: ["बीज सब्सिडी आवेदन", "कृषि अधिकारी संपर्क", "निःशुल्क मिनीकिट पात्रता", "स्प्रेयर उपकरण बुकिंग"],
      };
    }
    if (lang === "ta") {
      return {
        text: `🏛️ **வேளாண்மை துறை - சான்றளிக்கப்பட்ட விதைகள், ஜிப்சம் & தெளிப்பான் மானியத் திட்டம்:**\n\n📋 **சரிபார்க்கப்பட்ட மானிய விவரங்கள்:**\n• **சான்றளிக்கப்பட்ட விதைகள் (Certified Seeds):** 50% மானியம் (குவிண்டாலுக்கு ₹1,200/- வரை)\n• **ஜிப்சம் விநியோகம் (Gypsum):** 50% மானியம் (ஹெக்டேருக்கு ₹750/- வரை)\n• **பயிர் பாதுகாப்பு உபகரணங்கள் (Plant Protection Sprayers):** 50% மானியம் (கைத்தெளிப்பான் ₹800/- வரை)\n• **இலவச விதை மினிகிட் (Minikits):** 100% இலவச விநியோகம்\n\n📍 **விண்ணப்பிக்க வேண்டிய இடம்:**\nகிராம அளவில் உள்ள **உதவி வேளாண்மை அலுவலரிடம் (AAO / உழவர் மையம்)** விண்ணப்பத்தை சமர்ப்பிக்கவும்.\n\n📄 **தேவையான ஆவணங்கள்:**\n1. ஆதார் அட்டை\n2. நில பட்டா / சிட்டா நகல்\n3. வங்கி கணக்கு புத்தகம்`,
        chips: ["விதை மானியம் விண்ணப்பம்", "வேளாண் அதிகாரி தொடர்பு", "இலவச மினிகிட் தகுதி", "தெளிப்பான் முன்பதிவு"],
      };
    }
    if (lang === "kn") {
      return {
        text: `🏛️ **ಕೃಷಿ ಇಲಾಖೆ - ಪ್ರಮಾಣೀಕೃತ ಬೀಜಗಳು, ಜಿಪ್ಸಮ್ & ಕೃಷಿ ಉಪಕರಣ ಸಬ್ಸಿಡಿ ಯೋಜನೆ:**\n\n📋 **ಪರಿಶೀಲಿಸಲಾದ ಸಬ್ಸಿಡಿ ವಿವರಗಳು:**\n• **ಪ್ರಮಾಣೀಕೃತ ಬೀಜ ವಿತರಣೆ (Certified Seeds):** 50% ಸಬ್ಸಿಡಿ (ಕ್ವಿಂಟಾಲ್‌ಗೆ ಗರಿಷ್ಠ ₹1,200/- ವರೆಗೆ)\n• **ಜಿಪ್ಸಮ್ ವಿತರಣೆ (Gypsum):** 50% ಸಬ್ಸಿಡಿ (ಪ್ರತಿ ಹೆಕ್ಟೇರ್‌ಗೆ ₹750/- ವರೆಗೆ)\n• **ಸಸ್ಯ ಸಂರಕ್ಷಣಾ ಉಪಕರಣಗಳು (Plant Protection Sprayers):** 50% ಸಬ್ಸಿಡಿ (ಸ್ಪ್ರೇಯರ್‌ಗಳಿಗೆ ₹800/- ವರೆಗೆ)\n• **ಉಚಿತ ಬೀಜ ಮಿನಿಕಿಟ್ (Minikits):** 100% ಉಚಿತ ವಿತರಣೆ\n\n📍 **ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕಾದ ಸ್ಥಳ:**\nಗ್ರಾಮ ಮಟ್ಟದಲ್ಲಿ **ಸಹಾಯಕ ಕೃಷಿ ಅಧಿಕಾರಿ (AAO / ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ)** ಬಳಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.\n\n📄 **ಅಗತ್ಯ ದಾಖಲೆಗಳು:**\n1. ಆಧಾರ್ ಕಾರ್ಡ್\n2. ಪಹಣಿ / ಪಟ್ಟಾ ನಕಲು\n3. ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್`,
        chips: ["ಬೀಜ ಸಬ್ಸಿಡಿ ಅರ್ಜಿ", "ಕೃಷಿ ಅಧಿಕಾರಿ ವಿವರ", "ಉಚಿತ ಮಿನಿಕಿಟ್ ಅರ್ಹತೆ", "ಸ್ಪ್ರೇಯರ್ ಬುಕಿಂಗ್"],
      };
    }
    if (lang === "bn") {
      return {
        text: `🏛️ **কৃষি বিভাগ - প্রত্যয়িত বীজ, জিপসাম ও কৃষি সরঞ্জাম ভর্তুকি প্রকল্প:**\n\n📋 **অনুমোদিত সরকারি ভর্তুকির বিবরণ:**\n• **প্রত্যয়িত বীজ বিতরণ (Certified Seeds):** ৫০% ভর্তুকি (কুইন্টাল প্রতি সর্বোচ্চ ₹১,২০০/-)\n• **জিপসাম বিতরণ (Gypsum):** ৫০% ভর্তুকি (হেক্টর প্রতি ₹৭৫০/- পর্যন্ত)\n• **উদ্ভিদ সংরক্ষণ স্প্রেয়ার সরঞ্জাম (Plant Protection Sprayers):** ৫০% ভর্তুকি (হস্তচালিত স্প্রেয়ার সর্বোচ্চ ₹৮০০/- পর্যন্ত)\n• **বিনামূল্যে বীজ মিনিকেট (Minikits):** ১০০% বিনামূল্যে বিতরণ\n\n📍 **আবেদন প্রক্রিয়া ও দায়িত্বপ্রাপ্ত আধিকারিক:**\nগ্রাম পঞ্চায়েত স্তরে **সহকারী কৃষি আধিকারিক (Assistant Agricultural Officer - AAO) / কৃষি সেবা কেন্দ্রে** জমা দিন।\n\n📄 **প্রয়োজনীয় নথিপত্র:**\n১. আধার কার্ড\n২. জমির পাট্টা / খতিয়ান\n৩. ব্যাংক পাসবুক`,
        chips: ["বীজ ভর্তুকি আবেদন", "কৃষি আধিকারিকের যোগাযোগ", "বিনামূল্যে মিনিকেট", "স্প্রেয়ার বুকিং"],
      };
    }
    return {
      text: `🏛️ **Department of Agriculture - Certified Seeds, Gypsum & Equipment Subsidy Scheme:**\n\n📋 **Verified Scheme Entitlements & Subsidies:**\n• **Certified Seeds Distribution:** 50% cost subsidy (up to ₹1,200/- per quintal) for Oilseeds & Pulses\n• **Gypsum Soil Amendment:** 50% subsidy (up to ₹750/- per hectare for soil health improvement)\n• **Plant Protection Equipment:** 50% subsidy (up to ₹800/- for manually operated sprayers)\n• **Free Seed Minikits:** 100% Free of Cost distribution to eligible small and marginal farmers\n\n📍 **Implementing Authority & Where to Submit:**\nSubmit to the **Assistant Agricultural Officer (AAO) at the Village Level / Rythu Vedika / Krishi Bhavan**.\n\n📄 **Required Documents:**\n1. Aadhaar Card (Farmer KYC)\n2. Land Record Passbook (Pattadar Passbook / Pahani / RoR)\n3. Bank Account Passbook (DBT-linked)`,
      chips: ["Apply for Seed Subsidy", "Contact Village Agri Officer", "Free Minikit Eligibility", "Book Knapsack Sprayer"],
    };
  }

  const isLandDeed =
    det.docType === "land_record" &&
    (det.title?.toLowerCase().includes("deed") ||
     det.title?.toLowerCase().includes("patta") ||
     det.title?.toLowerCase().includes("pahani") ||
     det.title?.toLowerCase().includes("dharani") ||
     det.title?.toLowerCase().includes("land") ||
     det.title?.toLowerCase().includes("విక్రయ"));

  if (isLandDeed) {
    const lines: string[] = [];
    if (ext.ownerName) lines.push(`• Owner / Pattadar: ${ext.ownerName}`);
    if (ext.sellerName) lines.push(`• Vendor / Seller: ${ext.sellerName}`);
    if (ext.surveyNumber) lines.push(`• ${ext.surveyNumber}`);
    if (ext.landExtent) lines.push(`• Land Extent: ${ext.landExtent}`);
    if (ext.considerationAmount) lines.push(`• Consideration / Value: ${ext.considerationAmount}`);
    if (ext.passBookNumber) lines.push(`• Passbook Number: ${ext.passBookNumber}`);
    if (ext.districtMandal) lines.push(`• Jurisdiction: ${ext.districtMandal}`);
    if (ext.revenueStatus) lines.push(`• Status: ${ext.revenueStatus}`);

    const detailsStr = lines.length > 0 ? lines.join("\n") : `• ${det.detectionSummary}`;

    if (lang === "te") {
      return {
        text: `🏛️ **${det.title} విశ్లేషించబడింది!**\n\n📋 **ధృవీకరించబడిన పత్ర వివరాలు:**\n${detailsStr}\n\n✅ **అర్హత గల ప్రభుత్వ సంక్షేమ పథకాలు & తదుపరి చర్యలు:**\n1. **PM-KISAN:** సర్వే నంబర్ ఆధారంగా సంవత్సరానికి ₹6,000 నేరుగా బ్యాంక్ ఖాతాలో జమ.\n2. **కిసాన్ క్రెడిట్ కార్డ్ (KCC):** 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం.\n3. **PM-KUSUM:** 60% సబ్సిడీతో సోలార్ వాటర్ పంపు పథకం.\n4. **రెవెన్యూ టైటిల్ మ్యుటేషన్ & ఈ-పాస్ పుస్తకం:** డిజిటల్ పట్టాదారు పాస్ పుస్తకం జారీ.`,
        chips: ["PM-KISAN అర్హత పరిశీలన", "KCC బ్యాంక్ లోన్ వివరాలు", "సోలార్ పంపు సబ్సిడీ", "దస్తావేజు వివరాలు చూడండి"],
      };
    }
    if (lang === "hi") {
      return {
        text: `🏛️ **${det.title} सत्यापित!**\n\n📋 **दस्तावेज़ से सत्यापित विवरण:**\n${detailsStr}\n\n✅ **अनुशंसित सरकारी योजनाएं एवं कानूनी प्रक्रिया:**\n1. **PM-KISAN:** सर्वे संख्या अनुसार ₹6,000 वार्षिक डायरेक्ट बेनिफिट ट्रांसफर (DBT).\n2. **किसान क्रेडिट कार्ड (KCC):** 4% ब्याज पर रियायती कृषि ऋण.\n3. **PM-KUSUM सोलर पंप:** 60% सब्सिडी पर सौर ऊर्जा पंप योजना.\n4. **नामांतरण (Mutation):** डिजिटल खतौनी / ई-पासबुक जारी करना.`,
        chips: ["PM-KISAN ₹6,000 जांचें", "KCC 4% ऋण आवेदन", "सोलर पंप सब्सिडी", "दस्तावेज़ विवरण देखें"],
      };
    }
    if (lang === "ta") {
      return {
        text: `🏛️ **${det.title} சரிபார்க்கப்பட்டது!**\n\n📋 **சரிபார்க்கப்பட்ட ஆவண விவரங்கள்:**\n${detailsStr}\n\n✅ **தகுதியான அரசு நலத்திட்டங்கள் & அடுத்த நடவடிக்கைகள்:**\n1. **PM-KISAN:** ஆண்டுக்கு ₹6,000 வங்கி கணக்கில் நேரடியாக வரவு.\n2. **கிசான் கிரெடிட் கார்டு (KCC):** 4% மானிய வட்டியில் பயிர்க்கடன்.\n3. **PM-KUSUM:** 60% மானியத்தில் சோலார் நீர் பம்ப்.\n4. **பட்டா மாற்றம் & இ-பாஸ்புக்:** டிஜிட்டல் பட்டாதாரர் பாஸ்புக் வழங்கல்.`,
        chips: ["PM-KISAN தகுதி சரிபார்", "KCC வங்கி கடன் விவரங்கள்", "சோலார் பம்ப் மானியம்", "ஆவண விவரங்கள் காண்க"],
      };
    }
    if (lang === "kn") {
      return {
        text: `🏛️ **${det.title} ಪರಿಶೀಲಿಸಲಾಗಿದೆ!**\n\n📋 **ಪರಿಶೀಲಿಸಲಾದ ದಾಖಲೆಯ ವಿವರಗಳು:**\n${detailsStr}\n\n✅ **ಅರ್ಹ ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು & ಮುಂದಿನ ಕ್ರಮಗಳು:**\n1. **PM-KISAN:** ವರ್ಷಕ್ಕೆ ₹6,000 ನೇರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ.\n2. **ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC):** 4% ರಿಯಾಯಿತಿ ಬಡ್ಡಿಯಲ್ಲಿ ಬೆಳೆ ಸಾಲ.\n3. **PM-KUSUM:** 60% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ ಸೋಲಾರ್ ವಾಟರ್ ಪಂಪ್.\n4. **ಮ್ಯುಟೇಶನ್ & ಇ-ಪಾಸ್ ಬುಕ್:** ಡಿಜಿಟಲ್ ಪಟ್ಟಾದಾರ ಪಾಸ್ ಬುಕ್ ವಿತರಣೆ.`,
        chips: ["PM-KISAN ಲಿಂಕ್ ಪರಿಶೀಲಿಸಿ", "KCC ಬ್ಯಾಂಕ್ ಸಾಲ ವಿವರ", "ಸೋಲಾರ್ ಪಂಪ್ ಅರ್ಜಿ", "ದಾಖಲೆ ವಿವರ ನೋಡಿ"],
      };
    }
    if (lang === "bn") {
      return {
        text: `🏛️ **${det.title} যাচাইকৃত!**\n\n📋 **যাচাইকৃত দলিলের বিবরণ:**\n${detailsStr}\n\n✅ **যোগ্য সরকারি কল্যাণ প্রকল্প ও পরবর্তী করণীয়:**\n1. **PM-KISAN:** বার্ষিক ₹৬,০০০ সরাসরি ব্যাংক অ্যাকাউন্টে জমা।\n2. **কিষাণ ক্রেডিট কার্ড (KCC):** ৪% রেয়াতি সুদে ফসল ঋণ।\n3. **PM-KUSUM:** ৬০% ভর্তুকিতে সৌর জল পাম্প।\n4. **মিউটেশন ও ই-পাসবুক:** ডিজিটাল পাট্টাদার পাসবুক প্রদান।`,
        chips: ["PM-KISAN স্থিতি যাচাই", "KCC লোন তথ্য", "সৌর পাম্প ভর্তুকি", "দলিল বিবরণ দেখুন"],
      };
    }

    return {
      text: `🏛️ **${det.title} Verified!**\n\n📋 **Verified Parameters:**\n${detailsStr}\n\n✅ **Unlocked Welfare Schemes & Next Actions:**\n1. **PM-KISAN:** Direct Benefit Transfer of ₹6,000/year to linked bank account.\n2. **Kisan Credit Card (KCC):** Concessional crop credit at 4% interest against registered land.\n3. **PM-KUSUM Component-B:** 60% subsidy for solar water pump installation.\n4. **Title Mutation & e-Passbook:** Digital land title linkage and verification.`,
      chips: ["Check PM-KISAN Linkage", "Apply for KCC Loan", "Solar Pump 60% Subsidy", "View Details"],
    };
  }

  // 2. Crop Disease & Foliage Pest Diagnosis
  if (det.docType === "crop_disease") {
    const crop = ext.crop || "Farm Crop Leaf";
    const pest = ext.pestOrDisease || "Foliar Sucking Pests / Blight";
    const organic = ext.organicRemedy || "Spray 10,000 ppm Neem Oil @ 2-3ml/L water in late afternoon.";
    const chemical = ext.chemicalTreatment || "Spray Diafenthiuron 50% WP @ 1g/L or Flonicamid 50% WG @ 0.3g/L.";
    const tips = ext.preventionTips || "Install 15 yellow sticky traps/acre and ensure proper field drainage.";

    if (lang === "te") {
      return {
        text: `🌿 **పంట తెగులు & కీటక వ్యాధి నిర్ధారణ (AI Crop Vision Diagnosis)**\n\n🔍 **గుర్తించిన సమస్య:**\n• పంట: ${crop}\n• సోకిన తెగులు/కీటకం: **${pest}**\n• తీవ్రత: ${ext.severity || "మధ్యస్థం (తక్షణ నివారణ అవసరం)"}\n\n🧪 **శాస్త్రీయ నివారణ & సలహాలు:**\n1. **సేంద్రీయ నివారణ:** ${organic}\n2. **రసాయన చికిత్స:** ${chemical}\n3. **క్షేత్ర యాజమాన్యం:** ${tips}\n\n🏛️ **ప్రభుత్వ పథకాలు & బీమా సాయం:**\n• **PMFBY పంట నష్టం బీమా:** నష్టం 33% పైగా ఉంటే 72 గంటల్లోగా పోర్టల్ లేదా వ్యవసాయ అధికారికి తెలియజేయండి.\n• **కిసాన్ కాల్ సెంటర్ (ఉచితం):** 1800-180-1551 కాల్ చేసి ఉచిత వ్యవసాయ శాస్త్రవేత్త సలహా పొందండి.`,
        chips: ["మందు పిచికారీ సమయం", "PMFBY పంట బీమా దరఖాస్తు", "వేపనూనె తయారీ విధానం", "రైతు భరోసా కేంద్రం"],
      };
    }
    if (lang === "hi") {
      return {
        text: `🌿 **फसल कीट एवं रोग निदान (AI Crop Vision Diagnosis)**\n\n🔍 **पहचाना गया विवरण:**\n• फसल: ${crop}\n• कीट / रोग: **${pest}**\n• प्रकोप स्तर: ${ext.severity || "मध्यम (त्वरित उपचार आवश्यक)"}\n\n🧪 **वैज्ञानिक उपचार एवं कृषि सलाह:**\n1. **जैविक उपचार:** ${organic}\n2. **रासायनिक छिड़काव:** ${chemical}\n3. **खेत प्रबंधन:** ${tips}\n\n🏛️ **सरकारी सहायता एवं फसल बीमा:**\n• **PMFBY फसल बीमा:** 33% से अधिक नुकसान पर 72 घंटे के भीतर टोल-फ्री या पोर्टल पर सूचना दें.\n• **किसान कॉल सेंटर (निःशुल्क):** 1800-180-1551 पर कृषि वैज्ञानिकों से सीधी सलाह लें.`,
        chips: ["दवा छिड़काव की सही मात्रा", "PMFBY बीमा क्लेम प्रक्रिया", "नीम तेल जैविक विधि", "नजदीकी कृषि विज्ञान केंद्र"],
      };
    }
    if (lang === "ta") {
      return {
        text: `🌿 **பயிர் நோய் மற்றும் பூச்சி கண்டறிதல் (AI Crop Vision Diagnosis)**\n\n🔍 **கண்டறியப்பட்ட விவரங்கள்:**\n• பயிர்: ${crop}\n• பூச்சி/நோய்: **${pest}**\n• தீவிரம்: ${ext.severity || "மிதமான பாதிப்பு (உடனடி நடவடிக்கை தேவை)"}\n\n🧪 **பரிந்துரைக்கப்பட்ட விவசாய ஆலோசனைகள்:**\n1. **இயற்கை முறை:** ${organic}\n2. **வேதியியல் தெளிப்பு:** ${chemical}\n3. **வயல் பராமரிப்பு:** ${tips}\n\n🏛️ **அரசு மானியங்கள் & பயிர் காப்பீடு:**\n• **PMFBY பயிர் காப்பீடு:** 33% மேல் சேதம் ஏற்பட்டால் 72 மணி நேரத்திற்குள் தெரிவிக்கவும்.\n• **உழவர் உதவி மையம் (இலவசம்):** 1800-180-1551 என்ற எண்ணில் வேளாண் விஞ்ஞானிகளிடம் ஆலோசனை பெறவும்.`,
        chips: ["மருந்து தெளிக்கும் முறை", "PMFBY காப்பீடு விண்ணப்பம்", "இயற்கை வேப்பெண்ணெய் முறை", "உழவர் மையம்"],
      };
    }
    if (lang === "kn") {
      return {
        text: `🌿 **ಬೆಳೆ ರೋಗ ಮತ್ತು ಕೀಟ ನಿರ್ಣಯ (AI Crop Vision Diagnosis)**\n\n🔍 **ಗುರುತಿಸಲಾದ ಸಮಸ್ಯೆ:**\n• ಬೆಳೆ: ${crop}\n• ಕೀಟ / ರೋಗ: **${pest}**\n• ತೀವ್ರತೆ: ${ext.severity || "ಮಧ್ಯಮ (ತಕ್ಷಣದ ಕ್ರಮ ಅಗತ್ಯ)"}\n\n🧪 **ವೈಜ್ಞಾನಿಕ ಕೃಷಿ ಸಲಹೆಗಳು:**\n1. **ಸಾವಯವ ವಿಧಾನ:** ${organic}\n2. **ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ:** ${chemical}\n3. **ಜಮೀನಿನ ನಿರ್ವಹಣೆ:** ${tips}\n\n🏛️ **ಸರ್ಕಾರಿ ಬೆಳೆ ವಿಮೆ ಮತ್ತು ನೆರವು:**\n• **PMFBY ಬೆಳೆ ವಿಮೆ:** 33% ಕ್ಕಿಂತ ಹೆಚ್ಚು ಹಾನಿಯಾಗಿದ್ದರೆ 72 ಗಂಟೆಗಳಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ.\n• **ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್ (ಉಚಿತ):** 1800-180-1551 ಗೆ ಕರೆ ಮಾಡಿ ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆ ಪಡೆಯಿರಿ.`,
        chips: ["ಔಷಧ ಸಿಂಪಡಣೆ ಪ್ರಮಾಣ", "PMFBY ಬೆಳೆ ವಿಮೆ ಕ್ಲೈಮ್", "ಬೇವಿನ ಎಣ್ಣೆ ಬಳಕೆ", "ಕೃಷಿ ಕೇಂದ್ರ"],
      };
    }
    if (lang === "bn") {
      return {
        text: `🌿 **ফসল রোগ ও পোকা নির্ণয় (AI Crop Vision Diagnosis)**\n\n🔍 **চিহ্নিত সমস্যা:**\n• ফসল: ${crop}\n• পোকা / রোগ: **${pest}**\n• তীব্রতা: ${ext.severity || "মাঝারি (জরুরি ব্যবস্থা প্রয়োজন)"}\n\n🧪 **বিজ্ঞানসম্মত প্রতিকার ও পরামর্শ:**\n1. **জৈব সমাধান:** ${organic}\n2. **রাসায়নিক স্প্রে:** ${chemical}\n3. **মাঠের যত্ন:** ${tips}\n\n🏛️ **সরকারি ফসল বীমা ও সহায়তা:**\n• **PMFBY ফসল বীমা:** ৩৩% এর বেশি ক্ষতি হলে ৭২ ঘণ্টার মধ্যে অভিযোগ নথিভুক্ত করুন।\n• **কিষাণ কল সেন্টার (টোল-ফ্রি):** 1800-180-1551 এ কল করে সরাসরি কৃষি বিশেষজ্ঞদের পরামর্শ নিন।`,
        chips: ["ওষুধ স্প্রে করার পরিমাণ", "PMFBY বীমা দাবি প্রক্রিয়া", "নিম তেল তৈরির পদ্ধতি", "কৃষি সেবা কেন্দ্র"],
      };
    }

    return {
      text: `🌿 **Crop Pest & Disease Diagnosis (AI Vision Analysis)**\n\n🔍 **Identified Parameters:**\n• Crop: **${crop}**\n• Identified Pest / Disease: **${pest}**\n• Severity: **${ext.severity || "Moderate (Action Threshold Reached)"}**\n\n🧪 **Actionable Agronomic Advice:**\n1. **Organic Treatment:** ${organic}\n2. **Chemical Control:** ${chemical}\n3. **Field Prevention:** ${tips}\n\n🏛️ **Government Assistance & Insurance:**\n• **PMFBY Crop Loss Claim:** Report within 72 hours via PMFBY portal if damage exceeds 33%.\n• **Kisan Call Center (Toll-Free):** Dial 1800-180-1551 for free guidance from agricultural scientists.`,
      chips: ["Spray Dosage Guide", "Apply for PMFBY Claim", "Organic Neem Oil Recipe", "Nearest Krishi Kendra"],
    };
  }

  // 3. Soil Health Card & Nutrient Analysis
  if (det.docType === "soil_health_card") {
    const ph = ext.soilPh || 6.8;
    const n = ext.nitrogenStatus || "Medium";
    const p = ext.phosphorusStatus || "Low (Deficient)";
    const k = ext.potassiumStatus || "High (Sufficient)";
    const action = ext.recommendedAction || "Apply balanced NPK fertilizer with Zinc Sulphate.";

    if (lang === "te") {
      return {
        text: `🧪 **సాయిల్ హెల్త్ కార్డ్ & పోషకాల విశ్లేషణ (Soil Health Card Analysis)**\n\n📊 **నేల రసాయన సమతుల్యత:**\n• నేల పీహెచ్ (pH): **${ph}** (${ext.soilReaction || "అనుకూలమైన స్థితి"})\n• నత్రజని (Nitrogen): ${n}\n• భాస్వరం (Phosphorus): ${p}\n• పొటాష్ (Potassium): ${k}\n\n💡 **రైతుకు ఎరువుల సిఫార్సులు:**\n${action}\n\n🏛️ **వర్తించే ప్రభుత్వ రాయితీలు:**\n• ఉచిత నేల ఆరోగ్య కార్డు సూక్ష్మపోషకాల కిట్ పథకం\n• పరంపరాగత్ కృషి వికాస్ యోజన (PKVY) సేంద్రియ సాగు సబ్సిడీ`,
        chips: ["ఎరువుల మోతాదు లెక్కింపు", "సేంద్రియ ఎరువుల సలహా", "సాయిల్ కిట్ దరఖాస్తు"],
      };
    }
    if (lang === "hi") {
      return {
        text: `🧪 **मृदा स्वास्थ्य कार्ड एवं पोषक तत्व विश्लेषण (Soil Health Analysis)**\n\n📊 **रासायनिक संतुलन:**\n• मिट्टी का पीएच (pH): **${ph}** (${ext.soilReaction || "उचित स्थिति"})\n• नाइट्रोजन (N): ${n}\n• फास्फोरस (P): ${p}\n• पोटाश (K): ${k}\n\n💡 **उर्वरक एवं सुधारक सिफारिश:**\n${action}\n\n🏛️ **सरकारी सब्सिडी:**\n• मृदा स्वास्थ्य कार्ड योजनान्तर्गत निःशुल्क सूक्ष्म पोषक तत्व किट\n• परम्परागत कृषि विकास योजना (PKVY) जैविक खेती प्रोत्साहन`,
        chips: ["उर्वरक की सही मात्रा", "जैविक खाद सलाह", "सॉइल किट सब्सिडी"],
      };
    }

    return {
      text: `🧪 **Soil Health Card & Nutrient Analysis**\n\n📊 **Soil Chemical Balance:**\n• Soil pH: **${ph}** (${ext.soilReaction || "Optimal Range"})\n• Available Nitrogen (N): **${n}**\n• Available Phosphorus (P): **${p}**\n• Available Potassium (K): **${k}**\n\n💡 **Fertilizer & Amendment Recommendations:**\n${action}\n\n🏛️ **Eligible Government Subsidies:**\n• Soil Health Card Micronutrient Kit Subsidy\n• Paramparagat Krishi Vikas Yojana (PKVY) ₹50,000/ha Organic Cluster Scheme`,
      chips: ["Calculate Fertilizer Dose", "Organic Compost Guide", "Soil Kit Subsidy"],
    };
  }

  // 4. Generic Agricultural / Land Document
  const schemesList = (det.schemesUnlocked || [])
    .slice(0, 4)
    .map((s: string, idx: number) => `${idx + 1}. ${s}`)
    .join("\n");

  const paramEntries = Object.entries(ext)
    .filter(([k]) => !["recommendedAction", "docTitle"].includes(k))
    .slice(0, 5)
    .map(([k, v]) => `• ${k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}: ${v}`)
    .join("\n");

  if (lang === "te") {
    return {
      text: `📜 ${det.title} విజయవంతంగా విశ్లేషించబడింది!\n• గుర్తింపు: ${det.detectionSummary}\n• ఖచ్చితత్వం: ${(det.confidenceScore * 100).toFixed(0)}%\n\n📋 గుర్తించిన వివరాలు:\n${paramEntries}\n\n✅ అర్హత గల పథకాలు:\n${schemesList}`,
      chips: ["ప్రభుత్వ పథకాల దరఖాస్తు", "దస్తావేజు స్కానర్ తెరవండి"],
    };
  }
  if (lang === "hi") {
    return {
      text: `📜 ${det.title} सफलतापूर्वक विश्लेषित!\n• पहचान: ${det.detectionSummary}\n• सटीकता: ${(det.confidenceScore * 100).toFixed(0)}%\n\n📋 पहचाने गए विवरण:\n${paramEntries}\n\n✅ अनुशंसित योजनाएं:\n${schemesList}`,
      chips: ["सरकारी योजनाएं देखें", "दस्तावेज़ स्कैनर खोलें"],
    };
  }
  if (lang === "ta") {
    return {
      text: `📜 ${det.title} வெற்றிகரமாக பகுப்பாய்வு செய்யப்பட்டது!\n• கண்டறிதல்: ${det.detectionSummary}\n• நம்பகத்தன்மை: ${(det.confidenceScore * 100).toFixed(0)}%\n\n📋 கண்டறியப்பட்ட விவரங்கள்:\n${paramEntries}\n\n✅ பரிந்துரைக்கப்பட்ட திட்டங்கள்:\n${schemesList}`,
      chips: ["அரசு திட்டங்கள் விவரம்", "ஆவண ஸ்கேனரைத் திறக்கவும்"],
    };
  }
  if (lang === "kn") {
    return {
      text: `📜 ${det.title} ಯಶಸ್ವಿಯಾಗಿ ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ!\n• ಗುರುತಿಸುವಿಕೆ: ${det.detectionSummary}\n• ನಿಖರತೆ: ${(det.confidenceScore * 100).toFixed(0)}%\n\n📋 ಗುರುತಿಸಲಾದ ನಿಯತಾಂಕಗಳು:\n${paramEntries}\n\n✅ ಶಿಫಾರಸು ಮಾಡಲಾದ ಯೋಜನೆಗಳು:\n${schemesList}`,
      chips: ["ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರ", "ದಾಖಲೆ ಸ್ಕ್ಯಾನರ್ ತೆರೆಯಿರಿ"],
    };
  }
  if (lang === "bn") {
    return {
      text: `📜 ${det.title} সফলভাবে বিশ্লেষিত হয়েছে!\n• সনাক্তকরণ: ${det.detectionSummary}\n• নির্ভুলতা: ${(det.confidenceScore * 100).toFixed(0)}%\n\n📋 সনাক্তকৃত তথ্যাবলী:\n${paramEntries}\n\n✅ প্রস্তাবিত সরকারি প্রকল্পসমূহ:\n${schemesList}`,
      chips: ["সরকারি প্রকল্পসমূহ দেখুন", "নথি স্ক্যানার খুলুন"],
    };
  }

  return {
    text: `📜 ${det.title} Analyzed Successfully!\n• Detection: ${det.detectionSummary}\n• Confidence Score: ${(det.confidenceScore * 100).toFixed(0)}%\n\n📋 Extracted Parameters:\n${paramEntries}\n\n✅ Recommended Schemes & Benefits:\n${schemesList}`,
    chips: (det.schemesUnlocked || []).slice(0, 3).concat(["View Details"]),
  };
}

export function formatFarmerProfileReply(farmer: FarmerProfile, lang: SupportedLanguage): { text: string; chips: string[] } {
  const isGuest = !farmer.name && !farmer.landSizeAcres;

  if (isGuest) {
    if (lang === "te") {
      return {
        text: `నమస్కారం రైతు మిత్రమా! మీరు ప్రస్తుతం గెస్ట్ యూజర్‌గా చూస్తున్నారు. మీ ఆధార్ లేదా భూమి రికార్డులు ఇంకా లింక్ చేయబడలేదు.\n\nమీ భూమి పట్టాదారు పాస్ పుస్తకం, సేల్ డీడ్ లేదా సాయిల్ హెల్త్ కార్డును స్కాన్ చేయడం ద్వారా మీ చేను వివరాలను నమోదు చేసి అర్హత గల పథకాలను తెలుసుకోవచ్చు.`,
        chips: ["భూమి రికార్డు స్కాన్ చేయి", "వ్యవసాయ పథకాలు", "PM-KISAN అర్హత"],
      };
    }
    if (lang === "hi") {
      return {
        text: `नमस्ते किसान साथी! आप वर्तमान में अतिथि (Guest) के रूप में जुड़े हैं। आपका कोई व्यक्तिगत भूमि रिकॉर्ड अभी लिंक नहीं है।\n\nआप अपनी भूमि पट्टा पासबुक, सेल डीड या मृदा स्वास्थ्य कार्ड स्कैन करके अपनी ज़मीन की जानकारी जोड़ सकते हैं और सरकारी योजनाएं देख सकते हैं।`,
        chips: ["दस्तावेज़ स्कैन करें", "सरकारी योजनाएं", "PM-KISAN पात्रता"],
      };
    }
    return {
      text: `Namaste Farmer Friend! You are currently browsing as a guest. No registered farmer profile or land record is linked yet.\n\nYou can upload or scan your Land Patta / Pahani / RoR, Registered Sale Deed, or Soil Health Card to verify your farmland and discover eligible government welfare schemes.`,
      chips: ["Scan Land Document", "Explore Agri Schemes", "PM-KISAN Eligibility"],
    };
  }

  const name = farmer.name;
  const village = farmer.village || "your registered village";
  const district = farmer.district || "your district";
  const acres = farmer.landSizeAcres;
  const crops = farmer.primaryCrops?.length ? farmer.primaryCrops.join(", ") : "Cotton, Chilli, and Pulses";
  const irrigation = farmer.irrigationTypeName || "Borewell / Rainfed";
  const soil = farmer.soilTypeName || "Agricultural Soil";

  if (lang === "te") {
    return {
      text: `నమస్కారం **${name} గారు**! మీ వ్యవసాయ ప్రొఫైల్ వివరాలు:\n\nమీరు ${district} పరిధిలోని ${village}లో **${acres} ఎకరాల ${soil}లో** వ్యవసాయం చేస్తున్నారు. మీ చేనులో ప్రధానంగా **${crops}** సాగు చేస్తూ, **${irrigation}** పద్ధతిని వాడుతున్నారు.\n\n💡 **మీ పొలానికి ప్రయోజనకరమైన ప్రధాన పథకాలు:**\n1. **PM-KUSUM సోలార్ పంపు (60% సబ్సిడీ):** వ్యవసాయ పంపుల కోసం 60% ప్రభుత్వ రాయితీ.\n2. **PM-KISAN సమ్మాన్ నిధి:** సంవత్సరానికి ₹6,000 ప్రత్యక్ష నగదు బదిలీ.\n3. **కిసాన్ క్రెడిట్ కార్డ్ (KCC):** 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం.\n\nమీ వివరాల్లో ఏదైనా మార్పు చేయాలా, లేదా పథకాల దరఖాస్తులో సహాయం కావాలా?`,
      chips: ["భూమి వివరాలు మార్చు", "సోలార్ పంపు 60% సబ్సిడీ", "సమీప రైతులతో మాట్లాడండి", "అర్హత గల పథకాలు"],
    };
  }

  if (lang === "hi") {
    return {
      text: `नमस्ते **${name} जी**! आपकी पंजीकृत कृषि प्रोफ़ाइल का विवरण:\n\nआप ${district} के ${village} में **${acres} एकड़ ${soil}** पर खेती कर रहे हैं। आप मुख्य रूप से **${crops}** उगाते हैं तथा **${irrigation}** का उपयोग करते हैं।\n\n💡 **आपकी भूमि के लिए शीर्ष सरकारी योजनाएं:**\n1. **PM-KUSUM सोलर पंप (60% सब्सिडी):** बोरवेल/सिंचाई हेतु 60% सरकारी सहायता.\n2. **PM-KISAN सम्मान निधि:** ₹6,000 वार्षिक प्रत्यक्ष बैंक अंतरण (DBT).\n3. **किसान क्रेडिट कार्ड (KCC):** मात्र 4% रियायती ब्याज दर पर कृषि ऋण.\n\nक्या आप अपनी भूमि जानकारी अपडेट करना चाहते हैं या योजना आवेदन में सहायता चाहिए?`,
      chips: ["भूमि विवरण अपडेट करें", "सोलर पंप 60% सब्सिडी", "आसपास के किसान से जुड़ें", "पात्र सरकारी योजनाएं"],
    };
  }

  return {
    text: `Namaste **${name} Ji**! Here is your verified farm profile:\n\nYou farm on **${acres} Acres of ${soil}** in ${village}, ${district}. You cultivate **${crops}**, supported by **${irrigation}**.\n\n💡 **Top Recommended Welfare Schemes for Your Land:**\n1. **PM-KUSUM Solar Pump (60% Subsidy):** Subsidized standalone solar irrigation pump.\n2. **PM-KISAN Samman Nidhi:** ₹6,000/year direct cash transfer via DBT.\n3. **Kisan Credit Card (KCC):** Concessional crop loan at just 4% interest rate.\n\nWould you like to update any details or need help applying for these schemes?`,
    chips: ["Update Land Details", "Apply for PM-KUSUM 60%", "Connect with Nearby Peer Farmers", "View All Eligible Schemes"],
  };
}

/** Text reply for a farmer question. */
export function generateTextReply(text: string, lang: SupportedLanguage, currentFarmer: FarmerProfile): EngineReply {
  const lower = text.toLowerCase();
  const farmer = currentFarmer || GUEST_FARMER;
  let replyText = "";
  let chips: string[] | undefined = undefined;

  // 0. Warm Greeting / Casual Check-in
  const isGreetingQuery =
    lower.includes("నమస్కారం") ||
    lower.includes("నమస్తే") ||
    lower.includes("హలో") ||
    lower.includes("బాగున్నారా") ||
    lower.includes("ఎలా ఉన్నారు") ||
    lower.includes("వందనాలు") ||
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey") ||
    lower.includes("namaste") ||
    lower.includes("good morning") ||
    lower.includes("good afternoon") ||
    lower.includes("good evening") ||
    lower.includes("नमस्ते") ||
    lower.includes("प्रणाम") ||
    lower.includes("வணக்கம்") ||
    lower.includes("நலமா") ||
    lower.includes("ನಮಸ್ಕಾರ") ||
    lower.includes("ನಮಸ್ತೆ") ||
    lower.includes("নমস্কার") ||
    lower.includes("হ্যালো");

  // 1. Farmer Profile / Identity / Registered Details Inquiry
  const isProfileQuery =
    lower.includes("గురించి") ||
    lower.includes("వివరాలు") ||
    lower.includes("సమాచారం") ||
    lower.includes("ప్రొఫైల్") ||
    lower.includes("నేను ఎవరు") ||
    lower.includes("నా భూమి") ||
    lower.includes("రికార్డు") ||
    lower.includes("about me") ||
    lower.includes("my profile") ||
    lower.includes("my details") ||
    lower.includes("who am i") ||
    lower.includes("what do you know about me") ||
    lower.includes("tell me about me") ||
    lower.includes("my land details") ||
    lower.includes("my farm") ||
    lower.includes("my info") ||
    lower.includes("मेरे बारे") ||
    lower.includes("मेरी जानकारी") ||
    lower.includes("मेरा विवरण") ||
    lower.includes("मेरी प्रोफ़ाइल") ||
    lower.includes("मेरी ज़मीन") ||
    lower.includes("मैं कौन हूँ") ||
    lower.includes("என்னை பற்றி") ||
    lower.includes("என் விவரங்கள்") ||
    lower.includes("எனது சுயவிவரம்") ||
    lower.includes("என் நிலம்") ||
    lower.includes("நான் யார்") ||
    lower.includes("ನನ್ನ ಬಗ್ಗೆ") ||
    lower.includes("ನನ್ನ ವಿವರಗಳು") ||
    lower.includes("ನನ್ನ ಪ್ರೊಫೈಲ್") ||
    lower.includes("ನನ್ನ ಜಮೀನು") ||
    lower.includes("ನಾನು ಯಾರು") ||
    lower.includes("আমার সম্পর্কে") ||
    lower.includes("আমার তথ্য") ||
    lower.includes("আমার বিবরণ") ||
    lower.includes("আমার প্রোফাইল") ||
    lower.includes("আমার জমি") ||
    lower.includes("আমি কে");

  if (isGreetingQuery && text.trim().length < 30) {
    const greetingName = farmer.name ? `${farmer.name} గారు` : "రైతు మిత్రమా";
    const greetingHi = farmer.name ? `${farmer.name} जी` : "किसान साथी";
    const greetingEn = farmer.name ? `${farmer.name} Ji` : "Farmer Friend";

    if (lang === "te") {
      replyText = `నమస్కారం ${greetingName}! ఎలా ఉన్నారు? నేను మీ జనమిత్ర డిజిటల్ వ్యవసాయ మిత్రుడిని. మీ వ్యవసాయ సలహాలు, పంట ఆరోగ్యం లేదా ప్రభుత్వ సబ్సిడీ పథకాలలో నేను ఏ విధంగా సహాయపడగలను?`;
      chips = ["నా వివరాలు చెప్పు", "సోలార్ పంపు 60% సబ్సిడీ", "పంట తెగులు సలహా", "PM-KISAN ₹6,000 స్థితి"];
    } else if (lang === "hi") {
      replyText = `नमस्ते ${greetingHi}! आप कैसे हैं? मैं आपका जनमित्रा कृषि सलाहकार हूँ। आज मैं आपकी खेती, फसल सुरक्षा या सरकारी योजनाओं में किस प्रकार सहायता कर सकता हूँ?`;
      chips = ["मेरी जानकारी बताएं", "सोलर पंप 60% सब्सिडी", "फसल कीट सलाह", "PM-KISAN स्थिति"];
    } else {
      replyText = `Namaste ${greetingEn}! How are you doing? I am your JanMithra farm companion. How can I assist your farming, crop protection, or welfare scheme applications today?`;
      chips = ["Tell me about me", "Apply for PM-KUSUM 60%", "Pest control advice", "Check PM-KISAN ₹6,000 status"];
    }
  } else if (isProfileQuery) {
    const profileReply = formatFarmerProfileReply(farmer, lang);
    replyText = profileReply.text;
    chips = profileReply.chips;
  } else if (
    lower.includes("kusum") ||
    lower.includes("solar") ||
    lower.includes("pump") ||
    lower.includes("కుసుమ్") ||
    lower.includes("సోలార్") ||
    lower.includes("పంపు") ||
    lower.includes("బోరుబావి") ||
    lower.includes("कुसुम") ||
    lower.includes("सोलर") ||
    lower.includes("पंप") ||
    lower.includes("சோலார்") ||
    lower.includes("ಸೋಲಾರ್") ||
    lower.includes("সৌর")
  ) {
    const salutationTe = farmer.name ? `${farmer.name} గారు` : "రైతు మిత్రమా";
    const salutationHi = farmer.name ? `${farmer.name} जी` : "किसान साथी";
    const salutationEn = farmer.name ? `${farmer.name} Ji` : "Farmer Friend";
    const landStr = farmer.landSizeAcres ? `${farmer.landSizeAcres} ఎకరాల` : "మీ";
    const landStrHi = farmer.landSizeAcres ? `${farmer.landSizeAcres} एकड़` : "आपकी";
    const landStrEn = farmer.landSizeAcres ? `for your ${farmer.landSizeAcres} Acres of land` : "for your farmland";

    if (lang === "te") {
      replyText = `${salutationTe}, ${landStr} వ్యవసాయ భూమికి PM-KUSUM కాంపోనెంట్-బి కింద 5HP సోలార్ పంపు చాలా అద్భుతంగా సరిపోతుంది. దీనికి కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాలు కలిపి 60% సబ్సిడీ ఇస్తాయి, దీనితో డీజిల్ మరియు కరెంట్ బిల్లుల ఖర్చు పూర్తిగా ఆదా అవుతుంది! మీ వద్ద ప్రస్తుతం పనిచేసే బోరుబావి లేదా బావి ఉందా?`;
      chips = ["అవును, బోరుబావి ఉంది", "బావి ఉంది", "కొత్తగా బోరు వేయాలి", "కావలసిన పత్రాలు ఏమిటి?"];
    } else if (lang === "hi") {
      replyText = `${salutationHi}, ${landStrHi} भूमि और सिंचाई के लिए PM-KUSUM योजना के तहत 5HP सोलर पंप बहुत फायदेमंद रहेगा। इस पर सरकार 60% सब्सिडी देती है जिससे बिजली और डीजल का खर्च पूरी तरह समाप्त हो जाता है। क्या आपके पास वर्तमान में कार्यरत बोरवेल या कुआं है?`;
      chips = ["हाँ, बोरवेल है", "कुआं है", "नया बोरवेल लगवाना है", "आवश्यक दस्तावेज़ बताएं"];
    } else {
      replyText = `${salutationEn}, ${landStrEn}, a standalone Solar Pump under PM-KUSUM Component-B provides up to 60% government subsidy, eliminating diesel and high electricity bills! Do you currently have an active borewell or open well on your land?`;
      chips = ["I have an active Borewell", "Open Irrigation Well", "Need new borewell", "What documents are required?"];
    }
  } else if (
    lower.includes("pest") ||
    lower.includes("whitefly") ||
    lower.includes("disease") ||
    lower.includes("leaf") ||
    lower.includes("cotton") ||
    lower.includes("spray") ||
    lower.includes("తెల్లదోమ") ||
    lower.includes("తెగులు") ||
    lower.includes("పిచికారీ") ||
    lower.includes("పురుగు") ||
    lower.includes("మందు") ||
    lower.includes("ఆకు") ||
    lower.includes("పత్తి") ||
    lower.includes("మిర్చి") ||
    lower.includes("मक्खी") ||
    lower.includes("कीट") ||
    lower.includes("छिड़काव") ||
    lower.includes("रोग") ||
    lower.includes("दवा") ||
    lower.includes("பூச்சி") ||
    lower.includes("கீಟ")
  ) {
    if (lang === "te") {
      replyText = `పంటలలో తెల్లదోమ లేదా ఆకు ముడుత తెగులు కనిపిస్తే ఆకుల అడుగుభాగంలో రసం పీల్చే పురుగులు చేరి నష్టం కలిగిస్తాయి. తక్షణ నివారణకు:\n1. **సేంద్రీయ చికిత్స:** ఎకరాకు వేపనూనె 10,000 ppm 2 మిల్లీలీటర్లు లీటరు నీటిలో కలిపి సాయంత్రం వేళ ఆకుల అడుగుభాగం బాగా తడిచేలా పిచికారీ చేయండి.\n2. **రసాయన నివారణ:** తీవ్రత ఎక్కువగా ఉంటే డయాఫెంథియురాన్ 50% WP @ 1 గ్రా/లీటర్ లేదా ఫ్లోనికామిడ్ 50% WG @ 0.3 గ్రా/లీటర్ వాడండి.\n3. **బీమా రక్షణ:** పంట నష్టం 33% దాటితే PMFBY పంట బీమా పరిధిలో నష్టపరిహారానికి 72 గంటల్లో దరఖాస్తు చేసుకోవచ్చు.`;
      chips = ["పిచికారీ ఎప్పుడు చేయాలి?", "మందుల షాపు వివరాలు", "పంట బీమా క్లెయిమ్ ఎలా?"];
    } else if (lang === "hi") {
      replyText = `कपास या अन्य फसलों में सफेद मक्खी या पत्ती मुड़ने का प्रकोप होने पर पत्तियां मुड़ जाती हैं। रोकथाम हेतु:\n1. **जैविक उपचार:** नीम का तेल 10,000 ppm @ 2 मिली/लीटर पानी शाम के समय पत्तियों के निचले हिस्से पर छिड़कें।\n2. **रासायनिक उपचार:** प्रकोप अधिक होने पर डायफेंथियूरॉन 50% WP @ 1 ग्राम/लीटर या फ्लोनिकामाइड 50% WG @ 0.3 ग्राम/लीटर का प्रयोग करें।\n3. **बीमा:** 33% से अधिक क्षति होने पर PMFBY में 72 घंटे के भीतर क्लेम करें।`;
      chips = ["दवा छिड़काव का समय", "नजदीकी कृषि केंद्र", "फसल बीमा क्लेम प्रक्रिया"];
    } else {
      replyText = `For whitefly infestation and foliar curling on crops:\n1. **Organic / Botanical:** Spray cold-pressed Neem Oil (10,000 ppm) @ 2ml/litre water during evening hours, ensuring the underside of leaves is covered.\n2. **Chemical Control:** For severe infestation, Diafenthiuron 50% WP @ 1g/litre or Flonicamid 50% WG @ 0.3g/litre provides reliable knockdown.\n3. **Crop Insurance:** If yield loss exceeds 33%, you are eligible for claims under PMFBY by notifying within 72 hours.`;
      chips = ["Spray schedule", "Eligible under PMFBY crop insurance?", "Upload photo for scan"];
    }
  } else if (
    lower.includes("kisan") ||
    lower.includes("6000") ||
    lower.includes("installment") ||
    lower.includes("విడత") ||
    lower.includes("కిసాన్") ||
    lower.includes("డబ్బులు") ||
    lower.includes("కిస్త") ||
    lower.includes("किस्त") ||
    lower.includes("किसान") ||
    lower.includes("பணம்") ||
    lower.includes("ಕಂತು") ||
    lower.includes("টাকা")
  ) {
    const salutationTe = farmer.name ? `${farmer.name} గారు` : "రైతు మిత్రమా";
    const salutationHi = farmer.name ? `${farmer.name} जी` : "किसान साथी";
    const salutationEn = farmer.name ? `${farmer.name} Ji` : "Farmer Friend";

    if (lang === "te") {
      replyText = `${salutationTe}, PM-KISAN సమ్మాన్ నిధి పథకం ద్వారా అర్హత గల రైతు కుటుంబాలకు సంవత్సరానికి ₹6,000 చొప్పున మూడు విడతల్లో (ప్రతి 4 నెలలకు ₹2,000) నేరుగా బ్యాంక్ ఖాతాలో DBT ద్వారా జమ చేయబడుతుంది. మీ ఆధార్ ఈ-కేవైసీ మరియు ధరణి/భూమి రికార్డులు మీ బ్యాంక్ ఖాతాతో లింక్ అయి ఉంటేనే డబ్బులు జమవుతాయి. మీ పేమెంట్ స్టేటస్ లేదా ఈ-కేవైసీ వివరాలు కావాలా?`;
      chips = ["తదుపరి విడత ఎప్పుడు?", "ఈ-కేవైసీ ఎలా చేయాలి?", "బ్యాంక్ ఖాతా లింకేజ్"];
    } else if (lang === "hi") {
      replyText = `${salutationHi}, PM-KISAN सम्मान निधि योजना के अंतर्गत सभी पात्र भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष 3 समान किस्तों (प्रत्येक किस्त ₹2,000) में सीधे बैंक खाते में DBT द्वारा भेजे जाते हैं। इसके लिए आपका आधार ई-केवाईसी और भूमि रिकॉर्ड बैंक खाते से जुड़ा होना अनिवार्य है। क्या आप अपनी किस्त की स्थिति जांचना चाहते हैं?`;
      chips = ["अगली किस्त की तारीख?", "ई-केवाईसी कैसे करें?", "भूमि लिंकेज जांचें"];
    } else {
      replyText = `${salutationEn}, under PM-KISAN Samman Nidhi Yojana, eligible landholding farmer families receive ₹6,000 per year directly in their bank accounts via DBT in 3 equal installments of ₹2,000 every 4 months. To ensure seamless disbursement, ensure your Aadhaar biometric e-KYC and Land Records are linked to your DBT bank account.`;
      chips = ["Next installment date?", "How to complete e-KYC?", "Check land linkage status"];
    }
  } else if (
    lower.includes("loan") ||
    lower.includes("kcc") ||
    lower.includes("credit") ||
    lower.includes("రుణం") ||
    lower.includes("లోన్") ||
    lower.includes("కెసిసి") ||
    lower.includes("వడ్డీ") ||
    lower.includes("ऋण") ||
    lower.includes("लोन") ||
    lower.includes("கடன்") ||
    lower.includes("ಸಾಲ") ||
    lower.includes("ঋণ")
  ) {
    const salutationTe = farmer.name ? `${farmer.name} గారు` : "రైతు మిత్రమా";
    const salutationHi = farmer.name ? `${farmer.name} जी` : "किसान साथी";
    const salutationEn = farmer.name ? `${farmer.name} Ji` : "Farmer Friend";
    const landStr = farmer.landSizeAcres ? `${farmer.landSizeAcres} ఎకరాల` : "మీ";
    const landStrHi = farmer.landSizeAcres ? `${farmer.landSizeAcres} एकड़` : "आपकी";

    if (lang === "te") {
      replyText = `${salutationTe}, ${landStr} పట్టా భూమి ఆధారంగా కిసాన్ క్రెడిట్ కార్డ్ (KCC) ద్వారా కేవలం 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం పొందవచ్చు. ఎకరాకు సుమారు రూ. 45,000 నుండి రూ. 60,000 వరకు పంట రుణం మంజూరవుతుంది. మీ పట్టాదారు పాస్ పుస్తకం మరియు ఆధార్ కార్డు సమర్పిస్తే మీ స్థానిక బ్యాంకులోనే ఇది సులభంగా పూర్తవుతుంది. దరఖాస్తు విధానం చెప్పమంటారా?`;
      chips = ["KCC వడ్డీ రేటు ఎంత?", "ఏ బ్యాంకులో దరఖాస్తు చేయాలి?", "కావలసిన పత్రాలు", "దరఖాస్తు ఫారం"];
    } else if (lang === "hi") {
      replyText = `${salutationHi}, ${landStrHi} कृषि भूमि के आधार पर आप किसान क्रेडिट कार्ड (KCC) द्वारा मात्र 4% रियायती ब्याज दर पर बैंक फसल ऋण प्राप्त कर सकते हैं। प्रति एकड़ ₹45,000 से ₹60,000 तक का ऋण स्वीकृत होता है। पट्टा पासबुक और आधार कार्ड देकर अपनी स्थानीय बैंक शाखा से तुरंत आवेदन कर सकते हैं। क्या आप आवेदन प्रक्रिया जानना चाहते हैं?`;
      chips = ["KCC ब्याज दर", "आवश्यक दस्तावेज़", "नजदीकी बैंक शाखा", "ऋण आवेदन"];
    } else {
      replyText = `${salutationEn}, with verified agricultural landholding, you can avail a Kisan Credit Card (KCC) crop loan at a concessional interest rate of just 4% (with 3% prompt repayment incentive). You are eligible for approximately ₹45,000 to ₹60,000 per acre. Submit your Patta Passbook / Land Deed and Aadhaar at your local bank to apply.`;
      chips = ["What documents are needed?", "Check KCC interest rate", "Eligible banks", "Apply now"];
    }
  } else if (
    lower.includes("fertilizer") ||
    lower.includes("soil") ||
    lower.includes("urea") ||
    lower.includes("dap") ||
    lower.includes("ఎరువు") ||
    lower.includes("యూరియా") ||
    lower.includes("డిఎపి") ||
    lower.includes("సాయిల్") ||
    lower.includes("నేల పరీక్ష") ||
    lower.includes("మట్టి") ||
    lower.includes("खाद") ||
    lower.includes("मिट्टी") ||
    lower.includes("உரம்") ||
    lower.includes("மண்") ||
    lower.includes("ಗೊಬ್ಬರ") ||
    lower.includes("ಸಾರಜನಕ") ||
    lower.includes("সার")
  ) {
    if (lang === "te") {
      replyText = `పంటలకు సమతుల్య ఎరువుల యాజమాన్యం చాలా ముఖ్యం. విత్తే సమయంలో ఎకరాకు సిఫార్సు చేసిన డీఏపీ మరియు పొటాష్‌ను బేసల్ డోస్‌గా వేసి, యూరియాను రెండు విడతల్లో పైపాటుగా అందించడం వల్ల అధిక దిగుబడి వస్తుంది. మీ వద్ద ఉన్న నేల పరీక్ష కార్డును (Soil Health Card) స్కాన్ చేస్తే ఖచ్చితమైన ఎరువుల మోతాదును సిఫార్సు చేస్తాను!`;
      chips = ["నేల పరీక్ష కార్డు స్కాన్ చేయి", "సేంద్రియ ఎరువుల సలహా", "వేపపిండి వాడకం", "ఎరువుల షాపు వివరాలు"];
    } else if (lang === "hi") {
      replyText = `फसलों के लिए संतुलित पोषण आवश्यक है। बुवाई के समय डीएपी और पोटाश आधार रूप में डालें तथा यूरिया को दो किस्तों में छिड़कें। यदि आप अपना मृदा स्वास्थ्य कार्ड (Soil Health Card) स्कैन करेंगे तो मैं आपकी मिट्टी के अनुसार सटीक वैज्ञानिक खुराक बता सकूंगा।`;
      chips = ["मृदा कार्ड स्कैन करें", "जैविक खाद सलाह", "उर्वरक की सही मात्रा"];
    } else {
      replyText = `Balanced fertilization is critical for high crop yields. Applying recommended basal doses of DAP and Potash, followed by split application of Urea ensures maximum nutrient absorption. Upload your Soil Health Card or field photo, and JanMithra will calculate the precise micronutrient recommendation for your soil!`;
      chips = ["Upload Soil Card for Scan", "Organic fertilizer guide", "Fertilizer dosage calculator"];
    }
  } else if (
    lower.includes("weather") ||
    lower.includes("rain") ||
    lower.includes("climate") ||
    lower.includes("వాతావరణం") ||
    lower.includes("వర్షం") ||
    lower.includes("ఎండ") ||
    lower.includes("मौसम") ||
    lower.includes("बारिश") ||
    lower.includes("வானிலை") ||
    lower.includes("மழை") ||
    lower.includes("ಹವಾಮಾನ") ||
    lower.includes("ಆಕಾಶ") ||
    lower.includes("আবহাওয়া")
  ) {
    const locStr = farmer.village || farmer.district || "మీ ప్రాంతంలో";
    const locStrHi = farmer.village || farmer.district || "आपके क्षेत्र में";
    const locStrEn = farmer.village || farmer.district || "your region";

    if (lang === "te") {
      replyText = `${locStr} రాబోయే రోజుల్లో వాతావరణ పరిస్థితుల దృష్ట్యా, చేనులో నీరు నిల్వ ఉండకుండా డ్రైనేజీ కాల్వలు శుభ్రం చేసుకోండి. వర్షం పడే సూచన ఉన్నప్పుడు ఎలాంటి రసాయన పురుగుమందులు పిచికారీ చేయవద్దని సలహా ఇస్తున్నాను.`;
      chips = ["రాబోయే 7 రోజుల వాతావరణం", "పంట రక్షణ చర్యలు", "పంట బీమా వివరాలు"];
    } else if (lang === "hi") {
      replyText = `${locStrHi} मौसम की संभावना को देखते हुए, कृपया खेत में जल निकासी की व्यवस्था सुनिश्चित करें ताकि जड़ों में पानी न भरे। वर्षा के दौरान कीटनाशक छिड़काव से बचें।`;
      chips = ["अगले 7 दिनों का मौसम", "फसल सुरक्षा टिप्स", "फसल बीमा स्थिति"];
    } else {
      replyText = `In ${locStrEn}, please ensure field drainage channels are clear to prevent waterlogging around crop root zones. Avoid spraying chemical pesticides immediately before or during rain to prevent chemical wash-off.`;
      chips = ["7-Day Weather Forecast", "Crop protection advice", "PMFBY Insurance coverage"];
    }
  } else {
    // JanMitra Dense Vector NLP & Semantic Search Engine:
    const semanticMatches = semanticSearchSchemes(text, farmer, 3);
    const topMatch = semanticMatches[0];

    if (topMatch && (topMatch.hybridScore >= 0.20 || topMatch.vectorCosine >= 0.16)) {
      const s = topMatch.scheme;
      const elig = topMatch.eligibility;
      const sla = elig.sla;

      if (lang === "te") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **పథకం సారాంశం (శాఖ: ${s.ministry}):**\n${s.description}\n\n💰 **ప్రయోజనాలు & సబ్సిడీ:**\n${s.benefits}\n\n📄 **కావలసిన పత్రాలు:**\n${s.documents_required || "ఆధార్ కార్డు, పట్టాదారు పాస్ పుస్తకం, బ్యాంక్ ఖాతా వివరాలు"}\n\n⚡ **పరిష్కార గడువు & అర్హత సూచిక:**\n• అంచనా గడువు: **${sla.formattedEta}**\n• అర్హత స్కోరు: **${elig.overallMatchScore}%** (${elig.factorBreakdown[3]?.score || "చిన్న రైతు ప్రాధాన్యత"})`;
        chips = ["ఈ పథకానికి దరఖాస్తు చేయండి", "కావలసిన పత్రాలు ఏమిటి?", "సమీప రైతు భరోసా కేంద్రం", "ఇతర వ్యవసాయ పథకాలు"];
      } else if (lang === "hi") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **योजना का विवरण (मंत्रालय: ${s.ministry}):**\n${s.description}\n\n💰 **वित्तीय लाभ एवं सब्सिडी:**\n${s.benefits}\n\n📄 **आवश्यक दस्तावेज़:**\n${s.documents_required || "आधार कार्ड, भूमि रिकॉर्ड (खसरा/खतौनी), बैंक खाता विवरण"}\n\n⚡ **निपटान समय एवं पात्रता:**\n• अनुमानित समय: **${sla.formattedEta}**\n• पात्रता मैच: **${elig.overallMatchScore}%** (${elig.factorBreakdown[3]?.score || "लघु कृषक प्राथमिकता"})`;
        chips = ["आवेदन प्रक्रिया बताएं", "आवश्यक दस्तावेज़ सूची", "नजदीकी सीएससी केंद्र", "अन्य किसान योजनाएं"];
      } else {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **Scheme Summary (Ministry: ${s.ministry}):**\n${s.description}\n\n💰 **Key Benefits & Subsidies:**\n${s.benefits}\n\n📄 **Required Documents:**\n${s.documents_required || "Aadhaar Card, Land Holding Documents (Pahani/Patta), Bank Account Details, Mobile Number"}\n\n⚡ **Turnaround ETA & Eligibility:**\n• Estimated Turnaround: **${sla.formattedEta}**\n• Multi-Factor Match: **${elig.overallMatchScore}%** (${elig.factorBreakdown[3]?.score || "Marginal Farmer Priority"})`;
        chips = ["How to Apply", "Required Documents Checklist", "Nearest Krishi Kendra", "Explore More Welfare Schemes"];
      }

      return { text: replyText, chips };
    }

    const greetingTe = farmer.name ? `${farmer.name} గారు` : "రైతు మిత్రమా";
    const greetingHi = farmer.name ? `${farmer.name} जी` : "किसान साथी";
    const greetingEn = farmer.name ? `${farmer.name} Ji` : "Farmer Friend";
    const farmContextTe = farmer.landSizeAcres ? `మీకున్న ${farmer.landSizeAcres} ఎకరాల భూమిని` : "మీ వ్యవసాయాన్ని";
    const farmContextHi = farmer.landSizeAcres ? `आपकी ${farmer.landSizeAcres} एकड़ भूमि को` : "आपकी खेती को";
    const farmContextEn = farmer.landSizeAcres ? `your ${farmer.landSizeAcres} Acres of farmland` : "your farm";

    if (lang === "te") {
      replyText = `నమస్కారం ${greetingTe}! మీ ప్రశ్నను శ్రద్ధగా గమనించాను. ${farmContextTe} దృష్టిలో ఉంచుకుని నేను సహాయం చేస్తాను. పంటల సాగు పద్ధతులు, పురుగుమందులు, ఎరువుల మోతాదు లేదా ప్రభుత్వం అందించే సబ్సిడీ పథకాలలో ఏ అంశంపై సలహా కావాలో అడగండి, సరైన పరిష్కారం అందిస్తాను!`;
      chips = ["సోలార్ పంపు 60% సబ్సిడీ", "PM-KISAN డబ్బుల వివరాలు", "పంట తెగులు సలహా", "అర్హత గల పథకాలు"];
    } else if (lang === "hi") {
      replyText = `नमस्ते ${greetingHi}! मैंने आपका प्रश्न समझ लिया है। ${farmContextHi} ध्यान में रखते हुए मैं आपकी सहायता करूँगा। खेती की तकनीक, खाद, कीट नियंत्रण या सरकारी सब्सिडी योजनाओं में से किस विषय पर जानकारी चाहिए?`;
      chips = ["सोलर पंप 60% सब्सिडी", "PM-KISAN ₹6,000 स्थिति", "कीट नियंत्रण सलाह", "अन्य किसान योजनाएं"];
    } else {
      replyText = `Namaste ${greetingEn}! I have noted your question carefully. Considering ${farmContextEn}, I am here to help with crop advisory, fertilizers, pest control, or government welfare subsidies. What specific information would you like to explore?`;
      chips = ["Solar Pump 60% Subsidy", "Check PM-KISAN ₹6,000", "Pest & Disease Advisory", "Explore Welfare Schemes"];
    }
  }

  return { text: replyText, chips };
}

/** Reply shown when an uploaded photo/file is not agriculture-related. */
export function buildOutOfScopeReply(lang: SupportedLanguage, reason?: string): EngineReply {
  const data = { reason };
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
    replyText = `⚠️ Out of Scope (Not Related to Agriculture or Schemes):\nThe uploaded photo/file does not appear to be related to agriculture, crops, or government welfare schemes (${data.reason || "Everyday indoor items"}).\n\nJanMithra AI is dedicated exclusively to agriculture, crop diagnostics, and farmer schemes.\n\nPlease provide:\n• A photo of a farm crop leaf, pest, or field for disease diagnosis.\n• An official agricultural/government document (Registered Sale Deed, Land Patta / Pahani / RoR, Soil Health Card, or Farmer ID).`;
    chips = ["Explore Agri Schemes", "Take Crop Leaf Photo", "Scan Land Record"];
  }
  return { text: replyText, chips };
}
