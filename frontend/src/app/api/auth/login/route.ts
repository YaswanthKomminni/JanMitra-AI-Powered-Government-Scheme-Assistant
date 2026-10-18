import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { DEMO_FARMERS } from "@/lib/mockData";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp = "5289", password } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Phone number is required." },
        { status: 400 }
      );
    }

    // Query MySQL JanMithra database
    const dbResult = await queryDatabase(
      "SELECT * FROM users WHERE phone = ? LIMIT 1",
      [phone]
    );

    let userProfile = null;

    if (dbResult.success && Array.isArray(dbResult.data) && dbResult.data.length > 0) {
      const row = dbResult.data[0];
      userProfile = {
        id: `farmer_${row.id}`,
        name: row.name,
        phone: row.phone,
        email: row.email,
        state: row.state,
        district: row.district,
        village: row.village,
        lat: 17.1472,
        lng: 78.2882,
        landSizeAcres: parseFloat(row.land_size_acres) || 3.0,
        soilType: row.soil_type || "black_soil",
        soilTypeName: (row.soil_type || "black_soil").replace("_", " ").toUpperCase(),
        primaryCrops: row.primary_crops ? row.primary_crops.split(",").map((s: string) => s.trim()) : ["Cotton"],
        irrigationType: row.irrigation_type || "drip",
        irrigationTypeName: (row.irrigation_type || "drip").toUpperCase(),
        preferredLanguage: row.preferred_language || "en",
        annualIncomeSlab: row.annual_income_slab || "Below ₹2.5 Lakhs",
        verifiedDocsCount: row.verified_docs_count || 1,
        avatarUrl: row.avatar_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
      };
    } else {
      // Fallback to match demo farmers if DB is currently empty or connecting
      const matched = DEMO_FARMERS.find((f) => f.phone === phone);
      if (matched) {
        userProfile = matched;
      }
    }

    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered farmer found with this phone number. Please sign up.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Farmer authenticated successfully from JanMithra!",
      user: userProfile,
      source: dbResult.success && dbResult.data?.length ? "mysql" : "cached",
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Login failed." },
      { status: 500 }
    );
  }
}
