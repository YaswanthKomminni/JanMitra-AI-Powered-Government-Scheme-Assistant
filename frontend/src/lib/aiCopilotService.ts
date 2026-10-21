/**
 * JANMITRA SCHEME RETRIEVAL & CITIZEN CHARTER SERVICE
 *
 * Provides semantic scheme search, relevance ranking, and citizen charter
 * guidance across Indian central and state government welfare schemes.
 */

import type { SupportedLanguage } from "@/lib/i18n";
import type { FarmerProfile, Scheme } from "@/lib/mockData";
import { SCHEMES_DATABASE } from "@/lib/mockData";

export const DENSE_DIM = 128;

// Deterministic 32-bit FNV-1a Hash for token hashing
export function fnv1a32Hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// Multilingual tokenization (words + character 3-grams and 4-grams)
export function tokenizeMultilingual(text: string): string[] {
  if (!text) return [];
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9\s\u0900-\u0D7F]/g, " ");
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  const ngrams: string[] = [];

  for (const w of words) {
    if (w.length >= 3) {
      for (let i = 0; i <= w.length - 3; i++) {
        ngrams.push(w.slice(i, i + 3));
      }
    }
    if (w.length >= 4) {
      for (let i = 0; i <= w.length - 4; i++) {
        ngrams.push(w.slice(i, i + 4));
      }
    }
  }

  return [...words, ...ngrams];
}

/**
 * 128-Dimensional Token Embedding with Euclidean L2 normalization
 */
export function generateDenseVectorEmbedding(text: string, dim: number = DENSE_DIM): number[] {
  const tokens = tokenizeMultilingual(text);
  const vec = new Float32Array(dim);

  if (tokens.length === 0) {
    return Array.from(vec);
  }

  const counts: Record<string, number> = {};
  for (const t of tokens) {
    counts[t] = (counts[t] || 0) + 1;
  }

  for (const [token, count] of Object.entries(counts)) {
    const h1 = fnv1a32Hash(token);
    const h2 = fnv1a32Hash(token + "__proj");

    const idx1 = h1 % dim;
    const sign1 = ((h1 >> 8) & 1) === 0 ? 1.0 : -1.0;
    const tfWeight = Math.log1p(count);
    vec[idx1] += sign1 * tfWeight;

    const idx2 = ((h2 ^ (h1 >> 16)) >>> 0) % dim;
    const sign2 = ((h2 >> 8) & 1) === 0 ? 1.0 : -1.0;
    vec[idx2] += sign2 * (tfWeight * 0.5);
  }

  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }
  const l2Norm = Math.sqrt(sumSq);

  if (l2Norm > 1e-9) {
    for (let i = 0; i < dim; i++) {
      vec[i] = vec[i] / l2Norm;
    }
  }

  return Array.from(vec);
}

/**
 * Dot-Product Cosine Similarity
 */
export function computeVectorCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normASq = 0;
  let normBSq = 0;

  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normASq += vecA[i] * vecA[i];
    normBSq += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normASq) * Math.sqrt(normBSq);
  if (denom < 1e-9) return 0;
  const cos = dot / denom;
  return Math.max(0, Math.min(1, cos));
}

/**
 * Sparse Lexical Overlap Matching (Jaccard / Token overlap)
 */
export function computeSparseLexicalScore(query: string, documentText: string): number {
  if (!query || !documentText) return 0;
  const qWords = new Set(
    query
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s\u0900-\u0D7F]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  if (qWords.size === 0) return 0;

  const docWords = new Set(
    documentText
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s\u0900-\u0D7F]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  let matches = 0;
  qWords.forEach((w) => {
    if (docWords.has(w)) matches++;
  });

  return matches / qWords.size;
}

/**
 * Hybrid Semantic Match Engine
 */
export function computeHybridScore(
  query: string,
  candidateText: string,
  candidateVector?: number[]
): {
  hybridScore: number;
  vectorCosine: number;
  sparseScore: number;
  formattedBadge: string;
} {
  const qVec = generateDenseVectorEmbedding(query);
  const cVec = candidateVector || generateDenseVectorEmbedding(candidateText);

  const vectorCosine = computeVectorCosineSimilarity(qVec, cVec);
  const sparseScore = computeSparseLexicalScore(query, candidateText);

  const hybridScore = 0.5 * vectorCosine + 0.5 * sparseScore;
  const formattedBadge = `🎯 ${(hybridScore * 100).toFixed(0)}% Relevance Match`;

  return {
    hybridScore,
    vectorCosine,
    sparseScore,
    formattedBadge,
  };
}

