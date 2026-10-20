import type { FarmerProfile } from "@/lib/mockData";

export type HistoryTurn = { role: "user" | "assistant"; content: string };
export type FarmerFacts = Partial<Record<"crop" | "cropAge" | "land" | "state" | "district" | "location" | "soil" | "irrigation" | "symptoms" | "lastRain", string>>;
export interface ConversationMemory {
  version: 1;
  facts: FarmerFacts;
  topic?: { kind: "scheme" | "crop" | "document"; query: string; crop?: string; scheme?: string; intent?: string };
  pendingQuestion?: string;
  options?: string[];
  latestUploadAvailable?: boolean;
}

const cropPattern = /\b(cotton|paddy|rice|maize|corn|chill?i(?:es)?|mirchi|mirch|wheat|tomato|groundnut|sugarcane|millet|soybean|potato|onion)\b|మిర్చి|मिर्च/gi;

function canonicalCrop(value?: string): string | undefined {
  return value && /^(?:mirchi?|chill?i(?:es)?|మిర్చి|मिर्च)$/i.test(value) ? "chilli" : value;
}
const states = /\b(Telangana|Andhra Pradesh|Tamil Nadu|Karnataka|Kerala|Maharashtra|Rajasthan|Assam|Madhya Pradesh|Uttar Pradesh|Punjab|Haryana|Odisha|West Bengal|Gujarat|Bihar|Jharkhand|Chhattisgarh|Uttarakhand|Himachal Pradesh|Goa)\b/gi;
const schemePattern = /PM[ -]?KISAN|Kisan Samman Nidhi|PMFBY|crop insurance|PM[ -]?KUSUM|Kisan Credit Card|\bKCC\b|Mahalakshmi|Rythu Bharosa|Gruha Jyothi|Indiramma(?: Indlu)?|Cheyutha/gi;
const keys = ["crop", "cropAge", "land", "state", "district", "location", "soil", "irrigation", "symptoms", "lastRain"] as const;

export type TextTurnClass = "greeting" | "off_topic" | "relevant" | "contextual" | "unknown";

const relevantWords = /\b(?:agricultur\w*|farm\w*|cultivat\w*|crop\w*|plant\w*|leaf|leaves|pest\w*|disease\w*|soil|seed\w*|sow\w*|fertili[sz]\w*|irrigat\w*|waterlog\w*|harvest\w*|tractor|mandi|market price|weather|rainfall|subsid\w*|scheme\w*|yojana|government|govt|welfare|pension|scholarship|ration|housing|insurance|loan|kisan|patta|pahani|land record|farmer id|soil health card|pmfby|kusum|aadhaar|dbt)\b|పంట|వ్యవసాయ|రైతు|పథక|ప్రభుత్వ|అర్హత|దరఖాస్తు|खेती|किसान|फसल|योजना|सरकारी|पात्रता|आवेदन|விவசாய|பயிர்|திட்டம்|அரசு|ಕೃಷಿ|ಬೆಳೆ|ಯೋಜನೆ|ಸರ್ಕಾರ|কৃষি|ফসল|প্রকল্প|সরকার/i;
const unrelatedWords = /\b(?:joke|riddle|movie|film|celebrity|football|cricket score|match score|song|lyrics|recipe|restaurant|touris\w*|hotel|flight|stock(?:s| market)?|crypto|bitcoin|horoscope|astrology|physics|quantum|capital of|president of|prime minister of|exam result|passport|write\s+(?:me\s+)?(?:code|a program|an app|an essay|a poem)|debug\s+(?:this\s+)?code|(?:javascript|python|css|html)\s+(?:code|program))\b/i;
const genericFollowup = /\b(?:how (?:do|can|should) i (?:apply|register|check|claim|get)|how to (?:apply|register|check|claim|get)|what (?:documents?|paperwork|benefits?|requirements?|conditions?|should i do)|am i eligib\w*|which (?:documents?|scheme)|when (?:is|does) (?:the )?(?:deadline|application)|where (?:do|can) i apply|deadline|last date|documents?|paperwork|eligib\w*|qualif\w*|apply|application|register|benefits?|status|payment|next steps?|requirements?|conditions?|explain (?:it|this|that)|summari[sz]e (?:it|this|that)|tell me more|for me)\b|అర్హత|ఎలా దరఖాస్తు|कैसे आवेदन|दस्तावेज|எப்படி விண்ணப்பம்|ಅರ್ಹತೆ|কীভাবে আবেদন/i;
const schemeMentionPattern = new RegExp(schemePattern.source, "i");
const cropMentionPattern = new RegExp(cropPattern.source, "i");
const stateMentionPattern = new RegExp(states.source, "i");

