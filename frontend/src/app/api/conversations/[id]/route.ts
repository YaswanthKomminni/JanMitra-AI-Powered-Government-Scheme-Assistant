import { NextResponse } from "next/server";
import { requireUser, serviceUnavailable } from "@/lib/auth";
import {
  deleteConversation,
  getConversationMessages,
  getConversationSummary,
  isConversationId,
} from "@/lib/chatHistory";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const notFound = () =>
  NextResponse.json(
    { success: false, code: "CONVERSATION_NOT_FOUND", message: "Conversation not found." },
    { status: 404 }
  );

/** GET /api/conversations/:id — messages of one of the signed-in user's conversations. */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!isConversationId(params.id)) return notFound();
  try {
    const messages = await getConversationMessages(auth.dbId, params.id);
    if (!messages) return notFound(); // missing OR owned by another user
    const conversation = await getConversationSummary(auth.dbId, params.id);
    return NextResponse.json(
      { success: true, conversation, messages },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[conversations] get failed:", (err as Error).message);
    return serviceUnavailable("Could not load this conversation. Please try again.");
  }
}

/** DELETE /api/conversations/:id — deletes it (and its messages) only if owned by the user. */
export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!isConversationId(params.id)) return notFound();
  try {
    const deleted = await deleteConversation(auth.dbId, params.id);
    if (!deleted) return notFound();
    return NextResponse.json({ success: true, message: "Conversation deleted." });
  } catch (err) {
    console.error("[conversations] delete failed:", (err as Error).message);
    return serviceUnavailable("Could not delete this conversation. Please try again.");
  }
}
