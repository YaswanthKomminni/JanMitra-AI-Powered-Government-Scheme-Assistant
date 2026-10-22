import type { SupportedLanguage } from "@/lib/i18n";
const scripts: Record<Exclude<SupportedLanguage, "en">, RegExp> = {
  te: /[\u0C00-\u0C7F]/g, hi: /[\u0900-\u097F]/g, ta: /[\u0B80-\u0BFF]/g,
  kn: /[\u0C80-\u0CFF]/g, bn: /[\u0980-\u09FF]/g,
};
/** Check explanatory prose, allowing names, numbers, URLs and original source excerpts. */
export function usesAnswerLanguage(text: string, language: SupportedLanguage): boolean {
  const prose = text.split(/\n---\n/)[0].replace(/https?:\/\/\S+|\[[A-Z]+\d+[^\]]*\]/g, "");
  const latin = (prose.match(/[a-z]/gi) || []).length;
  const regional = (prose.match(/[\u0900-\u0D7F]/g) || []).length;
  if (latin + regional === 0) return true; // Numeric source values need no translation.
  if (language === "en") return latin >= regional;
  const selected = (prose.match(scripts[language]) || []).length;
  return selected >= Math.min(12, Math.max(2, Math.ceil((latin + regional) * .3))) && selected >= regional * .8 && selected >= latin * .3;
}
export function preferredChatLanguage(saved: string | null | undefined, profile: string | undefined, current: SupportedLanguage): SupportedLanguage {
  const valid = (v: unknown): v is SupportedLanguage => typeof v === "string" && ["en","te","hi","ta","kn","bn"].includes(v);
  return valid(saved) ? saved : valid(profile) ? profile : current;
}
export function answerChips(chips: string[], language: SupportedLanguage): string[] {
  if (language === "en") return chips;
  const localized = chips.filter(chip => (chip.match(scripts[language]) || []).length >= 2);
  const fallback = {
    te: ["అర్హత వివరించండి", "ఏ పత్రాలు అవసరం?", "తదుపరి చర్య ఏమిటి?"],
    hi: ["पात्रता समझाएँ", "कौन से दस्तावेज़ चाहिए?", "अगला कदम क्या है?"],
    ta: ["தகுதியை விளக்கவும்", "என்ன ஆவணங்கள் தேவை?", "அடுத்த படி என்ன?"],
    kn: ["ಅರ್ಹತೆ ವಿವರಿಸಿ", "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?", "ಮುಂದಿನ ಕ್ರಮ ಏನು?"],
    bn: ["যোগ্যতা ব্যাখ্যা করুন", "কী নথি লাগবে?", "পরের পদক্ষেপ কী?"],
  };
  return localized.length ? localized : fallback[language];
}
export function answerFailureNotice(reason: string | undefined, language: SupportedLanguage): string | undefined {
  if (!reason || language === "en") return reason;
  const quota = /usage limit|quota/i.test(reason);
  const copy = {
    te: ["AI సేవ వినియోగ పరిమితి చేరుకుంది. కోటా లేదా మరో సేవ కనెక్షన్ సరిచూసి మళ్లీ ప్రయత్నించండి. ప్రస్తుతం పరిమిత స్థానిక మార్గదర్శకం చూపిస్తున్నాం.", "AI సమాధానం పూర్తికాలేదు. అందుబాటులో ఉన్న స్థానిక సమాచారం చూపిస్తున్నాం; కనెక్షన్ వివరాలను మోడల్ నివేదికలో చూడండి."],
    hi: ["AI सेवा की उपयोग सीमा पूरी हो गई है। कोटा या दूसरी सेवा का कनेक्शन जाँचकर फिर प्रयास करें। अभी सीमित स्थानीय मार्गदर्शन दिखाया गया है।", "AI उत्तर पूरा नहीं हुआ। उपलब्ध स्थानीय जानकारी दिखाई गई है; कनेक्शन का विवरण मॉडल रिपोर्ट में देखें।"],
    ta: ["AI சேவையின் பயன்பாட்டு வரம்பு எட்டப்பட்டது. ஒதுக்கீடு அல்லது மற்றொரு சேவை இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும். இப்போது வரையறுக்கப்பட்ட உள்ளூர் வழிகாட்டல் காட்டப்படுகிறது.", "AI பதில் முழுமையடையவில்லை. கிடைக்கும் உள்ளூர் தகவல் காட்டப்படுகிறது; மாதிரி அறிக்கையில் இணைப்பு விவரங்களைப் பார்க்கவும்."],
    kn: ["AI ಸೇವೆಯ ಬಳಕೆ ಮಿತಿ ತಲುಪಿದೆ. ಕೋಟಾ ಅಥವಾ ಬೇರೆ ಸೇವೆಯ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. ಈಗ ಸೀಮಿತ ಸ್ಥಳೀಯ ಮಾರ್ಗದರ್ಶನ ನೀಡಲಾಗಿದೆ.", "AI ಉತ್ತರ ಪೂರ್ಣವಾಗಿಲ್ಲ. ಲಭ್ಯ ಸ್ಥಳೀಯ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ; ಸಂಪರ್ಕ ವಿವರ ಮಾದರಿ ವರದಿಯಲ್ಲಿ ನೋಡಿ."],
    bn: ["AI পরিষেবার ব্যবহারের সীমা শেষ হয়েছে। কোটা বা অন্য পরিষেবার সংযোগ দেখে আবার চেষ্টা করুন। এখন সীমিত স্থানীয় নির্দেশনা দেখানো হচ্ছে।", "AI উত্তর সম্পূর্ণ হয়নি। উপলব্ধ স্থানীয় তথ্য দেখানো হয়েছে; মডেল রিপোর্টে সংযোগের বিবরণ দেখুন।"],
  };
  return copy[language][quota ? 0 : 1];
}