export function isGreetingQuery(query: string): boolean {
  const q = query.trim().replace(/^[\s.,!?।]+|[\s.,!?।]+$/g, "");
  return /^(?:h+a+i+|h+i+|h+e+l+o+|h+e+y+|namaste|namaskar|good (?:morning|afternoon|evening)|thanks?|thank you|నమస్కారం|नमस्ते|வணக்கம்|ನಮಸ್ಕಾರ|নমস্কার)(?:\s+(?:there|sir|madam|ji|friend))?$/i.test(q);
}

export function isExplicitlyUnrelatedQuery(query: string): boolean {
  if (/\b(?:write\s+(?:me\s+)?(?:code|a program|an app|an essay|a poem)|debug\s+(?:this\s+)?code|tell\s+(?:me\s+)?a joke)\b/i.test(query)) return true;
  // Sports, tourism or employment can be the subject of a welfare scheme.
  return unrelatedWords.test(query) && !/\b(?:scheme|subsid|government|govt|welfare|scholarship|pension|yojana)\w*\b|పథక|ప్రభుత్వ|योजना|सरकारी|திட்டம்|ಯೋಜನೆ|প্রকল্প/i.test(query);
}

/** Keep unrelated requests away from scheme retrieval, while allowing short answers to an active question. */
export function classifyTextTurn(query: string, memory?: ConversationMemory): TextTurnClass {
  const q = query.trim();
  if (isGreetingQuery(q)) return "greeting";
  if (isExplicitlyUnrelatedQuery(q)) return "off_topic";
  if (memory?.options?.length && /\b(?:first|second|third|1st|2nd|3rd)\b/i.test(q)) return "contextual";
  if (memory?.options?.length && q.length < 60 && /insurance|loan|credit|income support|cash support|solar|pump|బీమా|రుణ|ఆదాయ|बीमा|ऋण|आय सहायता/i.test(q)) return "contextual";
  const hasTopic = Boolean(memory?.topic);
  if (hasTopic && cropMentionPattern.test(q) && (q.length < 35 && !/\b(?:how|what|why|when|which)\b|\?/.test(q)
    || /^(?:my crop|i grow|i planted|we grow)\b/i.test(q))) return "contextual";
  if (hasTopic && (isContextualFollowup(q) || genericFollowup.test(q))) {
    // A named new topic takes precedence over the old one.
    if (!schemeMentionPattern.test(q) && !/\b(?:new|different|another)\s+(?:crop|scheme|topic)\b/i.test(q)) return "contextual";
  }
  if (relevantWords.test(q) || schemeMentionPattern.test(q) || cropMentionPattern.test(q)
    || /\b(?:compost|organic|manure|weed|mulch|rotation|urea|dap|nutrient|germination|horticulture|livestock|dairy|cattle|poultry|fisheries|photosynthesis|pmay|mgnrega|nrega|ayushman|eshra?m)\b/i.test(q)) return "relevant";
  if (stateMentionPattern.test(q)) return hasTopic ? "contextual" : "relevant";
  if (hasTopic && q.length <= 100 && !/[?]/.test(q) &&
    (/\b(?:i|my|we|our|from|in|acres?|hectares?|guntas?|days?|weeks?|months?|years?|soil|district)\b|\d/.test(q)
      || Boolean(memory?.pendingQuestion && new RegExp("^[\\p{L}][\\p{L} .'-]{1,50}$", "u").test(q)))) return "contextual";
  // A general application question is in scope, but needs a scheme name or prior topic.
  if (genericFollowup.test(q) && /\b(?:apply|application|eligib\w*|documents?|deadline|benefits?|subsid\w*|status|payment|requirements?)\b/i.test(q)) return "relevant";
  // Keep unrecognized regional-language questions available to the language-aware
  // assistant. A narrow keyword list cannot safely declare them unrelated.
  if (/[\u0900-\u0D7F]/.test(q)) return hasTopic ? "contextual" : "relevant";
  // Absence from a keyword list is not evidence of irrelevance. Let the cloud
  // assistant resolve scope, or ask for clarification in the bounded fallback.
  return "unknown";
}

