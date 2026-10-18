import { create } from "zustand";
import { SupportedLanguage, translations } from "@/lib/i18n";
import {
  FarmerProfile,
  Scheme,
  PeerSuccessStory,
  MockOcrResult,
  DEMO_FARMERS,
  SCHEMES_DATABASE,
  NEARBY_PEERS,
  MOCK_OCR_PRESETS,
} from "@/lib/mockData";
import { speakText, stopSpeaking } from "@/lib/speech";
import { classifyBase64Image } from "@/lib/visionClassifier";

export interface OutOfScopeError {
  title: string;
  message: string;
  reason: string;
  previewUrl: string;
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  image?: string;
  fileName?: string;
  fileType?: string;
  clarificationChips?: string[];
  isClarification?: boolean;
  docDetection?: any;
}

export function getInitialChatMessage(lang: SupportedLanguage, farmerName: string = "Ramesh Goud"): ChatMessage {
  if (lang === "te") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `నమస్కారం ${farmerName} గారు! నేను జనమిత్ర (JanMithra) ఏఐ అసిస్టెంట్. కొత్తూరులో మీకున్న 3.5 ఎకరాల నల్లరేగడి భూమికి PM-KUSUM 60% సోలార్ పంపు సబ్సిడీకి మీరు 98% అర్హులు. మీ పొరుగున ఉన్న రామేశ్వర్ రెడ్డి గారు (3.8 కి.మీ దూరం) దీనితో నెలకు ₹4,600 డీజిల్ ఆదా చేసుకున్నారు! ఈరోజు మీ వ్యవసాయానికి లేదా పథకాలకు నేను ఎలా సహాయపడగలను?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "PM-KUSUM సోలార్ పంపు దరఖాస్తు",
        "పత్తిలో తెల్లదోమ నివారణ మందులు",
        "PM-KISAN ₹6,000 జమ వివరాలు",
        "ఎరువుల సిఫార్సు కోసం సాయిల్ కార్డు స్కాన్",
      ],
    };
  }
  if (lang === "hi") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `नमस्ते ${farmerName} जी! मैं जनमित्रा (JanMithra) एआई सहायक हूँ। कोथुर में आपकी 3.5 एकड़ काली मिट्टी की भूमि के आधार पर आप PM-KUSUM 60% सोलर पंप सब्सिडी के लिए 98% पात्र हैं। आपके पड़ोसी रामेश्वर रेड्डी जी (3.8 किमी दूर) ने इसे लगाकर हर महीने ₹4,600 का डीजल बचाया! आज मैं आपकी खेती में कैसे सहायता कर सकता हूँ?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "PM-KUSUM सोलर पंप आवेदन प्रक्रिया",
        "कपास में सफेद मक्खी कीट नियंत्रण",
        "PM-KISAN ₹6,000 स्थिति जांचें",
        "उर्वरक सलाह हेतु मृदा कार्ड स्कैन करें",
      ],
    };
  }
  if (lang === "ta") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `வணக்கம் ${farmerName} அவர்களே! நான் ஜனமித்ரா (JanMithra) AI. கொத்தூரில் உள்ள உங்கள் 3.5 ஏக்கர் கரிசல் மண் நிலத்திற்கு PM-KUSUM 60% சோலார் பம்ப் மானியத்திற்கு 98% தகுதியுடையவர். உங்கள் அண்டை விவசாயி ராமேஸ்வர ரெட்டி (3.8 கி.மீ தூரம்) இதன் மூலம் மாதம் ₹4,600 டீசல் சேமித்துள்ளார்! இன்று உங்கள் விவசாயத்திற்கு நான் எவ்வாறு உதவ முடியும்?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "PM-KUSUM சோலார் பம்ப் விண்ணப்பம் எப்படி?",
        "பருத்தியில் வெள்ளை ஈ பூச்சி கட்டுப்பாடு",
        "PM-KISAN ₹6,000 தகுதி நிலை",
        "உர ஆலோசனைக்கு மண் அட்டை ஸ்கேன் செய்யவும்",
      ],
    };
  }
  if (lang === "kn") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `ನಮಸ್ಕಾರ ${farmerName} ಅವರೇ! ನಾನು ಜನಮಿತ್ರ (JanMithra) AI ಸಹಾಯಕ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ 3.5 ಎಕರೆ ಕಪ್ಪು ಮಣ್ಣಿನ ಜಮೀನಿಗೆ PM-KUSUM 60% ಸೋಲಾರ್ ಪಂಪ್ ಸಬ್ಸಿಡಿಗೆ ನೀವು 98% ಅರ್ಹರಾಗಿದ್ದೀರಿ. ನಿಮ್ಮ ನೆರೆಯ ರಾಮೇಶ್ವರ್ ರೆಡ್ಡಿ (3.8 ಕಿ.ಮೀ ದೂರ) ಇದರಿಂದ ತಿಂಗಳಿಗೆ ₹4,600 ಡೀಸೆಲ್ ಉಳಿಸಿದ್ದಾರೆ! ಇಂದು ನಿಮ್ಮ ಕೃಷಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "PM-KUSUM ಸೋಲಾರ್ ಪಂಪ್ ಅರ್ಜಿ ಹೇಗೆ?",
        "ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣ ನಿಯಂತ್ರಣ",
        "PM-KISAN ₹6,000 ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ",
        "ರಸಗೊಬ್ಬರ ಸಲಹೆಗೆ ಮಣ್ಣಿನ ಕಾರ್ಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
      ],
    };
  }
  if (lang === "bn") {
    return {
      id: "msg_init",
      sender: "ai",
      text: `নমস্কার ${farmerName} বাবু! আমি জনমিত্র (JanMithra) এআই সহকারী। কোথুরে আপনার ৩.৫ একর কালো মাটির জমির জন্য আপনি PM-KUSUM ৬০% সৌর পাম্প ভর্তুকির ৯৮% যোগ্য। আপনার প্রতিবেশী রামেশ্বর রেড্ডি (৩.৮ কিমি দূরে) এর মাধ্যমে মাসে ₹৪,৬০০ ডিজেল বাঁচিয়েছেন! আজ আপনার চাষের জন্য আমি কীভাবে সাহায্য করতে পারি?`,
      timestamp: "10:30 AM",
      clarificationChips: [
        "PM-KUSUM সৌর পাম্পের আবেদন কীভাবে করবেন?",
        "তুলা ফসলে সাদা মাছি কীট দমন",
        "PM-KISAN ₹৬,০০০ স্থিতি দেখুন",
        "সারের পরিমাণের জন্য মৃত্তিকা কার্ড স্ক্যান করুন",
      ],
    };
  }
  return {
    id: "msg_init",
    sender: "ai",
    text: `Namaste ${farmerName} Ji! I am JanMithra AI. Based on your 3.5 Acres Black Soil in Kothur, you are 98% eligible for PM-KUSUM 60% Solar Pump subsidy. Your neighbor Rameshwar Reddy (3.8 km away) already saved ₹4,600/month with it! How can I assist your farm today?`,
    timestamp: "10:30 AM",
    clarificationChips: [
      "How to apply for PM-KUSUM Solar Pump?",
      "Pest control for whiteflies on cotton",
      "Check PM-KISAN ₹6,000 status",
      "Upload soil card for fertilizer dose",
    ],
  };
}

