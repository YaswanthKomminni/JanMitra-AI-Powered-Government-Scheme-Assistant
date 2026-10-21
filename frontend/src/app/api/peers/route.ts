import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { peerDirectory } from "@/lib/peerDirectory";
import { getSessionUser } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { ensureProfileStorage } from "@/lib/profileStorage";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let rows: any[] = [];
  let members: any[] = [];
  try {
    const user = await getSessionUser(request);
    if (user?.profile.state && user.profile.district) {
      await ensureProfileStorage();
      const people = await dbQuery<any[]>(`SELECT u.id,u.name,u.phone,u.village,u.primary_crops,u.soil_type,u.avatar_url FROM users u JOIN farmer_preferences p ON p.user_id=u.id
        WHERE p.share_contact=true AND u.id<>$1 AND lower(u.state)=lower($2) AND lower(u.district)=lower($3) ORDER BY u.name LIMIT 100`, [user.dbId,user.profile.state,user.profile.district]);
      members = people.map(p => ({ id: `member-${p.id}`, farmerName: p.name, village: p.village, cropsGrown: p.primary_crops || "Not provided", landType: p.soil_type?.replace(/_/g," ") || "Not provided",
        avatar: p.avatar_url, contactAllowed: true, contactPhone: p.phone, distanceKnown: false, distanceKm: 0, isDemo: false,
        schemeId: "", schemeName: "Ask this farmer about their experience", outcomeSummary: "Registered farmer in your district who has opted to share their contact. Outcomes and eligibility have not been verified.", yieldIncreasePct: 0, subsidyReceived: "Not reported", implementationDate: "Registered member" }));
    }
  } catch { /* Demo and supplied records remain available if member lookup fails. */ }
  try { const result = await queryDatabase("SELECT * FROM peer_success_stories ORDER BY distance_km ASC"); if (result.success && Array.isArray(result.data)) rows = result.data; } catch { /* Labeled examples remain available. */ }
  return NextResponse.json({ success: true, peers: [...members, ...peerDirectory(rows)], locationBasis: "Opted-in members are matched by saved state and district, not measured distance. Demo distances are illustrative." }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
