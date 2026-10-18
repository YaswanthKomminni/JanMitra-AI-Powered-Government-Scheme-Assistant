import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email = "",
      password = "1234",
      state = "Telangana",
      district = "Rangareddy",
      village = "Kothur",
      landSizeAcres = 3.5,
      soilType = "black_soil",
      irrigationType = "drip",
      primaryCrops = "Cotton, Chilli",
      annualIncomeSlab = "Below ₹2.5 Lakhs",
      preferredLanguage = "en",
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "Name and Phone number are required." },
        { status: 400 }
      );
    }

    // Check if user with phone already exists
    const existingResult = await queryDatabase(
      "SELECT id, name, phone FROM users WHERE phone = ? LIMIT 1",
      [phone]
    );

    if (existingResult.success && Array.isArray(existingResult.data) && existingResult.data.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A farmer with this phone number is already registered. Please sign in.",
        },
        { status: 409 }
      );
    }

    // Insert new user into MySQL JanMithra
    const insertSql = `
      INSERT INTO users (
        name, phone, email, password_hash, role,
        state, district, village, land_size_acres,
        soil_type, irrigation_type, primary_crops,
        annual_income_slab, preferred_language, verified_docs_count, avatar_url
      ) VALUES (?, ?, ?, ?, 'farmer', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `;

    const avatarUrl = `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80`;

    const insertResult = await queryDatabase(insertSql, [
      name,
      phone,
      email,
      password,
      state,
      district,
      village,
      parseFloat(landSizeAcres) || 3.0,
      soilType,
      irrigationType,
      primaryCrops,
      annualIncomeSlab,
      preferredLanguage,
      avatarUrl,
    ]);

    let newUserId = (insertResult.data as any)?.insertId || Date.now();

    const createdFarmer = {
      id: `farmer_${newUserId}`,
      name,
      phone,
      email,
      state,
      district,
      village,
      lat: 17.1472,
      lng: 78.2882,
      landSizeAcres: parseFloat(landSizeAcres) || 3.0,
      soilType,
      soilTypeName: soilType.replace("_", " ").toUpperCase(),
      primaryCrops: typeof primaryCrops === "string" ? primaryCrops.split(",").map((s) => s.trim()) : primaryCrops,
      irrigationType,
      irrigationTypeName: irrigationType.toUpperCase(),
      preferredLanguage,
      annualIncomeSlab,
      verifiedDocsCount: 1,
      avatarUrl,
    };

    return NextResponse.json({
      success: true,
      message: "Farmer account successfully registered in JanMithra MySQL database!",
      user: createdFarmer,
      dbSaved: insertResult.success,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register user." },
      { status: 500 }
    );
  }
}
