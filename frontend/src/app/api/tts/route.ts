import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LANG_MAP: Record<string, string> = {
  te: "te",
  ta: "ta",
  hi: "hi",
  kn: "kn",
  bn: "bn",
  en: "en",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "en";

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const ttsLang = SUPPORTED_LANG_MAP[lang] || "en";

    // Clean markdown, symbols, emojis, and bullet points for clean, natural speech
    const cleanText = text
      .replace(/[*_#`\[\]]/g, "")
      .replace(/[🏛️📜📋✅⚠️•\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limit to first ~200 characters for high-performance audio synthesis chunk
    const truncatedText = cleanText.length > 200 ? cleanText.substring(0, 197) + "..." : cleanText;

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      truncatedText
    )}&tl=${ttsLang}&client=tw-ob`;

    const res = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to generate speech audio" }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const ttsLang = SUPPORTED_LANG_MAP[lang] || "en";

    const cleanText = text
      .replace(/[*_#`\[\]]/g, "")
      .replace(/[🏛️📜📋✅⚠️•\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const truncatedText = cleanText.length > 200 ? cleanText.substring(0, 197) + "..." : cleanText;

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      truncatedText
    )}&tl=${ttsLang}&client=tw-ob`;

    const res = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to generate speech audio" }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
