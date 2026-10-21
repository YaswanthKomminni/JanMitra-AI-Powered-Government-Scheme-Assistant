import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { explainDocument } from "@/lib/documentChat";
import { LANGUAGE_CODES } from "@/lib/userProfile";
import type { SupportedLanguage } from "@/lib/i18n";
export const maxDuration = 40;
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 4000 || !body.document || JSON.stringify(body.document).length > 1200000)
      return NextResponse.json({ message: "Provide a question and the analyzed document." }, { status: 400 });
    const history = Array.isArray(body.history) ? body.history.filter((t: any) => ["user", "assistant"].includes(t.role) && typeof t.content === "string").slice(-8) : [];
    const reply = await explainDocument({ query: body.question, language: ((LANGUAGE_CODES as readonly string[]).includes(body.language) ? body.language : "en") as SupportedLanguage,
      documentContext: body.document, history, profile: auth.profile, customApiKey: typeof body.customApiKey === "string" ? body.customApiKey.slice(0, 512) : undefined });
    return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "The document answer could not finish. Your scan is still available; please retry." }, { status: 503 }); }
}
