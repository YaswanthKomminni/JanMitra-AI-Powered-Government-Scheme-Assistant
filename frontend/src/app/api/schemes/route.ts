import { NextResponse } from "next/server";
import { exploreSchemeCatalog } from "@/lib/schemeCatalog";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const query = (params.get("q") || params.get("query") || "").trim().toLowerCase().slice(0, 200);
  const schemes = exploreSchemeCatalog().filter(s => !category || category === "all" || s.category === category)
    .filter(s => !query || `${s.name} ${s.description} ${s.categoryName} ${s.department} ${s.jurisdiction}`.toLowerCase().includes(query));
  return NextResponse.json({ success: true, source: "saved_catalog", schemes, total: schemes.length },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
}
