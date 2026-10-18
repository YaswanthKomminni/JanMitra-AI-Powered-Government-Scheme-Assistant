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

        // Farmer Profile inquiry response
        if (
          text.includes("రైతు ప్రొఫైల్") ||
          text.includes("Farmer Profile") ||
          text.includes("किसान प्रोफ़ाइल") ||
          text.includes("விவசாயி சுயவிவரம்") ||
          text.includes("ರೈತರ ಪ್ರೊಫೈಲ್") ||
          text.includes("কৃষক প্রোফাইল")
        ) {
          const formatted = formatFarmerProfileReply(get().currentFarmer, lang);
          return {
            ...msg,
            text: formatted.text,
            clarificationChips: formatted.chips,
          };
        }

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

        // PM-KISAN installment
        if (
          text.includes("PM-KISAN") ||
          text.includes("16వ విడత") ||
          text.includes("16वीं किस्त") ||
          text.includes("16வது தவணை") ||
          text.includes("16ನೇ ಕಂತು") ||
          text.includes("১৬তম কিস্তি")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "మీ PM-KISAN 16వ విడత ₹2,000 ప్రాసెస్ చేయబడింది. మీ ఆధార్ ఈ-కేవైసీ మరియు ధరణి రికార్డులు మీ SBI బ్యాంక్ ఖాతా (చివరి అంకెలు •••• 4108) తో లింక్ చేయబడ్డాయి.",
              clarificationChips: ["తదుపరి విడత తేదీ?", "రసీదు డౌన్‌లోడ్", "భూమి లింకేజీ స్థితి"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "आपकी PM-KISAN 16वीं किस्त ₹2,000 स्वीकृत हो चुकी है। आपका आधार ई-केवाईसी और भूमि रिकॉर्ड आपके एसबीआई खाते (•••• 4108) से लिंक हैं।",
              clarificationChips: ["अगली किस्त की तारीख?", "भुगतान रसीद डाउनलोड करें", "भूमि लिंकेज जांचें"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: "உங்கள் PM-KISAN 16வது தவணை ₹2,000 அங்கீகரிக்கப்பட்டுவிட்டது. உங்கள் ஆதார் இ-கேஒய்சி மற்றும் நில ஆவணங்கள் உங்கள் எஸ்பிஐ வங்கி கணக்குடன் (•••• 4108) இணைக்கப்பட்டுள்ளன.",
              clarificationChips: ["அடுத்த தவணை எப்போது?", "கட்டண ரசீது பதிவிறக்கம்", "நில இணைப்பு நிலை"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: "ನಿಮ್ಮ PM-KISAN 16ನೇ ಕಂತು ₹2,000 ಪ್ರಕ್ರಿಯೆಗೊಂಡಿದೆ. ನಿಮ್ಮ ಆಧಾರ್ ಇ-ಕೆವೈಸಿ ಮತ್ತು ಭೂ ದಾಖಲೆಗಳು ನಿಮ್ಮ ಎಸ್‌ಬಿಐ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ (•••• 4108) ಲಿಂಕ್ ಆಗಿವೆ.",
              clarificationChips: ["ಮುಂದಿನ ಕಂತಿನ ದಿನಾಂಕ?", "ಪಾವತಿ ರಶೀದಿ ಡೌನ್‌ಲೋಡ್", "ಭೂಮಿ ಲಿಂಕ್ ಸ್ಥಿತಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: "আপনার PM-KISAN ১৬তম কিস্তি ₹২,০০০ অনুমোদিত হয়েছে। আপনার আধার ই-কেওয়াইসি এবং জমির রেকর্ড আপনার এসবিআই অ্যাকাউন্টের সাথে (•••• ৪১০৮) লিঙ্ক করা রয়েছে।",
              clarificationChips: ["পরের কিস্তির তারিখ?", "পেমেন্ট রশিদ ডাউনলোড", "জমির লিঙ্ক স্ট্যাটাস"],
            };
          } else {
            return {
              ...msg,
              text: "Your PM-KISAN 16th installment of ₹2,000 is processed. Your Aadhaar e-KYC and Dharani Land Record are verified and linked to your SBI Bank Account ending in •••• 4108.",
              clarificationChips: ["Next installment date?", "Download Payment Receipt", "Check land linkage"],
            };
          }
        }

        // Greetings & Pleasantries
        if (
          (text.includes("నమస్కారం") && (text.includes("బాగున్నారా") || text.includes("ఎలా ఉన్నారు") || text.includes("వ్యవసాయ మిత్రుడిని"))) ||
          (text.includes("नमस्ते") && (text.includes("कैसे हैं") || text.includes("कृषि साथी") || text.includes("सलाहकार"))) ||
          (text.includes("வணக்கம்") && (text.includes("நலமாக") || text.includes("தோழன்"))) ||
          (text.includes("ನಮಸ್ಕಾರ") && (text.includes("ಹೇಗಿದ್ದೀರಿ") || text.includes("ಸಂಗಾತಿ"))) ||
          (text.includes("নমস্কার") && (text.includes("কেমন আছেন") || text.includes("সহায়ক"))) ||
          (text.includes("Namaste") && (text.includes("doing") || text.includes("companion")))
        ) {
          const farmer = get().currentFarmer;
          if (lang === "te") {
            return {
              ...msg,
              text: `నమస్కారం ${farmer.name || "రమేష్"} గారు! ఎలా ఉన్నారు? నేను మీ జనమిత్ర డిజిటల్ వ్యవసాయ మిత్రుడిని. కొత్తూరులో మీకున్న 3.5 ఎకరాల చేనులో పత్తి, మిర్చి పంటలు బాగున్నాయా? ఈరోజు మీ వ్యవసాయానికి లేదా ఏదైనా ప్రభుత్వ సబ్సిడీ పథకానికి సంబంధించి నేను ఏ విధంగా సహాయపడగలను?`,
              clarificationChips: ["నా వివరాలు చెప్పు", "సోలార్ పంపు 60% సబ్సిడీ", "పంట తెగులు సలహా", "PM-KISAN ₹6,000 స్థితి"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: `नमस्ते ${farmer.name || "रमेश"} जी! आप कैसे हैं? मैं आपका जनमित्रा कृषि सलाहकार हूँ। कोथुर में आपकी 3.5 एकड़ भूमि पर कपास और मिर्च की फसल कैसी है? आज मैं आपकी खेती या सरकारी योजनाओं में किस प्रकार सहायता कर सकता हूँ?`,
              clarificationChips: ["मेरी जानकारी बताएं", "सोलर पंप 60% सब्सिडी", "फसल कीट सलाह", "PM-KISAN स्थिति"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: `வணக்கம் ${farmer.name || "ரமேஷ்"} அவர்களே! நலமாக உள்ளீர்களா? நான் உங்கள் ஜனமித்ரா விவசாய ஆலோசகர். கொத்தூரில் உங்கள் 3.5 ஏக்கர் நிலத்தில் பயிர்கள் நலமா? இன்று உங்கள் விவசாயத்திற்கு நான் எவ்வாறு உதவ முடியும்?`,
              clarificationChips: ["என் விவரங்கள் சொல்", "சோலார் பம்ப் 60% மானியம்", "பூச்சி மேலாண்மை", "PM-KISAN நிலை"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: `ನಮಸ್ಕಾರ ${farmer.name || "ರಮೇಶ್"} ಅವರೇ! ಹೇಗಿದ್ದೀರಿ? ನಾನು ನಿಮ್ಮ ಜನಮಿತ್ರ ಕೃಷಿ ಮಿತ್ರ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ 3.5 ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಬೆಳೆಗಳು ಚೆನ್ನಾಗಿವೆಯೇ? ಇಂದು ನಿಮ್ಮ ಕೃಷಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
              clarificationChips: ["ನನ್ನ ವಿವರ ತಿಳಿಸಿ", "ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ", "PM-KISAN ಸ್ಥಿತಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: `নমস্কার ${farmer.name || "রমেশ"} বাবু! কেমন আছেন? আমি আপনার জনমিত্র কৃষি সহকারী। কোথুরে আপনার ৩.৫ একর জমিতে ফসলের অবস্থা কেমন? আজ আপনার চাষের কাজে আমি কীভাবে সাহায্য করতে পারি?`,
              clarificationChips: ["আমার তথ্য বলুন", "সৌর পাম্প ৬০% ভর্তুকি", "কীটপতঙ্গ পরামর্শ", "PM-KISAN স্থিতি"],
            };
          } else {
            return {
              ...msg,
              text: `Namaste ${farmer.name || "Ramesh"} Ji! How are you doing? I am your JanMithra farm companion. How are the cotton and chilli crops on your 3.5 Acres in Kothur? How can I assist your farming or scheme applications today?`,
              clarificationChips: ["Tell me about me", "Apply for PM-KUSUM 60%", "Pest control advice", "Check PM-KISAN ₹6,000 status"],
            };
          }
        }

        // Kisan Credit Card / Loans
        if (
          text.includes("కిసాన్ క్రెడిట్ కార్డ్") ||
          text.includes("किसान क्रेडिट कार्ड") ||
          text.includes("Kisan Credit Card") ||
          text.includes("రాయితీ వడ్డీకే బ్యాంకు పంట రుణం") ||
          text.includes("रियायती ब्याज दर पर कृषि ऋण")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "రమేష్ గారు, మీకున్న 3.5 ఎకరాల నల్లరేగడి పట్టా భూమి ఆధారంగా కిసాన్ క్రెడిట్ కార్డ్ (KCC) ద్వారా కేవలం 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం పొందవచ్చు. ఎకరాకు సుమారు రూ. 45,000 నుండి రూ. 60,000 వరకు రుణం మంజూరవుతుంది. మీ ధరణి పట్టాదారు పాస్ పుస్తకం మరియు ఆధార్ కార్డు సమర్పిస్తే మీ స్థానిక బ్యాంకులోనే ఇది సులభంగా పూర్తవుతుంది. దరఖాస్తు విధానం చెప్పమంటారా?",
              clarificationChips: ["KCC వడ్డీ రేటు ఎంత?", "ఏ బ్యాంకులో దరఖాస్తు చేయాలి?", "కావలసిన పత్రాలు", "దరఖాస్తు ఫారం"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "रमेश जी, आपकी 3.5 एकड़ काली मिट्टी की भूमि के आधार पर आप किसान क्रेडिट कार्ड (KCC) द्वारा मात्र 4% रियायती ब्याज दर पर कृषि ऋण प्राप्त कर सकते हैं। प्रति एकड़ ₹45,000 से ₹60,000 तक का ऋण स्वीकृत होता है। धरणी पट्टा पासबुक और आधार कार्ड देकर अपनी स्थानीय बैंक शाखा से तुरंत आवेदन कर सकते हैं। क्या आप आवेदन प्रक्रिया जानना चाहते हैं?",
              clarificationChips: ["KCC ब्याज दर", "आवश्यक दस्तावेज़", "नजदीकी बैंक शाखा", "ऋण आवेदन"],
            };
          } else {
            return {
              ...msg,
              text: "Ramesh Ji, with your 3.5 Acres of verified farmland in Kothur, you can avail a Kisan Credit Card (KCC) crop loan at a concessional interest rate of just 4%! You are eligible for approximately ₹45,000 to ₹60,000 per acre. Submit your Dharani Patta Passbook and Aadhaar at your local bank to get started.",
              clarificationChips: ["What documents are needed?", "Check KCC interest rate", "Eligible banks in Kothur", "Apply now"],
            };
          }
        }

        // Smart empathetic fallback
        if (
          text.includes("శ్రద్ధగా గమనించాను") ||
          text.includes("అర్థమైంది! మీ") ||
          text.includes("समझा! आपकी") ||
          text.includes("समझ लिया है") ||
          text.includes("புரிந்தது! உங்கள்") ||
          text.includes("ತಿಳಿಯಿತು! ನಿಮ್ಮ") ||
          text.includes("ಬುঝেছি! আপনার") ||
          text.includes("Understood! With your") ||
          text.includes("noted your question")
        ) {
          const farmer = get().currentFarmer;
          if (lang === "te") {
            return {
              ...msg,
              text: `నమస్కారం ${farmer.name || "రమేష్"} గారు! మీ ప్రశ్నను శ్రద్ధగా గమనించాను. కొత్తూరులో మీకున్న ${farmer.landSizeAcres} ఎకరాల నల్లరేగడి భూమి మరియు పత్తి, మిర్చి పంటలను దృష్టిలో ఉంచుకుని నేను సహాయం చేస్తాను. మీకు పంటల సాగు పద్ధతులు, పురుగుమందులు, ఎరువుల మోతాదు లేదా ప్రభుత్వం అందించే సబ్సిడీ పథకాలలో ఏ అంశంపై సలహా కావాలో అడగండి, వెంటనే సరైన పరిష్కారం అందిస్తాను!`,
              clarificationChips: ["సోలార్ పంపు 60% సబ్సిడీ", "PM-KISAN డబ్బుల వివరాలు", "పంట తెగులు సలహా", "సమీప రైతులతో మాట్లాడండి"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: `नमस्ते ${farmer.name || "रमेश"} जी! मैंने आपका प्रश्न समझ लिया है। कोथुर में आपकी ${farmer.landSizeAcres} एकड़ काली मिट्टी और फसलों को ध्यान में रखते हुए मैं आपकी पूरी मदद करूँगा। आपको खेती की तकनीक, खाद, कीट नियंत्रण या सरकारी सब्सिडी योजनाओं में से किस विषय पर जानकारी चाहिए?`,
              clarificationChips: ["सोलर पंप 60% सब्सिडी", "PM-KISAN ₹6,000 स्थिति", "कीट नियंत्रण सलाह", "आसपास के किसान से जुड़ें"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: `வணக்கம் ${farmer.name || "ரமேஷ்"} அவர்களே! உங்கள் கேள்வியைப் புரிந்து கொண்டேன். கொத்தூரில் உங்கள் ${farmer.landSizeAcres} ஏக்கர் கரிசல் மண் நிலத்திற்கு பயனுள்ள அரசு திட்டங்கள் மற்றும் விவசாய ஆலோசனைகளை வழங்க நான் தயாராக உள்ளேன். உங்களுக்கு என்ன குறிப்பிட்ட வழிகாட்டுதல் தேவை?`,
              clarificationChips: ["சோலார் பம்ப் 60% மானியம்", "PM-KISAN தகுதி நிலை", "பூச்சி மேலாண்மை", "விவசாயியுடன் பேசுங்கள்"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: `ನಮಸ್ಕಾರ ${farmer.name || "ರಮೇಶ್"} ಅವರೇ! ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ ${farmer.landSizeAcres} ಎಕರೆ ಜಮೀನಿಗೆ ಸೂಕ್ತವಾದ ಕೃಷಿ ಮಾಹಿತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರಗಳನ್ನು ನೀಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ. ನಿಮಗೆ ಯಾವ ನಿರ್ದಿಷ್ಟ ಮಾಹಿತಿ ಬೇಕು?`,
              clarificationChips: ["ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "PM-KISAN ವಿವರಗಳು", "ಬೆಳೆ ಕೀಟ ಸಲಹೆ", "ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: `নমস্কার ${farmer.name || "রমেশ"} বাবু! আমি আপনার প্রশ্ন বুঝতে পেরেছি। কোথুরে আপনার ${farmer.landSizeAcres} একর জমির উপযোগী কৃষি পরামর্শ ও সরকারি প্রকল্পের সহায়তার জন্য আমি প্রস্তুত। আপনি কোন বিষয়ে বিস্তারিত জানতে চান?`,
              clarificationChips: ["সৌর পাম্প ৬০% ভর্তুকি", "PM-KISAN ₹৬,০০০ স্থিতি", "কীটপতঙ্গ নিয়ন্ত্রণ", "কৃষকের সাথে যোগাযোগ"],
            };
          } else {
            return {
              ...msg,
              text: `Namaste ${farmer.name || "Ramesh"} Ji! I have noted your question carefully. Considering your ${farmer.landSizeAcres} Acres of Black Soil and crops in ${farmer.village}, I am here to help with crop advisory, fertilizers, pest control, or government welfare subsidies. What specific information would you like to explore?`,
              clarificationChips: ["Solar Pump 60% Subsidy", "Check PM-KISAN ₹6,000", "Pest & Disease Advisory", "Connect with nearby peer farmers"],
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
        const farmer = get().currentFarmer;
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
        const farmer = get().currentFarmer;
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
        const farmer = get().currentFarmer;
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
      lower.includes("open document") ||
      lower.includes("మార్చు") ||
      lower.includes("update") ||
      lower.includes("अपडेट") ||
      lower.includes("மாற்று") ||
      lower.includes("ಬದಲಾಯಿಸಿ") ||
      lower.includes("পরিবর্তন") ||
      lower.includes("కార్డు స్కాన్") ||
      lower.includes("कार्ड स्कैन") ||
      lower.includes("soil card")
    ) {
      set({ verificationModalOpen: true });
      return;
    }
    if (
      lower.includes("సమీప రైతు") ||
      lower.includes("రైతులతో మాట్లాడండి") ||
      lower.includes("किसान से जुड़ें") ||
      lower.includes("விவசாயியுடன் பேசுங்கள்") ||
      lower.includes("ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ") ||
      lower.includes("কৃষকের সাথে") ||
      lower.includes("peer")
    ) {
      set({ activeTab: "peers" });
      return;
    }
    if (
      lower.includes("అన్ని పథకాలు") ||
      lower.includes("పాత్ పథకాలు") ||
      lower.includes("पात्र सरकारी योजनाएं") ||
      lower.includes("அனைத்து அரசு திட்டங்கள்") ||
      lower.includes("ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು") ||
      lower.includes("যোগ্য সরকারি প্রকল্প") ||
      lower.includes("eligible schemes")
    ) {
      set({ activeTab: "schemes" });
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
