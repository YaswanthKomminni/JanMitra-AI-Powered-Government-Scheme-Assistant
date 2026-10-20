import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkVisionConnections } from "@/lib/visionLlm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** User-triggered probe. Keys and raw provider responses are never returned or stored. */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    if (body.customApiKey != null && (typeof body.customApiKey !== "string" || body.customApiKey.length > 512)) {
      return NextResponse.json({ message: "Invalid key format." }, { status: 400 });
    }
    return NextResponse.json(await checkVisionConnections(body.customApiKey), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "The AI connection check could not finish. Try again." }, { status: 503 });
  }
}
