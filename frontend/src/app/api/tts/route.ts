import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SUPPORTED_LANG_MAP: Record<string, string> = {
  te: "te",
  ta: "ta",
  hi: "hi",
  kn: "kn",
  bn: "bn",
  en: "en",
};

// In-memory cache for synthesized audio chunks to make playback instant
const audioCache = new Map<string, Buffer>();

/**
 * Phonetic humanizer: transforms symbols, robotic field labels, and technical acronyms
 * into warm, natural, fluid regional spoken words so it sounds like a real human officer.
 */
function humanizeTextForSpeech(rawText: string, lang: string): string {
  let text = rawText;

  // 1. Remove emojis, markdown stars, hashes, backticks, brackets
  text = text
    .replace(/[🌾🏛️📜📋✅⚠️💡•▪🎯👉🔹]/g, "")
    .replace(/[*_#`~\[\]]/g, "")
    .replace(/Farmer Profile/gi, "")
    .replace(/\(.*?\)/g, ""); // strip parentheses content like (Regur), (+91 9876543210), (ధృవీకరించబడింది)

  // 2. Remove robotic field tags like "రైతు పేరు:", "మొబైల్ నంబర్:", "వ్యవసాయ భూమి:"
  text = text
    .replace(/రైతు పేరు\s*:\s*/g, "రైతు పేరు ")
    .replace(/మొబైల్ నంబర్\s*:\s*/g, "")
    .replace(/గ్రామం \/ ప్రాంతం\s*:\s*/g, "ప్రాంతం ")
    .replace(/వ్యవసాయ భూమి\s*:\s*/g, "భూమి ")
    .replace(/నేల రకం\s*:\s*/g, "నేల రకం ")
    .replace(/ప్రధాన పంటలు\s*:\s*/g, "పంటలు ")
    .replace(/నీటి పారుదల\s*:\s*/g, "నీటి వనరు ")
    .replace(/వార్షిక ఆదాయ వర్గం\s*:\s*/g, "")
    .replace(/ధృవీకరించబడిన పత్రాలు\s*:\s*/g, "ధృవీకరించబడిన రికార్డులు ")
    .replace(/किसान का नाम\s*:\s*/g, "")
    .replace(/मोबाइल नंबर\s*:\s*/g, "")
    .replace(/कुल कृषि भूमि\s*:\s*/g, "")
    .replace(/मिट्टी का प्रकार\s*:\s*/g, "")
    .replace(/விவசாயி பெயர்\s*:\s*/g, "")
    .replace(/கைபேசி எண்\s*:\s*/g, "")
    .replace(/రైతు ప్రొఫైల్ వివరాలు/g, "")
    .replace(/వ్యక్తిగత & భూమి వివరాలు/g, "")
    .replace(/మీకు అత్యధికంగా సరిపోయే ప్రభుత్వ పథకాలు/g, "మీకు సరిపోయే పథకాలు")
    .replace(/\d+\.\s*/g, ""); // strip numbering like "1. ", "2. "

  // 3. Language-specific spoken phonetic replacements for numbers & acronyms
  if (lang === "te") {
    text = text
      .replace(/PM-KUSUM|PM KUSUM/gi, "పీఎం కుసుమ్")
      .replace(/PM-KISAN|PM KISAN/gi, "పీఎం కిసాన్")
      .replace(/PMFBY/gi, "పీఎంఎఫ్బీవై")
      .replace(/KCC/gi, "కేసీసీ")
      .replace(/DBT/gi, "డీబీటీ")
      .replace(/e-KYC|eKYC/gi, "ఈ కేవైసీ")
      .replace(/5HP|5 HP/gi, "ఐదు హెచ్‌పీ")
      .replace(/3\.5/g, "మూడున్నర")
      .replace(/3\.8/g, "మూడు పాయింట్ ఎనిమిది")
      .replace(/60%/g, "అరవై శాతం")
      .replace(/98%/g, "తొంభై ఎనిమిది శాతం")
      .replace(/4%/g, "నాలుగు శాతం")
      .replace(/₹1,32,000|రూ\.\s*1,32,000/g, "లక్ష ముప్పై రెండు వేల రూపాయలు")
      .replace(/₹4,600|రూ\.\s*4,600/g, "నాలుగు వేల ఆరు వందల రూపాయలు")
      .replace(/₹6,000|రూ\.\s*6,000/g, "ఆరు వేల రూపాయలు")
      .replace(/₹2,000|రూ\.\s*2,000/g, "రెండు వేల రూపాయలు")
      .replace(/₹2\.5 లక్షల/g, "రెండున్నర లక్షల")
      .replace(/16వ/g, "పదహారవ")
      .replace(/17వ/g, "పదిహేడవ")
      .replace(/SBI/gi, "ఎస్బీఐ")
      .replace(/Ramesh Goud/gi, "రమేష్ గౌడ్")
      .replace(/JanMithra/gi, "జనమిత్ర")
      .replace(/₹/g, "రూపాయలు ")
      .replace(/రూ\./g, "రూపాయలు ");
  } else if (lang === "hi") {
    text = text
      .replace(/PM-KUSUM|PM KUSUM/gi, "पीएम कुसुम")
      .replace(/PM-KISAN|PM KISAN/gi, "पीएम किसान")
      .replace(/PMFBY/gi, "पीएमएफबीवाई")
      .replace(/KCC/gi, "केसीसी")
      .replace(/DBT/gi, "डीबीटी")
      .replace(/e-KYC|eKYC/gi, "ई केवाईसी")
      .replace(/5HP|5 HP/gi, "पांच एचपी")
      .replace(/3\.5/g, "साढ़े तीन")
      .replace(/60%/g, "साठ प्रतिशत")
      .replace(/98%/g, "अट्ठानवे प्रतिशत")
      .replace(/4%/g, "चार प्रतिशत")
      .replace(/₹1,32,000|रु\.\s*1,32,000/g, "एक लाख बत्तीस हज़ार रुपये")
      .replace(/₹4,600|रु\.\s*4,600/g, "चार हज़ार छह सौ रुपये")
      .replace(/₹6,000|रु\.\s*6,000/g, "छह हज़ार रुपये")
      .replace(/₹2,000|रु\.\s*2,000/g, "दो हज़ार रुपये")
      .replace(/16वीं/g, "सोलहवीं")
      .replace(/17वीं/g, "सत्रहवीं")
      .replace(/₹/g, "रुपये ")
      .replace(/रु\./g, "रुपये ");
  } else if (lang === "ta") {
    text = text
      .replace(/PM-KUSUM|PM KUSUM/gi, "பிஎம் குசும்")
      .replace(/PM-KISAN|PM KISAN/gi, "பிஎம் கிசான்")
      .replace(/5HP|5 HP/gi, "ஐந்து எச்பி")
      .replace(/60%/g, "அறுபது சதவீதம்")
      .replace(/₹6,000/g, "ஆறாயிரம் ரூபாய்")
      .replace(/₹2,000/g, "இரண்டாயிரம் ரூபாய்")
      .replace(/₹/g, "ரூபாய் ");
  } else if (lang === "kn") {
    text = text
      .replace(/PM-KUSUM|PM KUSUM/gi, "ಪಿಎಂ ಕುಸುಮ್")
      .replace(/PM-KISAN|PM KISAN/gi, "ಪಿಎಂ ಕಿಸಾನ್")
      .replace(/5HP|5 HP/gi, "ಐದು ಹೆಚ್‌ಪಿ")
      .replace(/60%/g, "ಅರವತ್ತು ಪ್ರತಿಶತ")
      .replace(/₹6,000/g, "ಆರು ಸಾವಿರ ರೂಪಾಯಿ")
      .replace(/₹2,000/g, "ಎರಡು ಸಾವಿರ ರೂಪಾಯಿ")
      .replace(/₹/g, "ರೂಪಾಯಿ ");
  } else if (lang === "bn") {
    text = text
      .replace(/PM-KUSUM|PM KUSUM/gi, "পিএম কুসুম")
      .replace(/PM-KISAN|PM KISAN/gi, "পিএম কিষাণ")
      .replace(/5HP|5 HP/gi, "পাঁচ এইচপি")
      .replace(/60%/g, "ষাট শতাংশ")
      .replace(/₹6,000/g, "ছয় হাজার টাকা")
      .replace(/₹2,000/g, "দুই হাজার টাকা")
      .replace(/₹/g, "টাকা ");
  } else {
    text = text
      .replace(/5HP/gi, "5 Horsepower")
      .replace(/60%/g, "60 percent")
      .replace(/₹1,32,000/g, "1 lakh 32 thousand rupees")
      .replace(/₹4,600/g, "4 thousand 600 rupees")
      .replace(/₹6,000/g, "6 thousand rupees")
      .replace(/₹2,000/g, "2 thousand rupees")
      .replace(/₹/g, "rupees ");
  }

  // 4. Normalize spaces and punctuation for smooth pauses
  text = text
    .replace(/[:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

/**
 * Splits humanized text into natural spoken sentence clauses up to maxChunkLen chars
 * so Google TTS synthesizes each clause fluidly without truncating.
 */
function splitIntoSentenceChunks(text: string, maxChunkLen: number = 150): string[] {
  if (text.length <= maxChunkLen) {
    return [text];
  }

  const chunks: string[] = [];
  // Split on sentence terminals or clause boundaries
  const parts = text.split(/(?<=[.!?।\n])\s+/);

  let currentChunk = "";
  for (const part of parts) {
    if ((currentChunk + " " + part).trim().length <= maxChunkLen) {
      currentChunk = currentChunk ? currentChunk + " " + part : part;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      // If a single sentence exceeds maxChunkLen, split on comma or spaces
      if (part.length > maxChunkLen) {
        const subparts = part.split(/(?<=[,])\s+/);
        let subChunk = "";
        for (const sub of subparts) {
          if ((subChunk + " " + sub).trim().length <= maxChunkLen) {
            subChunk = subChunk ? subChunk + " " + sub : sub;
          } else {
            if (subChunk) chunks.push(subChunk.trim());
            subChunk = sub;
          }
        }
        if (subChunk) chunks.push(subChunk.trim());
        currentChunk = "";
      } else {
        currentChunk = part;
      }
    }
    // Limit to 4 spoken chunks (~600 chars) for swift, responsive playback
    if (chunks.length >= 4) break;
  }

  if (currentChunk && chunks.length < 4) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Fetch a single audio segment buffer from Google Translate TTS
 */
async function fetchAudioSegment(textChunk: string, ttsLang: string): Promise<Buffer> {
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    textChunk
  )}&tl=${ttsLang}&client=tw-ob`;

  const res = await fetch(ttsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Google TTS returned HTTP ${res.status}`);
  }

  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

export async function GET(req: NextRequest) {
  // Reading assistant answers aloud sends their text to the speech service: signed-in users only.
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "en";

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const ttsLang = SUPPORTED_LANG_MAP[lang] || "en";
    const cacheKey = `${ttsLang}:${text.trim().substring(0, 120)}`;

    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    // Transform into warm, natural human spoken prose
    const humanized = humanizeTextForSpeech(text, lang);
    if (!humanized) {
      return NextResponse.json({ error: "No speakable content" }, { status: 400 });
    }

    // Split into complete sentence clauses
    const chunks = splitIntoSentenceChunks(humanized, 150);

    // Fetch all audio chunks in parallel and concatenate seamlessly
    const audioBuffers = await Promise.all(
      chunks.map((chunk) => fetchAudioSegment(chunk, ttsLang))
    );

    const fullAudio = Buffer.concat(audioBuffers);

    // Cache the concatenated audio
    if (audioCache.size > 200) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, fullAudio);

    return new NextResponse(new Uint8Array(fullAudio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { text, lang } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const ttsLang = SUPPORTED_LANG_MAP[lang] || "en";
    const cacheKey = `${ttsLang}:${text.trim().substring(0, 120)}`;

    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    const humanized = humanizeTextForSpeech(text, lang);
    if (!humanized) {
      return NextResponse.json({ error: "No speakable content" }, { status: 400 });
    }

    const chunks = splitIntoSentenceChunks(humanized, 150);

    const audioBuffers = await Promise.all(
      chunks.map((chunk) => fetchAudioSegment(chunk, ttsLang))
    );

    const fullAudio = Buffer.concat(audioBuffers);

    if (audioCache.size > 200) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, fullAudio);

    return new NextResponse(new Uint8Array(fullAudio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
