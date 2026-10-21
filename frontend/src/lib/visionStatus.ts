import type { SupportedLanguage } from "@/lib/i18n";
import type { VisionAnalysisResult } from "@/lib/visionLlm";

export function visionStatusMessage(status: VisionAnalysisResult["visionStatus"], lang: SupportedLanguage): string {
  if (!status || status.state !== "local") return "";
  const codes = status.failures?.map(f => f.code) || [];
  const kind = codes.includes("auth") ? "auth" : codes.includes("quota") ? "quota" : "unavailable";
  const messages = {
    en: { auth: "The AI connection was rejected. Check the configured API key and its permissions.", quota: "The AI service reached its usage limit. Check its quota or enable another provider.", unavailable: "AI image reading is unavailable. Only locally readable text is included below." },
    te: { auth: "AI కనెక్షన్ అనుమతించబడలేదు. API కీ, అనుమతులను తనిఖీ చేయండి.", quota: "AI వినియోగ పరిమితి చేరుకుంది. కోటాను తనిఖీ చేయండి లేదా మరో సేవను ప్రారంభించండి.", unavailable: "AI చిత్రం పఠనం అందుబాటులో లేదు. స్థానికంగా చదవగలిగిన సమాచారం మాత్రమే ఇవ్వబడింది." },
    hi: { auth: "AI कनेक्शन अस्वीकृत हुआ। API कुंजी और अनुमतियाँ जाँचें।", quota: "AI सेवा की उपयोग सीमा पूरी हुई। कोटा जाँचें या दूसरी सेवा जोड़ें।", unavailable: "AI से चित्र पढ़ना उपलब्ध नहीं है। केवल स्थानीय रूप से पढ़ा गया पाठ शामिल है।" },
    ta: { auth: "AI இணைப்பு மறுக்கப்பட்டது. API விசையையும் அனுமதிகளையும் சரிபார்க்கவும்.", quota: "AI பயன்பாட்டு வரம்பு எட்டப்பட்டது. ஒதுக்கீட்டைச் சரிபார்க்கவும் அல்லது வேறு சேவையை இயக்கவும்.", unavailable: "AI பட வாசிப்பு கிடைக்கவில்லை. உள்ளூரில் படிக்க முடிந்த தகவல் மட்டுமே சேர்க்கப்பட்டுள்ளது." },
    kn: { auth: "AI ಸಂಪರ್ಕ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. API ಕೀ ಮತ್ತು ಅನುಮತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.", quota: "AI ಬಳಕೆಯ ಮಿತಿ ತಲುಪಿದೆ. ಕೋಟಾ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಇನ್ನೊಂದು ಸೇವೆ ಬಳಸಿ.", unavailable: "AI ಚಿತ್ರ ಓದುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. ಸ್ಥಳೀಯವಾಗಿ ಓದಿದ ಮಾಹಿತಿ ಮಾತ್ರ ಸೇರಿಸಲಾಗಿದೆ." },
    bn: { auth: "AI সংযোগ প্রত্যাখ্যাত হয়েছে। API কী ও অনুমতি যাচাই করুন।", quota: "AI ব্যবহারের সীমা শেষ হয়েছে। কোটা যাচাই করুন বা অন্য পরিষেবা চালু করুন।", unavailable: "AI দিয়ে ছবি পড়া যাচ্ছে না। শুধু স্থানীয়ভাবে পড়া তথ্য দেওয়া হয়েছে।" },
  };
  return (messages[lang] || messages.en)[kind];
}