/* ------------------------------------------------------------------ */
/* Citizen Charter Processing & SLA Timelines                         */
/* ------------------------------------------------------------------ */

export interface SlaPrediction {
  domain: string;
  baselineHours: number;
  scopeImpactFactor: number;
  queueLoadPenaltyMinutes: number;
  totalEstimatedHours: number;
  formattedEta: string;
  confidenceScore: number;
  factorBreakdown: Array<{ factor: string; impact: string }>;
}

/**
 * Estimates turnaround based on official Citizen Charter timelines:
 * - Agriculture DBT: 48 hrs
 * - Crop Loss / PMFBY Claim: 72 hrs
 * - Kisan Credit Card / Loan: 96 hrs
 * - Solar Pump / Equipment Subsidy: 120 hrs
 * - Land Title / Mutation: 168 hrs
 * - Seed / Fertilizer Input Subsidy: 24 hrs
 */
export function predictResolutionSLA(
  domainOrCategory: string = "Agriculture",
  landSizeAcres: number = 3.5,
  activeQueueBatches: number = 2
): SlaPrediction {
  const lower = domainOrCategory.toLowerCase();

  let domain = "Agriculture Welfare DBT";
  let baselineHours = 48;

  if (lower.includes("insurance") || lower.includes("pmfby") || lower.includes("loss")) {
    domain = "PMFBY Crop Loss Inspection";
    baselineHours = 72;
  } else if (lower.includes("loan") || lower.includes("kcc") || lower.includes("credit")) {
    domain = "KCC Concessional Credit";
    baselineHours = 96;
  } else if (lower.includes("solar") || lower.includes("kusum") || lower.includes("pump")) {
    domain = "PM-KUSUM Solar Water Pump";
    baselineHours = 120;
  } else if (lower.includes("patta") || lower.includes("deed") || lower.includes("mutation") || lower.includes("land")) {
    domain = "Revenue Land Record Linkage";
    baselineHours = 168;
  } else if (lower.includes("seed") || lower.includes("fertilizer") || lower.includes("equipment")) {
    domain = "Agricultural Input & Seed Subsidy";
    baselineHours = 24;
  }

  let scopeImpactFactor = 1.0;
  let scopeLabel = "Standard Agricultural Holder (> 5 acres)";
  if (landSizeAcres < 2.5) {
    scopeImpactFactor = 0.8;
    scopeLabel = "Marginal Farmer Priority (< 2.5 acres)";
  } else if (landSizeAcres <= 5.0) {
    scopeImpactFactor = 0.9;
    scopeLabel = "Small Farmer Priority (2.5 - 5.0 acres)";
  }

  const queueLoadPenaltyMinutes = Math.max(0, activeQueueBatches * 25);
  const queueLoadPenaltyHours = queueLoadPenaltyMinutes / 60;
  const totalEstimatedHours = Math.max(4, Math.round(baselineHours * scopeImpactFactor + queueLoadPenaltyHours));

  let formattedEta = "";
  if (totalEstimatedHours >= 24) {
    const days = Math.floor(totalEstimatedHours / 24);
    const remHours = totalEstimatedHours % 24;
    formattedEta = remHours > 0 ? `${days} days ${remHours} hrs` : `${days} business days`;
  } else {
    formattedEta = `${totalEstimatedHours} hrs`;
  }

  const confidenceScore = 0.95;

  return {
    domain,
    baselineHours,
    scopeImpactFactor,
    queueLoadPenaltyMinutes,
    totalEstimatedHours,
    formattedEta,
    confidenceScore,
    factorBreakdown: [
      { factor: "Citizen Charter Standard Timeline", impact: `${baselineHours} hrs (${domain})` },
      { factor: "Landholding Category", impact: scopeLabel },
      { factor: "Departmental Queue Factor", impact: `Active portal queue` },
    ],
  };
}

