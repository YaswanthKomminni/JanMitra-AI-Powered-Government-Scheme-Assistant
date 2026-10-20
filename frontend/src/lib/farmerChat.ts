import type { SupportedLanguage } from "@/lib/i18n";
import { GUEST_FARMER, SCHEMES_DATABASE, type FarmerProfile } from "@/lib/mockData";
import { semanticSearchSchemes } from "@/lib/aiCopilotService";
import { buildConversationMemory, classifyTextTurn, knownFarmerFacts, resolveConversationQuery, type ConversationMemory, type HistoryTurn } from "@/lib/conversationMemory";

const scopeMessages: Record<SupportedLanguage, { greeting: string; offTopic: string; schemeName: string; crop: string; chips: string[] }> = {
  en: { greeting: "Hello! I can help with farming and government welfare schemes. What would you like to know?", offTopic: "Please ask about agriculture or government welfare schemes. I can help with crop problems, eligibility, required documents and applications.", schemeName: "Which scheme do you mean? Tell me its name, or describe the support you need and your state.", crop: "I have your crop as", chips: ["Which schemes fit me?", "Help with my crop", "How do I apply?"] },
  te: { greeting: "నమస్కారం! వ్యవసాయం మరియు ప్రభుత్వ సంక్షేమ పథకాల గురించి సహాయం చేస్తాను. మీకు ఏమి తెలుసుకోవాలి?", offTopic: "దయచేసి వ్యవసాయం లేదా ప్రభుత్వ సంక్షేమ పథకాల గురించి అడగండి. పంట సమస్యలు, అర్హత, అవసరమైన పత్రాలు, దరఖాస్తు గురించి సహాయం చేస్తాను.", schemeName: "ఏ పథకం గురించి అడుగుతున్నారు? దాని పేరు చెప్పండి లేదా మీకు కావలసిన సహాయం, మీ రాష్ట్రం చెప్పండి.", crop: "మీ పంట వివరాలు", chips: ["నాకు ఏ పథకాలు?", "నా పంటకు సహాయం", "ఎలా దరఖాస్తు చేయాలి?"] },
  hi: { greeting: "नमस्ते! मैं खेती और सरकारी कल्याण योजनाओं में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?", offTopic: "कृपया खेती या सरकारी कल्याण योजनाओं के बारे में पूछें। मैं फसल की समस्या, पात्रता, जरूरी दस्तावेज़ और आवेदन में मदद कर सकता हूँ।", schemeName: "आप किस योजना के बारे में पूछ रहे हैं? उसका नाम बताएं या अपनी जरूरत और राज्य बताएं।", crop: "आपकी फसल की जानकारी", chips: ["मेरे लिए कौन सी योजनाएँ?", "फसल में मदद", "आवेदन कैसे करें?"] },
  ta: { greeting: "வணக்கம்! விவசாயம் மற்றும் அரசு நலத் திட்டங்கள் குறித்து உதவ முடியும். நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?", offTopic: "தயவுசெய்து விவசாயம் அல்லது அரசு நலத் திட்டங்கள் பற்றி கேளுங்கள். பயிர் பிரச்சினை, தகுதி, தேவையான ஆவணங்கள், விண்ணப்பம் ஆகியவற்றில் உதவுகிறேன்.", schemeName: "எந்தத் திட்டத்தைப் பற்றி கேட்கிறீர்கள்? அதன் பெயரை அல்லது உங்களுக்குத் தேவைப்படும் உதவி மற்றும் மாநிலத்தைச் சொல்லுங்கள்.", crop: "உங்கள் பயிர் விவரம்", chips: ["எனக்குப் பொருந்தும் திட்டங்கள்", "பயிருக்கு உதவி", "விண்ணப்பிப்பது எப்படி?"] },
  kn: { greeting: "ನಮಸ್ಕಾರ! ಕೃಷಿ ಮತ್ತು ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ನಿಮಗೆ ಏನು ತಿಳಿಯಬೇಕು?", offTopic: "ದಯವಿಟ್ಟು ಕೃಷಿ ಅಥವಾ ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ. ಬೆಳೆ ಸಮಸ್ಯೆ, ಅರ್ಹತೆ, ಅಗತ್ಯ ದಾಖಲೆಗಳು ಮತ್ತು ಅರ್ಜಿಯಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.", schemeName: "ಯಾವ ಯೋಜನೆಯ ಬಗ್ಗೆ ಕೇಳುತ್ತಿದ್ದೀರಿ? ಅದರ ಹೆಸರು ಅಥವಾ ನಿಮಗೆ ಬೇಕಾದ ಸಹಾಯ ಮತ್ತು ರಾಜ್ಯವನ್ನು ತಿಳಿಸಿ.", crop: "ನಿಮ್ಮ ಬೆಳೆಯ ಮಾಹಿತಿ", chips: ["ನನಗೆ ಯಾವ ಯೋಜನೆಗಳು?", "ಬೆಳೆಗೆ ಸಹಾಯ", "ಅರ್ಜಿ ಹೇಗೆ ಸಲ್ಲಿಸಲಿ?"] },
  bn: { greeting: "নমস্কার! কৃষি এবং সরকারি কল্যাণ প্রকল্প নিয়ে সাহায্য করতে পারি। আপনি কী জানতে চান?", offTopic: "অনুগ্রহ করে কৃষি বা সরকারি কল্যাণ প্রকল্প সম্পর্কে জিজ্ঞাসা করুন। ফসলের সমস্যা, যোগ্যতা, প্রয়োজনীয় নথি ও আবেদনে সাহায্য করব।", schemeName: "কোন প্রকল্পের কথা বলছেন? নাম বলুন, অথবা কী সহায়তা দরকার এবং আপনার রাজ্য জানান।", crop: "আপনার ফসলের তথ্য", chips: ["আমার জন্য কোন প্রকল্প?", "ফসলে সাহায্য", "কীভাবে আবেদন করব?"] },
};