/** An explicit reference can return to an upload even after another chat topic. */
export function isUploadReference(query: string): boolean {
  return /\b(?:this|that|the|my|uploaded|attached|previous|earlier|above)\s+(?:(?:uploaded|attached|government|scheme|land)\s+)?(?:doc(?:ument)?|pdf|file|image|photo|table|notice|report|record)\b|\b(?:doc(?:ument)?|pdf|file|image|photo|report)\s+(?:I|we)\s+(?:uploaded|sent|shared)\b/i.test(query);
}

export function isContextualFollowup(query: string): boolean {
  const q = query.trim();
  return isUploadReference(q) || /^(yes|yeah|ok|okay|sure|no|continue|go ahead|please|అవును|సరే|हाँ|ठीक है)[!.\s]*$/i.test(q)
    || /^(?:(?:what|which|when|where|who)\b.{0,50}\b(?:benefits?|schemes?|conditions?|deadline|documents?|mentioned|says?|contain|department)|benefits?\??$|deadline\??$|required documents?\??$)/i.test(q)
    || /\b(this|that|these|those|it|above|same|previous|earlier|second one|first one|third one|for me|my profile|my farm|my land)\b/i.test(q)
    || /^(?:and\s+)?(?:how (?:do i |can i |to )?(?:apply|get|claim|check|register)|what documents|documents|eligibility|am i eligible|what about|tell me more|why\??$|how much|suggestions?|give me suggestions|next steps?|what (?:should|can) i (?:do|check)|అర్హత|ఎలా దరఖాస్తు|कैसे आवेदन|और बताओ)/i.test(q);
}

export function readConversationMemory(raw: unknown): ConversationMemory | undefined {
  if (!raw || typeof raw !== "object" || (raw as any).version !== 1) return undefined;
  const value = raw as any;
  const facts: FarmerFacts = {};
  for (const key of keys) if (typeof value.facts?.[key] === "string") facts[key] = value.facts[key].slice(0, 200);
  const topic = value.topic && ["scheme", "crop", "document"].includes(value.topic.kind) && typeof value.topic.query === "string"
    ? { kind: value.topic.kind, query: value.topic.query.slice(0, 1000), crop: typeof value.topic.crop === "string" ? value.topic.crop.slice(0, 100) : undefined,
      intent: typeof value.topic.intent === "string" ? value.topic.intent.slice(0, 30) : undefined,
      scheme: typeof value.topic.scheme === "string" ? value.topic.scheme.slice(0, 180) : undefined } : undefined;
  return { version: 1, facts, topic, latestUploadAvailable: typeof value.latestUploadAvailable === "boolean" ? value.latestUploadAvailable : undefined,
    pendingQuestion: typeof value.pendingQuestion === "string" ? value.pendingQuestion.slice(0, 500) : undefined,
    options: Array.isArray(value.options) ? value.options.filter((item: unknown) => typeof item === "string").slice(0, 8).map((item: string) => item.slice(0, 180)) : [] };
}

function lastMatch(text: string, pattern: RegExp): string | undefined {
  const matches = text.match(pattern);
  return matches?.[matches.length - 1];
}

