import { NextResponse } from "next/server";
import { testConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Health check only. It deliberately exposes no host, user, row counts or
 * credentials, and there is no POST: database credentials are configured on
 * the server through environment variables (see README), never from the browser.
 */
export async function GET() {
  const { connected } = await testConnection();
  return NextResponse.json({ connected }, { status: connected ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