/** Short, deterministic responses that should never invoke scheme matching or a cloud model. */
export function nonDomainChatReply(query: string, lang: SupportedLanguage, profile?: FarmerProfile | null, memory?: ConversationMemory) {
  const kind = classifyTextTurn(query, memory);
  if (kind !== "greeting" && kind !== "off_topic") return null;
  const localized = scopeMessages[lang];
  const crop = knownFarmerFacts(profile, memory).crop;
  return { text: kind === "greeting" ? `${localized.greeting}${crop ? `\n\n${localized.crop}: ${crop}.` : ""}` : localized.offTopic,
    chips: localized.chips };
}

const help: Record<SupportedLanguage, string> = {
  en: "Tell me your crop, district and the problem you are seeing, or the name of the government scheme. I can help with cultivation, soil, irrigation, crop problems and applications.",
  te: "మీ పంట, జిల్లా మరియు సమస్య వివరాలు లేదా ప్రభుత్వ పథకం పేరు చెప్పండి. సాగు, నేల, నీటిపారుదల, పంట సమస్యలు మరియు దరఖాస్తుల గురించి సహాయం చేస్తాను.",
  hi: "अपनी फसल, जिला और समस्या या सरकारी योजना का नाम बताएं। मैं खेती, मिट्टी, सिंचाई, फसल की समस्याओं और आवेदन में सहायता कर सकता हूँ।",
  ta: "உங்கள் பயிர், மாவட்டம் மற்றும் பிரச்சினை அல்லது அரசு திட்டத்தின் பெயரைக் கூறுங்கள். சாகுபடி, மண், பாசனம், பயிர் பிரச்சினைகள் மற்றும் விண்ணப்பங்களுக்கு உதவுகிறேன்.",
  kn: "ನಿಮ್ಮ ಬೆಳೆ, ಜಿಲ್ಲೆ ಮತ್ತು ಸಮಸ್ಯೆ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಯ ಹೆಸರನ್ನು ತಿಳಿಸಿ. ಕೃಷಿ, ಮಣ್ಣು, ನೀರಾವರಿ, ಬೆಳೆ ಸಮಸ್ಯೆಗಳು ಮತ್ತು ಅರ್ಜಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
  bn: "আপনার ফসল, জেলা ও সমস্যা অথবা সরকারি প্রকল্পের নাম বলুন। চাষ, মাটি, সেচ, ফসলের সমস্যা এবং আবেদনে সাহায্য করতে পারি।",
};

const knowledge = [
  { terms: /yellow|yellowing|chlorosis|పసుపు|పసుపు రంగు|पीली|पीलापन|மஞ்சள்|ಹಳದಿ|হলুদ/i,
    text: "Yellow leaves can result from waterlogging, nutrient imbalance, pests or disease. Check whether older or newer leaves are affected, look under leaves for insects, and check soil moisture. Avoid adding fertilizer or pesticide until the cause is clearer. Which crop is it, how old is it, and are the spots spreading?" },
  { terms: /irrigat|watering|water.*(?:crop|paddy|rice|cotton|plant)|నీరు|నీటిపారుదల|सिंचाई|पानी|பாசன|ನೀರಾವರಿ|সেচ/i,
    text: "Irrigation depends on the crop, growth stage, soil and recent rain. Check moisture in the root zone rather than watering on a fixed calendar. Keep drainage open and avoid prolonged waterlogging. Which crop and soil type do you have, and when did it last rain?" },
  { terms: /soil|fertili[sz]|urea|\bdap\b|nutrient|ఎరువు|నేల|मिट्टी|खाद|உரம்|ಮಣ್ಣು|সার/i,
    text: "Base fertilizer decisions on a soil test, the crop and its growth stage. A field photo cannot measure nitrogen, phosphorus, potassium or soil pH. Share your Soil Health Card values, crop, acreage and fertilizers already applied; I can help interpret them and identify what to ask your agricultural officer." },
  { terms: /pest|disease|insect|whitefl|aphid|blight|leaf.*spot|spray|pesticide|తెగులు|పురుగు|कीट|रोग|பூச்சி|ರೋಗ|পোকা/i,
    text: "To narrow down a crop problem, send a close-up of affected leaves, their undersides and the whole plant. Tell me the crop, age, affected area and when symptoms started. Check nearby plants and avoid mixing or applying pesticides before identifying the cause and checking the product label for that crop." },
  { terms: /seed|germinat|sowing|planting|విత్త|बीज|बुवाई|விதை|ಬೀಜ|বীজ/i,
    text: "Choose certified seed of a variety suited to your district, season, water availability and intended market. Check the label, lot number, germination information and expiry date. Sowing time, spacing and seed rate depend on the crop and variety. Which crop are you planning, and in which district?" },
  { terms: /compost|organic|manure|సేంద్రియ|కంపోస్ట్|जैविक|खाद बनाना|இயற்கை|ಸಾವಯವ|জৈব/i,
    text: "Use well-decomposed compost or manure and keep diseased plant material separate. Balance organic inputs with soil-test recommendations; immature manure can harm roots. Tell me your crop and the material available so I can suggest a practical composting or soil-improvement approach." },
  { terms: /weed|mulch|rotation|కలుపు|खरपतवार|களை|ಕಳೆ|আগাছা/i,
    text: "Control weeds early using timely hand or mechanical weeding, suitable mulching and crop rotation. The best approach depends on the crop, weed species and growth stage. Share a weed photo and your crop details before choosing a herbicide." },
  { terms: /weather|rain|forecast|వర్ష|వాతావరణ|मौसम|बारिश|வானிலை|ಹವಾಮಾನ|আবহাওয়া/i,
    text: "I do not have a live weather reading in this chat. Check your district's current forecast and agrometeorological advisory at https://mausam.imd.gov.in/ before irrigation or spraying. Tell me your district and crop so I can help interpret the forecast and plan field work." },
  { terms: /market|price|mandi|sell|ధర|మార్కెట్|मंडी|भाव|விலை|ಬೆಲೆ|বাজার/i,
    text: "Market prices vary by mandi, date, variety and quality. Check the current listing at https://agmarknet.gov.in/ or your local mandi; I cannot confirm today's price without current data. Which crop, variety and market are you considering?" },
];

