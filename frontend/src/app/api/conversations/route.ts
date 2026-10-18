import { NextResponse } from "next/server";
import { requireUser, serviceUnavailable } from "@/lib/auth";
import { listConversations } from "@/lib/chatHistory";

export const dynamic = "force-dynamic";

/** GET /api/conversations — the signed-in user's conversations, most recent first. */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const conversations = await listConversations(auth.dbId);
    return NextResponse.json({ success: true, conversations }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[conversations] list failed:", (err as Error).message);
    return serviceUnavailable("Could not load your conversations. Please try again.");
  }
}
