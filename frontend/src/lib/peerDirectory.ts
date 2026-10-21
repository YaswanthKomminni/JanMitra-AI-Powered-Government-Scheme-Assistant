import { NEARBY_PEERS, type PeerSuccessStory } from "@/lib/mockData";

export interface DemoFarmerProfile {
  name: string;
  village: string;
  landType: string;
  cropsGrown: string;
  schemeId: string;
  schemeName: string;
  outcomeSummary: string;
  yieldIncreasePct: number;
  subsidyReceived: string;
  implementationDate: string;
  phone: string;
  avatar: string;
}

export const DEMO_FARMER_SCENARIOS: DemoFarmerProfile[] = [
  {
    name: "Rameshwar Reddy",
    village: "Kothur, Rangareddy",
    landType: "3.0 Acres • Black Soil",
    cropsGrown: "Cotton & Red Gram",
    schemeId: "SCH_KUSUM",
    schemeName: "PM-KUSUM 5HP Solar Pump",
    outcomeSummary: "Replaced 6HP diesel pump with 5HP solar system. Saved ₹4,600 monthly fuel expenditure and increased cotton yield by 32% with reliable daytime irrigation.",
    yieldIncreasePct: 32,
    subsidyReceived: "₹1,32,000 (60% Subsidy)",
    implementationDate: "March 2024",
    phone: "+91 98480 34120",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Anjaiah Kuruma",
    village: "Nandigama, Rangareddy",
    landType: "2.8 Acres • Red Sandy Loam",
    cropsGrown: "Chilli & Groundnut",
    schemeId: "SCH_FASAL",
    schemeName: "PMFBY Crop Insurance Claim",
    outcomeSummary: "Severe hailstorm damaged unharvested chilli crops in October. Received ₹42,500 direct compensation into bank account within 35 days without intermediaries.",
    yieldIncreasePct: 0,
    subsidyReceived: "₹42,500 Claim Paid",
    implementationDate: "November 2023",
    phone: "+91 94401 89761",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Laxmi Bai",
    village: "Shadnagar Rural, Rangareddy",
    landType: "4.2 Acres • Mixed Loam",
    cropsGrown: "Paddy & Vegetables",
    schemeId: "SCH_SOIL",
    schemeName: "Soil Health Card Fertilizer Optimization",
    outcomeSummary: "Soil testing identified zinc and nitrogen deficiency. Applied customized micro-nutrients and reduced chemical urea usage by 40%, boosting crop yield by 22%.",
    yieldIncreasePct: 22,
    subsidyReceived: "Free Testing + ₹3,000 Kit",
    implementationDate: "January 2024",
    phone: "+91 99890 12389",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Venkat Rao",
    village: "Shamshabad, Rangareddy",
    landType: "3.5 Acres • Red Sandy Soil",
    cropsGrown: "Tomato & Capsicum",
    schemeId: "SCH_DRIP",
    schemeName: "Pradhan Mantri Krishi Sinchayee Yojana (Drip Irrigation)",
    outcomeSummary: "Installed micro-drip irrigation system covering 3.5 acres under 70% state subsidy. Water usage dropped by 50% while tomato production rose by 38%.",
    yieldIncreasePct: 38,
    subsidyReceived: "₹85,000 (70% Subsidy)",
    implementationDate: "February 2024",
    phone: "+91 97012 45819",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Padma Goud",
    village: "Maheshwaram, Rangareddy",
    landType: "2.5 Acres • Black Cotton Loam",
    cropsGrown: "Turmeric & Maize",
    schemeId: "SCH_PKVY",
    schemeName: "Paramparagat Krishi Vikas Yojana (Organic Farming)",
    outcomeSummary: "Adopted natural liquid bio-fertilizers and zero-budget organic methods. Premium organic certification yielded 25% higher market rates at local Rythu Bazars.",
    yieldIncreasePct: 25,
    subsidyReceived: "₹31,000 Incentive",
    implementationDate: "December 2023",
    phone: "+91 89192 73401",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Suresh Patel",
    village: "Chevella, Rangareddy",
    landType: "5.0 Acres • Clay Loam",
    cropsGrown: "Paddy & Sunflower",
    schemeId: "SCH_SMAM",
    schemeName: "Sub-Mission on Agricultural Mechanization (Tractor Subsidy)",
    outcomeSummary: "Acquired a 45HP mini-tractor with rotary tiller under agricultural mechanization quota. Cut field tilling turnaround from 5 days to 8 hours.",
    yieldIncreasePct: 18,
    subsidyReceived: "₹1,75,000 Subsidy",
    implementationDate: "October 2023",
    phone: "+91 70321 84920",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Narayana Swamy",
    village: "Moinabad, Rangareddy",
    landType: "3.2 Acres • Red Loam",
    cropsGrown: "Mango Orchard & Guava",
    schemeId: "SCH_MIDH",
    schemeName: "Mission for Integrated Development of Horticulture (MIDH)",
    outcomeSummary: "Established ultra-high density mango plantation with multi-tier drip lines. Harvested export-grade Banganapalle fruits with zero insect pest damage.",
    yieldIncreasePct: 35,
    subsidyReceived: "₹68,000 Plant Material",
    implementationDate: "April 2024",
    phone: "+91 91214 56782",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Mallesh Yadav",
    village: "Ibrahimpatnam, Rangareddy",
    landType: "2.0 Acres • Mixed Soil",
    cropsGrown: "Fodder Grass & Dairy",
    schemeId: "SCH_DAIRY",
    schemeName: "National Livestock Mission (Dairy Cattle Grant)",
    outcomeSummary: "Procured 2 Murrah buffaloes with cattle shed construction grant. Selling 24 liters of fresh milk daily to district cooperative dairy at ₹52/liter.",
    yieldIncreasePct: 40,
    subsidyReceived: "₹1,20,000 Unit Grant",
    implementationDate: "May 2024",
    phone: "+91 93902 41837",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Kavitha Devi",
    village: "Yacharam, Rangareddy",
    landType: "4.0 Acres • Sandy Loam",
    cropsGrown: "Cotton & Green Gram",
    schemeId: "SCH_NFSM",
    schemeName: "National Food Security Mission (Certified Seed Kit)",
    outcomeSummary: "Utilized drought-resilient high-yielding pulse seed varieties and seed treatment inoculum. Green gram harvest generated ₹58,000 net profit as intercrop.",
    yieldIncreasePct: 28,
    subsidyReceived: "₹18,500 Seed Mini-Kit",
    implementationDate: "July 2023",
    phone: "+91 80083 62914",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Balram Naik",
    village: "Farooqnagar, Rangareddy",
    landType: "3.8 Acres • Red Gravely Loam",
    cropsGrown: "Groundnut & Sesame",
    schemeId: "SCH_NMOOP",
    schemeName: "National Mission on Oilseeds and Oil Palm",
    outcomeSummary: "Applied gypsum and sulphur booster fertilizers for oilseed cultivation. Oil content and pod weight increased significantly with guaranteed MSP procurement.",
    yieldIncreasePct: 24,
    subsidyReceived: "₹22,000 Input Subsidy",
    implementationDate: "September 2023",
    phone: "+91 94905 71284",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Geetha Rani",
    village: "Kondurg, Rangareddy",
    landType: "1.8 Acres • Red Sandy Soil",
    cropsGrown: "Marigold Flowers & Jasmine",
    schemeId: "SCH_FLORI",
    schemeName: "State Floriculture & Polyhouse Scheme",
    outcomeSummary: "Constructed shade net house for seasonal marigold and crossandra cultivation. Daily harvest supplies Hyderabad floral markets during festival peaks.",
    yieldIncreasePct: 45,
    subsidyReceived: "₹90,000 Shade Net Subsidy",
    implementationDate: "August 2023",
    phone: "+91 96184 92051",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Rajeshwar Rao",
    village: "Shabad, Rangareddy",
    landType: "4.5 Acres • Deep Black Soil",
    cropsGrown: "Soybean & Wheat",
    schemeId: "SCH_RKVY",
    schemeName: "Rashtriya Krishi Vikas Yojana (Farm Pond & Water Harvesting)",
    outcomeSummary: "Excavated a 15x15m polythene-lined farm pond to capture monsoon rainwater run-off. Provided life-saving critical irrigation during a 4-week dry spell.",
    yieldIncreasePct: 30,
    subsidyReceived: "₹75,000 Pond Subsidy",
    implementationDate: "June 2023",
    phone: "+91 98663 17409",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  }
];

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
  const examples = Array.from({ length: 32 }, (_, i) => {
    const s = DEMO_FARMER_SCENARIOS[i % DEMO_FARMER_SCENARIOS.length];
    return {
      id: `demo-farmer-${i + 1}`,
      farmerName: s.name,
      village: s.village,
      distanceKm: Number((1.5 + i * 0.7).toFixed(1)),
      landType: s.landType,
      cropsGrown: s.cropsGrown,
      schemeId: s.schemeId,
      schemeName: s.schemeName,
      outcomeSummary: s.outcomeSummary,
      yieldIncreasePct: s.yieldIncreasePct,
      subsidyReceived: s.subsidyReceived,
      implementationDate: s.implementationDate,
      contactAllowed: true,
      contactPhone: s.phone,
      avatar: s.avatar,
      isDemo: true,
    };
  });
  return [...registered, ...examples];
}