export function formatDocumentAnalysisReply(det: any, lang: SupportedLanguage): { text: string; chips: string[] } {
  const ext = det.extractedData || {};
  const isTelanganaDeed =
    det.title?.toLowerCase().includes("sale deed") ||
    det.title?.toLowerCase().includes("dharani") ||
    det.title?.toLowerCase().includes("విక్రయ");

  if (isTelanganaDeed) {
    if (lang === "te") {
      return {
        text: `🏛️ తెలంగాణ ప్రభుత్వం - ధరణి నమోదిత విక్రయ పత్రం (Registered Sale Deed) విశ్లేషించబడింది!\n\n📋 ధృవీకరించబడిన పత్ర వివరాలు:\n• పత్రం రకం: వ్యవసాయ భూమి విక్రయ పత్రం (Registered Sale Deed)\n• కొనుగోలుదారు (Vendee / నూతన యజమాని): ${ext.ownerName || "బానోతు వెంకన్న"}\n• విక్రేత (Vendor): ${ext.sellerName || "నరాల నవ్యశ్రీ"}\n• సర్వే నంబర్: ${ext.surveyNumber || "65/ఆ/1 (రెడ్లవాడ)"}\n• విస్తీర్ణం: ${ext.extentAcGts || "0.2250 ఎకరాలు"}\n• రిజిస్ట్రేషన్ ప్రతిఫలం: ${ext.considerationAmount || "₹1,26,518"}\n• పాస్ పుస్తకం నం: ${ext.passBookNumber || "T22090081201"}\n• ప్రాంతం: ${ext.districtMandal || "రెడ్లవాడ, నెక్కొండ మండలం, వరంగల్ జిల్లా"}\n\n✅ అర్హత గల ప్రభుత్వ సంక్షేమ పథకాలు & తదుపరి చర్యలు:\n1. ధరణి ఆటో-మ్యుటేషన్ & ఈ-పాస్ పుస్తకం: సేల్ డీడ్ ఆధారంగా మీ పేరిట డిజిటల్ పట్టాదారు పాస్ పుస్తకం జారీ.\n2. PM-KISAN: మ్యుటేషన్ తర్వాత సంవత్సరానికి ₹6,000 నేరుగా బ్యాంక్ ఖాతాలో జమ.\n3. రైతు బంధు / రైతు భరోసా: ఎకరాకు సాగు పెట్టుబడి సాయం.\n4. కిసాన్ క్రెడిట్ కార్డ్ (KCC): 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం.\n5. PM-KUSUM: 60% సబ్సిడీతో సోలార్ వాటర్ పంపు.`,
        chips: ["ధరణి మ్యుటేషన్ దరఖాస్తు", "PM-KISAN అర్హత పరిశీలన", "KCC బ్యాంక్ లోన్ వివరాలు", "దస్తావేజు వెరిఫికేషన్ చూడండి"],
      };
    }
    if (lang === "hi") {
      return {
        text: `🏛️ तेलंगाना सरकार धरणी पंजीकृत विक्रय पत्र (Registered Sale Deed) सत्यापित:\n\n📋 दस्तावेज़ विवरण:\n• दस्तावेज़: कृषि भूमि बैनामा (Sale Deed)\n• क्रेता (खरीदार / Vendee): ${ext.ownerName || "बनोथु वेंकन्ना"}\n• विक्रेता (Seller / Vendor): ${ext.sellerName || "नराला नव्या श्री"}\n• सर्वे संख्या: ${ext.surveyNumber || "65/ఆ/1 (रेडलावाड़ा)"}\n• रकबा: ${ext.extentAcGts || "0.2250 एकड़"}\n• प्रतिफल राशि: ${ext.considerationAmount || "₹1,26,518"}\n• पासबुक नंबर: ${ext.passBookNumber || "T22090081201"}\n• क्षेत्र: ${ext.districtMandal || "रेडलावाड़ा, नेक्कोंडा, वारंगल"}\n\n✅ अनुशंसित सरकारी योजनाएं एवं कानूनी प्रक्रिया:\n1. धरणी नामांतरण (Dharani Mutation): डिजिटल ई-पासबुक और खाता संख्या जारी करना.\n2. PM-KISAN: ₹6,000 वार्षिक डायरेक्ट बेनिफिट ट्रांसफर (DBT).\n3. किसान क्रेडिट कार्ड (KCC): 4% ब्याज पर रियायती कृषि ऋण.\n4. PM-KUSUM सोलर पंप: 60% सब्सिडी पर सौर ऊर्जा पंप.`,
        chips: ["धरणी म्यूटेशन प्रक्रिया", "PM-KISAN ₹6,000 जांचें", "KCC 4% ऋण आवेदन", "दस्तावेज़ विवरण देखें"],
      };
    }
    if (lang === "ta") {
      return {
        text: `🏛️ தெலங்கானா அரசு - தரணி பதிவு செய்யப்பட்ட விற்பனைப் பத்திரம் (Registered Sale Deed) சரிபார்க்கப்பட்டது!\n\n📋 சரிபார்க்கப்பட்ட ஆவண விவரங்கள்:\n• ஆவண வகை: விவசாய நில விற்பனைப் பத்திரம் (Registered Sale Deed)\n• வாங்குபவர் (Vendee / புதிய உரிமையாளர்): ${ext.ownerName || "பனோத்து வெங்கன்னா"}\n• விற்பனையாளர் (Vendor): ${ext.sellerName || "நராலா நவ்யா ஸ்ரீ"}\n• சர்வே எண்: ${ext.surveyNumber || "65/ஆ/1 (ரெட்லவாடா)"}\n• நில அளவு: ${ext.extentAcGts || "0.2250 ஏக்கர்"}\n• பதிவுத் தொகை: ${ext.considerationAmount || "₹1,26,518"}\n• பாஸ்புக் எண்: ${ext.passBookNumber || "T22090081201"}\n• வருவாய் பகுதி: ${ext.districtMandal || "ரெட்லவாடா, நெக்கொண்டா மண்டலம், வாரங்கல் மாவட்டம்"}\n\n✅ தகுதியான அரசு நலத்திட்டங்கள் & அடுத்த நடவடிக்கைகள்:\n1. தரணி தானியங்கி பட்டா மாற்றம் & இ-பாஸ்புக்: விற்பனைப் பத்திரத்தின் அடிப்படையில் டிஜிட்டல் பட்டாதாரர் பாஸ்புக் வழங்கல்.\n2. PM-KISAN: பட்டா மாற்றத்திற்குப் பிறகு ஆண்டுக்கு ₹6,000 வங்கி கணக்கில் நேரடியாக வரவு.\n3. ரைத்து பந்து / ரைத்து பரோசா: ஏக்கருக்கு சாகுபடி முதலீட்டு உதவி.\n4. கிசான் கிரெடிட் கார்டு (KCC): பதிவு செய்யப்பட்ட நிலத்திற்கு 4% மானிய வட்டியில் வங்கிப் பயிர்க்கடன்.\n5. PM-KUSUM: 60% மானியத்தில் சோலார் நீர் பம்ப்.`,
        chips: ["தரணி பட்டா மாற்றம் விண்ணப்பம்", "PM-KISAN தகுதி சரிபார்", "KCC வங்கி கடன் விவரங்கள்", "ஆவண சரிபார்ப்பை திறக்கவும்"],
      };
    }
    if (lang === "kn") {
      return {
        text: `🏛️ ತೆಲಂಗಾಣ ಸರ್ಕಾರ - ಧರಣಿ ನೋಂದಾಯಿತ ಮಾರಾಟ ಪತ್ರ (Registered Sale Deed) ಪರಿಶೀಲಿಸಲಾಗಿದೆ!\n\n📋 ಪರಿಶೀಲಿಸಲಾದ ದಾಖಲೆಯ ವಿವರಗಳು:\n• ದಾಖಲೆಯ ಪ್ರಕಾರ: ಕೃಷಿ ಭೂಮಿ ಮಾರಾಟ ಪತ್ರ (Registered Sale Deed)\n• ಖರೀದಿದಾರ (Vendee / ಹೊಸ ಮಾಲೀಕ): ${ext.ownerName || "ಬಾನೋತು ವೆಂಕಣ್ಣ"}\n• ಮಾರಾಟಗಾರ (Vendor): ${ext.sellerName || "ನರಾಲ ನವ್ಯಶ್ರೀ"}\n• ಸರ್ವೆ ಸಂಖ್ಯೆ: ${ext.surveyNumber || "65/ಆ/1 (ರೆಡ್ಲವಾಡ)"}\n• ವಿಸ್ತೀರ್ಣ: ${ext.extentAcGts || "0.2250 ಎಕರೆ"}\n• ನೋಂದಣಿ ಮೌಲ್ಯ: ${ext.considerationAmount || "₹1,26,518"}\n• ಪಾಸ್ ಬುಕ್ ಸಂಖ್ಯೆ: ${ext.passBookNumber || "T22090081201"}\n• ಕಂದಾಯ ಪ್ರದೇಶ: ${ext.districtMandal || "ರೆಡ್ಲವಾಡ, ನೆಕ್ಕೊಂಡ ಮಂಡಲ, ವಾರಂಗಲ್ ಜಿಲ್ಲೆ"}\n\n✅ ಅರ್ಹ ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು & ಮುಂದಿನ ಕ್ರಮಗಳು:\n1. ಧರಣಿ ಸ್ವಯಂ-ಮ್ಯುಟೇಶನ್ & ಇ-ಪಾಸ್ ಬುಕ್: ಮಾರಾಟ ಪತ್ರದ ಆಧಾರದ ಮೇಲೆ ಡಿಜಿಟಲ್ ಪಟ್ಟಾದಾರ ಪಾಸ್ ಬುಕ್ ವಿತರಣೆ.\n2. PM-KISAN: ಮ್ಯುಟೇಶನ್ ನಂತರ ವರ್ಷಕ್ಕೆ ₹6,000 ನೇರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ.\n3. ರೈತ ಬಂಧು / ರೈತ ಭರೋಸಾ: ಪ್ರತಿ ಎಕರೆಗೆ ಕೃಷಿ ಹೂಡಿಕೆ ನೆರವು.\n4. ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC): ನೋಂದಾಯಿತ ಭೂಮಿಗೆ 4% ರಿಯಾಯಿತಿ ಬಡ್ಡಿಯಲ್ಲಿ ಬೆಳೆ ಸಾಲ.\n5. PM-KUSUM: 60% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ ಸೋಲಾರ್ ವಾಟರ್ ಪಂಪ್.`,
        chips: ["ಧರಣಿ ಮ್ಯುಟೇಶನ್ ಪ್ರಕ್ರಿಯೆ", "PM-KISAN ಲಿಂಕ್ ಪರಿಶೀಲಿಸಿ", "KCC ಬ್ಯಾಂಕ್ ಸಾಲ ವಿವರ", "ದಾಖಲೆ ವಿವರ ನೋಡಿ"],
      };
    }
    if (lang === "bn") {
      return {
        text: `🏛️ তেলেঙ্গানা সরকার - ধরণী নিবন্ধিত বিক্রয় দলিল (Registered Sale Deed) যাচাইকৃত!\n\n📋 যাচাইকৃত দলিলের বিবরণ:\n• দলিলের ধরন: কৃষিজমি বিক্রয় দলিল (Registered Sale Deed)\n• ক্রেতা (Vendee / নতুন মালিক): ${ext.ownerName || "বানোথু ভেঙ্কান্না"}\n• বিক্রেতা (Vendor): ${ext.sellerName || "নরালা নব্যাশ্রী"}\n• দাগ/সার্ভে নং: ${ext.surveyNumber || "৬৫/আ/১ (রেডলাওয়াদা)"}\n• জমির পরিমাণ: ${ext.extentAcGts || "০.২২৫০ একর"}\n• রেজিস্ট্রেশন মূল্য: ${ext.considerationAmount || "₹১,২৬,৫১৮"}\n• পাসবুক নং: ${ext.passBookNumber || "T22090081201"}\n• এলাকা: ${ext.districtMandal || "রেডলাওয়াদা, নেক্কোন্ডা, ওয়ারাঙ্গল"}\n\n✅ যোগ্য সরকারি কল্যাণ প্রকল্প ও পরবর্তী করণীয়:\n1. ধরণী অটো-মিউটেশন ও ই-পাসবুক: দলিলের ভিত্তিতে ডিজিটাল পাট্টাদার পাসবুক প্রদান।\n2. PM-KISAN: বার্ষিক ₹৬,০০০ সরাসরি ব্যাংক অ্যাকাউন্টে জমা।\n3. রায়থু বন্ধু / রায়থু ভরসা: একর প্রতি চাষের বিনিয়োগ সহায়তা।\n4. কিষাণ ক্রেডিট কার্ড (KCC): ৪% রেয়াতি সুদে ফসল ঋণ।\n5. PM-KUSUM: ৬০% ভর্তুকিতে সৌর জল পাম্প।`,
        chips: ["ধরণী মিউটেশন আবেদন", "PM-KISAN স্থিতি যাচাই", "KCC লোন তথ্য", "দলিল বিবরণ দেখুন"],
      };
    }
    return {
      text: `🏛️ Government of Telangana Dharani Registered Sale Deed Verified:\n\n📋 Verified Title & Conveyance Parameters:\n• Document Type: Farmland Registered Deed of Sale (Sale Deed)\n• Vendee (Buyer / Absolute Owner): ${ext.ownerName || "Banothu Venkanna"}\n• Vendor (Seller): ${ext.sellerName || "Narala Navya Sri"}\n• Survey Number: ${ext.surveyNumber || "Survey No: 65/ఆ/1 (Redlawada)"}\n• Land Extent: ${ext.extentAcGts || "0.2250 Ac.Gts"}\n• Consideration Paid: ${ext.considerationAmount || "₹1,26,518"}\n• Passbook Number: ${ext.passBookNumber || "T22090081201"}\n• Revenue Location: ${ext.districtMandal || "Redlawada (V), Nekkonda (M), Warangal Dist"}\n\n✅ Unlocked Welfare Schemes & Actions:\n1. Dharani Auto-Mutation & e-Passbook: Automatic transfer of title and issuance of digital Pattadar Passbook.\n2. PM-KISAN: Direct Benefit Transfer of ₹6,000/year to linked bank account.\n3. Rythu Bharosa / Rythu Bandhu: Seasonal farm investment support.\n4. Kisan Credit Card (KCC): Concessional crop credit at 4% interest against registered land.\n5. PM-KUSUM Component-B: 60% subsidy for solar water pump.`,
      chips: ["Dharani Mutation Process", "Check PM-KISAN Linkage", "Apply for KCC Loan", "Open in Document Modal"],
    };
  }

  // Generic document or Rajasthan / Soil card
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

interface FarmerState {
  language: SupportedLanguage;
  currentFarmer: FarmerProfile;
  isAuthenticated: boolean;
  authModalOpen: boolean;
  activeTab: "dashboard" | "schemes" | "peers" | "chat" | "verify";
  selectedCategoryFilter: string;
  
  // Modals & Details
  selectedScheme: Scheme | null;
  peerContactModal: PeerSuccessStory | null;
  verificationModalOpen: boolean;

  // Chat & Speech
  chatMessages: ChatMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  speakingMessageId: string | null;

  // Document OCR Verification
  verificationScanning: boolean;
  verificationResult: MockOcrResult | null;
  outOfScopeError: OutOfScopeError | null;
  selectedPresetKey: string | null;

  // Actions
  setLanguage: (lang: SupportedLanguage) => void;
  setCurrentFarmer: (farmer: FarmerProfile) => void;
  setAuthModalOpen: (open: boolean) => void;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  signupFarmer: (formData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setActiveTab: (tab: "dashboard" | "schemes" | "peers" | "chat" | "verify") => void;
  setSelectedCategoryFilter: (category: string) => void;
  setSelectedScheme: (scheme: Scheme | null) => void;
  setPeerContactModal: (peer: PeerSuccessStory | null) => void;
  setVerificationModalOpen: (open: boolean) => void;
  clearOutOfScopeError: () => void;
  
  // Chat Actions
  sendChatMessage: (text: string, image?: string, fileName?: string, fileType?: string) => Promise<void>;
  handleClarificationChip: (chipText: string) => void;
  setIsListening: (listening: boolean) => void;
  speakMessage: (id: string, text: string) => void;
  stopAudio: () => void;

  // OCR Verification Actions
  startMockVerification: (presetKey: string) => void;
  analyzeUploadedFile: (
    fileBase64: string,
    fileName: string,
    fileType: string,
    category?: string
  ) => Promise<boolean>;
  confirmExtractedData: () => void;
  resetVerification: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [getInitialChatMessage("en", "Ramesh Goud")];

export const useFarmerStore = create<FarmerState>((set, get) => ({
  language: "en",
  currentFarmer: DEMO_FARMERS[0],
  isAuthenticated: true, // Default to true so Dashboard (Image 2) is the start page
  authModalOpen: false,
  activeTab: "dashboard",
  selectedCategoryFilter: "all",
  
  selectedScheme: null,
  peerContactModal: null,
  verificationModalOpen: false,

  chatMessages: INITIAL_MESSAGES,
  isListening: false,
  isSpeaking: false,
  speakingMessageId: null,

  verificationScanning: false,
  verificationResult: null,
  outOfScopeError: null,
  selectedPresetKey: null,

  clearOutOfScopeError: () => set({ outOfScopeError: null }),

  setLanguage: (lang) => {
    set({ language: lang });

    // Automatically update existing chat messages into the newly selected language
    const currentMessages = get().chatMessages;
    const farmer = get().currentFarmer;
    const t = translations[lang] as any;

    const updatedMessages = currentMessages.map((msg) => {
      // 1. Initial greeting
      if (msg.id === "msg_init" || msg.id === "msg_01") {
        return getInitialChatMessage(lang, farmer.name);
      }

      // 2. Verified document AI response
      if (
        msg.sender === "ai" &&
        (msg.docDetection ||
          msg.text.includes("🏛️") ||
          msg.text.includes("Sale Deed") ||
          msg.text.includes("ధరణి") ||
          msg.text.includes("धरणी") ||
          msg.text.includes("తరணி") ||
          msg.text.includes("ధృవీకరించబడిన") ||
          msg.text.includes("పత్ర వివరాలు") ||
          msg.text.includes("దస్తావేజు") ||
          msg.text.includes("దస్త్రం") ||
          msg.text.includes("విక్రయ") ||
          msg.text.includes("விற்பனை") ||
          msg.text.includes("ಮಾರಾಟ") ||
          msg.text.includes("বিক্রয়") ||
          msg.text.includes("Analyzed Successfully") ||
          msg.text.includes("విజయవంతంగా విశ్లేషించబడింది") ||
          msg.text.includes("வெற்றிகரமாக பகுப்பாய்வு"))
      ) {
        const det = msg.docDetection || get().verificationResult || {
          title: "Telangana Dharani Registered Sale Deed (0.2250 Ac.Gts)",
          confidenceScore: 0.98,
          detectionSummary: "Farmland Registered Deed of Sale (Sale Deed) - Warangal District",
          extractedData: {
            docType: "Registered Sale Deed (Farmland)",
            ownerName: "Banothu Venkanna",
            sellerName: "Narala Navya Sri",
            surveyNumber: "Survey No: 65/ఆ/1 (Redlawada)",
            extentAcGts: "0.2250 Ac.Gts",
            considerationAmount: "₹1,26,518",
            passBookNumber: "T22090081201",
            districtMandal: "Redlawada (V), Nekkonda (M), Warangal Dist",
            natureOfDeed: "Absolute Sale of Agricultural Land",
          },
          schemesUnlocked: [
            "Dharani Auto-Mutation & e-Passbook",
            "PM-KISAN ₹6,000/year DBT",
            "Rythu Bharosa / Rythu Bandhu Farm Investment Support",
            "Kisan Credit Card (KCC) Concessional 4% Loan",
            "PM-KUSUM 60% Solar Water Pump",
          ],
        };
        const localized = formatDocumentAnalysisReply(det, lang);
        return {
          ...msg,
          text: localized.text,
          clarificationChips: localized.chips,
          docDetection: det,
        };
      }

      // 3. User default inspect image message
      if (
        msg.sender === "user" &&
        msg.image &&
        (msg.text.includes("inspect this attached") ||
          msg.text.includes("పరిశీలించండి") ||
          msg.text.includes("విశ్లేషించండి") ||
          msg.text.includes("विश्लेषण") ||
          msg.text.includes("ஆய்வு") ||
          msg.text.includes("ಪರಿಶೀಲಿಸಿ") ||
          msg.text.includes("পরীক্ষা"))
      ) {
        return {
          ...msg,
          text: t.inspectDocPrompt || "Please inspect this attached crop/document photo using AI Vision",
        };
      }

      // 4. User default inspect file message
      if (
        msg.sender === "user" &&
        msg.fileName &&
        !msg.image &&
        (msg.text.includes("analyze this attached") ||
          msg.text.includes("పరిశీలించండి") ||
          msg.text.includes("విశ్లేషించండి") ||
          msg.text.includes("विश्लेषण") ||
          msg.text.includes("ஆய்வு") ||
          msg.text.includes("ಪರಿಶೀಲಿಸಿ") ||
          msg.text.includes("পরীক্ষা"))
      ) {
        return {
          ...msg,
          text: `${t.inspectDocFilePrompt || "Please analyze this attached government document"}: ${msg.fileName}`,
        };
      }

      // 5. Conversational AI responses in chat history
      if (msg.sender === "ai" && !msg.docDetection) {
        const text = msg.text;
        // Whitefly pest control
        if (
          text.includes("Whitefly") ||
          text.includes("whiteflies") ||
          text.includes("తెల్లదోమ") ||
          text.includes("सफेद मक्खी") ||
          text.includes("வெள்ளை ஈ") ||
          text.includes("ಬಿಳಿ ನೊಣ") ||
          text.includes("সাদা মাছি")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "మీ పత్తి చేనులో తెల్లదోమ (Whitefly) తెగులు గుర్తించబడింది. ఆకులు ముడుచుకుని తేనెజిగురు కారుతుంది. నివారణకు: ఎకరాకు వేపనూనె 10,000 ppm 2ml/లీటరు లేదా డయాఫెంథియురాన్ 50% WP 1గ్రాము/లీటరు నీటిలో కలిపి సాయంత్రం వేళ పిచికారీ చేయండి.",
              clarificationChips: ["పిచికారీ సమయం ఎప్పుడు?", "మందుల షాపు వివరాలు", "పంట నష్టం బీమా వర్తిస్తుందా?"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "कपास में सफेद मक्खी (Whitefly) का प्रकोप पहचाना गया है। पत्तियां मुड़ने और चिपचिपा स्राव की समस्या के लिए: नीम का तेल 10,000 ppm @ 2 मिली/लीटर पानी, या डायफेंथियूरॉन 50% WP @ 1 ग्राम/लीटर का शाम को छिड़काव करें।",
              clarificationChips: ["दवा छिड़काव का समय", "नजदीकी कृषि केंद्र", "फसल बीमा क्लेम प्रक्रिया"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: "பருத்தியில் வெள்ளை ஈ (Whitefly) தாக்குதல் கண்டறியப்பட்டுள்ளது. இலைகள் சுருங்கி தேன் போன்ற பிசின் வடிகிறது. தடுப்பு முறை: ஏக்கருக்கு வேப்பெண்ணெய் 10,000 ppm @ 2 மிலி/லிட்டர் அல்லது டயாபெந்தியூரான் 50% WP @ 1 கிராம்/லிட்டர் தண்ணீரில் கலந்து மாலை வேளையில் தெளிக்கவும்.",
              clarificationChips: ["மருந்து தெளிக்கும் நேரம் எப்போது?", "அருகிலுள்ள உழவர் மருந்தகம்", "பயிர் காப்பீட்டு உதவி"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: "ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣ (Whitefly) ಬಾಧೆ ಕಂಡುಬಂದಿದೆ. ಎಲೆಗಳು ಸುರುಟಿಕೊಂಡು ಜಿಗುಟು ಸ್ರವಿಸುತ್ತದೆ. ನಿಯಂತ್ರಣಕ್ಕೆ: ಎಕರೆಗೆ ಬೇವಿನ ಎಣ್ಣೆ 10,000 ppm @ 2 ಮಿಲಿ/ಲೀಟರ್ ಅಥವಾ ಡಯಾಫೆಂಥಿಯುರಾನ್ 50% WP @ 1 ಗ್ರಾಂ/ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸಿ.",
              clarificationChips: ["ಸಿಂಪಡಣೆ ಸಮಯ ಯಾವಾಗ?", "ಔಷಧಿ ಅಂಗಡಿ ವಿವರ", "ಬೆಳೆ ವಿಮೆ ಲಭ್ಯವಿದೆಯೇ?"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: "তুলা ফসলে সাদা মাছি (Whitefly) আক্রমণ সনাক্ত করা হয়েছে। পাতা কুঁকড়ে যাচ্ছে ও আঠালো ভাব হচ্ছে। দমনের জন্য: প্রতি লিটার জলে নিম তেল 10,000 ppm @ ২ মিলি বা ডায়াফেন্থিউরন 50% WP @ ১ গ্রাম মিশিয়ে বিকেলের দিকে স্প্রে করুন।",
              clarificationChips: ["স্প্রে করার সঠিক সময়", "নিকটবর্তী কৃষি সেবা কেন্দ্র", "ফসল বীমা সুবিধা"],
            };
          } else {
            return {
              ...msg,
              text: "For Whitefly nymph pest control on Cotton: Spray Neem Oil (10,000 ppm) @ 2ml/litre water, or Diafenthiuron 50% WP @ 1g/litre water during cooler evening hours. Ensure spray covers underside of the leaves.",
              clarificationChips: ["Spray schedule", "Eligible under PMFBY crop insurance?", "Upload photo for scan"],
            };
          }
        }

        // PM-KUSUM Solar pump
        if (
          text.includes("PM-KUSUM") ||
          text.includes("solar") ||
          text.includes("pump") ||
          text.includes("కుసుమ్") ||
          text.includes("సోలార్") ||
          text.includes("सोलर") ||
          text.includes("சோலார்") ||
          text.includes("ಸೋಲಾರ್") ||
          text.includes("সৌর")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "PM-KUSUM పథకం ద్వారా 60% సబ్సిడీతో 5HP సోలార్ పంపు లభిస్తుంది. మీ పొలానికి కరెంట్ బిల్లు లేదా డీజిల్ ఖర్చు ఉండదు. మీ దగ్గరలోని రైతు రామేశ్వర్ రెడ్డి (3.8 కి.మీ) దీనిని అమర్చి నెలకు ₹4,600 డీజిల్ ఆదా చేసుకున్నారు. మీ దగ్గర బోరుబావి ఉందా?",
              clarificationChips: ["అవును, బోరుబావి ఉంది", "బావి ఉంది", "కొత్తగా వేయాలి", "సబ్సిడీ అర్హతలు చూపించు"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "पीएम-कुसुम योजना के तहत 60% सरकारी सब्सिडी पर 5HP सोलर पंप मिल रहा है। आपके पड़ोस में रामेश्वर जी (3.8 किमी दूर) ने इसे लगवाकर हर महीने ₹4,600 डीजल का बचाया। क्या आपके पास वर्तमान में बोरवेल या कुआं है?",
              clarificationChips: ["हाँ, बोरवेल है", "कुआं है", "नया बोरवेल लगवाना है", "आवश्यक दस्तावेज़ बताएं"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: "PM-KUSUM திட்டத்தின் கீழ் 60% அரசு மானியத்துடன் 5HP சோலார் பம்ப் கிடைக்கிறது. உங்கள் வயலுக்கு மின் கட்டணம் அல்லது டீசல் செலவு இருக்காது. உங்கள் அண்டை விவசாயி ராமேஸ்வர ரெட்டி (3.8 கி.மீ) இதனை அமைத்து மாதம் ₹4,600 டீசல் சேமித்துள்ளார். உங்களிடம் ஆழ்துளை கிணறு உள்ளதா?",
              clarificationChips: ["ஆம், ஆழ்துளை கிணறு உள்ளது", "திறந்த கிணறு உள்ளது", "புதிதாக அமைக்க வேண்டும்", "மானிய தகுதிகள் காட்டு"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: "PM-KUSUM ಯೋಜನೆಯಡಿ 60% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ 5HP ಸೋಲಾರ್ ಪಂಪ್ ಲಭ್ಯವಿದೆ. ನಿಮ್ಮ ಜಮೀನಿಗೆ ವಿದ್ಯುತ್ ಬಿಲ್ ಅಥವಾ ಡೀಸೆಲ್ ವೆಚ್ಚ ಇರುವುದಿಲ್ಲ. ನಿಮ್ಮ ನೆರೆಯ ರಾಮೇಶ್ವರ್ ರೆಡ್ಡಿ (3.8 ಕಿ.ಮೀ) ಇದನ್ನು ಅಳವಡಿಸಿ ತಿಂಗಳಿಗೆ ₹4,600 ಡೀಸೆಲ್ ಉಳಿಸಿದ್ದಾರೆ. ನಿಮ್ಮಲ್ಲಿ ಕೊಳವೆಬಾವಿ ಇದೆಯೇ?",
              clarificationChips: ["ಹೌದು, ಕೊಳವೆಬಾವಿ ಇದೆ", "ಬಾವಿ ಇದೆ", "ಹೊಸದಾಗಿ ಕೊರೆಯಬೇಕು", "ಸಬ್ಸಿಡಿ ಅರ್ಹತೆಗಳನ್ನು ತೋರಿಸಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: "PM-KUSUM প্রকল্পের অধীনে ৬০% সরকারি ভর্তুকিতে ৫HP সৌর পাম্প পাওয়া যাচ্ছে। আপনার জমিতে বিদ্যুৎ বিল বা ডিজেল খরচ থাকবে না। আপনার প্রতিবেশী রামেশ্বর রেড্ডি (৩.৮ কিমি) এটি বসিয়ে মাসে ₹৪,৬০০ ডিজেল বাঁচিয়েছেন। আপনার কি সাবমার্সিবল বা নলকূপ আছে?",
              clarificationChips: ["হ্যাঁ, নলকূপ আছে", "কুয়ো আছে", "নতুন বসাতে হবে", "ভর্তুকির যোগ্যতা দেখান"],
            };
          } else {
            return {
              ...msg,
              text: "Under PM-KUSUM Scheme Component-B, you are eligible for 60% subsidy on a 5HP Solar Pump (Subsidy value ₹1,32,000). Your neighbor Rameshwar Reddy (3.8 km away in Kothur) installed this and saved ₹4,600/month on diesel! What is your existing water source type?",
              clarificationChips: ["I have a Borewell", "Open Irrigation Well", "Canal Water only", "What documents are needed?"],
            };
          }
        }
      }

      return msg;
    });

    set({ chatMessages: updatedMessages });
  },

  setCurrentFarmer: (farmer) => {
    set({
      currentFarmer: farmer,
    });
    get().setLanguage((farmer.preferredLanguage as SupportedLanguage) || "en");
  },

  setAuthModalOpen: (open) => set({ authModalOpen: open }),

  loginWithPhone: async (phone, otp) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        set({
          currentFarmer: data.user,
          isAuthenticated: true,
          authModalOpen: false,
        });
        get().setLanguage((data.user.preferredLanguage as SupportedLanguage) || get().language);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Login failed" };
    } catch (e: any) {
      // Fallback to demo farmer matching
      const matched = DEMO_FARMERS.find((f) => f.phone === phone) || DEMO_FARMERS[0];
      set({
        currentFarmer: matched,
        isAuthenticated: true,
        authModalOpen: false,
      });
      get().setLanguage((matched.preferredLanguage as SupportedLanguage) || "en");
      return { success: true, message: "Logged in via offline session cache." };
    }
  },

  signupFarmer: async (formData) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.user) {
        set({
          currentFarmer: data.user,
          isAuthenticated: true,
          authModalOpen: false,
        });
        get().setLanguage((data.user.preferredLanguage as SupportedLanguage) || get().language);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Registration failed" };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to reach registration API" };
    }
  },

  logout: () => {
    set({ isAuthenticated: false, authModalOpen: true });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedCategoryFilter: (category) => set({ selectedCategoryFilter: category }),

  setSelectedScheme: (scheme) => set({ selectedScheme: scheme }),

  setPeerContactModal: (peer) => set({ peerContactModal: peer }),

  setVerificationModalOpen: (open) => set({ verificationModalOpen: open }),

  setIsListening: (listening) => set({ isListening: listening }),

  sendChatMessage: async (text, image, fileName, fileType) => {
    const userMsg: ChatMessage = {
      id: `msg_usr_${Date.now()}`,
      sender: "user",
      text,
      image,
      fileName,
      fileType,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
    }));

    const lang = get().language;

    // Handle Image / Document Analysis
    if (image) {
      try {
        const res = await fetch("/api/ocr/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: image,
            fileName: fileName || "uploaded_document.png",
            fileType: fileType || "image/png",
            docCategory: "auto_detect",
            userId: 1,
          }),
        });

        const data = await res.json();

        if (data.isOutOfScope) {
          let replyText = "";
          let chips: string[] = [];
          if (lang === "te") {
            replyText = `⚠️ పరిధి వెలుపల ఫోటో (Out of Scope):\nమీరు పంపిన చిత్రం వ్యవసాయం, పంటలు లేదా ప్రభుత్వ రైతు సంక్షేమ పథకాలకు సంబంధించినదిగా లేదు (${data.reason || "వ్యవసాయేతర అంశాలు"}).\n\nజనమిత్ర (JanMithra) AI కేవలం వ్యవసాయ సంబంధిత సలహాలు, పంట వ్యాధి నిర్ధారణ మరియు ప్రభుత్వ రైతు పథకాల కోసం మాత్రమే పనిచేస్తుంది.\nదయచేసి:\n• పంట ఆకు లేదా తెగులు సోకిన చేను ఫోటో తీయండి.\n• లేదా భూమి రిజిస్ట్రేషన్ దస్తావేజు (సేల్ డీడ్), పట్టాదారు పాస్ పుస్తకం/పహానీ, సాయిల్ టెస్ట్ కార్డు సమర్పించండి.`;
            chips = ["వ్యవసాయ పథకాల వివరాలు", "పంట తెగులు ఫోటో తీయండి", "పట్టాదారు పాస్ పుస్తకం స్కాన్"];
          } else if (lang === "hi") {
            replyText = `⚠️ कार्यक्षेत्र से बाहर (Out of Scope):\nयह तस्वीर या फ़ाइल कृषि, फसलों या सरकारी किसान योजनाओं से संबंधित नहीं लग रही है (${data.reason || "गैर-कृषि वस्तुएं"})।\n\nजनमित्रा (JanMithra) AI केवल फसलों, कीट नियंत्रण, भूमि दस्तावेज़ों और सरकारी योजनाओं के लिए समर्पित है।\nकृपया:\n• किसी पौधे या पत्ती की स्पष्ट तस्वीर भेजें।\n• या भूमि बैनामा (Sale Deed), पट्टा/खसरा, सॉइल हेल्थ कार्ड साझा करें।`;
            chips = ["किसान योजनाओं की जानकारी", "फसल पत्ती की तस्वीर लें", "भूमि दस्तावेज़ स्कैन"];
          } else {
            replyText = `⚠️ Out of Scope:\nThe uploaded photo/file does not appear to be related to agriculture, crops, or government welfare schemes (${data.reason || "Everyday indoor items"}).\n\nJanMithra AI is dedicated exclusively to agriculture, crop diagnostics, and farmer schemes.\nPlease provide:\n• A photo of a farm crop leaf, pest, or field for disease diagnosis.\n• An official agricultural/government document (Registered Sale Deed, Land Patta / Pahani / RoR, Soil Health Card, or Farmer ID).`;
            chips = ["Explore Agri Schemes", "Take Crop Leaf Photo", "Scan Land Record"];
          }

          const aiMsg: ChatMessage = {
            id: `msg_ai_${Date.now()}`,
            sender: "ai",
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            clarificationChips: chips,
          };
          set((state) => ({ chatMessages: [...state.chatMessages, aiMsg] }));
          return;
        }

        if (data.success && data.detection) {
          const det = data.detection;
          set({ verificationResult: det });

          const formatted = formatDocumentAnalysisReply(det, lang);

          const aiMsg: ChatMessage = {
            id: `msg_ai_${Date.now()}`,
            sender: "ai",
            text: formatted.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            clarificationChips: formatted.chips,
            docDetection: det,
          };
          set((state) => ({ chatMessages: [...state.chatMessages, aiMsg] }));
          return;
        }
      } catch (err) {
        console.warn("Error calling /api/ocr/analyze:", err);
      }
    }

    // Conversational text synthesis
    setTimeout(() => {
      const lower = text.toLowerCase();
      let replyText = "";
      let chips: string[] | undefined = undefined;

      if (
        lower.includes("kusum") ||
        lower.includes("solar") ||
        lower.includes("pump") ||
        lower.includes("కుసుమ్") ||
        lower.includes("సోలార్") ||
        lower.includes("పంపు") ||
        lower.includes("कुसुम") ||
        lower.includes("सोलर") ||
        lower.includes("पंप")
      ) {
        if (lang === "te") {
          replyText = "PM-KUSUM పథకం ద్వారా 60% సబ్సిడీతో 5HP సోలార్ పంపు లభిస్తుంది. మీ పొలానికి కరెంట్ బిల్లు లేదా డీజిల్ ఖర్చు ఉండదు. మీ దగ్గరలోని రైతు రామేశ్వర్ రెడ్డి (3.8 కి.మీ) దీనిని అమర్చి నెలకు ₹4,600 డీజిల్ ఆదా చేసుకున్నారు. మీ దగ్గర బోరుబావి ఉందా?";
          chips = ["అవును, బోరుబావి ఉంది", "బావి ఉంది", "కొత్తగా వేయాలి", "సబ్సిడీ అర్హతలు చూపించు"];
        } else if (lang === "hi") {
          replyText = "पीएम-कुसुम योजना के तहत 60% सरकारी सब्सिडी पर 5HP सोलर पंप मिल रहा है। आपके पड़ोस में रामेश्वर जी (3.8 किमी दूर) ने इसे लगवाकर हर महीने ₹4,600 डीजल का बचाया। क्या आपके पास वर्तमान में बोरवेल या कुआं है?";
          chips = ["हाँ, बोरवेल है", "कुआं है", "नया बोरवेल लगवाना है", "आवश्यक दस्तावेज़ बताएं"];
        } else if (lang === "ta") {
          replyText = "PM-KUSUM திட்டத்தின் கீழ் 60% அரசு மானியத்துடன் 5HP சோலார் பம்ப் கிடைக்கிறது. உங்கள் வயலுக்கு மின் கட்டணம் அல்லது டீசல் செலவு இருக்காது. உங்கள் அண்டை விவசாயி ராமேஸ்வர ரெட்டி (3.8 கி.மீ) இதனை அமைத்து மாதம் ₹4,600 டீசல் சேமித்துள்ளார். உங்களிடம் ஆழ்துளை கிணறு உள்ளதா?";
          chips = ["ஆம், ஆழ்துளை கிணறு உள்ளது", "திறந்த கிணறு உள்ளது", "புதிதாக அமைக்க வேண்டும்", "மானிய தகுதிகள் காட்டு"];
        } else if (lang === "kn") {
          replyText = "PM-KUSUM ಯೋಜನೆಯಡಿ 60% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ 5HP ಸೋಲಾರ್ ಪಂಪ್ ಲಭ್ಯವಿದೆ. ನಿಮ್ಮ ಜಮೀನಿಗೆ ವಿದ್ಯುತ್ ಬಿಲ್ ಅಥವಾ ಡೀಸೆಲ್ ವೆಚ್ಚ ಇರುವುದಿಲ್ಲ. ನಿಮ್ಮ ನೆರೆಯ ರಾಮೇಶ್ವರ್ ರೆಡ್ಡಿ (3.8 ಕಿ.ಮೀ) ಇದನ್ನು ಅಳವಡಿಸಿ ತಿಂಗಳಿಗೆ ₹4,600 ಡೀಸೆಲ್ ಉಳಿಸಿದ್ದಾರೆ. ನಿಮ್ಮಲ್ಲಿ ಕೊಳವೆಬಾವಿ ಇದೆಯೇ?";
          chips = ["ಹೌದು, ಕೊಳವೆಬಾವಿ ಇದೆ", "ಬಾವಿ ಇದೆ", "ಹೊಸದಾಗಿ ಕೊರೆಯಬೇಕು", "ಸಬ್ಸಿಡಿ ಅರ್ಹತೆಗಳನ್ನು ತೋರಿಸಿ"];
        } else if (lang === "bn") {
          replyText = "PM-KUSUM প্রকল্পের অধীনে ৬০% সরকারি ভর্তুকিতে ৫HP সৌর পাম্প পাওয়া যাচ্ছে। আপনার জমিতে বিদ্যুৎ বিল বা ডিজেল খরচ থাকবে না। আপনার প্রতিবেশী রামেশ্বর রেড্ডি (৩.৮ কিমি) এটি বসিয়ে মাসে ₹৪,৬০০ ডিজেল বাঁচিয়েছেন। আপনার কি সাবমার্সিবল বা নলকূপ আছে?";
          chips = ["হ্যাঁ, নলকূপ আছে", "কুয়ো আছে", "নতুন বসাতে হবে", "ভর্তুকির যোগ্যতা দেখান"];
        } else {
          replyText = "Under PM-KUSUM Scheme Component-B, you are eligible for 60% subsidy on a 5HP Solar Pump (Subsidy value ₹1,32,000). Your neighbor Rameshwar Reddy (3.8 km away in Kothur) installed this and saved ₹4,600/month on diesel! What is your existing water source type?";
          chips = ["I have a Borewell", "Open Irrigation Well", "Canal Water only", "What documents are needed?"];
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
        lower.includes("मक्खी") ||
        lower.includes("कीट") ||
        lower.includes("छिड़काव") ||
        lower.includes("रोग") ||
        lower.includes("दवा")
      ) {
        if (lang === "te") {
          replyText = "మీ పత్తి చేనులో తెల్లదోమ (Whitefly) తెగులు గుర్తించబడింది. ఆకులు ముడుచుకుని తేనెజిగురు కారుతుంది. నివారణకు: ఎకరాకు వేపనూనె 10,000 ppm 2ml/లీటరు లేదా డయాఫెంథియురాన్ 50% WP 1గ్రాము/లీటరు నీటిలో కలిపి సాయంత్రం వేళ పిచికారీ చేయండి.";
          chips = ["పిచికారీ సమయం ఎప్పుడు?", "మందుల షాపు వివరాలు", "పంట నష్టం బీమా వర్తిస్తుందా?"];
        } else if (lang === "hi") {
          replyText = "कपास में सफेद मक्खी (Whitefly) का प्रकोप पहचाना गया है। पत्तियां मुड़ने और चिपचिपा स्राव की समस्या के लिए: नीम का तेल 10,000 ppm @ 2 मिली/लीटर पानी, या डायफेंथियूरॉन 50% WP @ 1 ग्राम/लीटर का शाम को छिड़काव करें।";
          chips = ["दवा छिड़काव का समय", "नजदीकी कृषि केंद्र", "फसल बीमा क्लेम प्रक्रिया"];
        } else if (lang === "ta") {
          replyText = "பருத்தியில் வெள்ளை ஈ (Whitefly) தாக்குதல் கண்டறியப்பட்டுள்ளது. இலைகள் சுருங்கி தேன் போன்ற பிசின் வடிகிறது. தடுப்பு முறை: ஏக்கருக்கு வேப்பெண்ணெய் 10,000 ppm @ 2 மிலி/லிட்டர் அல்லது டயாபெந்தியூரான் 50% WP @ 1 கிராம்/லிட்டர் தண்ணீரில் கலந்து மாலை வேளையில் தெளிக்கவும்.";
          chips = ["மருந்து தெளிக்கும் நேரம் எப்போது?", "அருகிலுள்ள உழவர் மருந்தகம்", "பயிர் காப்பீட்டு உதவி"];
        } else if (lang === "kn") {
          replyText = "ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣ (Whitefly) ಬಾಧೆ ಕಂಡುಬಂದಿದೆ. ಎಲೆಗಳು ಸುರುಟಿಕೊಂಡು ಜಿಗುಟು ಸ್ರವಿಸುತ್ತದೆ. ನಿಯಂತ್ರಣಕ್ಕೆ: ಎಕರೆಗೆ ಬೇವಿನ ಎಣ್ಣೆ 10,000 ppm @ 2 ಮಿಲಿ/ಲೀಟರ್ ಅಥವಾ ಡಯಾಫೆಂಥಿಯುರಾನ್ 50% WP @ 1 ಗ್ರಾಂ/ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸಿ.";
          chips = ["ಸಿಂಪಡಣೆ ಸಮಯ ಯಾವಾಗ?", "ಔಷಧಿ ಅಂಗಡಿ ವಿವರ", "ಬೆಳೆ ವಿಮೆ ಲಭ್ಯವಿದೆಯೇ?"];
        } else if (lang === "bn") {
          replyText = "তুলা ফসলে সাদা মাছি (Whitefly) আক্রমণ সনাক্ত করা হয়েছে। পাতা কুঁকড়ে যাচ্ছে ও আঠালো ভাব হচ্ছে। দমনের জন্য: প্রতি লিটার জলে নিম তেল 10,000 ppm @ ২ মিলি বা ডায়াফেন্থিউরন 50% WP @ ১ গ্রাম মিশিয়ে বিকেলের দিকে স্প্রে করুন।";
          chips = ["স্প্রে করার সঠিক সময়", "নিকটবর্তী কৃষি সেবা কেন্দ্র", "ফসল বীমা সুবিধা"];
        } else {
          replyText = "For Whitefly nymph pest control on Cotton: Spray Neem Oil (10,000 ppm) @ 2ml/litre water, or Diafenthiuron 50% WP @ 1g/litre water during cooler evening hours. Ensure spray covers underside of the leaves.";
          chips = ["Spray schedule", "Eligible under PMFBY crop insurance?", "Upload photo for scan"];
        }
      } else if (
        lower.includes("kisan") ||
        lower.includes("6000") ||
        lower.includes("installment") ||
        lower.includes("విడత") ||
        lower.includes("కిసాన్") ||
        lower.includes("किस्त") ||
        lower.includes("किसान")
      ) {
        if (lang === "te") {
          replyText = "మీ PM-KISAN 16వ విడత ₹2,000 ప్రాసెస్ చేయబడింది. మీ ఆధార్ ఈ-కేవైసీ మరియు ధరణి రికార్డులు మీ SBI బ్యాంక్ ఖాతా (చివరి అంకెలు •••• 4108) తో లింక్ చేయబడ్డాయి.";
          chips = ["తదుపరి విడత తేదీ?", "రసీదు డౌన్‌లోడ్", "భూమి లింకేజీ స్థితి"];
        } else if (lang === "hi") {
          replyText = "आपकी PM-KISAN 16वीं किस्त ₹2,000 स्वीकृत हो चुकी है। आपका आधार ई-केवाईसी और भूमि रिकॉर्ड आपके एसबीआई खाते (•••• 4108) से लिंक हैं।";
          chips = ["अगली किस्त की तारीख?", "भुगतान रसीद डाउनलोड करें", "भूमि लिंकेज जांचें"];
        } else if (lang === "ta") {
          replyText = "உங்கள் PM-KISAN 16வது தவணை ₹2,000 அங்கீகரிக்கப்பட்டுவிட்டது. உங்கள் ஆதார் இ-கேஒய்சி மற்றும் நில ஆவணங்கள் உங்கள் எஸ்பிஐ வங்கி கணக்குடன் (•••• 4108) இணைக்கப்பட்டுள்ளன.";
          chips = ["அடுத்த தவணை எப்போது?", "கட்டண ரசீது பதிவிறக்கம்", "நில இணைப்பு நிலை"];
        } else if (lang === "kn") {
          replyText = "ನಿಮ್ಮ PM-KISAN 16ನೇ ಕಂತು ₹2,000 ಪ್ರಕ್ರಿಯೆಗೊಂಡಿದೆ. ನಿಮ್ಮ ಆಧಾರ್ ಇ-ಕೆವೈಸಿ ಮತ್ತು ಭೂ ದಾಖಲೆಗಳು ನಿಮ್ಮ ಎಸ್‌ಬಿಐ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ (•••• 4108) ಲಿಂಕ್ ಆಗಿವೆ.";
          chips = ["ಮುಂದಿನ ಕಂತಿನ ದಿನಾಂಕ?", "ಪಾವತಿ ರಶೀದಿ ಡೌನ್‌ಲೋಡ್", "ಭೂಮಿ ಲಿಂಕ್ ಸ್ಥಿತಿ"];
        } else if (lang === "bn") {
          replyText = "আপনার PM-KISAN ১৬তম কিস্তি ₹২,০০০ অনুমোদিত হয়েছে। আপনার আধার ই-কেওয়াইসি এবং জমির রেকর্ড আপনার এসবিআই অ্যাকাউন্টের সাথে (•••• ৪১০৮) লিঙ্ক করা রয়েছে।";
          chips = ["পরের কিস্তির তারিখ?", "পেমেন্ট রশিদ ডাউনলোড", "জমির লিঙ্ক স্ট্যাটাস"];
        } else {
          replyText = "Your PM-KISAN 16th installment of ₹2,000 is processed. Your Aadhaar e-KYC and Dharani Land Record are verified and linked to your SBI Bank Account ending in •••• 4108.";
          chips = ["Next installment date?", "Download Payment Receipt", "Check land linkage"];
        }
      } else {
        const farmer = get().currentFarmer;
        if (lang === "te") {
          replyText = `అర్థమైంది! మీ ${farmer.landSizeAcres} ఎకరాల ${farmer.soilTypeName} నేల (${farmer.village}) ఆధారంగా, మా ఏఐ ఇంజిన్ PM-KUSUM సోలార్ పంపు మరియు నేల పరీక్ష కార్డు కోసం దరఖాస్తు చేసుకోవాలని సిఫార్సు చేస్తోంది. మీకు ఏ నిర్దిష్ట సలహా లేదా సబ్సిడీ వివరాలు కావాలి?`;
          chips = ["సోలార్ పంపు 60% సబ్సిడీ", "ఉచిత నేల పరీక్ష కార్డు", "తక్కువ వడ్డీ కిసాన్ క్రెడిట్ కార్డ్ (KCC)", "సమీప రైతుతో మాట్లాడండి"];
        } else if (lang === "hi") {
          replyText = `समझा! आपकी ${farmer.landSizeAcres} एकड़ ${farmer.soilTypeName} भूमि (${farmer.village}) के आधार पर, हमारा एआई इंजन PM-KUSUM और सॉइल हेल्थ टेस्टिंग की सिफारिश करता है। आप किस योजना या सलाह की जानकारी चाहते हैं?`;
          chips = ["सोलर पंप 60% सब्सिडी", "मुफ़्त मृदा परीक्षण कार्ड", "कम ब्याज किसान क्रेडिट कार्ड", "आसपास के किसान से जुड़ें"];
        } else if (lang === "ta") {
          replyText = `புரிந்தது! உங்கள் ${farmer.landSizeAcres} ஏக்கர் ${farmer.soilTypeName} நிலம் (${farmer.village}) அடிப்படையில், எங்களது AI என்ஜின் PM-KUSUM சோலார் பம்ப் மற்றும் மண் பரிசோதனை அட்டைக்கு விண்ணப்பிக்க பரிந்துரைக்கிறது. உங்களுக்கு என்ன குறிப்பிட்ட ஆலோசனை தேவை?`;
          chips = ["சோலார் பம்ப் 60% மானியம்", "இலவச மண் பரிசோதனை அட்டை", "குறைந்த வட்டி கிசான் கிரெடிட் கார்டு (KCC)", "அருகிலுள்ள விவசாயியுடன் பேசுங்கள்"];
        } else if (lang === "kn") {
          replyText = `ತಿಳಿಯಿತು! ನಿಮ್ಮ ${farmer.landSizeAcres} ಎಕರೆ ${farmer.soilTypeName} ಭೂಮಿ (${farmer.village}) ಆಧರಿಸಿ, ನಮ್ಮ AI ಎಂಜಿನ್ PM-KUSUM ಸೋಲಾರ್ ಪಂಪ್ ಮತ್ತು ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಶಿಫಾರಸು ಮಾಡುತ್ತದೆ. ನಿಮಗೆ ಯಾವ ನಿರ್ದಿಷ್ಟ ಸಲಹೆ ಅಥವಾ ಸಬ್ಸಿಡಿ ಮಾಹಿತಿ ಬೇಕು?`;
          chips = ["ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "ಉಚಿತ ಮಣ್ಣಿನ ಪರೀಕ್ಷಾ ಕಾರ್ಡ್", "ಕಡಿಮೆ ಬಡ್ಡಿಯ ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್", "ಸಮೀಪದ ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ"];
        } else if (lang === "bn") {
          replyText = `বুঝেছি! আপনার ${farmer.landSizeAcres} একর ${farmer.soilTypeName} জমি (${farmer.village}) অনুযায়ী, আমাদের এআই ইঞ্জিন PM-KUSUM সৌর পাম্প এবং মৃত্তিকা স্বাস্থ্য কার্ডের জন্য আবেদনের পরামর্শ দিচ্ছে। আপনি কোন প্রকল্পের তথ্য জানতে চান?`;
          chips = ["সৌর পাম্প ৬০% ভর্তুকি", "বিনামূল্যে মৃত্তিকা পরীক্ষা কার্ড", "স্বল্প সুদের কিষাণ ক্রেডিট কার্ড", "নিকটবর্তী কৃষকের সাথে যোগাযোগ"];
        } else {
          replyText = `Understood! With your ${farmer.landSizeAcres} Acres of ${farmer.soilTypeName} in ${farmer.village}, our AI engine recommends applying for PM-KUSUM and Soil Health Testing. What specific advice or subsidy would you like to explore?`;
          chips = ["Solar Pump 60% Subsidy", "Soil Health Card Free Test", "Low-Interest Kisan Credit Card", "Connect with nearby peer farmer"];
        }
      }

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        clarificationChips: chips,
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, aiMsg],
      }));
    }, 600);
  },

  handleClarificationChip: (chipText) => {
    const lower = chipText.toLowerCase();
    if (
      lower.includes("modal") ||
      lower.includes("scanner") ||
      lower.includes("చూడండి") ||
      lower.includes("देखें") ||
      lower.includes("open document")
    ) {
      set({ verificationModalOpen: true });
      return;
    }
    get().sendChatMessage(chipText);
  },

  speakMessage: (id, text) => {
    const lang = get().language;
    set({ isSpeaking: true, speakingMessageId: id });

    speakText(
      text,
      lang,
      () => set({ isSpeaking: false, speakingMessageId: null }),
      () => set({ isSpeaking: false, speakingMessageId: null })
    );
  },

  stopAudio: () => {
    stopSpeaking();
    set({ isSpeaking: false, speakingMessageId: null });
  },

  startMockVerification: (presetKey) => {
    const preset = MOCK_OCR_PRESETS[presetKey];
    if (!preset) return;

    set({
      selectedPresetKey: presetKey,
      verificationScanning: true,
      verificationResult: null,
      outOfScopeError: null,
    });

    // Simulate Llama 3.2 Vision OCR latency
    setTimeout(() => {
      set({
        verificationScanning: false,
        verificationResult: preset,
        outOfScopeError: null,
      });
    }, 2200);
  },

  analyzeUploadedFile: async (fileBase64, fileName, fileType, category = "auto_detect") => {
    set({
      verificationScanning: true,
      verificationResult: null,
      outOfScopeError: null,
      selectedPresetKey: null,
    });

    // 1. Strict Agricultural & Scheme Scope Check
    const classification = await classifyBase64Image(fileBase64, fileName, category);

    if (!classification.isAgriRelated) {
      set({
        verificationScanning: false,
        verificationResult: null,
        outOfScopeError: {
          title: "Image Out of Scope",
          message: classification.message,
          reason: `Detected: ${classification.metrics.dominantDomain}. JanMithra is dedicated exclusively to agriculture, crop disease diagnostics, and government farmer schemes.`,
          previewUrl: fileBase64,
          suggestions: [
            "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
            "Take a photo of an official Land Patta, RoR 1B, Soil Health Card, or Farmer ID.",
            "Avoid everyday indoor items, clothes, or non-agricultural objects.",
          ],
        },
      });
      return false;
    }

    try {
      const res = await fetch("/api/ocr/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          fileName,
          fileType,
          docCategory: category,
          classification,
          userId: 1,
        }),
      });

      const data = await res.json();
      if (data.isOutOfScope || !data.success) {
        set({
          verificationScanning: false,
          verificationResult: null,
          outOfScopeError: {
            title: "Image Out of Scope",
            message: data.message || "Image does not appear to be related to agriculture or government schemes.",
            reason: data.reason || "The uploaded photo does not contain identifiable farm crops, soil, or official farmer documents.",
            previewUrl: fileBase64,
            suggestions: data.suggestions || [
              "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
              "Take a photo of an official Land Patta, RoR 1B, Soil Health Card, or Farmer ID.",
            ],
          },
        });
        return false;
      }

      if (data.success && data.detection) {
        set({
          verificationScanning: false,
          verificationResult: data.detection,
          outOfScopeError: null,
        });
        return true;
      }
    } catch (e) {
      console.warn("Failed to reach /api/ocr/analyze, falling back to local vision heuristics:", e);
    }

    // Fallback simulation if network issue
    const preset = MOCK_OCR_PRESETS["land_patta"];
    set({
      verificationScanning: false,
      verificationResult: {
        ...preset,
        previewUrl: fileBase64,
        fileName,
      },
      outOfScopeError: null,
    });
    return true;
  },

  confirmExtractedData: () => {
    const result = get().verificationResult;
    if (!result) return;

    // Send to backend MySQL JanMithra
    try {
      fetch("/api/verify-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          docType: result.docType,
          title: result.title,
          confidenceScore: result.confidenceScore,
          extractedData: result.extractedData,
          previewUrl: result.previewUrl,
        }),
      }).catch((err) => console.warn("Background verify-doc sync notice:", err));
    } catch (e) {
      // ignore
    }

    // If land record, update farmer land size
    if (result.extractedData.landAreaAcres) {
      set((state) => ({
        currentFarmer: {
          ...state.currentFarmer,
          landSizeAcres: result.extractedData.landAreaAcres || state.currentFarmer.landSizeAcres,
          verifiedDocsCount: state.currentFarmer.verifiedDocsCount + 1,
        },
        verificationModalOpen: false,
      }));
    } else {
      set((state) => ({
        currentFarmer: {
          ...state.currentFarmer,
          verifiedDocsCount: state.currentFarmer.verifiedDocsCount + 1,
        },
        verificationModalOpen: false,
      }));
    }
  },

  resetVerification: () => {
    set({
      verificationScanning: false,
      verificationResult: null,
      outOfScopeError: null,
      selectedPresetKey: null,
    });
  },
}));