function updateUser(memory: ConversationMemory, query: string, attachment = false) {
  if (attachment) memory.latestUploadAvailable = false; // Set true only after successful server analysis.
  const q = query.trim();
  if (!attachment && classifyTextTurn(q, memory) === "off_topic") {
    delete memory.topic;
    delete memory.pendingQuestion;
    memory.options = [];
  }
  const facts = memory.facts;
  const pending = memory.pendingQuestion || "";
  const rawCrop = lastMatch(q, cropPattern);
  const crop = canonicalCrop(rawCrop);
  const state = lastMatch(q, states);
  const comparison = /\b(compare|versus|vs|or)\b/i.test(q);
  const cropsMentioned = q.match(cropPattern) || [];
  const personalCrop = !comparison && crop && (/\b(i|we)\s+(?:am\s+)?(?:grow|growing|planted|cultivate|have)|\bnot\b.*\b(?:cotton|maize|paddy|rice)\b/i.test(q)
    || q.toLowerCase() === rawCrop?.toLowerCase()
    || new RegExp(`\\bmy\\s+(?:crop (?:is |of )?|farm (?:has |grows )?)?${rawCrop}\\b`, "i").test(q)
    || (q.length < 150 && (!/\b(how|what|why|when|which)\b/i.test(q) && (/crop|grow|plant/i.test(pending) || memory.topic?.kind === "crop"))));
  if (personalCrop && !new RegExp(`\\bnot\\s+${crop}\\b`, "i").test(q)) {
    if (facts.crop && facts.crop.toLowerCase() !== crop!.toLowerCase()) {
      delete facts.cropAge;
      delete facts.symptoms;
    }
    facts.crop = crop;
  }
  const age = q.match(/\b(\d{1,3}\s*(?:days?|weeks?|months?)(?:\s+old)?)\b/i)?.[1];
  if (age && (/age|old|crop|plant|sow/i.test(q + pending) || memory.topic?.kind === "crop")) facts.cropAge = age;
  const land = q.match(/\b((?:(?:more|less) than|over|above|under|below)?\s*\d+(?:\.\d+)?\s*(?:acres?|acers?|hectares?|guntas?|cents?))\b/i)?.[1]?.trim().replace(/acers?/i, "acres");
  if (land && !/\b(if|suppose|example|someone|neighbour)\b/i.test(q)
    && (/\b(?:i|my|we|our)\b/i.test(q) || /^(?:(?:more|less) than|over|above|under|below|\d)/i.test(q) || /land|acres|holding/i.test(pending) && q.length < 40)) facts.land = land;
  if (state && !comparison && !/\b(if|suppose|example|someone)\b/i.test(q) && (!/^(how|what|why|when|which|is|are|can)\b/i.test(q) || /\bi live|\bi am from|\bmy farm\b/i.test(q))) {
    if (facts.state && facts.state.toLowerCase() !== state.toLowerCase()) {
      delete facts.district;
      delete facts.location;
    }
    facts.state = state;
  }
  const district = q.match(/\bdistrict\s*(?:is|:|=|-)?\s*([a-z][a-z ]{1,35})/i)?.[1]
    || q.match(/(?:\bin\s+|\bfrom\s+|^)([a-z]+(?: [a-z]+){0,2})\s+district\b/i)?.[1];
  if (district && !/^(?:how|what|which|where|when|is|are|can)\b/i.test(q)) facts.district = district.replace(/\b(and|with|where|i)\b.*$/i, "").trim();
  if (/\b(?:i am|i live|my farm|we live|i grow|i am from)\b/i.test(q) && /\b(from|in)\b/i.test(q) && !state) {
    const place = q.match(/\b(?:from|in)\s+([a-z][a-z ]{1,35})/i)?.[1]?.split(/\b(?:and|with|on)\b/i)[0]?.trim();
    if (place && !/soil|crop|field|farm|days|weeks/i.test(place)) facts.location = place;
  }
  if (/district/i.test(pending) && !district && !state && /^[a-z][a-z .-]{1,40}$/i.test(q) && !crop && !/soil|drip|canal|rainfed|borewell|days|weeks/i.test(q) && !isContextualFollowup(q)) facts.district = q;
  const soil = lastMatch(q, /\b(black soil|red soil|alluvial(?: soil)?|sandy(?: loam| soil)?|clay(?: soil)?|dryland|wetland)\b/gi);
  if (soil && !comparison) facts.soil = soil;
  const irrigation = lastMatch(q, /\b(drip|borewell|bore well|canal|rainfed|rain-fed|sprinkler)\b/gi);
  if (irrigation && !comparison) facts.irrigation = irrigation;
  if (/yellow|wilting|spots|curling|stunted|pest|insect|drying|rotting|older leaves|newer leaves/i.test(q) && !/\b(if|example|neighbour)\b/i.test(q)) facts.symptoms = q.slice(0, 200);
  if (/last rain|last rained|rainfall/i.test(pending) && /yesterday|today|\d+\s*(?:days?|weeks?)\s*ago|no rain/i.test(q)) facts.lastRain = q.slice(0, 100);

  const scheme = lastMatch(q, schemePattern);
  const ordinal = q.match(/\b(first|second|third|1st|2nd|3rd)\b/i)?.[1]?.toLowerCase();
  const selected = ordinal ? memory.options?.[({ first: 0, "1st": 0, second: 1, "2nd": 1, third: 2, "3rd": 2 } as Record<string, number>)[ordinal]]
    : q.length < 60 ? memory.options?.find(option => /insurance|బీమా|बीमा/i.test(q) && /PMFBY|insurance/i.test(option)
      || /loan|credit|రుణ|ऋण/i.test(q) && /KCC|Kisan Credit/i.test(option)
      || /income support|cash support|ఆదాయ|आय सहायता/i.test(q) && /PM.?KISAN/i.test(option)
      || /solar|pump|సౌర|सौर/i.test(q) && /KUSUM/i.test(option)) : undefined;
  if (attachment || isUploadReference(q) || /\b(?:this|attached|uploaded|above)\b.*\b(document|image|photo|table|notice|file)\b/i.test(q)) {
    memory.topic = { kind: "document", query: q };
  } else if (scheme || selected) {
    memory.topic = { kind: "scheme", query: q, scheme: selected || scheme };
  } else if (/scheme|subsid|pension|scholarship|welfare|yojana/i.test(q) && !isContextualFollowup(q)) {
    memory.topic = { kind: "scheme", query: q };
  } else if (/irrigat|fertili[sz]|soil test|yellow|wilting|pest|disease|seed|sowing|weed|compost|weather|forecast|market|price/i.test(q)
    && (!isContextualFollowup(q) || /^(?:how|what|why|when|which)\b/i.test(q) && /irrigat|fertili[sz]|soil|yellow|wilting|pest|disease|seed|sowing|weed|compost|weather|forecast|market|price/i.test(q))) {
    memory.topic = { kind: "crop", query: q, crop: comparison && cropsMentioned.length > 1 ? undefined : crop || facts.crop };
  } else if (crop && memory.topic?.kind === "crop" && !comparison) {
    memory.topic.crop = crop;
  }
  if (memory.topic?.kind === "scheme") {
    const intent = /deadline|last date|closing date|when.*apply|గడువు|अंतिम तिथि|கடைசி நாள்|ಕೊನೆಯ ದಿನ|শেষ তারিখ/i.test(q) ? "deadline"
      : /documents?|paperwork|checklist|పత్రాలు|दस्तावेज|ஆவணங்கள்|ದಾಖಲೆಗಳು|নথি/i.test(q) ? "documents"
      : /eligib|qualify|for me|my profile|అర్హత|पात्रता|தகுதி|ಅರ್ಹತೆ|যোগ্যতা/i.test(q) ? "eligibility"
      : /status|payment|installment|track|స్థితి|स्थिति|நிலை|ಸ್ಥಿತಿ|অবস্থা/i.test(q) ? "status"
      : /apply|application|register|enrol|దరఖాస్తు|आवेदन|விண்ணப்ப|ಅರ್ಜಿ|আবেদন/i.test(q) ? "apply" : undefined;
    if (intent) memory.topic.intent = intent;
  }
  // Personal facts update the current context; they do not replace its original question.
}

