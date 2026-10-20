import type { SupportedLanguage } from "@/lib/i18n";
import { GUEST_FARMER, type FarmerProfile } from "@/lib/mockData";
import { semanticSearchSchemes } from "@/lib/aiCopilotService";
import { queryWithHistory, type HistoryTurn } from "@/lib/chatRouting";

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

export function schemeReferences(query: string, profile?: FarmerProfile | null) {
  if (!/scheme|yojana|subsid|pension|scholarship|welfare|pm[- ]|kisan|\bkcc\b|insurance|loan|పథక|योजना|திட்ட|ಯೋಜನೆ|প্রকল্প/i.test(query)) return [];
  return semanticSearchSchemes(query, profile || GUEST_FARMER, 3)
    .filter((match) => match.sparseScore >= 0.18 && match.hybridScore >= 0.22)
    .map((match) => ({ name: match.scheme.name, department: match.scheme.ministry, description: match.scheme.description,
      documents: match.scheme.documents_required, source: "Saved scheme catalog; current rules and eligibility are unverified" }));
}

export function farmerChatReply(query: string, lang: SupportedLanguage, profile?: FarmerProfile | null, history: HistoryTurn[] = []) {
  const effective = queryWithHistory(query, history);
  const chips = ["Which scheme can help me?", "Help with my crop", "How to apply?"];
  if (/^(hi|hello|hey|namaste|thanks|thank you|నమస్కారం|नमस्ते|வணக்கம்|ನಮಸ್ಕಾರ|নমস্কার)[!.\s]*$/i.test(query.trim())) return { text: help[lang], chips };
  const named = namedSchemes.find((item) => item.match.test(effective));
  if (named) {
    const followup = /apply|application|documents?|checklist|దరఖాస్తు|आवेदन/i.test(query);
    return { text: `${named.text}\n\n${followup ? "For the application, first check the current state/season notice on the official portal. Then confirm your eligibility and the exact checklist with the implementing office or bank. Prepare identity, bank and relevant land/activity records as requested; requirements vary by scheme.\n\n" : ""}Official information: ${named.url}\n\nWhich state are you in, and do you want eligibility, application steps or status-check guidance?`, chips: [`How to apply for ${named.name}?`, `Eligibility for ${named.name}`, `Documents for ${named.name}`] };
  }
  const topic = !/scheme|subsid|government|yojana|పథక|योजना/i.test(effective) ? knowledge.find((item) => item.terms.test(effective)) : undefined;
  if (topic) {
    const crop = effective.match(/\b(cotton|paddy|rice|maize|chilli|wheat|tomato|groundnut)\b/i)?.[0] || profile?.primaryCrops?.[0];
    const text = crop ? `For ${crop}: ${topic.text.replace(/Which crop is it, how old is it, and are the spots spreading\?/, "How old is the crop, and are the symptoms spreading?").replace(/Which crop and soil type do you have, and when did it last rain\?/, "What is your soil type, crop stage, and when did it last rain?")}` : topic.text;
    return { text, chips: ["I can share my crop details", "Help interpret my soil report", "Related government schemes"] };
  }
  const schemes = schemeReferences(effective, profile);
  if (schemes.length) {
    const selected = schemes[0];
    const paperwork = /documents?|checklist/i.test(query) && selected.documents ? `\n\nThe saved catalog lists: ${selected.documents}. Confirm the current checklist with the implementing office.` : "";
    return { text: `${selected.name}\n\nThe saved scheme catalog describes it as: ${selected.description}${paperwork}\n\nConfirm current eligibility, benefits and dates with ${selected.department || "the implementing department"} or the official scheme listing at https://www.myscheme.gov.in/. Tell me your state and what you want to know about this scheme.`, chips: [`How to apply for ${selected.name}?`, "What are the eligibility conditions?", "What documents are required?"] };
  }
  if (/write.*code|programming|football|cricket score|movie|celebrity/i.test(query)) return { text: "I can help with agriculture and government welfare schemes. Ask me about your crop, farming practices, eligibility or an application.", chips };
  return { text: help[lang], chips };
}
