import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { SCHEMES_DATABASE, GUEST_FARMER } from "@/lib/mockData";
import { semanticSearchSchemes } from "@/lib/aiCopilotService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q") || searchParams.get("query");

    // Semantic Dense Vector Search if query is provided
    if (query && query.trim()) {
      const matches = semanticSearchSchemes(query.trim(), GUEST_FARMER, 12);
      const results = matches.map((m) => ({
        id: m.scheme.id,
        code: m.scheme.id,
        name: m.scheme.name,
        category: m.scheme.category,
        categoryName: m.scheme.category,
        matchScore: m.eligibility.overallMatchScore,
        hybridScoreBadge: m.formattedBadge,
        vectorCosine: m.vectorCosine,
        subsidyAmount: m.scheme.is_agri ? "60% Subsidy / DBT" : "Government Welfare",
        description: m.scheme.description,
        benefits: m.scheme.benefits,
        eligibilitySummary: `Eligibility Match: ${m.eligibility.overallMatchScore}% (${m.formattedBadge})`,
        documentsRequired: m.scheme.documents_required
          ? m.scheme.documents_required.split(",").map((d) => d.trim()).filter(Boolean)
          : ["Aadhaar Card", "Bank Account Details", "Land Record Documents"],
        department: m.scheme.ministry,
        tagColor: m.scheme.is_agri ? "emerald" : "sky",
        applicationMode: "Both",
        sla: m.eligibility.sla,
      }));

      return NextResponse.json({
        success: true,
        source: "dense_vector_nlp",
        schemes: results,
      });
    }

    let sql = "SELECT * FROM schemes";
    const params: any[] = [];

    if (category && category !== "all") {
      sql += " WHERE category = $1";
      params.push(category);
    }

    const dbResult = await queryDatabase(sql, params);

    if (dbResult.success && Array.isArray(dbResult.data) && dbResult.data.length > 0) {
      const formatted = dbResult.data.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        categoryName: row.category_name,
        matchScore: row.match_score,
        subsidyAmount: row.subsidy_amount,
        description: row.description,
        benefits: row.benefits,
        eligibilitySummary: row.eligibility_summary,
        documentsRequired: typeof row.documents_required === "string" ? JSON.parse(row.documents_required) : row.documents_required,
        department: row.department,
        tagColor: row.tag_color,
        applicationMode: row.application_mode,
      }));

      return NextResponse.json({
        success: true,
        source: "postgres",
        schemes: formatted,
      });
    }

    // Fallback to in-memory database
    const filtered = category && category !== "all" 
      ? SCHEMES_DATABASE.filter(s => s.category === category)
      : SCHEMES_DATABASE;

    return NextResponse.json({
      success: true,
      source: "cached",
      schemes: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, schemes: SCHEMES_DATABASE },
      { status: 500 }
    );
  }
}
