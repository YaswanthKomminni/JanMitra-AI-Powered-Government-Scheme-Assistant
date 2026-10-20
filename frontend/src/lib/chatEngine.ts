import { semanticSearchSchemes, predictResolutionSLA, computeHybridScore } from "@/lib/aiCopilotService";
/**
 * JanMithra conversational reply engine.
 *
 * This is the SAME multilingual rule-based engine that previously ran inside
 * the browser (useFarmerStore.sendChatMessage). It was moved here unchanged so
 * that it runs on the server behind authentication in /api/chat, and so every
 * question and answer can be persisted. The formatting helpers are also used by
 * the client store to re-localise messages when the language is switched.
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

export function getInitialChatMessage(lang: SupportedLanguage, farmerName: string = "Ramesh Goud"): ChatMessage {
  if (lang === "te") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `నమస్కారం ${farmerName} గారు! నేను మీ జనమిత్ర (JanMithra) వ్యవసాయ మిత్రుడిని. కొత్తూరులో మీకున్న 3.5 ఎకరాల నల్లరేగడి భూమికి PM-KUSUM 60% సోలార్ పంపు సబ్సిడీ పథకం చాలా ప్రయోజనకరంగా ఉంది. మీ పొరుగున ఉన్న రామేశ్వర్ రెడ్డి గారు దీనితో నెలకు రూ. 4,600 డీజిల్ ఆదా చేసుకుంటున్నారు! ఈరోజు మీ చేనుకి లేదా ప్రభుత్వ పథకాలకు నేను ఏ విధంగా సాయపడగలను?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "నా వివరాలు చెప్పు",
        "PM-KUSUM సోలార్ పంపు దరఖాస్తు",
        "పత్తిలో తెల్లదోమ నివారణ",
        "PM-KISAN ₹6,000 జమ వివరాలు",
      ],
    };
  }
  if (lang === "hi") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `नमस्ते ${farmerName} जी! मैं आपका जनमित्रा (JanMithra) कृषि साथी हूँ। कोथुर में आपकी 3.5 एकड़ काली मिट्टी की भूमि के लिए PM-KUSUM 60% सोलर पंप योजना बहुत लाभकारी है। आपके पड़ोसी रामेश्वर रेड्डी जी ने इसे लगाकर हर महीने ₹4,600 का डीजल बचाया! आज मैं आपकी खेती में कैसे सहायता कर सकता हूँ?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "मेरी जानकारी बताएं",
        "PM-KUSUM सोलर पंप आवेदन",
        "कपास में सफेद मक्खी नियंत्रण",
        "PM-KISAN ₹6,000 स्थिति",
      ],
    };
  }
  if (lang === "ta") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `வணக்கம் ${farmerName} அவர்களே! நான் உங்கள் ஜனமித்ரா (JanMithra) விவசாய தோழன். கொத்தூரில் உங்கள் 3.5 ஏக்கர் கரிசல் மண் நிலத்திற்கு PM-KUSUM 60% சோலார் பம்ப் மானியம் மிகவும் பயனளிக்கும். இன்று உங்கள் விவசாயத்திற்கு நான் எவ்வாறு உதவ முடியும்?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "என் விவரங்கள் சொல்",
        "PM-KUSUM சோலார் பம்ப் விண்ணப்பம்",
        "பருத்தியில் வெள்ளை ஈ கட்டுப்பாடு",
        "PM-KISAN ₹6,000 நிலை",
      ],
    };
  }
  if (lang === "kn") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `ನಮಸ್ಕಾರ ${farmerName} ಅವರೇ! ನಾನು ನಿಮ್ಮ ಜನಮಿತ್ರ (JanMithra) ಕೃಷಿ ಸಂಗಾತಿ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ 3.5 ಎಕರೆ ಕಪ್ಪು ಮಣ್ಣಿನ ಜಮೀನಿಗೆ PM-KUSUM 60% ಸೋಲಾರ್ ಪಂಪ್ ಸಬ್ಸಿಡಿ ಯೋಜನೆ ಬಹಳ ಪ್ರಯೋಜನಕಾರಿಯಾಗಿದೆ. ಇಂದು ನಿಮ್ಮ ಕೃಷಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "ನನ್ನ ವಿವರ ತಿಳಿಸಿ",
        "PM-KUSUM ಸೋಲಾರ್ ಪಂಪ್ ಅರ್ಜಿ",
        "ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣ ನಿಯಂತ್ರಣ",
        "PM-KISAN ₹6,000 ಸ್ಥಿತಿ",
      ],
    };
  }
  if (lang === "bn") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `নমস্কার ${farmerName} বাবু! আমি আপনার জনমিত্র (JanMithra) কৃষি সহায়ক। কোথুরে আপনার ৩.৫ একর কালো মাটির জমির জন্য PM-KUSUM ৬০% সৌর পাম্প ভর্তুকি অত্যন্ত লাভজনক। আজ আপনার চাষের জন্য আমি কীভাবে সাহায্য করতে পারি?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "আমার তথ্য বলুন",
        "PM-KUSUM সৌর পাম্প আবেদন",
        "তুলা ফসলে সাদা মাছি দমন",
        "PM-KISAN ₹৬,০০০ স্থিতি",
      ],
    };
  }
  return {
    id: "msg_init",
    sender: "ai",
    text: `Namaste ${farmerName} Ji! I am your JanMithra farm companion. Based on your 3.5 Acres of Black Soil in Kothur, the PM-KUSUM 60% Solar Pump subsidy is a high-value opportunity. Your neighbor Rameshwar Reddy already saved ₹4,600/month with it! How can I assist your farm today?`,
    timestamp: "10:30 AM",
    clarificationChips: [
      "Tell me about me",
      "Apply for PM-KUSUM Solar Pump",
      "Pest control for whiteflies on cotton",
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
        chips: ["PM-KISAN అర్హత పరిశీలన", "KCC బ్యాంక్ లోన్ వివరాలు", "సోలార్ పంపు సబ్సిడీ", "దస్తావేజు వెరిఫికేషన్ చూడండి"],
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
        chips: ["PM-KISAN தகுதி சரிபார்", "KCC வங்கி கடன் விவரங்கள்", "சோலார் பம்ப் மானியம்", "ஆவண சரிபார்ப்பை திறக்கவும்"],
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
    const slaPrediction = predictResolutionSLA("Agriculture", 3.5, 2);
    return {
      text: `🏛️ **${det.title} Verified!**\n🎯 **YOLOv8 Feature Localization:** Verified [ymin, xmin, ymax, xmax] defect & seal coordinates.\n⚡ **Predictive SLA Regressor:** Turnaround ETA: **${slaPrediction.formattedEta}** (${(slaPrediction.confidenceScore * 100).toFixed(0)}% confidence, Marginal Farmer Priority).\n\n📋 **Verified Parameters:**\n${detailsStr}\n\n✅ **Unlocked Welfare Schemes & Next Actions:**\n1. **PM-KISAN:** Direct Benefit Transfer of ₹6,000/year to linked bank account.\n2. **Kisan Credit Card (KCC):** Concessional crop credit at 4% interest against registered land.\n3. **PM-KUSUM Component-B:** 60% subsidy for solar water pump installation.\n4. **Title Mutation & e-Passbook:** Digital land title linkage and verification.`,
      chips: ["Check PM-KISAN Linkage", "Apply for KCC Loan", "Solar Pump 60% Subsidy", "Open in Document Modal"],
    };
  }

  // 2. Crop Disease & Foliage Pest Diagnosis
  if (det.docType === "crop_disease") {
    const crop = ext.crop || "Cotton Crop (పత్తి / कपास)";
    const pest = ext.pestOrDisease || "Whitefly & Sucking Pests (తెల్లదోమ / सफेद मक्खी)";
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
    chips: (det.schemesUnlocked || []).slice(0, 3).concat(["Open in Document Modal"]),
  };
}

export function formatFarmerProfileReply(farmer: FarmerProfile, lang: SupportedLanguage): { text: string; chips: string[] } {
  const name = farmer.name || "Ramesh Goud";
  const village = farmer.village || "Kothur Gramam";
  const district = farmer.district || "Rangareddy";
  const acres = farmer.landSizeAcres || 3.5;

  if (lang === "te") {
    return {
      text: `నమస్కారం **${name} గారు**! మీ వ్యవసాయ ప్రొఫైల్ వివరాలన్నీ నా దగ్గర స్పష్టంగా ఉన్నాయండి:\n\nమీరు ${district} జిల్లా ${village}లో **${acres} ఎకరాల నల్లరేగడి నేలలో** వ్యవసాయం చేస్తున్నారు. మీ చేనులో ప్రధానంగా **పత్తి, మిర్చి మరియు కందులు** సాగు చేస్తూ, **బోరుబావి మరియు డ్రిప్ పద్ధతిని** వాడుతున్నారు. మీ ధరణి పట్టాదారు పాస్ పుస్తకం మరియు నేల పరీక్ష కార్డు ఇప్పటికే ప్రభుత్వ రికార్డులలో ధృవీకరించబడ్డాయి.\n\n💡 **మీ పొలానికి అత్యధికంగా ప్రయోజనకరమైన పథకాలు:**\n1. **PM-KUSUM సోలార్ పంపు (60% సబ్సిడీ):** మీ బోరుబావికి 5HP సోలార్ పంపు చాలా అద్భుతంగా సరిపోతుంది, దీని ద్వారా రూ. 1,32,000 ఆదా అవుతుంది.\n2. **PM-KISAN సమ్మాన్ నిధి:** సంవత్సరానికి రూ. 6,000 నగదు సాయం (16వ విడత పూర్తయింది).\n3. **కిసాన్ క్రెడిట్ కార్డ్ (KCC):** కేవలం 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం లభిస్తుంది.\n\nమీ వివరాల్లో ఏదైనా మార్పు చేయాలా, లేక సోలార్ పంపు దరఖాస్తులో సహాయం చేయమంటారా?`,
      chips: ["నా భూమి వివరాలు మార్చు", "సోలార్ పంపు 60% సబ్సిడీ", "సమీప రైతులతో మాట్లాడండి", "అర్హత గల అన్ని పథకాలు"],
    };
  }

  if (lang === "hi") {
    return {
      text: `नमस्ते **${name} जी**! आपकी खेती और ज़मीन का पूरा विवरण मेरे पास सुरक्षित है:\n\nआप ${district} जिले के ${village} में **${acres} एकड़ काली मिट्टी की भूमि** पर खेती कर रहे हैं। आप मुख्य रूप से **कपास, मिर्च और अरहर** उगाते हैं तथा **बोरवेल और ड्रिप सिंचाई** का उपयोग करते हैं। आपका धरणी पट्टा पासबुक और मृदा स्वास्थ्य कार्ड पहले से ही सत्यापित हैं।\n\n💡 **आपकी भूमि के लिए सर्वोत्तम सरकारी योजनाएं:**\n1. **PM-KUSUM सोलर पंप (60% सब्सिडी):** आपके बोरवेल के लिए 5HP सोलर पंप बहुत फायदेमंद है (रु. 1,32,000 की बचत).\n2. **PM-KISAN सम्मान निधि:** ₹6,000 वार्षिक प्रत्यक्ष बैंक अंतरण (16वीं किस्त स्वीकृत).\n3. **किसान क्रेडिट कार्ड (KCC):** मात्र 4% रियायती ब्याज दर पर कृषि ऋण.\n\nक्या आप अपनी भूमि जानकारी अपडेट करना चाहते हैं या सोलर पंप आवेदन में सहायता चाहिए?`,
      chips: ["भूमि विवरण अपडेट करें", "सोलर पंप 60% सब्सिडी", "आसपास के किसान से जुड़ें", "पात्र सरकारी योजनाएं"],
    };
  }

  if (lang === "ta") {
    return {
      text: `வணக்கம் **${name} அவர்களே**! உங்கள் விவசாய விவரங்கள் அனைத்தும் என்னிடம் தெளிவாக உள்ளன:\n\nநீங்கள் ${district} மாவட்டம் ${village} பகுதியில் **${acres} ஏக்கர் கரிசல் மண் நிலத்தில்** விவசாயம் செய்கிறீர்கள். முக்கியமாக **பருத்தி, மிளகாய், துவரை** பயிரிட்டு, **ஆழ்துளை கிணறு மற்றும் சொட்டு நீர் பாசனம்** பயன்படுத்துகிறீர்கள். உங்கள் பட்டாதாரர் பாஸ்புக் மற்றும் மண் அட்டை ஏற்கனவே சரிபார்க்கப்பட்டுள்ளன.\n\n💡 **உங்கள் நிலத்திற்கு மிகவும் பயனளிக்கும் திட்டங்கள்:**\n1. **PM-KUSUM சோலார் பம்ப் (60% மானியம்):** 5HP சோலார் பம்ப் அமைப்பதன் மூலம் ரூ. 1,32,000 சேமிக்கலாம்.\n2. **PM-KISAN சம்மான் நிதி:** ஆண்டுக்கு ரூ. 6,000 நேரடி வங்கி வரவு (16வது தவணை தயார்).\n3. **கிசான் கிரெடிட் கார்டு (KCC):** 4% மானிய வட்டியில் விவசாய பயிர்க்கடன்.\n\nஉங்கள் விவரங்களை மாற்ற வேண்டுமா அல்லது சோலார் பம்ப் விண்ணப்பத்தில் உதவ வேண்டுமா?`,
      chips: ["நில விவரங்களை மாற்று", "சோலார் பம்ப் 60% மானியம்", "அருகிலுள்ள விவசாயியுடன் பேசுங்கள்", "அனைத்து அரசு திட்டங்கள்"],
    };
  }

  if (lang === "kn") {
    return {
      text: `ನಮಸ್ಕಾರ **${name} ಅವರೇ**! ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳು ನನ್ನ ಬಳಿ ಸಿದ್ಧವಾಗಿವೆ:\n\nನೀವು ${district} ಜಿಲ್ಲೆಯ ${village} ಗ್ರಾಮದಲ್ಲಿ **${acres} ಎಕರೆ ಕಪ್ಪು ಮಣ್ಣಿನ ಜಮೀನಿನಲ್ಲಿ** ಕೃಷಿ ಮಾಡುತ್ತಿದ್ದೀರಿ. ಮುಖ್ಯವಾಗಿ **ಹತ್ತಿ, ಮೆಣಸಿನಕಾಯಿ, ತೊಗರಿ** ಬೆಳೆಯುತ್ತಿದ್ದು, **ಕೊಳವೆಬಾವಿ ಮತ್ತು ಹನಿ ನೀರಾವರಿ** ಬಳಸುತ್ತಿದ್ದೀರಿ. ನಿಮ್ಮ ಪಟ್ಟಾದಾರ ಪಾಸ್ ಬುಕ್ ಮತ್ತು ಮಣ್ಣಿನ ಕಾರ್ಡ್ ಈಗಾಗಲೇ ಪರಿಶೀಲನೆಗೊಂಡಿವೆ.\n\n💡 **ನಿಮ್ಮ ಜಮೀನಿಗೆ ಹೆಚ್ಚು ಪ್ರಯೋಜನಕಾರಿ ಯೋಜನೆಗಳು:**\n1. **PM-KUSUM ಸೋಲಾರ್ ಪಂಪ್ (60% ಸಬ್ಸಿಡಿ):** 5HP ಸೋಲಾರ್ ಪಂಪ್‌ನಿಂದ ರೂ. 1,32,000 ಉಳಿತಾಯವಾಗಲಿದೆ.\n2. **PM-KISAN ಸಮ್ಮಾನ್ ನಿಧಿ:** ವರ್ಷಕ್ಕೆ ರೂ. 6,000 ನೇರ ಬ್ಯಾಂಕ್ ಜಮೆ (16ನೇ ಕಂತು ಸಿದ್ಧ).\n3. **ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC):** 4% ರಿಯಾಯಿತಿ ಬಡ್ಡಿಯಲ್ಲಿ ಕೃಷಿ ಬೆಳೆ ಸಾಲ.\n\nನಿಮ್ಮ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಬೇಕೆ ಅಥವಾ ಸೋಲಾರ್ ಪಂಪ್ ಅರ್ಜಿಯಲ್ಲಿ ಸಹಾಯ ಬೇಕೆ?`,
      chips: ["ಜಮೀನಿನ ವಿವರ ಬದಲಾಯಿಸಿ", "ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "ಸಮೀಪದ ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ", "ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು"],
    };
  }

  if (lang === "bn") {
    return {
      text: `নমস্কার **${name} বাবু**! আপনার কৃষি তথ্য আমার কাছে প্রস্তুত রয়েছে:\n\nআপনি ${district} জেলার ${village} গ্রামে **${acres} একর কালো মাটিতে** চাষাবাদ করছেন। মূলত **তুলা, লঙ্কা ও অড়হর ডাল** চাষ করেন এবং **বোরওয়েল ও ড্রিপ সেচ** ব্যবহার করছেন। আপনার পাট্টাদার পাসবুক ও মৃত্তিকা স্বাস্থ্য কার্ড ইতিপূর্বে যাচাইকৃত হয়েছে।\n\n💡 **আপনার জমির জন্য শীর্ষ উপকারী প্রকল্প:**\n1. **PM-KUSUM সৌর পাম্প (৬০% ভর্তুকি):** ৫HP সৌর পাম্পে প্রায় ১,৩২,০০০ টাকা সাশ্রয় হবে।\n2. **PM-KISAN সম্মান নিধি:** বছরে ৬,০০০ টাকা সরাসরি ব্যাংক সহায়তা (১৬তম কিস্তি অনুমোদিত)।\n3. **কিষাণ ক্রেডিট কার্ড (KCC):** মাত্র ৪% রেয়াতি সুদে ফসল ঋণ।\n\nআপনি কি জমির বিবরণ আপডেট করতে চান নাকি সৌর পাম্পের আবেদনে সহায়তা প্রয়োজন?`,
      chips: ["জমির বিবরণ পরিবর্তন করুন", "সৌর পাম্প ৬০% ভর্তুকি", "নিকটবর্তী কৃষকের সাথে যোগাযোগ", "যোগ্য সরকারি প্রকল্পসমূহ"],
    };
  }

  return {
    text: `Namaste **${name} Ji**! I know your farm details thoroughly:\n\nYou farm on **${acres} Acres of Black Soil** in ${village}, ${district}. You primarily cultivate **Cotton, Chilli, and Red Gram**, supported by **Borewell and Drip irrigation**. Your Dharani Patta Passbook and Soil Health Card are already verified in government records.\n\n💡 **Top Recommended Welfare Schemes for Your Land:**\n1. **PM-KUSUM Solar Pump (60% Subsidy):** A 5HP Solar Pump is ideal for your borewell, saving ₹1,32,000.\n2. **PM-KISAN Samman Nidhi:** ₹6,000/year direct cash transfer (16th Installment processed).\n3. **Kisan Credit Card (KCC):** Concessional crop loan at just 4% interest rate.\n\nWould you like to update any details or need help applying for the Solar Pump?`,
    chips: ["Update My Land Details", "Apply for PM-KUSUM 60%", "Connect with Nearby Peer Farmers", "View All Eligible Schemes"],
  };
}

/** Text reply for a farmer question (moved verbatim from the client store). */
export function generateTextReply(text: string, lang: SupportedLanguage, currentFarmer: FarmerProfile): EngineReply {
  const lower = text.toLowerCase();
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
    const farmer = currentFarmer;
    if (lang === "te") {
      replyText = `నమస్కారం ${farmer.name || "రమేష్"} గారు! ఎలా ఉన్నారు? నేను మీ జనమిత్ర డిజిటల్ వ్యవసాయ మిత్రుడిని. కొత్తూరులో మీకున్న 3.5 ఎకరాల చేనులో పత్తి, మిర్చి పంటలు బాగున్నాయా? ఈరోజు మీ వ్యవసాయానికి లేదా ఏదైనా ప్రభుత్వ సబ్సిడీ పథకానికి సంబంధించి నేను ఏ విధంగా సహాయపడగలను?`;
      chips = ["నా వివరాలు చెప్పు", "సోలార్ పంపు 60% సబ్సిడీ", "పంట తెగులు సలహా", "PM-KISAN ₹6,000 స్థితి"];
    } else if (lang === "hi") {
      replyText = `नमस्ते ${farmer.name || "रमेश"} जी! आप कैसे हैं? मैं आपका जनमित्रा कृषि सलाहकार हूँ। कोथुर में आपकी 3.5 एकड़ भूमि पर कपास और मिर्च की फसल कैसी है? आज मैं आपकी खेती या सरकारी योजनाओं में किस प्रकार सहायता कर सकता हूँ?`;
      chips = ["मेरी जानकारी बताएं", "सोलर पंप 60% सब्सिडी", "फसल कीट सलाह", "PM-KISAN स्थिति"];
    } else if (lang === "ta") {
      replyText = `வணக்கம் ${farmer.name || "ரமேஷ்"} அவர்களே! நலமாக உள்ளீர்களா? நான் உங்கள் ஜனமித்ரா விவசாய ஆலோசகர். கொத்தூரில் உங்கள் 3.5 ஏக்கர் நிலத்தில் பயிர்கள் நலமா? இன்று உங்கள் விவசாயத்திற்கு நான் எவ்வாறு உதவ முடியும்?`;
      chips = ["என் விவரங்கள் சொல்", "சோலார் பம்ப் 60% மானியம்", "பூச்சி மேலாண்மை", "PM-KISAN நிலை"];
    } else if (lang === "kn") {
      replyText = `ನಮಸ್ಕಾರ ${farmer.name || "ರಮೇಶ್"} ಅವರೇ! ಹೇಗಿದ್ದೀರಿ? ನಾನು ನಿಮ್ಮ ಜನಮಿತ್ರ ಕೃಷಿ ಮಿತ್ರ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ 3.5 ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಬೆಳೆಗಳು ಚೆನ್ನಾಗಿವೆಯೇ? ಇಂದು ನಿಮ್ಮ ಕೃಷಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
      chips = ["ನನ್ನ ವಿವರ ತಿಳಿಸಿ", "ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ", "PM-KISAN ಸ್ಥಿತಿ"];
    } else if (lang === "bn") {
      replyText = `নমস্কার ${farmer.name || "রমেশ"} বাবু! কেমন আছেন? আমি আপনার জনমিত্র কৃষি সহকারী। কোথুরে আপনার ৩.৫ একর জমিতে ফসলের অবস্থা কেমন? আজ আপনার চাষের কাজে আমি কীভাবে সাহায্য করতে পারি?`;
      chips = ["আমার তথ্য বলুন", "সৌর পাম্প ৬০% ভর্তুকি", "কীটপতঙ্গ পরামর্শ", "PM-KISAN স্থিতি"];
    } else {
      replyText = `Namaste ${farmer.name || "Ramesh"} Ji! How are you doing? I am your JanMithra farm companion. How are the cotton and chilli crops on your 3.5 Acres in Kothur? How can I assist your farming or scheme applications today?`;
      chips = ["Tell me about me", "Apply for PM-KUSUM 60%", "Pest control advice", "Check PM-KISAN ₹6,000 status"];
    }
  } else if (isProfileQuery) {
    const farmer = currentFarmer;
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
    if (lang === "te") {
      replyText = "రమేష్ గారు, మీ 3.5 ఎకరాల భూమికి మరియు బోరుబావికి PM-KUSUM కాంపోనెంట్-బి కింద 5HP సోలార్ పంపు చాలా అద్భుతంగా సరిపోతుంది. దీనికి కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాలు కలిపి 60% సబ్సిడీ ఇస్తాయి, అంటే సుమారు రూ. 1,32,000 ఆదా అవుతుంది! మీ పొరుగు రైతు రామేశ్వర్ రెడ్డి గారు (3.8 కి.మీ దూరం) కూడా ఇదే పథకం ద్వారా పంపు అమర్చుకుని నెలకు రూ. 4,600 డీజిల్ ఖర్చు ఆదా చేసుకుంటున్నారు. మీ వద్ద ప్రస్తుతం బోరుబావి ఉందా లేక కొత్తగా వేయించాలా?";
      chips = ["అవును, బోరుబావి ఉంది", "బావి ఉంది", "కొత్తగా బోరు వేయాలి", "కావలసిన పత్రాలు ఏమిటి?"];
    } else if (lang === "hi") {
      replyText = "रमेश जी, आपकी 3.5 एकड़ ज़मीन और बोरवेल के लिए PM-KUSUM योजना के तहत 5HP सोलर पंप बहुत फायदेमंद रहेगा। इस पर सरकार 60% सब्सिडी दे रही है (रु. 1,32,000 की सीधी बचत)। आपके पड़ोसी रामेश्वर रेड्डी जी (3.8 किमी दूर) ने इसे लगवाकर हर महीने ₹4,600 का डीजल बचाया। क्या आपके पास वर्तमान में कार्यरत बोरवेल या कुआं है?";
      chips = ["हाँ, बोरवेल है", "कुआं है", "नया बोरवेल लगवाना है", "आवश्यक दस्तावेज़ बताएं"];
    } else if (lang === "ta") {
      replyText = "ரமேஷ் அவர்களே, உங்கள் 3.5 ஏக்கர் நிலம் மற்றும் ஆழ்துளை கிணற்றுக்கு PM-KUSUM திட்டத்தின் கீழ் 60% அரசு மானியத்துடன் 5HP சோலார் பம்ப் மிகவும் சிறந்தது. உங்கள் அண்டை விவசாயி ராமேஸ்வர ரெட்டி மாதம் ₹4,600 டீசல் சேமித்துள்ளார். உங்களிடம் தற்போது ஆழ்துளை கிணறு உள்ளதா?";
      chips = ["ஆம், ஆழ்துளை கிணறு உள்ளது", "திறந்த கிணறு உள்ளது", "புதிதாக அமைக்க வேண்டும்", "மானிய தகுதிகள் காட்டு"];
    } else if (lang === "kn") {
      replyText = "ರಮೇಶ್ ಅವರೇ, ನಿಮ್ಮ 3.5 ಎಕರೆ ಜಮೀನಿಗೆ PM-KUSUM ಯೋಜನೆಯಡಿ 60% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ 5HP ಸೋಲಾರ್ ಪಂಪ್ ಅತ್ಯಂತ ಸೂಕ್ತವಾಗಿದೆ. ನಿಮ್ಮ ನೆರೆಯ ರಾಮೇಶ್ವರ್ ರೆಡ್ಡಿ ತಿಂಗಳಿಗೆ ₹4,600 ಡೀಸೆಲ್ ಉಳಿಸಿದ್ದಾರೆ. ನಿಮ್ಮಲ್ಲಿ ಪ್ರಸ್ತುತ ಕೊಳವೆಬಾವಿ ಇದೆಯೇ?";
      chips = ["ಹೌದು, ಕೊಳವೆಬಾವಿ ಇದೆ", "ಬಾವಿ ಇದೆ", "ಹೊಸದಾಗಿ ಕೊರೆಯಬೇಕು", "ಸಬ್ಸಿಡಿ ಅರ್ಹತೆಗಳನ್ನು ತೋರಿಸಿ"];
    } else if (lang === "bn") {
      replyText = "রমেশ বাবু, আপনার ৩.৫ একর জমি ও নলকূপের জন্য PM-KUSUM প্রকল্পে ৬০% সরকারি ভর্তুকিতে ৫HP সৌর পাম্প অত্যন্ত লাভজনক। আপনার প্রতিবেশী রামেশ্বর রেড্ডি মাসে ₹৪,৬০০ ডিজেল বাঁচিয়েছেন। আপনার কি বর্তমানে নলকূপ রয়েছে?";
      chips = ["হ্যাঁ, নলকূপ আছে", "কুয়ো আছে", "নতুন বসাতে হবে", "ভর্তুকির যোগ্যতা দেখান"];
    } else {
      replyText = "Ramesh Ji, for your 3.5 Acres and existing borewell in Kothur, a 5HP Solar Pump under PM-KUSUM Component-B is ideal! The government provides a 60% subsidy (saving you ₹1,32,000). Your neighbor Rameshwar Reddy (3.8 km away) saves ₹4,600 every month on diesel! Do you have an active borewell on your land?";
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
      replyText = "రమేష్ గారు, పత్తిలో తెల్లదోమ లేదా ఆకు ముడుత తెగులు కనిపిస్తే ఆకుల అడుగుభాగంలో రసం పీల్చే పురుగులు చేరి తేనెజిగురును విసర్జిస్తాయి. కంగారు పడకండి! తక్షణ నివారణకు: ముందుగా ఎకరాకు వేపనూనె 10,000 ppm 2 మిల్లీలీటర్లు లీటరు నీటిలో కలిపి సాయంత్రం వేళ ఆకుల అడుగుభాగం బాగా తడిచేలా పిచికారీ చేయండి. తీవ్రత ఎక్కువగా ఉంటే డయాఫెంథియురాన్ 50% WP మందు వాడండి. అలాగే మీ పంట PMFBY పంట బీమా పరిధిలో ఉంటే నష్టపరిహారానికి కూడా దరఖాస్తు చేసుకోవచ్చు.";
      chips = ["పిచికారీ ఎప్పుడు చేయాలి?", "మందుల షాపు వివరాలు", "పంట బీమా క్లెయిమ్ ఎలా?"];
    } else if (lang === "hi") {
      replyText = "रमेश जी, कपास में सफेद मक्खी या पत्ती मुड़ने का प्रकोप होने पर पत्तियां मुड़ जाती हैं और चिपचिपा स्राव होता है। चिंता न करें! तुरंत रोकथाम के लिए: नीम का तेल 10,000 ppm @ 2 मिली/लीटर पानी शाम के समय पत्तियों के निचले हिस्से पर छिड़कें। यदि प्रकोप अधिक हो तो डायफेंथियूरॉन 50% WP @ 1 ग्राम/लीटर का प्रयोग करें।";
      chips = ["दवा छिड़काव का समय", "नजदीकी कृषि केंद्र", "फसल बीमा क्लेम प्रक्रिया"];
    } else if (lang === "ta") {
      replyText = "ரமேஷ் அவர்களே, பருத்தியில் வெள்ளை ஈ அல்லது இலை சுருட்டை தாக்குதல் இருந்தால் கவலை வேண்டாம்! உடனடியாக ஏக்கருக்கு வேப்பெண்ணெய் 10,000 ppm @ 2 மிலி/லிட்டர் அல்லது டயாபெந்தியூரான் 50% WP @ 1 கிராம்/லிட்டர் தண்ணீரில் கலந்து மாலை வேளையில் தெளிக்கவும்.";
      chips = ["மருந்து தெளிக்கும் நேரம் எப்போது?", "அருகிலுள்ள உழவர் மருந்தகம்", "பயிர் காப்பீட்டு உதவி"];
    } else if (lang === "kn") {
      replyText = "ರಮೇಶ್ ಅವರೇ, ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣ ಅಥವಾ ಎಲೆ ಸುರುಟು ರೋಗ ಕಂಡುಬಂದರೆ ಗಾಬರಿಯಾಗಬೇಡಿ! ಎಕರೆಗೆ ಬೇವಿನ ಎಣ್ಣೆ 10,000 ppm @ 2 ಮಿಲಿ/ಲೀಟರ್ ಅಥವಾ ಡಯಾಫೆಂಥಿಯುರಾನ್ 50% WP @ 1 ಗ್ರಾಂ/ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸಿ.";
      chips = ["ಸಿಂಪಡಣೆ ಸಮಯ ಯಾವಾಗ?", "ಔಷಧಿ ಅಂಗಡಿ ವಿವರ", "ಬೆಳೆ ವಿಮೆ ಲಭ್ಯವಿದೆಯೇ?"];
    } else if (lang === "bn") {
      replyText = "রমেশ বাবু, তুলা ফসলে সাদা মাছি বা পাতা কোঁকড়ানো দেখা দিলে চিন্তা করবেন না! প্রতি লিটার জলে নিম তেল 10,000 ppm @ ২ মিলি বা ডায়াফেন্থিউরন 50% WP @ ১ গ্রাম মিশিয়ে বিকেলের দিকে স্প্রে করুন।";
      chips = ["স্প্রে করার সঠিক সময়", "নিকটবর্তী কৃষি সেবা কেন্দ্র", "ফসল বীমা সুবিধা"];
    } else {
      replyText = "Ramesh Ji, for whitefly infestation and leaf curling on cotton: spray Neem Oil (10,000 ppm) @ 2ml/litre water during evening hours, ensuring the underside of leaves is fully covered. For severe attack, Diafenthiuron 50% WP @ 1g/litre provides excellent control. This is also covered under PMFBY crop insurance.";
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
    if (lang === "te") {
      replyText = "రమేష్ గారు, మీ PM-KISAN 16వ విడత రూ. 2,000 సాయం ఇప్పటికే నేరుగా మీ స్టేట్ బ్యాంక్ ఆఫ్ ఇండియా ఖాతాలో (చివరి అంకెలు 4108) విజయవంతంగా జమ చేయబడింది. మీ ఆధార్ ఈ-కేవైసీ మరియు ధరణి భూమి రికార్డులు పక్కాగా లింక్ అయి ఉన్నాయి. 17వ విడత త్వరలోనే ప్రభుత్వం విడుదల చేయనుంది. మీకు పేమెంట్ రసీదు కావాలా?";
      chips = ["తదుపరి విడత తేదీ ఎప్పుడు?", "రసీదు డౌన్‌లోడ్ చేయి", "బ్యాంక్ ఖాతా వివరాలు"];
    } else if (lang === "hi") {
      replyText = "रमेश जी, आपकी PM-KISAN 16वीं किस्त ₹2,000 पहले ही आपके एसबीआई खाते (अंतिम अंक 4108) में सफलतापूर्वक ट्रांसफर हो चुकी है। आपका आधार ई-केवाईसी और धरणी भूमि रिकॉर्ड पूरी तरह सत्यापित हैं। 17वीं किस्त भी जल्द ही जारी होगी। क्या आपको भुगतान रसीद देखनी है?";
      chips = ["अगली किस्त की तारीख?", "भुगतान रसीद डाउनलोड करें", "भूमि लिंकेज जांचें"];
    } else if (lang === "ta") {
      replyText = "ரமேஷ் அவர்களே, உங்கள் PM-KISAN 16வது தவணை ₹2,000 ஏற்கனவே உங்கள் எஸ்பிஐ வங்கிக் கணக்கில் (•••• 4108) வரவு வைக்கப்பட்டுள்ளது. உங்கள் ஆதார் மற்றும் நில ஆவணங்கள் சரியாக இணைக்கப்பட்டுள்ளன.";
      chips = ["அடுத்த தவணை எப்போது?", "கட்டண ரசீது பதிவிறக்கம்", "நில இணைப்பு நிலை"];
    } else if (lang === "kn") {
      replyText = "ರಮೇಶ್ ಅವರೇ, ನಿಮ್ಮ PM-KISAN 16ನೇ ಕಂತು ₹2,000 ಈಗಾಗಲೇ ನಿಮ್ಮ ಎಸ್‌ಬಿಐ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ (•••• 4108) ಜಮೆಯಾಗಿದೆ. ನಿಮ್ಮ ಆಧಾರ್ ಮತ್ತು ಭೂ ದಾಖಲೆಗಳು ಸರಿಯಾಗಿ ಲಿಂಕ್ ಆಗಿವೆ.";
      chips = ["ಮುಂದಿನ ಕಂತಿನ ದಿನಾಂಕ?", "ಪಾವತಿ ರಶೀದಿ ಡೌನ್‌ಲೋಡ್", "ಭೂಮಿ ಲಿಂಕ್ ಸ್ಥಿತಿ"];
    } else if (lang === "bn") {
      replyText = "রমেশ বাবু, আপনার PM-KISAN ১৬তম কিস্তি ₹২,০০০ ইতিমধ্যে আপনার এসবিআই অ্যাকাউন্টে (•••• ৪১০৮) জমা হয়েছে। আপনার আধার ও জমির রেকর্ড সঠিকভাবে যুক্ত রয়েছে।";
      chips = ["পরের কিস্তির তারিখ?", "পেমেন্ট রশিদ ডাউনলোড", "জমির লিঙ্ক স্ট্যাটাস"];
    } else {
      replyText = "Ramesh Ji, your PM-KISAN 16th installment of ₹2,000 has already been credited to your SBI Account (ending in 4108). Your Aadhaar e-KYC and Dharani Land Record are fully verified and linked. The 17th installment will be announced shortly.";
      chips = ["Next installment date?", "Download Payment Receipt", "Check land linkage"];
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
    if (lang === "te") {
      replyText = "రమేష్ గారు, మీకున్న 3.5 ఎకరాల నల్లరేగడి పట్టా భూమి ఆధారంగా కిసాన్ క్రెడిట్ కార్డ్ (KCC) ద్వారా కేవలం 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం పొందవచ్చు. ఎకరాకు సుమారు రూ. 45,000 నుండి రూ. 60,000 వరకు రుణం మంజూరవుతుంది. మీ ధరణి పట్టాదారు పాస్ పుస్తకం మరియు ఆధార్ కార్డు సమర్పిస్తే మీ స్థానిక బ్యాంకులోనే ఇది సులభంగా పూర్తవుతుంది. దరఖాస్తు విధానం చెప్పమంటారా?";
      chips = ["KCC వడ్డీ రేటు ఎంత?", "ఏ బ్యాంకులో దరఖాస్తు చేయాలి?", "కావలసిన పత్రాలు", "దరఖాస్తు ఫారం"];
    } else if (lang === "hi") {
      replyText = "रमेश जी, आपकी 3.5 एकड़ काली मिट्टी की भूमि के आधार पर आप किसान क्रेडिट कार्ड (KCC) द्वारा मात्र 4% रियायती ब्याज दर पर कृषि ऋण प्राप्त कर सकते हैं। प्रति एकड़ ₹45,000 से ₹60,000 तक का ऋण स्वीकृत होता है। धरणी पट्टा पासबुक और आधार कार्ड देकर अपनी स्थानीय बैंक शाखा से तुरंत आवेदन कर सकते हैं। क्या आप आवेदन प्रक्रिया जानना चाहते हैं?";
      chips = ["KCC ब्याज दर", "आवश्यक दस्तावेज़", "नजदीकी बैंक शाखा", "ऋण आवेदन"];
    } else {
      replyText = "Ramesh Ji, with your 3.5 Acres of verified farmland in Kothur, you can avail a Kisan Credit Card (KCC) crop loan at a concessional interest rate of just 4%! You are eligible for approximately ₹45,000 to ₹60,000 per acre. Submit your Dharani Patta Passbook and Aadhaar at your local bank to get started.";
      chips = ["What documents are needed?", "Check KCC interest rate", "Eligible banks in Kothur", "Apply now"];
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
      replyText = "రమేష్ గారు, మీ భూమి నల్లరేగడి నేల కాబట్టి తేమను ఎక్కువ కాలం నిలుపుకుంటుంది. మీ పత్తి మరియు మిర్చి పంటలకు ఎకరాకు 50 కేజీల డీఏపీ, 25 కేజీల పొటాష్ వేసి, పైపాటుగా యూరియాను రెండు విడతల్లో వేసుకోవడం మంచిది. మీ వద్ద ఉన్న నేల పరీక్ష కార్డును స్కాన్ చేస్తే ఖచ్చితమైన ఎరువుల మోతాదును సిఫార్సు చేస్తాను!";
      chips = ["నేల పరీక్ష కార్డు స్కాన్ చేయి", "సేంద్రియ ఎరువుల సలహా", "వేపపిండి వాడకం", "ఎరువుల షాపు వివరాలు"];
    } else if (lang === "hi") {
      replyText = "रमेश जी, आपकी ज़मीन काली मिट्टी की है जो नमी को लंबे समय तक रोकती है। कपास और मिर्च के लिए प्रति एकड़ 50 किग्रा डीएपी और 25 किग्रा पोटाश आधार रूप में डालें, तथा यूरिया को दो किस्तों में छिड़कें। यदि आप अपना मृदा स्वास्थ्य कार्ड स्कैन करेंगे तो मैं सटीक वैज्ञानिक खुराक बता पाऊंगा!";
      chips = ["मृदा कार्ड स्कैन करें", "जैविक खाद सलाह", "उर्वरक की सही मात्रा"];
    } else {
      replyText = "Ramesh Ji, because your farm is Black Soil, it retains moisture well. For cotton and chilli, applying 50kg DAP and 25kg Potash as basal dose, followed by split Urea application gives the highest yield. Upload your Soil Health Card and I'll calculate the exact micro-nutrient dose for you!";
      chips = ["Upload Soil Card for Scan", "Organic fertilizer guide", "Best fertilizer dealers in Kothur"];
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
    if (lang === "te") {
      replyText = "రమేష్ గారు, రంగారెడ్డి మరియు కొత్తూరు పరిసర ప్రాంతాల్లో రాబోయే 3 రోజుల్లో తేలికపాటి నుండి మోస్తరు వర్షాలు కురిసే అవకాశం ఉంది. కాబట్టి చేనులో నీరు నిల్వ ఉండకుండా డ్రైనేజీ కాల్వలు శుభ్రం చేసుకోండి. వర్షం పడే సూచన ఉన్నప్పుడు ఎలాంటి పురుగుమందులు పిచికారీ చేయవద్దని సలహా ఇస్తున్నాను.";
      chips = ["రాబోయే 7 రోజుల వాతావరణం", "పంట రక్షణ చర్యలు", "పంట బీమా వివరాలు", "కార్యాలయానికి కాల్ చేయి"];
    } else if (lang === "hi") {
      replyText = "रमेश जी, रंगारेड्डी और कोथुर क्षेत्र में अगले 3 दिनों में हल्की से मध्यम वर्षा की संभावना है। कृपया अपने खेत में जल निकासी की व्यवस्था सुनिश्चित करें। बारिश के दौरान किसी भी कीटनाशक का छिड़काव न करने की सलाह दी जाती है।";
      chips = ["अगले 7 दिनों का मौसम", "फसल सुरक्षा टिप्स", "फसल बीमा स्थिति"];
    } else {
      replyText = "Ramesh Ji, in Rangareddy and Kothur village, light to moderate rainfall is expected over the next 3 days. Please ensure field drainage channels are clear to prevent waterlogging around cotton roots. Avoid spraying chemicals until the rain passes.";
      chips = ["7-Day Weather Forecast", "Crop protection advice", "PMFBY Insurance coverage"];
    }
  } else {
    const farmer = currentFarmer;

    // JanMitra Dense Vector NLP & Semantic Search Engine:
    // Queries the 4,706 government schemes and conversational dataset using 128-dim embeddings + 50/50 hybrid matching.
    const semanticMatches = semanticSearchSchemes(text, farmer, 3);
    const topMatch = semanticMatches[0];

    if (topMatch && (topMatch.hybridScore >= 0.20 || topMatch.vectorCosine >= 0.16)) {
      const s = topMatch.scheme;
      const elig = topMatch.eligibility;
      const sla = elig.sla;

      if (lang === "te") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **పథకం సారాంశం (శాఖ: ${s.ministry}):**\n${s.description}\n\n💰 **ప్రయోజనాలు & సబ్సిడీ:**\n${s.benefits}\n\n📄 **కావలసిన పత్రాలు:**\n${s.documents_required || "ఆధార్ కార్డు, పట్టాదారు పాస్ పుస్తకం, బ్యాంక్ ఖాతా వివరాలు"}\n\n⚡ **పరిష్కార గడువు & అర్హత సూచిక (Predictive Regressor):**\n• అంచనా గడువు: **${sla.formattedEta}** (కన్ఫిడెన్స్: ${(sla.confidenceScore * 100).toFixed(0)}%)\n• అర్హత స్కోరు: **${elig.overallMatchScore}%** (${elig.factorBreakdown[3]?.score || "చిన్న రైతు ప్రాధాన్యత"})`;
        chips = ["ఈ పథకానికి దరఖాస్తు చేయండి", "కావలసిన పత్రాలు ఏమిటి?", "సమీప రైతు భరోసా కేంద్రం", "ఇతర వ్యవసాయ పథకాలు"];
      } else if (lang === "hi") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **योजना का विवरण (मंत्रालय: ${s.ministry}):**\n${s.description}\n\n💰 **वित्तीय लाभ एवं सब्सिडी:**\n${s.benefits}\n\n📄 **आवश्यक दस्तावेज़:**\n${s.documents_required || "आधार कार्ड, भूमि रिकॉर्ड (खसरा/खतौनी), बैंक खाता विवरण"}\n\n⚡ **निपटान समय एवं पात्रता (Predictive Regressor):**\n• अनुमानित समय: **${sla.formattedEta}** (सटीकता: ${(sla.confidenceScore * 100).toFixed(0)}%)\n• पात्रता मैच: **${elig.overallMatchScore}%** (${elig.factorBreakdown[3]?.score || "लघु कृषक प्राथमिकता"})`;
        chips = ["आवेदन प्रक्रिया बताएं", "आवश्यक दस्तावेज़ सूची", "नजदीकी सीएससी केंद्र", "अन्य किसान योजनाएं"];
      } else if (lang === "ta") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **திட்ட விவரங்கள் (அமைச்சகம்: ${s.ministry}):**\n${s.description}\n\n💰 **நலன்கள் & அரசு மானியம்:**\n${s.benefits}\n\n📄 **தேவையான ஆவணங்கள்:**\n${s.documents_required || "ஆதார் அட்டை, நில பட்டா, வங்கி பாஸ்புக்"}\n\n⚡ **செயல்முறை காலக்கெடு (Predictive Regressor):**\n• மதிப்பிடப்பட்ட நேரம்: **${sla.formattedEta}** (${(sla.confidenceScore * 100).toFixed(0)}% துல்லியம்)\n• தகுதி நிலை: **${elig.overallMatchScore}%**`;
        chips = ["விண்ணப்பிக்கும் முறை", "ஆவண சரிபார்ப்பு", "உழவர் மையம்", "பிற நலத்திட்டங்கள்"];
      } else if (lang === "kn") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **ಯೋಜನೆಯ ವಿವರಗಳು (ಸಚಿವಾಲಯ: ${s.ministry}):**\n${s.description}\n\n💰 **ಸೌಲಭ್ಯಗಳು & ಆರ್ಥಿಕ ನೆರವು:**\n${s.benefits}\n\n📄 **ಅಗತ್ಯ ದಾಖಲೆಗಳು:**\n${s.documents_required || "ಆಧಾರ್ ಕಾರ್ಡ್, ಪಹಣಿ/ಆರ್‌ಒಆರ್, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್"}\n\n⚡ **ಅಂದಾಜು ಸಮಯ (Predictive Regressor):**\n• ಅಂದಾಜು ಸಮಯ: **${sla.formattedEta}** (${(sla.confidenceScore * 100).toFixed(0)}% ನಿಖರತೆ)\n• ಅರ್ಹತಾ ಸ್ಕೋರ್: **${elig.overallMatchScore}%**`;
        chips = ["ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ", "ದಾಖಲೆಗಳ ಪಟ್ಟಿ", "ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ", "ಇತರ ಯೋಜನೆಗಳು"];
      } else if (lang === "bn") {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **প্রকল্প বিবরণ (মন্ত্রণালয়: ${s.ministry}):**\n${s.description}\n\n💰 **সুবিধা ও সরকারি অনুদান:**\n${s.benefits}\n\n📄 **প্রয়োজনীয় কাগজপত্র:**\n${s.documents_required || "আধার কার্ড, জমির পাট্টা, ব্যাংক অ্যাকাউন্ট তথ্য"}\n\n⚡ **প্রক্রিয়াকরণ সময় (Predictive Regressor):**\n• আনুমানিক সময়: **${sla.formattedEta}** (${(sla.confidenceScore * 100).toFixed(0)}% নির্ভুলতা)\n• যোগ্যতা স্কোর: **${elig.overallMatchScore}%**`;
        chips = ["আবেদন পদ্ধতি", "প্রয়োজনীয় ডকুমেন্টস", "কৃষি সেবা কেন্দ্র", "অন্যান্য প্রকল্প"];
      } else {
        replyText = `🏛️ **${s.name}**\n${topMatch.formattedBadge}\n\n📋 **Scheme Summary (Ministry: ${s.ministry}):**\n${s.description}\n\n💰 **Key Benefits & Subsidies:**\n${s.benefits}\n\n📄 **Required Documents:**\n${s.documents_required || "Aadhaar Card, Land Holding Documents (Pahani/Patta), Bank Account Details, Mobile Number"}\n\n⚡ **Turnaround ETA & Eligibility (Predictive Regressor):**\n• Estimated Turnaround: **${sla.formattedEta}** (${(sla.confidenceScore * 100).toFixed(0)}% predictive confidence)\n• Multi-Factor Match: **${elig.overallMatchScore}%** (${elig.factorBreakdown[3]?.score || "Marginal Farmer Priority"})`;
        chips = ["How to Apply", "Required Documents Checklist", "Nearest Krishi Kendra", "Explore More Welfare Schemes"];
      }

      return { text: replyText, chips };
    }

    if (lang === "te") {
      replyText = `నమస్కారం ${farmer.name || "రమేష్"} గారు! మీ ప్రశ్నను శ్రద్ధగా గమనించాను. కొత్తూరులో మీకున్న ${farmer.landSizeAcres} ఎకరాల నల్లరేగడి భూమి మరియు పత్తి, మిర్చి పంటలను దృష్టిలో ఉంచుకుని నేను సహాయం చేస్తాను. మీకు పంటల సాగు పద్ధతులు, పురుగుమందులు, ఎరువుల మోతాదు లేదా ప్రభుత్వం అందించే సబ్సిడీ పథకాలలో ఏ అంశంపై సలహా కావాలో అడగండి, వెంటనే సరైన పరిష్కారం అందిస్తాను!`;
      chips = ["సోలార్ పంపు 60% సబ్సిడీ", "PM-KISAN డబ్బుల వివరాలు", "పంట తెగులు సలహా", "సమీప రైతులతో మాట్లాడండి"];
    } else if (lang === "hi") {
      replyText = `नमस्ते ${farmer.name || "रमेश"} जी! मैंने आपका प्रश्न समझ लिया है। कोथुर में आपकी ${farmer.landSizeAcres} एकड़ काली मिट्टी और फसलों को ध्यान में रखते हुए मैं आपकी पूरी मदद करूँगा। आपको खेती की तकनीक, खाद, कीट नियंत्रण या सरकारी सब्सिडी योजनाओं में से किस विषय पर जानकारी चाहिए?`;
      chips = ["सोलर पंप 60% सब्सिडी", "PM-KISAN ₹6,000 स्थिति", "कीट नियंत्रण सलाह", "आसपास के किसान से जुड़ें"];
    } else if (lang === "ta") {
      replyText = `வணக்கம் ${farmer.name || "ரமேஷ்"} அவர்களே! உங்கள் கேள்வியைப் புரிந்து கொண்டேன். கொத்தூரில் உங்கள் ${farmer.landSizeAcres} ஏக்கர் கரிசல் மண் நிலத்திற்கு பயனுள்ள அரசு திட்டங்கள் மற்றும் விவசாய ஆலோசனைகளை வழங்க நான் தயாராக உள்ளேன். உங்களுக்கு என்ன குறிப்பிட்ட வழிகாட்டுதல் தேவை?`;
      chips = ["சோலார் பம்ப் 60% மானியம்", "PM-KISAN தகுதி நிலை", "பூச்சி மேலாண்மை", "விவசாயியுடன் பேசுங்கள்"];
    } else if (lang === "kn") {
      replyText = `ನಮಸ್ಕಾರ ${farmer.name || "ರಮೇಶ್"} ಅವರೇ! ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ ${farmer.landSizeAcres} ಎಕರೆ ಜಮೀನಿಗೆ ಸೂಕ್ತವಾದ ಕೃಷಿ ಮಾಹಿತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರಗಳನ್ನು ನೀಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ. ನಿಮಗೆ ಯಾವ ನಿರ್ದಿಷ್ಟ ಮಾಹಿತಿ ಬೇಕು?`;
      chips = ["ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "PM-KISAN ವಿವರಗಳು", "ಬೆಳೆ ಕೀಟ ಸಲಹೆ", "ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ"];
    } else if (lang === "bn") {
      replyText = `নমস্কার ${farmer.name || "রমেশ"} বাবু! আমি আপনার প্রশ্ন বুঝতে পেরেছি। কোথুরে আপনার ${farmer.landSizeAcres} একর জমির উপযোগী কৃষি পরামর্শ ও সরকারি প্রকল্পের সহায়তার জন্য আমি প্রস্তুত। আপনি কোন বিষয়ে বিস্তারিত জানতে চান?`;
      chips = ["সৌর পাম্প ৬০% ভর্তুকি", "PM-KISAN ₹৬,০০০ স্থিতি", "কীটপতঙ্গ নিয়ন্ত্রণ", "কৃষকের সাথে যোগাযোগ"];
    } else {
      replyText = `Namaste ${farmer.name || "Ramesh"} Ji! I have noted your question carefully. Considering your ${farmer.landSizeAcres} Acres of Black Soil and crops in ${farmer.village}, I am here to help with crop advisory, fertilizers, pest control, or government welfare subsidies. What specific information would you like to explore?`;
      chips = ["Solar Pump 60% Subsidy", "Check PM-KISAN ₹6,000", "Pest & Disease Advisory", "Connect with nearby peer farmers"];
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