const namedSchemes = [
  { match: /pm[ -]?kisan|kisan samman/i, name: "PM-KISAN", url: "https://pmkisan.gov.in/", text: "PM-KISAN provides ₹6,000 per year in three equal installments to eligible landholding farmer families, subject to its exclusion rules. Land records, e-KYC and bank details matter. Application and payment status must be checked on the official portal; I cannot see your personal payment record." },
  { match: /pmfby|crop insurance|పంట బీమా|फसल बीमा/i, name: "PMFBY crop insurance", url: "https://pmfby.gov.in/", text: "PMFBY covers eligible notified crops and risks under the applicable seasonal notification. Enrollment deadlines, notified areas and claim procedures vary by state and season. Contact the listed insurer or agriculture office promptly if your insured crop is damaged." },
  { match: /kusum|solar.*pump/i, name: "PM-KUSUM", url: "https://pmkusum.mnre.gov.in/", text: "PM-KUSUM supports solar energy and agricultural pumping through different components. The component, subsidy, farmer contribution and application window depend on the current state implementation. Use the official portal or state implementing agency before paying any supplier." },
  { match: /\bkcc\b|kisan credit|crop loan/i, name: "Kisan Credit Card", url: "https://www.myscheme.gov.in/", text: "A Kisan Credit Card can provide eligible farmers with credit for farming and allied activities. The bank assesses the activity, local scale of finance and repayment capacity. The loan amount and effective interest are not guaranteed by acreage or by an uploaded land document." },
];

