import { captureModels } from "@/lib/modelTelemetry";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { synthesizeVoice } from "@/lib/voiceAudio";
export const dynamic = "force-dynamic";
export const maxDuration = 35;
const cache = new Map<string, { bytes: Buffer; mime: string; provider: string; expires: number; modelReport?: any }>();
async function respond(req: NextRequest, read: () => Promise<any>) {
  const auth = await requireUser(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await read();
    if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 2400)
      return NextResponse.json({ error: "Provide a spoken briefing of up to 2400 characters." }, { status: 400 });
    const lang = ["te", "ta", "hi", "kn", "bn", "en"].includes(body.lang) ? body.lang : "en";
    const text = body.text.trim();
    const key = createHash("sha256").update(`${lang}:${text}`).digest("hex");
    let audio = cache.get(key);
    let playbackReport: any = { runs: [], explanation: { method: "Audio cache", evidence: ["Previously generated audio was reused. No synthesis model ran for this playback."] } };
    if (!audio || audio.expires < Date.now()) {
      const captured = await captureModels(() => synthesizeVoice(text, lang, typeof body.customApiKey === "string" ? body.customApiKey.slice(0, 512) : undefined));
      playbackReport = captured.modelReport;
      audio = { ...captured.result, modelReport: captured.modelReport, expires: Date.now() + 600000 };
      if (cache.size >= 16) cache.delete(cache.keys().next().value!);
      cache.set(key, audio);
    }
    return new NextResponse(new Uint8Array(audio.bytes), { headers: { "Content-Type": audio.mime, "Cache-Control": "private, no-store", "X-Speech-Provider": audio.provider, "X-Model-Report": encodeURIComponent(JSON.stringify(playbackReport)) } });
  } catch { return NextResponse.json({ error: "Speech is temporarily unavailable. Your browser can still explain the briefing aloud." }, { status: 503 }); }
}
export async function GET(req: NextRequest) { return respond(req, async () => Object.fromEntries(new URL(req.url).searchParams)); }
export async function POST(req: NextRequest) { return respond(req, () => req.json()); }
