/** Browser previews do not have a semantic vision model. Classification happens on the server. */
export interface VisionClassificationResult {
  isAgriRelated: boolean;
  detectedType: "pending";
  scopeStatus: "pending";
  confidence: number;
  message: string;
  metrics: { greenVegetationRatio: number; soilToneRatio: number; documentPaperRatio: number; dominantDomain: string };
}
export function classifyImagePixels(_data: Uint8ClampedArray | number[], _width: number, _height: number, _fileName = "", _category = "auto_detect"): VisionClassificationResult {
  return { isAgriRelated: false, detectedType: "pending", scopeStatus: "pending", confidence: 0,
    message: "Ready for analysis. Relevance will be checked when you scan or send this image.",
    metrics: { greenVegetationRatio: 0, soilToneRatio: 0, documentPaperRatio: 0, dominantDomain: "Awaiting analysis" } };
}
export async function classifyBase64Image(_base64Url: string, fileName = "", category = "auto_detect"): Promise<VisionClassificationResult> {
  return classifyImagePixels([], 0, 0, fileName, category);
}
