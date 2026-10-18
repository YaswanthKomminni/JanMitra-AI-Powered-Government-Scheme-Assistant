import { NextResponse } from "next/server";
import { checkSameOrigin, clearSessionCookie, destroySession, readSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Deletes the server-side session (so the cookie can never be replayed) and clears the cookie. */
export async function POST(request: Request) {
  const originError = checkSameOrigin(request);
  if (originError) return originError;

  const token = readSessionToken(request);
  try {
    await destroySession(token);
  } catch (err) {
    console.error("[logout] could not delete session:", (err as Error).message);
    const res = NextResponse.json(
      {
        success: false,
        message: "Could not reach the database to end your session. Please try signing out again.",
      },
      { status: 503 }
    );
    // Still remove the cookie from this browser.
    clearSessionCookie(res);
    return res;
  }

  const res = NextResponse.json({ success: true, message: "You have been signed out." });
  clearSessionCookie(res);
  return res;
}