export interface SchemeEligibilityPrediction {
  schemeId: string;
  schemeName: string;
  overallMatchScore: number;
  vectorCosineScore: number;
  sparseLexicalScore: number;
  domainBaselineWeight: number;
  landholdingMultiplier: number;
  soilCropBonus: number;
  factorBreakdown: Array<{ factor: string; score: string }>;
  sla: SlaPrediction;
}

/**
 * Scheme Eligibility Matching based on farmer profile
 */
export function predictSchemeEligibility(
  farmer: FarmerProfile,
  scheme: {
    id: string;
    name: string;
    category?: string;
    description?: string;
    baselineWeight?: number;
    vector?: number[];
  },
  userQuery?: string
): SchemeEligibilityPrediction {
  const baselineWeight = scheme.baselineWeight || 0.95;
  const landAcres = farmer.landSizeAcres || 3.5;

  let landMultiplier = 1.0;
  if (landAcres < 2.5) landMultiplier = 1.15;
  else if (landAcres <= 5.0) landMultiplier = 1.08;

  let soilCropBonus = 1.0;
  const sText = (scheme.name + " " + (scheme.description || "")).toLowerCase();
  for (const crop of farmer.primaryCrops || []) {
    if (sText.includes(crop.toLowerCase())) {
      soilCropBonus += 0.05;
      break;
    }
  }
  if (farmer.soilType && sText.includes(farmer.soilType.toLowerCase())) {
    soilCropBonus += 0.03;
  }

  let vectorCosine = 0.75;
  let sparseScore = 0.65;
  if (userQuery) {
    const qVec = generateDenseVectorEmbedding(userQuery);
    const sVec = scheme.vector || generateDenseVectorEmbedding(scheme.name + " " + scheme.description);
    vectorCosine = computeVectorCosineSimilarity(qVec, sVec);
    sparseScore = computeSparseLexicalScore(userQuery, scheme.name + " " + (scheme.description || ""));
  }

  const rawScore = 0.4 * vectorCosine + 0.3 * sparseScore + 0.15 * baselineWeight + 0.15 * (landMultiplier - 1.0);
  const overallMatchScore = Math.min(99, Math.max(55, Math.round(rawScore * 100)));

  const sla = predictResolutionSLA(scheme.category || "Agriculture", landAcres, 2);

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    overallMatchScore,
    vectorCosineScore: Math.round(vectorCosine * 100),
    sparseLexicalScore: Math.round(sparseScore * 100),
    domainBaselineWeight: baselineWeight,
    landholdingMultiplier: landMultiplier,
    soilCropBonus,
    factorBreakdown: [
      { factor: "Domain Relevance", score: `${(baselineWeight * 100).toFixed(0)}%` },
      { factor: "Contextual Match", score: `${(vectorCosine * 100).toFixed(0)}%` },
      { factor: "Keyword Relevance", score: `${(sparseScore * 100).toFixed(0)}%` },
      { factor: "Landholding Category Bonus", score: `${((landMultiplier - 1.0) * 100).toFixed(0)}%` },
    ],
    sla,
  };
}

/* ------------------------------------------------------------------ */
/* Model Loader & Semantic Retrieval Engine                           */
/* ------------------------------------------------------------------ */

export interface IndexedScheme {
  id: string;
  name: string;
  category: string;
  ministry: string;
  description: string;
  benefits: string;
  documents_required: string;
  is_agri: boolean;
  baseline_weight: number;
  vector: number[];
}

export interface TrainedModelPackage {
  architecture: string;
  dimensions: number;
  intent_accuracy: number;
  intent_classes: string[];
  intent_centroids: Record<string, number[]>;
  total_schemes_indexed: number;
  schemes: IndexedScheme[];
}

let cachedModel: TrainedModelPackage | null = null;

export function getTrainedModel(): TrainedModelPackage | null {
  if (cachedModel) return cachedModel;
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    const fs = eval("require")("fs");
    const path = eval("require")("path");
    const candidatePaths = [
      path.join(process.cwd(), "frontend", "src", "lib", "data", "trained_nlp_model.json"),
      path.join(process.cwd(), "src", "lib", "data", "trained_nlp_model.json"),
      path.join(process.cwd(), "dataset", "trained_nlp_model.json"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, "utf-8");
          cachedModel = JSON.parse(raw);
          return cachedModel;
        } catch {
          // continue
        }
      }
    }
  } catch {
    // Non-node
  }

  return null;
}

