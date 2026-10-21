import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { peerDirectory } from "@/lib/peerDirectory";
export const dynamic = "force-dynamic";
export async function GET() {
  let rows: any[] = [];
  try { const result = await queryDatabase("SELECT * FROM peer_success_stories ORDER BY distance_km ASC"); if (result.success && Array.isArray(result.data)) rows = result.data; } catch { /* Labeled examples remain available. */ }
  return NextResponse.json({ success: true, peers: peerDirectory(rows), locationBasis: "Stored distances for supplied records; demo distances are illustrative, not live geolocation." });
}