const recommendationCopy: Record<SupportedLanguage, { intro: string; state: string; crop: string; land: string; kisan: string; insurance: string; credit: string; solar: string; unknown: string; ask: string }> = {
  en: { intro: "Schemes worth checking for your farm", state: "State", crop: "Crop", land: "Land", kisan: "PM-KISAN: check landholding, family exclusions and e-KYC.", insurance: "PMFBY: check whether your crop and district are notified for this season and the enrolment deadline.", credit: "Kisan Credit Card: ask a bank to assess farming activity and current credit terms.", solar: "PM-KUSUM: check which solar pump component your state currently offers.", unknown: "These are possibilities, not an eligibility decision or an open application window.", ask: "Tell me your state, crop and the type of support you need. I will narrow this to a scheme and guide you through its conditions, documents and application steps." },
  te: { intro: "మీ పొలానికి పరిశీలించదగిన పథకాలు", state: "రాష్ట్రం", crop: "పంట", land: "భూమి", kisan: "PM-KISAN: భూమి, కుటుంబ మినహాయింపులు, e-KYC నిబంధనలు చూడండి.", insurance: "PMFBY: ఈ సీజన్‌లో మీ పంట, జిల్లా ప్రకటించారా మరియు నమోదు గడువు ఏమిటో చూడండి.", credit: "కిసాన్ క్రెడిట్ కార్డ్: వ్యవసాయ కార్యకలాపం, ప్రస్తుత రుణ నిబంధనలను బ్యాంకులో తెలుసుకోండి.", solar: "PM-KUSUM: మీ రాష్ట్రంలో ప్రస్తుతం ఏ సౌర పంపు భాగం అమలులో ఉందో చూడండి.", unknown: "ఇవి అవకాశాలు మాత్రమే; అర్హత లేదా దరఖాస్తు గడువు నిర్ధారణ కాదు.", ask: "మీ రాష్ట్రం, పంట, అవసరమైన సహాయం చెప్పండి. సంబంధిత పథకం షరతులు, పత్రాలు, దరఖాస్తు విధానం వివరించగలను." },
  hi: { intro: "आपके खेत के लिए जाँचने योग्य योजनाएँ", state: "राज्य", crop: "फसल", land: "भूमि", kisan: "PM-KISAN: भूमि, परिवार संबंधी अपवाद और e-KYC नियम जाँचें।", insurance: "PMFBY: इस मौसम में आपकी फसल और जिला अधिसूचित हैं या नहीं तथा नामांकन की अंतिम तिथि जाँचें।", credit: "किसान क्रेडिट कार्ड: खेती की गतिविधि और मौजूदा ऋण शर्तों का आकलन बैंक से कराएँ।", solar: "PM-KUSUM: आपके राज्य में अभी कौन सा सौर पंप घटक उपलब्ध है, जाँचें।", unknown: "ये संभावित विकल्प हैं; इससे पात्रता या खुली आवेदन अवधि तय नहीं होती।", ask: "अपना राज्य, फसल और ज़रूरत बताएं। मैं संबंधित योजना की शर्तें, दस्तावेज़ और आवेदन प्रक्रिया समझाऊँगा।" },
  ta: { intro: "உங்கள் பண்ணைக்குச் சரிபார்க்க வேண்டிய திட்டங்கள்", state: "மாநிலம்", crop: "பயிர்", land: "நிலம்", kisan: "PM-KISAN: நில உரிமை, குடும்ப விலக்குகள், e-KYC நிபந்தனைகளைச் சரிபார்க்கவும்.", insurance: "PMFBY: இந்த பருவத்தில் உங்கள் பயிரும் மாவட்டமும் அறிவிக்கப்பட்டுள்ளதா, பதிவு கடைசி நாள் என்ன என்பதைச் சரிபார்க்கவும்.", credit: "கிசான் கிரெடிட் கார்டு: விவசாயச் செயல்பாடும் தற்போதைய கடன் விதிகளும் குறித்து வங்கியிடம் கேட்கவும்.", solar: "PM-KUSUM: உங்கள் மாநிலத்தில் தற்போது எந்த சூரிய பம்பு பிரிவு செயல்படுகிறது எனப் பார்க்கவும்.", unknown: "இவை வாய்ப்புகள் மட்டுமே; தகுதியோ திறந்த விண்ணப்ப காலமோ உறுதி செய்யப்படவில்லை.", ask: "மாநிலம், பயிர், தேவையான உதவி ஆகியவற்றைச் சொல்லுங்கள். நிபந்தனைகள், ஆவணங்கள், விண்ணப்ப வழிமுறையை விளக்குவேன்." },
  kn: { intro: "ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಪರಿಶೀಲಿಸಬಹುದಾದ ಯೋಜನೆಗಳು", state: "ರಾಜ್ಯ", crop: "ಬೆಳೆ", land: "ಭೂಮಿ", kisan: "PM-KISAN: ಜಮೀನು, ಕುಟುಂಬ ಹೊರತಾಗುವ ನಿಯಮಗಳು ಮತ್ತು e-KYC ಪರಿಶೀಲಿಸಿ.", insurance: "PMFBY: ಈ ಋತುವಿಗೆ ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಜಿಲ್ಲೆ ಅಧಿಸೂಚಿತವಾಗಿವೆಯೇ, ನೋಂದಣಿ ಕೊನೆಯ ದಿನ ಯಾವುದು ಎಂದು ಪರಿಶೀಲಿಸಿ.", credit: "ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್: ಕೃಷಿ ಚಟುವಟಿಕೆ ಮತ್ತು ಪ್ರಸ್ತುತ ಸಾಲದ ಷರತ್ತುಗಳ ಬಗ್ಗೆ ಬ್ಯಾಂಕಿನಲ್ಲಿ ಕೇಳಿ.", solar: "PM-KUSUM: ನಿಮ್ಮ ರಾಜ್ಯದಲ್ಲಿ ಈಗ ಯಾವ ಸೌರ ಪಂಪ್ ಘಟಕ ಲಭ್ಯವಿದೆ ಎಂದು ಪರಿಶೀಲಿಸಿ.", unknown: "ಇವು ಸಾಧ್ಯತೆಗಳು ಮಾತ್ರ; ಅರ್ಹತೆ ಅಥವಾ ಅರ್ಜಿ ಅವಧಿ ದೃಢಪಟ್ಟಿಲ್ಲ.", ask: "ನಿಮ್ಮ ರಾಜ್ಯ, ಬೆಳೆ ಮತ್ತು ಬೇಕಾದ ನೆರವು ತಿಳಿಸಿ. ಷರತ್ತುಗಳು, ದಾಖಲೆಗಳು ಮತ್ತು ಅರ್ಜಿ ಕ್ರಮ ವಿವರಿಸುತ್ತೇನೆ." },
  bn: { intro: "আপনার খামারের জন্য যাচাই করার মতো প্রকল্প", state: "রাজ্য", crop: "ফসল", land: "জমি", kisan: "PM-KISAN: জমি, পরিবারের বাদ পড়ার শর্ত এবং e-KYC যাচাই করুন।", insurance: "PMFBY: এই মরসুমে আপনার ফসল ও জেলা তালিকাভুক্ত কি না এবং নথিভুক্তির শেষ দিন দেখুন।", credit: "কিসান ক্রেডিট কার্ড: কৃষিকাজ ও বর্তমান ঋণের শর্ত সম্পর্কে ব্যাংকে জিজ্ঞাসা করুন।", solar: "PM-KUSUM: আপনার রাজ্যে এখন কোন সৌর পাম্প অংশ চালু আছে দেখুন।", unknown: "এগুলি সম্ভাব্য বিকল্প; যোগ্যতা বা আবেদন খোলা আছে কি না নিশ্চিত নয়।", ask: "রাজ্য, ফসল ও কী সহায়তা দরকার জানান। প্রাসঙ্গিক প্রকল্পের শর্ত, নথি ও আবেদনের ধাপ বুঝিয়ে দেব।" },
};

