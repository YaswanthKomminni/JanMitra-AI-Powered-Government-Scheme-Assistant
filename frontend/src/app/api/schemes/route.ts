import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";
import { SCHEMES_DATABASE } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let sql = "SELECT * FROM schemes";
    const params: any[] = [];

    if (category && category !== "all") {
      sql += " WHERE category = ?";
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
        source: "mysql",
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
