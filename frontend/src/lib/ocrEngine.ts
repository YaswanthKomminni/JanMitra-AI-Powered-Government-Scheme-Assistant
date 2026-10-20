import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import englishData from "@tesseract.js-data/eng";
import teluguData from "@tesseract.js-data/tel";
import { analyzeDocumentWithNlpSuite } from "@/lib/nlpDocumentAnalyzer";
import { assessUploadText } from "@/lib/uploadScope";
import { classifyImageObjects, clearlyIrrelevantObject, agriculturalScene } from "@/lib/localImageModel";

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

export async function performOcr(fileBase64: string, timeoutMs = 20000): Promise<string> {
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
    const codes = (process.env.OCR_LANGUAGES || "eng+tel").split("+");
    // Use packaged language files from a temporary data directory; never download OCR data during a request.
    const langPath = process.env.OCR_LANG_PATH || path.join(os.tmpdir(), "janmithra-tessdata-v1");
    if (!process.env.OCR_LANG_PATH) {
      await fs.mkdir(langPath, { recursive: true });
      await Promise.all(codes.map(async (code) => {
        const bundled = code === "eng" ? englishData : code === "tel" ? teluguData : undefined;
        if (!bundled) throw new Error(`Set OCR_LANG_PATH to the installed language files for ${code}.`);
        const packageDirectory = path.dirname(bundled.langPath);
        const target = path.join(langPath, `${code}.traineddata.gz`);
        try { await fs.access(target); } catch {
          await fs.copyFile(path.join(packageDirectory, "4.0.0_best_int", `${code}.traineddata.gz`), target);
        }
      }));
    }
    worker = await Tesseract.createWorker(codes.join("+"), 1, {
      langPath,
      cacheMethod: "none",
      errorHandler: () => {},
    });
    if (expired) { await worker.terminate(); return ""; }
    const image = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: 1600, height: 2200, fit: "inside" }).grayscale().normalize().sharpen().png().toBuffer();
    const first = (await worker.recognize(image)).data.text.trim();
    if (assessUploadText(first) === "in_scope" || expired) return first.slice(0, 40000);
    // Posters and collages often need sparse text segmentation instead of a page layout.
    await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
    const second = (await worker.recognize(image)).data.text.trim();
    return `${first}\n${second}`.trim().slice(0, 40000);
  })();
  try {
    return await Promise.race([task, new Promise<string>((resolve) => {
      timer = setTimeout(() => { expired = true; void worker?.terminate(); resolve(""); }, timeoutMs);
    })]);
  } catch (error) { console.warn("[ocr] Local text extraction unavailable:", (error as Error).message); return ""; }
  finally { if (timer) clearTimeout(timer); if (worker && !expired) await worker.terminate(); }
}

export async function analyzeDocumentComprehensive(fileBase64: string, fileName = "", _fileType = "", _classification?: any): Promise<ExtractedDocumentResult & {
  isAgriRelated: boolean; scopeStatus: "in_scope" | "out_of_scope" | "uncertain"; reason?: string;
}> {
  const text = await performOcr(fileBase64);
  const scope = assessUploadText(text);
  if (scope === "uncertain" && fileBase64.startsWith("data:image/")) {
    const predictions = await classifyImageObjects(Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ""), "base64"));
    const unrelated = clearlyIrrelevantObject(predictions);
    if (unrelated) {
      const reason = `This image appears to show ${unrelated.label}, with no readable agriculture or government scheme document.`;
      return { docType: "land_record", title: "Irrelevant image", isAgriRelated: false, scopeStatus: "out_of_scope",
        confidenceScore: unrelated.probability, detectionSummary: "Irrelevant image: please upload a crop, farm, or government scheme document.",
        reason, extractedData: {}, boundingBoxes: [], schemesUnlocked: [], suggestions: ["Upload a clear agriculture or government scheme image, or retake the photo with the relevant subject in view."] };
    }
    const crop = agriculturalScene(predictions);
    if (crop) {
      return { docType: "crop_disease", title: "Agricultural image", isAgriRelated: true, scopeStatus: "in_scope",
        confidenceScore: crop.probability, detectionSummary: "The image appears to show an agricultural subject. This visual classification does not establish a crop disease or soil condition.",
        extractedData: { observedSubject: crop.label }, boundingBoxes: [], schemesUnlocked: [], suggestions: [
          "If you need crop health advice, photograph the affected leaves and the whole plant in good light.",
          "Describe the crop, location, symptoms, and when the problem started so the advice can be specific.",
          "Confirm any suspected disease with a local agricultural officer before selecting a pesticide.",
        ] };
    }
  }
  if (scope !== "in_scope") {
    const reason = scope === "out_of_scope" ? "The readable content shows a software terminal rather than agriculture or government welfare information."
      : "I could not confidently identify the subject or read the text. Please retake a clear close-up of the crop or scheme document, or paste the document text.";
    return { docType: "land_record", title: scope === "out_of_scope" ? "Unrelated content" : "Could not read the upload",
      isAgriRelated: false, scopeStatus: scope, confidenceScore: scope === "out_of_scope" ? 0.9 : 0,
      detectionSummary: reason, reason, extractedData: {}, extractedTextSnippet: text,
      boundingBoxes: [], schemesUnlocked: [], suggestions: ["Upload a clear view of the full document page, or paste the document text."] };
  }
  return { ...analyzeDocumentWithNlpSuite(text, fileName), isAgriRelated: true, scopeStatus: "in_scope", extractedTextSnippet: text };
}
