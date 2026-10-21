import { NEARBY_PEERS, type PeerSuccessStory } from "@/lib/mockData";
/** Illustrations expand the demo without inventing real farmers, consent or contact details. */
export function peerDirectory(rows: any[] = []): PeerSuccessStory[] {
  const seeds = new Set(NEARBY_PEERS.map(p => p.id));
  const seedPeople = new Set(NEARBY_PEERS.map(p => `${p.farmerName}|${p.village}`.toLowerCase()));
  const registered = rows.filter(row => !seeds.has(row.id) && !seedPeople.has(`${row.farmer_name}|${row.village}`.toLowerCase())).map(row => ({
    id: row.id, farmerName: row.farmer_name, distanceKm: Number(row.distance_km), village: row.village,
    landType: row.land_type, cropsGrown: row.crops_grown, schemeId: row.scheme_id, schemeName: row.scheme_name,
    outcomeSummary: row.outcome_summary, yieldIncreasePct: Number(row.yield_increase_pct), subsidyReceived: row.subsidy_received,
    implementationDate: row.implementation_date, contactAllowed: !!row.contact_allowed,
    contactPhone: row.contact_allowed ? row.contact_phone : "", avatar: row.avatar_url, isDemo: false,
  }));
  const examples = Array.from({ length: 32 }, (_, i) => ({ ...NEARBY_PEERS[i % NEARBY_PEERS.length],
    id: `demo-farmer-${i + 1}`, farmerName: `Demo farmer ${String(i + 1).padStart(2, "0")}`,
    village: `Example village ${i + 1}`, distanceKm: Number((1.5 + i * .7).toFixed(1)),
    cropsGrown: ["Cotton", "Paddy", "Chilli", "Maize", "Groundnut", "Vegetables"][i % 6],
    contactAllowed: false, contactPhone: "", isDemo: true,
    outcomeSummary: "Illustrative farmer scenario for exploring crop and scheme support. This is not a verified person, outcome, benefit or measured location.",
    subsidyReceived: "Illustrative scenario", implementationDate: "Demo record", yieldIncreasePct: 0,
  }));
  return [...registered, ...examples];
}
