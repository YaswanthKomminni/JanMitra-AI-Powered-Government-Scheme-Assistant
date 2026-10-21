import { MAX_DOCUMENT_CHARACTERS } from "@/lib/documentLimits";
/** Never forward previews, verification flags, or client-provided profile values to the answer engine. */
export function documentChatContext(input: any) {
  const source = String(input?.parsedDetails?.fullOcrText || input?.extractedTextSnippet || "").slice(0, MAX_DOCUMENT_CHARACTERS);
  return { docType: input?.docType === "crop_disease" ? "crop_disease" : "land_record",
    analysisQuality: input?.analysisQuality === "partial" ? "partial" : undefined,
    detectionSummary: String(input?.detectionSummary || "").slice(0, 4000),
    extractedTextSnippet: source,
    readablePassages: Array.isArray(input?.readablePassages) ? input.readablePassages.slice(0, 100) : undefined,
    cropAnalysis: input?.docType === "crop_disease" ? input.cropAnalysis : undefined };
}