export function classifyIntent(query: string): {
  intent: string;
  confidence: number;
  vector: number[];
} {
  const model = getTrainedModel();
  const qVec = generateDenseVectorEmbedding(query);

  if (!model || !model.intent_centroids) {
    return { intent: "scheme_inquiry", confidence: 0.85, vector: qVec };
  }

  let bestIntent = "scheme_inquiry";
  let bestSim = -1;

  for (const [intent, centroid] of Object.entries(model.intent_centroids)) {
    const sim = computeVectorCosineSimilarity(qVec, centroid);
    if (sim > bestSim) {
      bestSim = sim;
      bestIntent = intent;
    }
  }

  return {
    intent: bestIntent,
    confidence: Math.max(0.6, bestSim),
    vector: qVec,
  };
}

export interface SemanticSchemeMatch {
  scheme: IndexedScheme;
  hybridScore: number;
  vectorCosine: number;
  sparseScore: number;
  formattedBadge: string;
  eligibility: SchemeEligibilityPrediction;
}

/**
 * Semantic Retrieval Engine over Government Welfare Schemes
 */
export function semanticSearchSchemes(
  query: string,
  farmer: FarmerProfile,
  limit: number = 4
): SemanticSchemeMatch[] {
  const model = getTrainedModel();
  const qVec = generateDenseVectorEmbedding(query);

  const sourceSchemes: IndexedScheme[] = model?.schemes?.length
    ? model.schemes
    : SCHEMES_DATABASE.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        ministry: s.department || "Government of India",
        description: s.description,
        benefits: s.benefits,
        documents_required: s.documentsRequired?.join(", ") || "",
        is_agri: true,
        baseline_weight: 0.95,
        vector: generateDenseVectorEmbedding(s.name + " " + s.description),
      }));

  const scored: SemanticSchemeMatch[] = [];

  for (const s of sourceSchemes) {
    const sVec = s.vector || generateDenseVectorEmbedding(s.name + " " + s.description);
    const vectorCosine = computeVectorCosineSimilarity(qVec, sVec);
    const sparseScore = computeSparseLexicalScore(query, s.name + " " + s.description + " " + s.category);

    let hybridScore = 0.5 * vectorCosine + 0.5 * sparseScore;

    if (s.is_agri) {
      hybridScore += 0.05;
    }

    const formattedBadge = `🎯 ${(hybridScore * 100).toFixed(0)}% Relevance Match`;
    const eligibility = predictSchemeEligibility(farmer, s, query);

    scored.push({
      scheme: s,
      hybridScore,
      vectorCosine,
      sparseScore,
      formattedBadge,
      eligibility,
    });
  }

  scored.sort((a, b) => b.hybridScore - a.hybridScore);
  return scored.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Visual Feature Bounding Box Helpers                                */
/* ------------------------------------------------------------------ */

export interface VisionBoundingBox {
  id: string;
  label: string;
  defectOrEntity: string;
  confidence: number;
  normalizedCoords: [number, number, number, number];
  box: { top: number; left: number; width: number; height: number };
  visibilityState: "critical" | "moderate" | "low";
  visibilityPercent: number;
}

export function buildBoundingBox(opts: {
  id: string;
  label: string;
  defectOrEntity: string;
  confidence: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  visibilityPercent?: number;
}): VisionBoundingBox {
  const { id, label, defectOrEntity, confidence, ymin, xmin, ymax, xmax } = opts;
  const top = ymin;
  const left = xmin;
  const width = Math.max(5, xmax - xmin);
  const height = Math.max(5, ymax - ymin);

  const vis = opts.visibilityPercent ?? Math.round(confidence * 100);
  let visibilityState: "critical" | "moderate" | "low" = "low";
  if (vis >= 70) visibilityState = "critical";
  else if (vis >= 35) visibilityState = "moderate";

  return {
    id,
    label,
    defectOrEntity,
    confidence,
    normalizedCoords: [ymin, xmin, ymax, xmax],
    box: { top, left, width, height },
    visibilityState,
    visibilityPercent: vis,
  };
}

// Backward-compatible alias
export const buildYoloBoundingBox = buildBoundingBox;
