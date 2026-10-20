import type { VisionAnalysisResult } from "@/lib/visionLlm";
import { parseAndSummarizeDocumentContent } from "@/lib/nlpDocumentAnalyzer";
import { numbersSupported } from "@/lib/documentEvidence";
import type { FarmerFacts } from "@/lib/conversationMemory";

export interface CropAnalysis {
  cropName?: string;
  observations: string[];
  possibleCauses: Array<{ name: string; evidence: string; check: string }>;
  limitations: string[];
  nextSteps: string[];
  questions: string[];
}
const strings = (v: unknown, max = 8): string[] => Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, max).map(s => s.slice(0, 700)) : [];
const chemicalDose = /\d+(?:\.\d+)?\s*(?:ml|mg|kg|grams?|litres?)\s*(?:\/|per)|\b(?:spray|apply|use)\b.*\b(?:imidacloprid|flonicamid|chlorpyrifos|fungicide|pesticide|insecticide)\b/i;
export function normalizeCropAnalysis(value: any): CropAnalysis | undefined {
  if (!value || !Array.isArray(value.observations)) return undefined;
  const possibleCauses = Array.isArray(value.possibleCauses) ? value.possibleCauses.filter((c: any) =>
    typeof c?.name === "string" && typeof c?.evidence === "string" && typeof c?.check === "string")
    .slice(0, 4).map((c: any) => ({ name: c.name.slice(0, 120), evidence: c.evidence.slice(0, 500), check: c.check.slice(0, 500) })) : [];
  return { cropName: typeof value.cropName === "string" ? value.cropName.slice(0, 100) : undefined,
    observations: strings(value.observations), possibleCauses,
    limitations: strings(value.limitations), nextSteps: strings(value.nextSteps).filter(s => !chemicalDose.test(s)), questions: strings(value.questions, 3) };
}

/** Compare independent readings; a model's self-reported confidence never verifies a document. */
export function reconcileImageEvidence(cloud: VisionAnalysisResult | null, local: VisionAnalysisResult): VisionAnalysisResult {
  if (!cloud || cloud.scopeStatus !== "in_scope") {
    if (local.scopeStatus === "in_scope") return local;
    return cloud?.scopeStatus === "out_of_scope" && cloud.confidenceScore >= 0.85 ? cloud : local;
  }
  if (cloud.docType === "crop_disease") {
    if (local.scopeStatus === "out_of_scope" && local.confidenceScore >= 0.85) {
      return { ...local, scopeStatus: "uncertain", isAgriRelated: false, confidenceScore: 0,
        title: "Image needs a clearer view", extractedData: {}, schemesUnlocked: [],
        detectionSummary: "The visual readings disagree about whether a crop is visible. Please send a close-up with the crop clearly in focus.",
        suggestions: ["Include the whole plant and a close-up of the affected part in good light."] };
    }
    // Readable document content takes precedence over mistaking a poster's plant picture for a crop sample.
    if (local.scopeStatus === "in_scope" && local.docType !== "crop_disease" && (local.extractedTextSnippet || "").length > 80) return local;
    return { ...cloud, schemesUnlocked: [], suggestions: (cloud.cropAnalysis?.nextSteps || cloud.suggestions).filter(s => !chemicalDose.test(s)),
      detectionSummary: cloud.cropAnalysis?.observations.length ? cloud.cropAnalysis.observations.join(" ") : cloud.detectionSummary };
  }
  const visionText = cloud.extractedTextSnippet?.trim() || "";
  const ocrText = local.parsedDetails?.fullOcrText || local.extractedTextSnippet || "";
  if (visionText.length < 25 && local.analysisQuality === "partial") return local;
  const source = visionText.length >= 25 && (local.analysisQuality === "partial" || visionText.length >= ocrText.length) ? visionText : ocrText;
  if (source.length < 25) return { ...cloud, analysisQuality: "partial", extractedData: {}, schemesUnlocked: [],
    detectionSummary: "A relevant document may be visible, but its text is not readable enough to confirm names, amounts, dates or eligibility.",
    suggestions: ["Upload a clear close-up of the relevant section or paste the original text."] };
  const parsed = parseAndSummarizeDocumentContent(source);
  const localFields = parseAndSummarizeDocumentContent(ocrText).extractedParameters;
  const visionFields = parseAndSummarizeDocumentContent(visionText).extractedParameters;
  const conflicts: string[] = [];
  for (const key of ["Owner / Applicant", "Survey Number", "Land Extent", "Consideration Amount", "Schedule / Dates"]) {
    const left = localFields[key]?.toLowerCase().replace(/\s+/g, " ").trim();
    const right = visionFields[key]?.toLowerCase().replace(/\s+/g, " ").trim();
    if (left && right && left !== right) conflicts.push(key);
  }
  const ocrRows = parseAndSummarizeDocumentContent(ocrText).schemeEntries || [];
  for (const row of parseAndSummarizeDocumentContent(visionText).schemeEntries || []) {
    const other = ocrRows.find(r => r.name.toLowerCase() === row.name.toLowerCase());
    if (other && /\d/.test(other.source) && /\d/.test(row.source)
      && (!numbersSupported(row.source, other.source) || !numbersSupported(other.source, row.source))) conflicts.push(`assistance figures for ${row.name}`);
  }
  const extractedData = { ...parsed.extractedParameters };
  for (const [key, value] of Object.entries(cloud.extractedData || {})) {
    const literal = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
    if (literal && source.toLowerCase().includes(literal.toLowerCase())) extractedData[key] = literal;
  }
  if (conflicts.length) {
    return { ...cloud, analysisQuality: "partial", extractedTextSnippet: source, parsedDetails: parsed,
      extractedData: {}, schemesUnlocked: [], readingConflicts: conflicts,
      detectionSummary: `The independent readings disagree on: ${conflicts.join(", ")}. I cannot reliably confirm those values from this copy.`,
      suggestions: ["Upload a sharp close-up of the conflicting fields or check the original document with its issuing office."] };
  }
  return { ...cloud, extractedTextSnippet: source, parsedDetails: parsed, extractedData,
    schemesUnlocked: parsed.unlockedSchemes,
    detectionSummary: numbersSupported(cloud.detectionSummary, source) ? cloud.detectionSummary || parsed.summary : parsed.summary,
    // Suggestions are regenerated from source; unverified cloud checklists must not become evidence.
    suggestions: parsed.actionableSuggestions, analysisQuality: "complete" };
}