function isRecommendationRequest(query: string): boolean {
  if (namedSchemes.some(item => item.match.test(query))) return false;
  if (/pension|scholarship|housing|ration|education|disability|widow|employment|పింఛను|छात्रवृत्ति|आवास/i.test(query)) return false;
  return /\b(?:schemes?|subsidies|benefits)\b.{0,45}\b(?:for me|fit me|help me|my farm|can i apply|am i eligible)\b|\bwhat can i apply for\b|\b(?:suggest|recommend|show|find|list)\b.{0,25}\b(?:schemes?|subsidies)\b(?:\s+for (?:me|my farm))?[?.!]*$|నా.*పథక|मेरे.*योजना|எனக்கு.*திட்ட|ನನಗೆ.*ಯೋಜನೆ|আমার.*প্রকল্প/i.test(query);
}

function broadSchemeGuidance(lang: SupportedLanguage, facts: ReturnType<typeof knownFarmerFacts>) {
  const l = recommendationCopy[lang];
  const supportQuestion: Record<SupportedLanguage, string> = { en: "Which support do you need first: income support, crop insurance, a loan, or equipment?", te: "ముందుగా ఏ సహాయం కావాలి: ఆదాయ సహాయం, పంట బీమా, రుణం లేదా పరికరాలా?", hi: "पहले किस सहायता की ज़रूरत है: आय सहायता, फसल बीमा, ऋण या उपकरण?", ta: "முதலில் எந்த உதவி தேவை: வருமான உதவி, பயிர் காப்பீடு, கடன் அல்லது கருவிகளா?", kn: "ಮೊದಲು ಯಾವ ನೆರವು ಬೇಕು: ಆದಾಯ ನೆರವು, ಬೆಳೆ ವಿಮೆ, ಸಾಲ ಅಥವಾ ಉಪಕರಣಗಳು?", bn: "প্রথমে কোন সহায়তা দরকার: আয় সহায়তা, ফসল বিমা, ঋণ না যন্ত্রপাতি?" };
  const known = [facts.state && `${l.state}: ${facts.state}`, facts.crop && `${l.crop}: ${facts.crop}`, facts.land && `${l.land}: ${facts.land}`].filter(Boolean);
  return { text: [`**${l.intro}**`, known.join("; "), `• ${l.kisan}`, `• ${l.insurance}`, `• ${l.credit}`,
    /pump|borewell|sprinkler|drip/i.test(facts.irrigation || "") ? `• ${l.solar}` : "", l.unknown, facts.state && facts.crop ? supportQuestion[lang] : l.ask].filter(Boolean).join("\n\n"),
    chips: scopeMessages[lang].chips };
}

