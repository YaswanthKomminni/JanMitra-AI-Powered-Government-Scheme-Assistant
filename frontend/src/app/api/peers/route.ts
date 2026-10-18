import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { NEARBY_PEERS } from "@/lib/mockData";

export async function GET() {
  try {
    const dbResult = await queryDatabase(
      "SELECT * FROM peer_success_stories ORDER BY distance_km ASC"
    );

    if (dbResult.success && Array.isArray(dbResult.data) && dbResult.data.length > 0) {
      const formatted = dbResult.data.map((row: any) => ({
        id: row.id,
        farmerName: row.farmer_name,
        distanceKm: parseFloat(row.distance_km),
        village: row.village,
        landType: row.land_type,
        cropsGrown: row.crops_grown,
        schemeId: row.scheme_id,
        schemeName: row.scheme_name,
        outcomeSummary: row.outcome_summary,
        yieldIncreasePct: row.yield_increase_pct,
        subsidyReceived: row.subsidy_received,
        implementationDate: row.implementation_date,
        contactAllowed: Boolean(row.contact_allowed),
        contactPhone: row.contact_phone,
        avatar: row.avatar_url,
      }));

      return NextResponse.json({
        success: true,
        source: "mysql",
        peers: formatted,
      });
    }

    return NextResponse.json({
      success: true,
      source: "cached",
      peers: NEARBY_PEERS,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, peers: NEARBY_PEERS },
      { status: 500 }
    );
  }
}