export function answerCropImage(query: string, detection: any, facts: FarmerFacts = {}): { text: string; chips: string[] } {
  const analysis: CropAnalysis | undefined = normalizeCropAnalysis(detection.cropAnalysis);
  const observations = analysis?.observations.length ? analysis.observations : [detection.detectionSummary || "An agricultural subject is visible; its crop or condition is not confirmed."];
  const causes = analysis?.possibleCauses || [];
  const steps = analysis?.nextSteps.length ? analysis.nextSteps : (detection.suggestions || []).filter((s: string) => !chemicalDose.test(s));
  const known = [facts.crop, facts.cropAge, facts.soil, facts.irrigation, facts.district || facts.state].filter(Boolean).join("; ");
  const yellow = /yellow|chlorosis/i.test(observations.join(" "));
  const checks = yellow ? "Compare older and younger leaves, uniform yellowing versus green veins, and wet versus dry root-zone soil. Root stress can resemble nutrient deficiency; check the soil report before adding fertilizer." : "";
  const question = analysis?.questions.find(q => !(facts.crop && /what crop|which crop/i.test(q)) && !(facts.cropAge && /how old|crop age/i.test(q)))
    || (!facts.crop ? "What crop is this?" : "How much of the field is affected, and when did it start?");
  const cropIdentity = /(?:what|which).*(?:crop|plant)|(?:crop|plant) name|identify (?:the |this )?(?:crop|plant)/i.test(query);
  if (cropIdentity) return { text: analysis?.cropName
    ? `The image may show ${analysis.cropName}. This is a tentative visual identification; confirm with the whole plant, leaves and farmer's crop information.`
    : `I cannot reliably identify the crop from this image. ${facts.crop ? `You told me you grow ${facts.crop}; that does not by itself confirm the pictured plant.` : "Please share the crop name or a clearer view of the whole plant."}`, chips: ["What symptoms are visible?", "What should I check next?"] };
  const actionsOnly = /suggest|recommend|next|should i do|safely do|treat|remed|what can i do|check.*causes/i.test(query);
  const text = [
    ...(known ? [`Using the farm details you shared: ${known}.`] : []),
    `**What is visible**\n${observations.map(s => `• ${s}`).join("\n")}`,
    causes.length ? `**Possible causes to check**\n${causes.map(c => `• ${c.name}: ${actionsOnly ? c.check : `${c.evidence} Check: ${c.check}`}`).join("\n")}` : "The image alone does not identify a disease or nutrient deficiency.",
    `**Next steps**\n${steps.map((s: string) => `• ${s}`).join("\n")}`,
    ...(checks ? [checks, "General diagnostic reference: https://ipm.ucanr.edu/home-and-landscape/common-nutrient-deficiency-symptoms/"] : []),
    ...(analysis?.limitations || []),
    "A photo cannot confirm soil nutrient levels or a crop diagnosis. Match any treatment to the identified problem, crop and authorised label with a local agricultural officer.",
    question,
  ].join("\n\n");
  return { text, chips: ["How do I check the possible causes?", "What can I safely do now?", "I can share the crop age and symptoms"] };
}