const schemeActions: Record<SupportedLanguage, { apply: string; documents: string; eligible: string; deadline: string; status: string; official: string }> = {
  en: { apply: "Open the official source, read the current conditions and checklist, submit through its listed channel, and keep the acknowledgement.", documents: "Confirm the exact current checklist with the implementing authority before submitting.", eligible: "Your saved farm details help check conditions, but do not establish eligibility. The authority must check the applicable rules and exclusions.", deadline: "I cannot confirm a current application deadline from the available source. Check the dated official notice for your state and season.", status: "Use the official application or beneficiary-status service. I cannot access your personal payment or application record.", official: "Official information" },
  te: { apply: "అధికారిక లింక్‌లో ప్రస్తుత షరతులు, పత్రాల జాబితా చదవండి. అక్కడ తెలిపిన విధంగా దరఖాస్తు చేసి రసీదు ఉంచుకోండి.", documents: "దరఖాస్తు చేసే ముందు ఖచ్చితమైన ప్రస్తుత పత్రాల జాబితాను అమలు చేసే శాఖతో నిర్ధారించండి.", eligible: "మీ వ్యవసాయ వివరాలు షరతులు పరిశీలించడానికి సహాయపడతాయి. వాటితోనే అర్హత నిర్ధారించలేం; వర్తించే నియమాలు, మినహాయింపులను శాఖ పరిశీలించాలి.", deadline: "అందుబాటులో ఉన్న సమాచారంతో ప్రస్తుత దరఖాస్తు గడువు నిర్ధారించలేను. మీ రాష్ట్రం, సీజన్‌కు సంబంధించిన తేదీ ఉన్న అధికారిక ప్రకటన చూడండి.", status: "అధికారిక దరఖాస్తు లేదా లబ్ధిదారుల స్థితి సేవ వాడండి. మీ వ్యక్తిగత చెల్లింపు లేదా దరఖాస్తు రికార్డును నేను చూడలేను.", official: "అధికారిక సమాచారం" },
  hi: { apply: "आधिकारिक लिंक पर मौजूदा शर्तें और दस्तावेज़ सूची पढ़ें। वहाँ बताए माध्यम से आवेदन करें और पावती रखें।", documents: "आवेदन से पहले लागू करने वाले विभाग से सही और मौजूदा दस्तावेज़ सूची की पुष्टि करें।", eligible: "आपके खेती के विवरण शर्तें जाँचने में मदद करते हैं; वे पात्रता सिद्ध नहीं करते। विभाग को लागू नियम और अपवाद जाँचने होंगे।", deadline: "उपलब्ध जानकारी से वर्तमान अंतिम तिथि की पुष्टि नहीं हो सकती। अपने राज्य और मौसम की तारीख वाली आधिकारिक सूचना देखें।", status: "आधिकारिक आवेदन या लाभार्थी स्थिति सेवा इस्तेमाल करें। मैं आपका व्यक्तिगत भुगतान या आवेदन रिकॉर्ड नहीं देख सकता।", official: "आधिकारिक जानकारी" },
  ta: { apply: "அதிகாரப்பூர்வ இணைப்பில் தற்போதைய விதிகளையும் ஆவணப் பட்டியலையும் படிக்கவும். அங்கு கூறிய வழியில் விண்ணப்பித்து ஒப்புகைச் சீட்டை வைத்திருக்கவும்.", documents: "விண்ணப்பிக்கும் முன் செயல்படுத்தும் துறையில் சரியான தற்போதைய ஆவணப் பட்டியலை உறுதிப்படுத்தவும்.", eligible: "உங்கள் விவசாய விவரங்கள் நிபந்தனைகளைச் சரிபார்க்க உதவும்; தகுதியை உறுதி செய்யாது. பொருந்தும் விதிகளையும் விலக்குகளையும் துறை சரிபார்க்க வேண்டும்.", deadline: "கிடைக்கும் தகவலிலிருந்து தற்போதைய கடைசி தேதியை உறுதிப்படுத்த முடியவில்லை. மாநிலம் மற்றும் பருவத்திற்கான தேதியிட்ட அதிகாரப்பூர்வ அறிவிப்பைப் பார்க்கவும்.", status: "அதிகாரப்பூர்வ விண்ணப்ப அல்லது பயனாளர் நிலை சேவையைப் பயன்படுத்தவும். உங்கள் தனிப்பட்ட கட்டணம் அல்லது விண்ணப்பப் பதிவை என்னால் பார்க்க முடியாது.", official: "அதிகாரப்பூர்வ தகவல்" },
  kn: { apply: "ಅಧಿಕೃತ ಲಿಂಕ್‌ನಲ್ಲಿ ಪ್ರಸ್ತುತ ಷರತ್ತು ಮತ್ತು ದಾಖಲೆ ಪಟ್ಟಿಯನ್ನು ಓದಿ. ಅಲ್ಲಿ ತಿಳಿಸಿದ ಮಾರ್ಗದಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಸ್ವೀಕೃತಿಯನ್ನು ಉಳಿಸಿ.", documents: "ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಸಂಬಂಧಿಸಿದ ಇಲಾಖೆಯಲ್ಲಿ ಸರಿಯಾದ ಪ್ರಸ್ತುತ ದಾಖಲೆ ಪಟ್ಟಿಯನ್ನು ಖಚಿತಪಡಿಸಿ.", eligible: "ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳು ಷರತ್ತು ಪರಿಶೀಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ; ಅರ್ಹತೆಯನ್ನು ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ. ಅನ್ವಯಿಸುವ ನಿಯಮ ಮತ್ತು ಹೊರತಾಗುವ ಷರತ್ತುಗಳನ್ನು ಇಲಾಖೆ ಪರಿಶೀಲಿಸಬೇಕು.", deadline: "ಲಭ್ಯ ಮಾಹಿತಿಯಿಂದ ಪ್ರಸ್ತುತ ಕೊನೆಯ ದಿನವನ್ನು ಖಚಿತಪಡಿಸಲಾಗುವುದಿಲ್ಲ. ನಿಮ್ಮ ರಾಜ್ಯ ಮತ್ತು ಋತುವಿನ ದಿನಾಂಕವಿರುವ ಅಧಿಕೃತ ಪ್ರಕಟಣೆ ನೋಡಿ.", status: "ಅಧಿಕೃತ ಅರ್ಜಿ ಅಥವಾ ಫಲಾನುಭವಿ ಸ್ಥಿತಿ ಸೇವೆ ಬಳಸಿ. ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಪಾವತಿ ಅಥವಾ ಅರ್ಜಿ ದಾಖಲೆಯನ್ನು ನಾನು ನೋಡಲಾರೆ.", official: "ಅಧಿಕೃತ ಮಾಹಿತಿ" },
  bn: { apply: "সরকারি লিঙ্কে বর্তমান শর্ত ও নথির তালিকা পড়ুন। সেখানে বলা মাধ্যমে আবেদন করুন এবং প্রাপ্তিস্বীকার রাখুন।", documents: "আবেদনের আগে দায়িত্বপ্রাপ্ত দপ্তর থেকে সঠিক বর্তমান নথির তালিকা নিশ্চিত করুন।", eligible: "আপনার কৃষির তথ্য শর্ত যাচাইয়ে সাহায্য করে; যোগ্যতা প্রমাণ করে না। দপ্তরকে প্রযোজ্য নিয়ম ও বাদ পড়ার শর্ত যাচাই করতে হবে।", deadline: "উপলব্ধ তথ্য দিয়ে বর্তমান শেষ তারিখ নিশ্চিত করা যায় না। আপনার রাজ্য ও মরসুমের তারিখযুক্ত সরকারি বিজ্ঞপ্তি দেখুন।", status: "সরকারি আবেদন বা উপভোক্তার অবস্থা দেখার পরিষেবা ব্যবহার করুন। আমি আপনার ব্যক্তিগত অর্থপ্রদান বা আবেদনের রেকর্ড দেখতে পারি না।", official: "সরকারি তথ্য" },
};

