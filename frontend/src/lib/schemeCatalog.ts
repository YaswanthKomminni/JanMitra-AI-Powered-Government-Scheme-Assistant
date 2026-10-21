import { getTrainedModel, schemeJurisdiction } from "@/lib/aiCopilotService";
import { SCHEMES_DATABASE, type Scheme } from "@/lib/mockData";
export function catalogText(value: unknown, limit = 4000): string {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*#`>]/g, "").replace(/\s+/g, " ").trim().slice(0, limit);
}
export function catalogCategory(text: string): string {
  if (/agricultur|rural|environment/i.test(text)) return "Agriculture & rural support";
  if (/education|learning/i.test(text)) return "Education & scholarships";
  if (/health|wellness/i.test(text)) return "Health & care";
  if (/housing|shelter/i.test(text)) return "Housing";
  if (/energy|solar|lpg/i.test(text)) return "Energy";
  if (/bank|financial|credit/i.test(text)) return "Finance & credit";
  if (/business|entrepreneur/i.test(text)) return "Business support";
  if (/skill|employment/i.test(text)) return "Employment & skills";
  if (/women|child/i.test(text)) return "Women & children";
  if (/pension|social security/i.test(text)) return "Pensions & social security";
  if (/transport|utility|sanitation/i.test(text)) return "Infrastructure & services";
  return "Other welfare support";
}
/** Saved source data, without sending model vectors to browsers. */
export function exploreSchemeCatalog(): Scheme[] {
  const names = new Set(SCHEMES_DATABASE.map(s => s.name.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const catalog = (getTrainedModel()?.schemes || []).flatMap(row => {
    const name = catalogText(row.name, 240);
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || names.has(key)) return [];
    names.add(key);
    const text = `${name} ${row.category}`;
    const category: Scheme["category"] = /insurance|fasal|bima/i.test(text) ? "insurance" : /solar|kusum/i.test(text) ? "solar"
      : /credit|loan|finance|mudra/i.test(text) ? "credit" : /soil/i.test(text) ? "soil" : "subsidy";
    const documents = String(row.documents_required || "").replace(/<\/(?:li|p)>|<br\s*\/?>/gi, "\n").split(/\n|,(?=\s*[A-Z])/)
      .map(d => catalogText(d, 180)).filter(Boolean).slice(0, 12);
    return [{ id: `catalog:${row.id}`, code: "Saved catalog", name, category, categoryName: catalogCategory(row.category),
      matchScore: 0, subsidyAmount: catalogText(row.benefits, 180) || "Check the current official terms",
      description: catalogText(row.description, 1600), benefits: catalogText(row.benefits),
      eligibilitySummary: "Check the current scheme notice for eligible applicants, state rules, exclusions and application dates. This listing does not establish eligibility.",
      documentsRequired: documents, department: catalogText(row.ministry, 240), tagColor: "emerald", applicationMode: "unknown" as const,
      jurisdiction: schemeJurisdiction(row.ministry) || "Central / jurisdiction not specified", sourceUrl: "https://www.myscheme.gov.in/" }];
  });
  return [...SCHEMES_DATABASE, ...catalog];
}
