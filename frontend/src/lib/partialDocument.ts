/** Conservative evidence retained from an incomplete OCR reading. Never promote
 * low-confidence amounts, dates or personal fields into confirmed facts. */
export interface ReadablePassage { text: string; confidence: number }
export function partialDocumentSource(detection: any): string {
  const reliable: string[] = Array.isArray(detection?.readablePassages) ? detection.readablePassages
    .filter((item: any) => typeof item?.text === "string" && item.confidence >= 70)
    .map((item: any) => item.text) : [];
  const raw = String(detection?.parsedDetails?.fullOcrText || detection?.extractedTextSnippet || "");
  const headings = raw.split(/\r?\n/).map(line => line.trim()).filter(line =>
    line.length >= 12 && line.length <= 180 && !/\d/.test(line)
    && /government|govt|schemes? and policies|welfare department|soil health card|land record|ప్రభుత్వ|పథకాలు|सरकारी योजना/i.test(line)
    && !/[{}<>\\=]/.test(line));
  const names = raw.match(/PM[ -]?KISAN|Kisan Samman Nidhi|PMFBY|Pradhan Mantri Fasal Bima Yojana|PM[ -]?KUSUM|Kisan Credit Card|Mahalakshmi|Rythu Bharosa|Gruha Jyothi|Indiramma(?: Indlu)?|Cheyutha|మహాలక్ష్మి|రైతు భరోసా|గృహ జ్యోతి|ఇందిరమ్మ ఇండ్లు|చేయూత/gi) || [];
  const entries = raw.match(/certified\s+seeds?(?:\s+of\s+(?:maize|rice|paddy))?|gypsum|(?:manually\s+operated\s+)?plant\s+protection\s+equipment|mini\s*kits?(?:\s+of\s+maize)?|(?:knapsack|power)\s+sprayer/gi) || [];
  return Array.from(new Set([...reliable, ...headings, ...names, ...entries])).join("\n").slice(0, 16000);
}