export function schemeReferences(query: string, profile?: FarmerProfile | null, memory?: ConversationMemory) {
  if (isRecommendationRequest(query)) return SCHEMES_DATABASE.filter(item => ["SCH_KISAN", "SCH_FASAL", "SCH_KCC"].includes(item.id))
    .map(item => ({ name: item.name, department: item.department, description: item.description, benefits: item.benefits,
      documents: item.documentsRequired.join("\n"), jurisdiction: undefined as string | undefined,
      source: "General scheme background; current rules, deadlines and eligibility are unverified" }));
  if (!/scheme|yojana|subsid|pension|scholarship|welfare|pm[- ]|kisan|\bkcc\b|insurance|loan|పథక|योजना|திட்ட|ಯೋಜನೆ|প্রকল্প/i.test(query)) return [];
  const farmer = { ...(profile || GUEST_FARMER), state: knownFarmerFacts(profile, memory).state || "" };
  return semanticSearchSchemes(query, farmer, 3)
    .filter((match) => match.sparseScore >= 0.18 && match.hybridScore >= 0.22)
    .map((match) => ({ name: match.scheme.name, department: match.scheme.ministry, description: match.scheme.description,
      benefits: match.scheme.benefits, documents: match.scheme.documents_required, jurisdiction: match.jurisdiction,
      source: "Saved scheme catalog; current rules, deadlines and eligibility are unverified" }));
}

