import path from "node:path";
import sharp from "sharp";

export interface ObjectPrediction { label: string; probability: number }
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
];
const relatedLabels = [
  "an agricultural crop plant, leaves, fruit or a crop pest",
  "a farm field, farmland, agricultural soil or farm machinery",
  "a government welfare scheme information poster or notice",
  "an official government document, certificate, application form or identity card",
  "an agricultural university admission, recruitment or research document",
  "an Indian land record, sale deed, farmer passbook or soil health card",
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
  try {
    const classifier = await getClassifier();
    const { RawImage } = await import("@huggingface/transformers");
    const { data, info } = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
      .removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    const image = new RawImage(new Uint8ClampedArray(data), info.width, info.height, 3);
    const result = await classifier(image, [...relatedLabels, ...unrelatedLabels]);
    return result.map((item: any) => ({ label: item.label, probability: item.score }));
  } catch (error) {
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
