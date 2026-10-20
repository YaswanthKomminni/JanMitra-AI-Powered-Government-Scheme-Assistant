import Tesseract from "tesseract.js";
import { analyzeDocumentWithNlpSuite } from "@/lib/nlpDocumentAnalyzer";
import { assessUploadText } from "@/lib/uploadScope";

export interface ExtractedBoundingBox {
  id: string; label: string; text: string;
  box: { top: number; left: number; width: number; height: number };
  normalizedCoords?: [number, number, number, number]; confidence: number;
  defectOrEntity?: string; visibilityState?: "critical" | "moderate" | "low"; visibilityPercent?: number;
}
export interface ExtractedDocumentResult {
  docType: "land_record" | "soil_health_card" | "crop_disease" | "identity_card";
  title: string; confidenceScore: number; detectionSummary: string;
  extractedTextSnippet?: string; extractedData: Record<string, any>;
  boundingBoxes: ExtractedBoundingBox[]; schemesUnlocked: string[];
  suggestions?: string[]; parsedDetails?: any;
}

export async function performOcr(fileBase64: string, timeoutMs = 14000): Promise<string> {
  const bytes = Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (fileBase64.startsWith("data:text/plain")) return bytes.toString("utf8").slice(0, 40000);
  if (bytes.subarray(0, 5).toString() === "%PDF-") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      try { return (await parser.getText({ first: 20 })).text.slice(0, 40000).trim(); }
      finally { await parser.destroy(); }
    } catch { return ""; }
  }
  if (!fileBase64.startsWith("data:image/")) return "";
  // Terminate workers on completion AND timeout; a timed-out OCR job must not keep running.
  let worker: Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const task = (async () => {
    worker = await Tesseract.createWorker(process.env.OCR_LANGUAGES || "eng", 1, {
      ...(process.env.OCR_LANG_PATH ? { langPath: process.env.OCR_LANG_PATH } : {}),
      errorHandler: () => {},
    });
    if (expired) { await worker.terminate(); return ""; }
    return (await worker.recognize(bytes)).data.text.trim().slice(0, 40000);
  })();
  try {
    return await Promise.race([task, new Promise<string>((resolve) => {
      timer = setTimeout(() => { expired = true; void worker?.terminate(); resolve(""); }, timeoutMs);
    })]);
  } catch { return ""; }
  finally { if (timer) clearTimeout(timer); if (worker && !expired) await worker.terminate(); }
}

export async function analyzeDocumentComprehensive(fileBase64: string, fileName = "", _fileType = "", _classification?: any): Promise<ExtractedDocumentResult & {
  isAgriRelated: boolean; scopeStatus: "in_scope" | "out_of_scope" | "uncertain"; reason?: string;
}> {
  const text = await performOcr(fileBase64);
  const scope = assessUploadText(text);
  if (scope !== "in_scope") {
    const reason = scope === "out_of_scope" ? "The readable content shows a software terminal rather than agriculture or government welfare information."
      : "I could not reliably read or identify this upload. Please send a clearer image, a searchable PDF, or paste its text. A photo taken indoors can still be a valid document.";
    return { docType: "land_record", title: scope === "out_of_scope" ? "Unrelated content" : "Could not read the upload",
      isAgriRelated: false, scopeStatus: scope, confidenceScore: scope === "out_of_scope" ? 0.9 : 0,
      detectionSummary: reason, reason, extractedData: {}, extractedTextSnippet: text,
      boundingBoxes: [], schemesUnlocked: [], suggestions: ["Upload a clear view of the full document page, or paste the document text."] };
  }
  return { ...analyzeDocumentWithNlpSuite(text, fileName), isAgriRelated: true, scopeStatus: "in_scope", extractedTextSnippet: text };
}
