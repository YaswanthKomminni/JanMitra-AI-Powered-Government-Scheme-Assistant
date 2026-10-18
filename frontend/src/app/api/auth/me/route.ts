import { NextResponse } from "next/server";
import { getSessionUser, serviceUnavailable } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Returns the signed-in user's profile, derived only from the session cookie. */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      { authenticated: true, user: user.profile },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[me] session lookup failed:", (err as Error).message);
    return serviceUnavailable();
  }
}
