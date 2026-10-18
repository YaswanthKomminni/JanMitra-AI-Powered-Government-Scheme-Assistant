import type { FarmerProfile } from "@/lib/mockData";

/** Columns that are safe to read for building a public profile (never password_hash). */
export const PUBLIC_USER_COLUMNS = `u.id, u.name, u.phone, u.email, u.state, u.district, u.village,
  u.land_size_acres, u.soil_type, u.irrigation_type, u.primary_crops, u.annual_income_slab,
  u.preferred_language, u.verified_docs_count, u.avatar_url, u.created_at`;

export const SOIL_TYPES = ["black_soil", "red_soil", "alluvial", "dryland", "wetland"] as const;
export const IRRIGATION_TYPES = ["drip", "borewell", "canal", "rainfed"] as const;
export const LANGUAGE_CODES = ["en", "hi", "te", "ta", "kn", "bn"] as const;

const SOIL_LABELS: Record<string, string> = {
  black_soil: "Black Soil (Regur)",
  red_soil: "Red Sandy Loam",
  alluvial: "Alluvial Soil",
  dryland: "Dryland Soil",
  wetland: "Wetland / Clay Alluvial",
};

const IRRIGATION_LABELS: Record<string, string> = {
  drip: "Drip Irrigation",
  borewell: "Borewell / Tube Well",
  canal: "Canal Irrigation",
  rainfed: "Rainfed (Dryland)",
};

export const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80";

/** Map a `users` row to the FarmerProfile shape used across the UI. */
export function mapUserRow(row: any): FarmerProfile {
  const soil = row.soil_type || "";
  const irrigation = row.irrigation_type || "";
  return {
    id: `farmer_${row.id}`,
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    state: row.state || "",
    district: row.district || "",
    village: row.village || "",
    lat: 17.1472,
    lng: 78.2882,
    landSizeAcres: row.land_size_acres != null ? parseFloat(row.land_size_acres) || 0 : 0,
    soilType: soil as FarmerProfile["soilType"],
    soilTypeName: soil ? SOIL_LABELS[soil] || soil.replace(/_/g, " ") : "",
    primaryCrops: row.primary_crops
      ? String(row.primary_crops)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    irrigationType: irrigation as FarmerProfile["irrigationType"],
    irrigationTypeName: irrigation ? IRRIGATION_LABELS[irrigation] || irrigation : "",
    preferredLanguage: row.preferred_language || "en",
    annualIncomeSlab: row.annual_income_slab || "",
    verifiedDocsCount: Number(row.verified_docs_count) || 0,
    avatarUrl: row.avatar_url || DEFAULT_AVATAR,
  };
}
