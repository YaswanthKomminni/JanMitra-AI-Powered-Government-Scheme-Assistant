import { recordModelRun } from "@/lib/modelTelemetry";
import { MAX_DOCUMENT_CHARACTERS, MAX_DOCUMENT_PAGES, type ExtractionCoverage } from "@/lib/documentLimits";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import englishData from "@tesseract.js-data/eng";
import teluguData from "@tesseract.js-data/tel";
import { analyzeDocumentWithNlpSuite } from "@/lib/nlpDocumentAnalyzer";
import { assessUploadText } from "@/lib/uploadScope";
import { partialDocumentSource, type ReadablePassage } from "@/lib/partialDocument";
import { classifyImageObjects, clearlyIrrelevantObject, agriculturalScene, documentScene } from "@/lib/localImageModel";

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
  analysisQuality?: "partial" | "complete";
  readablePassages?: ReadablePassage[];
  extractionCoverage?: ExtractionCoverage;
}

export async function performOcr(...args: Parameters<typeof performOcrInternal>): Promise<string> {
  const started = Date.now();
  let confidence: number | undefined;
  const reportQuality = args[2];
  args[2] = value => { confidence = value; reportQuality?.(value); };
  const text = await performOcrInternal(...args);
  recordModelRun({ model: args[0].startsWith("data:image/") ? "Tesseract LSTM OCR" : "Document text extractor", task: "Text extraction", status: text.trim() ? "completed" : "failed", latencyMs: Date.now() - started, score: confidence == null ? undefined : confidence / 100, detail: `${text.length} characters retained. Character count is coverage, not recognition accuracy.` });
  return text;
}

function readableOcrLines(data: Tesseract.Page): ReadablePassage[] {
  return (data.blocks || []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines))
    .filter(line => line.confidence >= 85 && line.text.trim().length >= 5 && line.words.every(word => word.confidence >= (/\d/.test(word.text) ? 90 : 70)))
    .slice(0, 120).map(line => ({ text: line.text.trim(), confidence: line.confidence }));
}

async function performOcrInternal(fileBase64: string, timeoutMs = 20000, reportQuality?: (confidence: number) => void,
  reportPassages?: (passages: ReadablePassage[]) => void, reportCoverage?: (coverage: ExtractionCoverage) => void): Promise<string> {
  const bytes = Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (fileBase64.startsWith("data:text/plain")) {
    const text = bytes.toString("utf8");
    reportCoverage?.({ method: "text", characters: Math.min(text.length, MAX_DOCUMENT_CHARACTERS), truncated: text.length > MAX_DOCUMENT_CHARACTERS });
    return text.slice(0, MAX_DOCUMENT_CHARACTERS);
  }
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const ole = bytes.subarray(0, 4).toString("hex") === "d0cf11e0";
  if (zip || ole) {
    try {
      const { default: WordExtractor } = await import("word-extractor");
      const document = await new WordExtractor().extract(bytes);
      const text = [document.getBody(), document.getFootnotes(), document.getEndnotes(), document.getHeaders(), document.getTextboxes()].filter(Boolean).join("\n\n");
      reportCoverage?.({ method: zip ? "docx" : "doc", characters: Math.min(text.length, MAX_DOCUMENT_CHARACTERS), truncated: text.length > MAX_DOCUMENT_CHARACTERS });
      return text.slice(0, MAX_DOCUMENT_CHARACTERS);
    } catch { return ""; }
  }
  if (bytes.subarray(0, 5).toString() === "%PDF-") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      try {
        const started = Date.now();
        const result = await parser.getText({ first: MAX_DOCUMENT_PAGES });
        const pages = result.pages || [];
        const readings = new Map(pages.map(page => [page.num, page.text.replace(/-- \d+ of \d+ --/g, "").trim()]));
        const hasText = Array.from(readings.values()).join("").trim().length >= 40;
        const missing = pages.filter(page => (readings.get(page.num) || "").length < 20).map(page => page.num);
        // Some PDFs mix searchable pages with scans. OCR a bounded number of missing pages,
        // preserving the text layer and explicitly reporting pages still unreadable.
        const screenshots = missing.length ? await parser.getScreenshot({ partial: missing.slice(0, 3), desiredWidth: 2000, imageDataUrl: false, imageBuffer: true }) : undefined;
        const reliable: ReadablePassage[] = [];
        for (const page of screenshots?.pages || []) {
          const remaining = timeoutMs - (Date.now() - started);
          if (remaining < 1000) break;
          // Blank separator pages are common in booklets; avoid wasting the OCR budget on them.
          const stats = await sharp(Buffer.from(page.data)).stats();
          if (hasText && stats.channels.every(c => c.mean > 245 && c.stdev < 5)) continue;
          const reading = await performOcr(`data:image/png;base64,${Buffer.from(page.data).toString("base64")}`, remaining,
            hasText ? undefined : reportQuality, passages => { reliable.push(...passages); reportPassages?.(reliable); });
          if (reading.trim()) readings.set(page.pageNumber, reading.trim());
        }
        const extracted = pages.length ? pages.map(page => `[Page ${page.num}]\n${readings.get(page.num) || "[No readable text on this page]"}`).join("\n\n") : result.text;
        const unreadablePages = pages.filter(page => (readings.get(page.num) || "").length < 20).map(page => page.num);
        reportCoverage?.({ method: hasText ? "pdf_text" : "pdf_scan", pagesRead: pages.length, totalPages: result.total,
          unreadablePages, characters: Math.min(extracted.length, MAX_DOCUMENT_CHARACTERS),
          truncated: result.total > pages.length || extracted.length > MAX_DOCUMENT_CHARACTERS });
        return extracted.slice(0, MAX_DOCUMENT_CHARACTERS);

      }
      finally { await parser.destroy(); }
    } catch { return ""; }
  }
  if (!fileBase64.startsWith("data:image/")) return "";
  // Terminate workers on completion AND timeout; a timed-out OCR job must not keep running.
  let worker: Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;
  let expired = false;
  let bestText = "";
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
    const firstLanguage = codes.includes("eng") ? "eng" : codes.join("+");
    worker = await Tesseract.createWorker(firstLanguage, 1, {
      langPath,
      cacheMethod: "none",
      errorHandler: () => {},
    });
    if (expired) { await worker.terminate(); return ""; }
    const dimensions = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
    const image = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: Math.min(1800, (dimensions.width || 900) * 4), height: Math.min(2400, (dimensions.height || 1200) * 4), fit: "inside" })
      .grayscale().normalize().sharpen().png().toBuffer();
    // Read English first for dense tables; add Telugu only when the first pass needs help.
    const firstPass = (await worker.recognize(image, {}, { text: true, blocks: true })).data;
    const first = firstPass.text.trim();
    bestText = first;
    reportQuality?.(firstPass.confidence || 0);
    reportPassages?.(readableOcrLines(firstPass));
    if (expired || (assessUploadText(first) === "in_scope" && first.length > 500 && firstPass.confidence >= 80)) return first.slice(0, 40000);
    // Posters and collages often need sparse text segmentation instead of a page layout.
    await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
    if (codes.length > 1) await worker.reinitialize(codes.join("+"));
    const secondPass = (await worker.recognize(image, {}, { text: true, blocks: true })).data;
    const second = secondPass.text.trim();
    // Pick a reading rather than concatenating conflicting copies of dates/amounts.
    const regionalWords = /ప్రభుత్వ|పథక|రైతు|వ్యవసాయ|మహాలక్ష|భరోసా/.test(second);
    const better = secondPass.confidence >= 55 && secondPass.confidence > firstPass.confidence;
    if (second && (better || regionalWords || !first.trim())) {
      bestText = second;
      reportQuality?.(secondPass.confidence || 0);
      reportPassages?.(readableOcrLines(secondPass));
    }
    bestText = bestText.slice(0, 40000);
    return bestText;
  })();
  try {
    return await Promise.race([task, new Promise<string>((resolve) => {
      timer = setTimeout(() => { expired = true; void worker?.terminate(); resolve(bestText); }, timeoutMs);
    })]);
  } catch (error) { console.warn("[ocr] Local text extraction unavailable:", (error as Error).message); return bestText; }
  finally { if (timer) clearTimeout(timer); if (worker && !expired) await worker.terminate(); }
}

