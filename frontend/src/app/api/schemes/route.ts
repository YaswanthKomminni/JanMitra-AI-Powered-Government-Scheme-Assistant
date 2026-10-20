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
        matchScore: 0,
        catalogRelevance: m.hybridScore,
        jurisdiction: m.jurisdiction || "Central / jurisdiction not specified in catalog",
        subsidyAmount: m.scheme.benefits?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 180) || "Check current official benefit terms",
        description: m.scheme.description,
        benefits: m.scheme.benefits,
        eligibilitySummary: "Eligibility has not been determined. Compare your profile with current scheme rules, exclusions and state requirements.",
        documentsRequired: m.scheme.documents_required
          ? m.scheme.documents_required.split(/\n|,(?=\s*[A-Z])/).map((d) => d.replace(/<[^>]+>/g, " ").trim()).filter(Boolean)
          : [],
        department: m.scheme.ministry,
        tagColor: m.scheme.is_agri ? "emerald" : "sky",
        applicationMode: "unknown",
      }));

      return NextResponse.json({
        success: true,
        source: "saved_catalog_topic_search",
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
      const formatted = dbResult.data.map((row: any) => SCHEMES_DATABASE.find(scheme => scheme.id === row.id) || ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        categoryName: row.category_name,
        matchScore: 0,
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
