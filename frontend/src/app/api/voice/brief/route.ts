import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createVoiceBriefing } from "@/lib/voiceBriefing";
import { LANGUAGE_CODES } from "@/lib/userProfile";
import type { SupportedLanguage } from "@/lib/i18n";
export const maxDuration = 30;
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 24000)
      return NextResponse.json({ message: "Provide an answer to explain aloud." }, { status: 400 });
    const result = await createVoiceBriefing(body.text, ((LANGUAGE_CODES as readonly string[]).includes(body.language) ? body.language : "en") as SupportedLanguage,
      typeof body.customApiKey === "string" ? body.customApiKey.slice(0, 512) : undefined);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Voice briefing is temporarily unavailable." }, { status: 503 }); }
}