export function finishConversationMemory(memory: ConversationMemory, answer: string): ConversationMemory {
  const result = readConversationMemory(memory)!;
  result.pendingQuestion = answer.match(/[^.!?\n]+\?/g)?.slice(-1)[0]?.trim().slice(0, 500);
  const schemes = answer.match(schemePattern) || [];
  if (schemes.length) result.options = Array.from(new Set(schemes.map((item) => item.trim()))).slice(0, 8);
  return result;
}

export function buildConversationMemory(history: HistoryTurn[], query: string, prior?: unknown, attachment = false): ConversationMemory {
  let memory = readConversationMemory(prior);
  if (!memory) {
    memory = { version: 1, facts: {} };
    for (const turn of history) {
      if (turn.role === "user") updateUser(memory, turn.content);
      else memory = finishConversationMemory(memory, turn.content);
    }
  }
  updateUser(memory, query, attachment);
  return memory;
}

export function knownFarmerFacts(profile?: FarmerProfile | null, memory?: ConversationMemory): FarmerFacts {
  const sameState = !memory?.facts.state || !profile?.state || memory.facts.state.toLowerCase() === profile.state.toLowerCase();
  return {
    ...(profile?.primaryCrops?.length ? { crop: profile.primaryCrops.join(", ") } : {}),
    ...(profile?.landSizeAcres ? { land: `${profile.landSizeAcres} acres` } : {}),
    ...(profile?.state ? { state: profile.state } : {}), ...(sameState && profile?.district ? { district: profile.district } : {}),
    ...(sameState && profile?.village ? { location: profile.village } : {}),
    ...(profile?.soilTypeName || profile?.soilType ? { soil: profile.soilTypeName || profile.soilType.replace(/_/g, " ") } : {}),
    ...(profile?.irrigationTypeName || profile?.irrigationType ? { irrigation: profile.irrigationTypeName || profile.irrigationType } : {}),
    ...(memory?.facts || {}),
  };
}

export function resolveConversationQuery(query: string, memory: ConversationMemory): string {
  if (!memory.topic || classifyTextTurn(query, memory) !== "contextual") return query;
  const anchor = memory.topic.scheme || memory.topic.query;
  if (anchor === query) return query;
  return `Current conversation topic: ${anchor}\nCurrent question: ${query}`;
}