export async function analyzeDocumentComprehensive(fileBase64: string, fileName = "", _fileType = "", _classification?: any): Promise<ExtractedDocumentResult & {
  isAgriRelated: boolean; scopeStatus: "in_scope" | "out_of_scope" | "uncertain"; reason?: string;
}> {
  let ocrConfidence: number | undefined;
  let readablePassages: ReadablePassage[] = [];
  let extractionCoverage: ExtractionCoverage | undefined;
  const text = await performOcr(fileBase64, 20000, confidence => { ocrConfidence = confidence; }, passages => { readablePassages = passages; }, coverage => { extractionCoverage = coverage; });
  const scope = assessUploadText(text);
  let predictions: Awaited<ReturnType<typeof classifyImageObjects>> = [];
  if (scope === "uncertain" && fileBase64.startsWith("data:image/")) {
    predictions = await classifyImageObjects(Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ""), "base64"));
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
  if (scope === "uncertain" && fileBase64.startsWith("data:image/")) {
    const document = documentScene(predictions);
    if (document) {
      const readable = partialDocumentSource({ extractedTextSnippet: text, readablePassages });
      const partial = readable ? analyzeDocumentWithNlpSuite(readable, fileName) : undefined;
      return { docType: "land_record", title: "Document image — partial reading", isAgriRelated: document.scopeStatus === "in_scope", scopeStatus: document.scopeStatus || "uncertain",
        analysisQuality: "partial", confidenceScore: document.probability,
        detectionSummary: partial?.detectionSummary || "I can see a printed document/table, but no text could be read reliably. I cannot yet summarize its specific contents.",
        extractedTextSnippet: text, readablePassages, extractedData: {}, boundingBoxes: [], schemesUnlocked: [], suggestions: [
          "Tell me which scheme or table row you want help with; I can explain the application process or farming topic in the meantime.",
          "Upload a close-up of one row at a time, or the original image/PDF rather than a screenshot thumbnail.",
          "Before applying, check the current eligibility, assistance limit and deadline with the issuing agriculture office or official portal.",
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
  const parsed = { ...analyzeDocumentWithNlpSuite(text, fileName), extractionCoverage };
  if (ocrConfidence !== undefined && ocrConfidence < 55) {
    const readable = partialDocumentSource({ extractedTextSnippet: text, readablePassages });
    const summary = readable ? analyzeDocumentWithNlpSuite(readable, fileName).detectionSummary
      : "This appears to be an agriculture or government scheme document, but its fine print could not be read reliably. Names, figures and conditions are not confirmed.";
    return { ...parsed, isAgriRelated: true, scopeStatus: "in_scope", analysisQuality: "partial", extractedTextSnippet: text,
      extractedData: {}, readablePassages, schemesUnlocked: [], detectionSummary: summary,
      suggestions: ["Upload a close-up of the specific scheme panel or table row, or the original PDF. I can use the readable heading to discuss the topic, but cannot confirm unreadable benefits or eligibility."] };
  }
  return { ...parsed, isAgriRelated: true, scopeStatus: "in_scope", extractedTextSnippet: text };
}
