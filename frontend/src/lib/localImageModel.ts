import { recordModelRun } from "@/lib/modelTelemetry";
import path from "node:path";
import sharp from "sharp";

export interface ObjectPrediction { label: string; probability: number; scopeStatus?: "in_scope" | "uncertain" }
let classifierPromise: Promise<any> | undefined;
const unrelatedLabels = [
  "an indoor room with a ceiling, walls, a fan and furniture",
  "a selfie or portrait of a person without a document",
  "a pet dog or cat",
  "a car, motorcycle or other road vehicle",
  "a computer showing programming code or a software terminal",
  "an everyday household object unrelated to farming",
  "a plate of cooked food",
  "an empty wall, floor or ceiling",
  "a school worksheet, shopping receipt, restaurant menu or unrelated printed document",
];
const relatedLabels = [
  "an agricultural crop plant, leaves, fruit or a crop pest",
  "a farm field, farmland, agricultural soil or farm machinery",
  "a government welfare scheme information poster or notice",
  "an official government document, certificate, application form or identity card",
  "an agricultural university admission, recruitment or research document",
  "an Indian land record, sale deed, farmer passbook or soil health card",
  "an agricultural subsidy table listing seeds, fertilizers and farm equipment assistance",
];

async function getClassifier() {
  if (!classifierPromise) classifierPromise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.localModelPath = process.env.VISION_MODEL_PATH || path.join(process.cwd(), "models");
    env.allowRemoteModels = false;
    return pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
      dtype: "q8", device: "cpu", local_files_only: true,
      session_options: { intraOpNumThreads: 1, interOpNumThreads: 1, executionMode: "sequential" },
    });
  })().catch((error) => { classifierPromise = undefined; throw error; });
  return classifierPromise;
}

/** Compare real image embeddings with relevant and unrelated scenes. No pixel-color decisions. */
export async function classifyImageObjects(bytes: Buffer): Promise<ObjectPrediction[]> {
  const started = Date.now();
  try {
    const classifier = await getClassifier();
    const { RawImage } = await import("@huggingface/transformers");
    const { data, info } = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
      .removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    const image = new RawImage(new Uint8ClampedArray(data), info.width, info.height, 3);
    const result = await classifier(image, [...relatedLabels, ...unrelatedLabels]);
    recordModelRun({ model: "CLIP ViT-B/32 q8", task: "Zero-shot image scene classification", status: "completed", latencyMs: Date.now() - started, score: result[0]?.score, detail: `Top scene: ${result[0]?.label || "unknown"}. Similarity is not calibrated accuracy.` });
    return result.map((item: any) => ({ label: item.label, probability: item.score }));
  } catch (error) {
    recordModelRun({ model: "CLIP ViT-B/32 q8", task: "Scene classification", status: "failed", latencyMs: Date.now() - started });
    console.warn("[local vision] Semantic model unavailable:", (error as Error).message);
    return [];
  }
}

export function clearlyIrrelevantObject(predictions: ObjectPrediction[]): ObjectPrediction | undefined {
  const first = predictions[0];
  if (!first || !unrelatedLabels.includes(first.label)) return undefined;
  const unrelated = predictions.filter((item) => unrelatedLabels.includes(item.label)).reduce((sum, item) => sum + item.probability, 0);
  const related = predictions.filter((item) => relatedLabels.includes(item.label)).reduce((sum, item) => sum + item.probability, 0);
  return first.probability >= 0.35 && unrelated >= 0.85 && related < 0.15 ? first : undefined;
}

export function agriculturalScene(predictions: ObjectPrediction[]): ObjectPrediction | undefined {
  const first = predictions[0];
  return first?.probability >= 0.65 && relatedLabels.slice(0, 2).includes(first.label) ? first : undefined;
}

export function documentScene(predictions: ObjectPrediction[]): ObjectPrediction | undefined {
  const documents = predictions.filter((item) => relatedLabels.slice(2).includes(item.label));
  const total = documents.reduce((sum, item) => sum + item.probability, 0);
  const unrelated = predictions.filter((item) => unrelatedLabels.includes(item.label)).reduce((sum, item) => sum + item.probability, 0);
  if (documents[0] && total >= 0.85 && unrelated < 0.1) return { ...documents[0], probability: total, scopeStatus: "in_scope" };
  const otherPaper = predictions.find((item) => item.label === "a school worksheet, shopping receipt, restaurant menu or unrelated printed document");
  const paper = total + (otherPaper?.probability || 0);
  return documents[0] && paper >= 0.85 && unrelated - (otherPaper?.probability || 0) < 0.1
    ? { ...documents[0], probability: paper, scopeStatus: "uncertain" } : undefined;
}

/** Black-box occlusion sensitivity: hide each quadrant and rerun the actual CLIP model. */
export async function explainImageOcclusion(bytes: Buffer) {
  const image = await sharp(bytes).rotate().resize(512, 512, { fit: "contain", background: "#808080" }).png().toBuffer();
  const baseline = await classifyImageObjects(image);
  if (!baseline[0]) throw new Error("The local vision model is unavailable.");
  const label = baseline[0].label;
  const score = baseline[0].probability;
  const regions = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const patch = await sharp({ create: { width: 256, height: 256, channels: 3, background: "#808080" } }).png().toBuffer();
    const masked = await sharp(image).composite([{ input: patch, left: col * 256, top: row * 256 }]).png().toBuffer();
    const prediction = await classifyImageObjects(masked);
    if (!prediction.length) throw new Error("A masked-image evaluation did not finish.");
    regions.push({ row, col, scoreDrop: score - (prediction.find(p => p.label === label)?.probability || 0) });
  }
  return { method: "CLIP quadrant occlusion sensitivity", label, baselineScore: score, regions,
    limitation: "Red regions reduce this CLIP scene score when hidden. This does not identify disease, prove document authenticity, or explain a cloud model’s internal reasoning." };
}