export function farmerChatReply(query: string, lang: SupportedLanguage, profile?: FarmerProfile | null, history: HistoryTurn[] = [], suppliedMemory?: ConversationMemory) {
  const memory = suppliedMemory || buildConversationMemory(history, query);
  const nonDomain = nonDomainChatReply(query, lang, profile, memory);
  if (nonDomain) return nonDomain;
  if (classifyTextTurn(query, memory) === "unknown") return { text: help[lang], chips: scopeMessages[lang].chips };
  const facts = knownFarmerFacts(profile, memory);
  const effective = resolveConversationQuery(query, memory);
  const chips = ["Which scheme can help me?", "Help with my crop", "How to apply?"];
  const location = [facts.district, facts.state].filter(Boolean).join(", ");
  const crop = memory.topic?.crop || facts.crop;
  const context = [crop, facts.cropAge, facts.land, facts.soil, facts.irrigation, location].filter(Boolean).join("; ");
  const named = memory.topic?.kind !== "crop" && namedSchemes.find((item) => item.match.test(effective));
  if (named) {
    const documents = memory.topic?.intent === "documents" || /documents?|paperwork|checklist|దరఖాస్తు పత్ర|दस्तावेज/i.test(query);
    const apply = memory.topic?.intent === "apply" || /apply|application|register|enrol|దరఖాస్తు|आवेदन/i.test(query);
    const eligible = memory.topic?.intent === "eligibility" || /eligib|qualify|for me|my profile|అర్హత|पात्र/i.test(query);
    const status = memory.topic?.intent === "status" || /status|payment|installment|paid|track/i.test(query);
    const deadline = memory.topic?.intent === "deadline" || /deadline|last date|closing date|when.*apply/i.test(query);
    const actionWords = schemeActions[lang];
    if (lang !== "en") {
      const l = recommendationCopy[lang];
      const overview = /PM-KISAN/.test(named.name) ? l.kisan : /insurance/.test(named.name) ? l.insurance : /Credit/.test(named.name) ? l.credit : l.solar;
      const action = deadline ? actionWords.deadline : documents ? actionWords.documents : status ? actionWords.status : eligible ? actionWords.eligible : apply ? actionWords.apply : overview;
      const known = [facts.state && `${l.state}: ${facts.state}`, crop && `${l.crop}: ${crop}`, facts.land && `${l.land}: ${facts.land}`].filter(Boolean).join("; ");
      return { text: [`**${named.name}**`, known, action, `${actionWords.official}: ${named.url}`].filter(Boolean).join("\n\n"), chips: scopeMessages[lang].chips };
    }
    let guidance = named.text;
    if (deadline) guidance = `${named.name}: ${actionWords.deadline}`;
    else if (documents) guidance = `For ${named.name}, prepare identity and bank details, plus the relevant land, tenancy or farming-activity records requested by the implementing agency. ${/PM-KISAN/.test(named.name) ? "Check Aadhaar/e-KYC and that names match your land and bank records." : /insurance/.test(named.name) ? "Also check the seasonal notification for crop, sowing and insurance/enrollment records." : /Credit/.test(named.name) ? "Ask your bank for its current KCC checklist and application form." : "Ask the state implementing agency which component-specific records are required."} Confirm the exact current checklist before applying.`;
    else if (status) guidance = `To check ${named.name} status, use the official portal below or contact the implementing agency${/Credit/.test(named.name) ? " / your bank" : ""}. Use the beneficiary or application-status section where available. I cannot access your payment or application record. Do not share Aadhaar numbers, passwords or OTPs in this chat.`;
    else if (eligible) guidance = `For ${named.name}, your ${[facts.land, crop, location].filter(Boolean).join(", ") || "farm profile"} helps narrow the questions, but does not establish eligibility. ${named.text} Check the current exclusions and state/season requirements with the implementing agency. Tell me which eligibility condition you want to check.`;
    else if (apply) guidance = `To apply for ${named.name}${location ? ` in ${location}` : ""}:\n1. Open the official portal below and check the current application window and applicable state/season/component.\n2. Read the eligibility conditions and current document checklist.\n3. Submit through the listed official channel${/Credit/.test(named.name) ? " or your bank" : " or authorised local centre"}, keep the acknowledgement, and track the application there. ${/PM-KISAN/.test(named.name) ? "For PM-KISAN, complete the requested e-KYC and resolve any land/bank-record mismatch." : "The implementing agency must confirm the exact process for your case."}`;
    return { text: `${location && !apply ? `For your location: ${location}.\n\n` : ""}${guidance}\n\nOfficial information: ${named.url}${!facts.state ? "\n\nWhich state are you in?" : ""}`, chips: [`How to apply for ${named.name}?`, `Eligibility for ${named.name}`, `Documents for ${named.name}`] };
  }
  if (isRecommendationRequest(query)) return broadSchemeGuidance(lang, facts);
  // Prefer the current agricultural question, then the active issue for short replies.
  const topic = memory.topic?.kind !== "scheme" ? knowledge.find((item) => item.terms.test(memory.topic?.query || query)) || knowledge.find((item) => item.terms.test(effective)) : undefined;
  if (topic) {
    let advice = topic.text
      .replace(/Which crop is it, how old is it, and are the spots spreading\?/, "")
      .replace(/Which crop and soil type do you have, and when did it last rain\?/, "")
      .replace(/Share your Soil Health Card values, crop, acreage and fertilizers already applied; I can help interpret them and identify what to ask your agricultural officer\./, "Share the Soil Health Card readings and fertilizers already applied so I can help interpret them.")
      .replace(/Tell me the crop, age, affected area and when symptoms started\./, "")
      .replace(/Which crop are you planning, and in which district\?/, "")
      .replace(/Tell me your crop and the material available so I can suggest a practical composting or soil-improvement approach\./, "Which composting material do you have available?")
      .replace(/Share a weed photo and your crop details before choosing a herbicide\./, "Share a weed photo before choosing a herbicide.")
      .replace(/Tell me your district and crop so I can help interpret the forecast and plan field work\./, "Paste the forecast here and I can help plan field work.")
      .replace(/Which crop, variety and market are you considering\?/, "Which variety and mandi are you considering?").trim();
    let question = !crop ? "Which crop are you growing?" : !facts.district && !facts.location ? "Which district is your farm in?" : "";
    if (!question && /yellow|pest|disease/i.test(memory.topic?.query || query)) question = !facts.cropAge ? "How old is the crop?" : "Are older or newer leaves affected, and are symptoms spreading?";
    if (!question && /irrigat|watering/i.test(memory.topic?.query || query)) question = !facts.soil ? "What is your soil type?" : !facts.cropAge ? "What is the crop age or growth stage?" : !facts.lastRain ? "When did it last rain?" : "Is the root-zone soil still moist?";
    // Do not append a second question to guidance that already asks one.
    if (advice.includes("?")) question = "";
    return { text: `${context ? `For ${context}:\n\n` : ""}${advice}${question ? `\n\n${question}` : ""}`, chips: ["What should I check next?", "Help interpret my soil report", "Related government schemes"] };
  }
  const schemes = schemeReferences(effective, profile, memory);
  if (schemes.length) {
    const selected = schemes[0];
    if (memory.topic?.intent === "deadline" || /deadline|last date|closing date|when.*apply/i.test(query)) {
      return { text: `${selected.name}\n\n${schemeActions[lang].deadline}\n\n${schemeActions[lang].official}: https://www.myscheme.gov.in/`, chips: scopeMessages[lang].chips };
    }
    if (lang !== "en") {
      const intent = memory.topic?.intent;
      const action = intent === "apply" ? schemeActions[lang].apply : intent === "documents" ? schemeActions[lang].documents : intent === "status" ? schemeActions[lang].status : schemeActions[lang].eligible;
      return { text: `${selected.name}\n\n${action}\n\n${schemeActions[lang].official}: https://www.myscheme.gov.in/`, chips: scopeMessages[lang].chips };
    }
    const paperwork = /documents?|checklist/i.test(query) && selected.documents ? `\n\nThe saved catalog lists: ${selected.documents}. Confirm the current checklist with the implementing office.` : "";
    return { text: `${selected.name}\n\nThe saved scheme catalog describes it as: ${selected.description}${paperwork}\n\nConfirm current eligibility, benefits and dates with ${selected.department || "the implementing department"} or the official scheme listing at https://www.myscheme.gov.in/.${facts.state ? ` Your location is ${location || facts.state}. Which condition would you like to check?` : " Which state are you in?"}`, chips: [`How to apply for ${selected.name}?`, "What are the eligibility conditions?", "What documents are required?"] };
  }
  if (memory.topic?.kind === "scheme" || /\b(?:apply|application|eligib\w*|documents?|deadline|benefits?|subsid\w*|schemes?)\b/i.test(query)) {
    return { text: scopeMessages[lang].schemeName, chips: scopeMessages[lang].chips };
  }
  return { text: context ? `I have these farm details: ${context}. What crop problem or government scheme would you like help with?` : help[lang], chips };
}
