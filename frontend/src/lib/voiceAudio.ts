import { providerKeys } from "@/lib/aiProviders";

export function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(pcm.length + 36, 4); header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export function speechChunks(text: string, limit = 150): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current.length + word.length + 1 > limit) { if (current) chunks.push(current); current = ""; }
    // Also handle scripts or identifiers with no spaces.
    for (let i = 0; i < word.length; i += limit) {
      const part = word.slice(i, i + limit);
      if (part.length === limit) chunks.push(part); else current += `${current ? " " : ""}${part}`;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function synthesizeVoice(text: string, language: string, customApiKey?: string): Promise<{ bytes: Buffer; mime: string; provider: string }> {
  const signal = AbortSignal.timeout(14000);
  for (const entry of providerKeys(customApiKey).filter(p => p.provider === "gemini")) {
    if (signal.aborted) break;
    try {
      const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": entry.key }, signal,
        body: JSON.stringify({ contents: [{ parts: [{ text, speech_metadata: { style: "Warm, calm and conversational. Explain patiently with natural pauses, like a helpful farm adviser. Speak only the supplied transcript." } }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { languageCode: `${language}-IN`, voiceConfig: { prebuiltVoiceConfig: { voiceName: process.env.GEMINI_TTS_VOICE || "Kore" } } } } }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const audio = parts.find((p: any) => p.inlineData?.data)?.inlineData;
      if (!audio) continue;
      const bytes = Buffer.from(audio.data, "base64");
      if (bytes.length < 4 || bytes.length > 12000000) continue;
      const mime = String(audio.mimeType || "");
      if (/audio\/(?:L16|pcm)/i.test(mime)) return { bytes: pcmToWav(bytes, Number(mime.match(/rate=(\d+)/)?.[1]) || 24000), mime: "audio/wav", provider: "gemini" };
      if (/^audio\/(?:wav|mpeg|mp3|ogg)/i.test(mime)) return { bytes, mime, provider: "gemini" };
    } catch { /* Continue with the independent speech fallback. */ }
  }
  const chunks = speechChunks(text);
  const buffers = await Promise.all(chunks.map(async chunk => {
    const response = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${language}&client=tw-ob`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Speech service unavailable");
    return Buffer.from(await response.arrayBuffer());
  }));
  return { bytes: Buffer.concat(buffers), mime: "audio/mpeg", provider: "speech_fallback" };
}
