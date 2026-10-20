import Tesseract from "tesseract.js";
import { analyzeDocumentWithNlpSuite } from "@/lib/nlpDocumentAnalyzer";

export interface ExtractedBoundingBox {
  id: string;
  label: string;
  text: string;
  box: { top: number; left: number; width: number; height: number };
  /** Normalized bounding coordinates [ymin, xmin, ymax, xmax] (0-100) */
  normalizedCoords?: [number, number, number, number];
  confidence: number;
  defectOrEntity?: string;
  visibilityState?: "critical" | "moderate" | "low";
  visibilityPercent?: number;
}

export interface ExtractedDocumentResult {
  docType: "land_record" | "soil_health_card" | "crop_disease" | "identity_card";
  title: string;
  confidenceScore: number;
  detectionSummary: string;
  extractedTextSnippet?: string;
  extractedData: Record<string, any>;
  boundingBoxes: ExtractedBoundingBox[];
  schemesUnlocked: string[];
  suggestions?: string[];
  nlpBreakdown?: any;
}

/**
 * Known non-agricultural software, computer screen, and developer keywords.
 * If these are found in the OCR text, the image is strictly rejected as out of scope.
 */
const TECH_CONSOLE_KEYWORDS = [
  "environment variables",
  "render.com",
  "localhost",
  "database_url",
  "npm run",
  "npm install",
  "npm start",
  "git commit",
  "powershell",
  "terminal",
  "docker",
  "syntaxerror",
  "vscode",
  "vs code",
  "operating system",
  "build failed",
  "port 10000",
  "neondb",
  "postgresql://",
  "pull request",
  "github.com",
  "command line",
  "task manager",
];

/**
 * Agricultural, land revenue, and government welfare keywords that confirm domain relevance.
 */
const AGRI_DOMAIN_KEYWORDS = [
  "agriculture", "agricultural", "krishi", "farmer", "farmers", "kisan",
  "patta", "pahani", "ror", "land", "survey", "khasra", "khata", "revenue",
  "soil", "crop", "seed", "seeds", "fertilizer", "pesticide", "subsidy",
  "subsidies", "gram", "panchayat", "tahsildar", "mandal", "taluk", "district",
  "government", "yojana", "praman", "deed", "sale deed", "rythu", "aadhaar",
  "card", "certificate", "department", "ministry", "directorate", "dharani",
  "meebhoomi", "bhulekh", "jamabandi", "acres", "guntas", "hectare", "bigha",
  "gypsum", "sprayer", "minikit", "beneficiary", "paddy", "cotton", "maize",
  "chilli", "horticulture", "irrigation", "borwell", "solar pump", "kusum",
  "pm-kisan", "pmfby", "kcc", "shc", "icar", "extension", "officer", "aao",
  "vendee", "vendor", "purchaser", "pattadar", "allotment", "barani", "cultivable"
];

/**
 * Perform OCR on a base64 string or file buffer with a strict timeout.
 */
export async function performOcr(
  fileBase64: string,
  timeoutMs: number = 20000
): Promise<string> {
  return new Promise(async (resolve) => {
    let completed = false;

    const timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        resolve("");
      }
    }, timeoutMs);

    try {
      const pureBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(pureBase64, "base64");

      // Check if file is plain text
      const headText = buffer.toString("utf8", 0, Math.min(buffer.length, 1000));
      if (
        fileBase64.startsWith("data:text/") &&
        /^[a-zA-Z0-9\s\.,;:!?'"()\-_/\\%@#&+=<>[\]{}]+$/.test(headText)
      ) {
        completed = true;
        clearTimeout(timer);
        resolve(buffer.toString("utf8"));
        return;
      }

      // Run Tesseract OCR in English
      const {
        data: { text },
      } = await Tesseract.recognize(buffer, "eng");

      if (!completed) {
        completed = true;
        clearTimeout(timer);
        resolve(text ? text.trim() : "");
      }
    } catch {
      if (!completed) {
        completed = true;
        clearTimeout(timer);
        resolve("");
      }
    }
  });
}

/**
 * Clean OCR text into meaningful non-empty lines.
 */
function getCleanLines(ocrRawText: string): string[] {
  return ocrRawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2 && !/^[^a-zA-Z0-9]+$/.test(l));
}

/**
 * Extract farmer or applicant name dynamically from OCR text lines without presets.
 */
function extractDynamicName(text: string, lines: string[]): string | undefined {
  const namePatterns = [
    /(?:name\s*(?:of\s*(?:the)?\s*(?:farmer|owner|pattadar|purchaser|applicant|vendee|holder|candidate))?|pattadar|farmer\s*name|holder)\s*[:=\-]?\s*([A-Za-z\s\.\u0C00-\u0C7F]+)/i,
    /(?:shri|smt|mr\.|ms\.)\s+([A-Za-z\s\.\u0C00-\u0C7F]{3,35})/i,
    /(?:vendee|purchaser)\s*[:=\-]?\s*([A-Za-z\s\.\u0C00-\u0C7F]{3,35})/i,
    /(?:s\/o|d\/o|w\/o|son\s*of|wife\s*of)\s+([A-Za-z\s\.\u0C00-\u0C7F]{3,35})/i,
  ];

  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const candidate = match[1].replace(/\r?\n.*/g, "").trim();
      const cleaned = candidate.replace(/\b(and|is|the|of|for|to|in|at|no|survey|extent)\b.*/i, "").trim();
      if (cleaned.length >= 3 && cleaned.length <= 40 && !/\d{2,}/.test(cleaned)) {
        return cleaned;
      }
    }
  }

  // Look for a line containing "s/o" or "d/o"
  for (const line of lines) {
    if (/\b(?:s\/o|d\/o|w\/o)\b/i.test(line)) {
      const cleaned = line.replace(/^(?:name\s*[:=\-]?\s*)?/i, "").trim();
      if (cleaned.length >= 4 && cleaned.length <= 50) {
        return cleaned;
      }
    }
  }

  return undefined;
}

/**
 * Extract survey number, khata, or khasra number dynamically.
 */
function extractSurveyNumber(text: string): string | undefined {
  const match = text.match(
    /(?:survey|khasra|khata|passbook|pass\s*book|dag|sy\.?|patta)\s*(?:no\.?|number|num)?\s*[:=\-]?\s*([0-9A-Za-z\/\-\u0C00-\u0C7F]+)/i
  );
  if (match && match[1]) {
    const val = match[1].trim();
    if (val.length >= 1 && val.length <= 25 && /[0-9]/.test(val)) {
      return val;
    }
  }
  return undefined;
}

/**
 * Extract land area or extent (acres, hectares, guntas, bigha).
 */
function extractLandExtent(text: string): { extentStr?: string; acresNum?: number } {
  const areaMatch = text.match(
    /([0-9]+(?:\.[0-9]+)?)\s*(acres?|hectares?|ha\.?|bigha|guntas?|cents?|ac\.?gts?)/i
  );
  if (areaMatch) {
    const val = parseFloat(areaMatch[1]);
    const unit = areaMatch[2].toLowerCase();
    let normalizedAcres = val;
    if (unit.startsWith("hect") || unit === "ha" || unit === "ha.") {
      normalizedAcres = Math.round(val * 2.471 * 100) / 100;
    } else if (unit.startsWith("bigha")) {
      normalizedAcres = Math.round(val * 0.413 * 100) / 100;
    } else if (unit.startsWith("gun")) {
      normalizedAcres = Math.round((val / 40) * 100) / 100;
    }
    return {
      extentStr: `${areaMatch[1]} ${areaMatch[2]}`,
      acresNum: normalizedAcres,
    };
  }
  return {};
}

/**
 * Extract financial consideration or subsidy amounts.
 */
function extractFinancialAmount(text: string): string | undefined {
  const match = text.match(
    /(?:₹|rs\.?|inr|consideration|subsidy|fee|amount|cost)\s*[:=\-]?\s*(?:₹|rs\.?)?\s*([0-9,]+(?:\.[0-9]{2})?)/i
  );
  if (match && match[1]) {
    const num = match[1].trim();
    if (num.length >= 2 && num.length <= 15) {
      return `₹${num}`;
    }
  }
  return undefined;
}

/**
 * Extract location details (District, Mandal, Tehsil, State).
 */
function extractLocation(text: string): string | undefined {
  const locMatch = text.match(
    /(?:district|dist\.?|mandal|tehsil|taluk|village|gram|panchayat)\s*[:=\-]?\s*([A-Za-z\s]+)/i
  );
  if (locMatch && locMatch[1]) {
    const loc = locMatch[1].trim().split(/\n|,/)[0].trim();
    if (loc.length >= 3 && loc.length <= 35) {
      return loc;
    }
  }

  // Check known Indian states
  const states = [
    "Telangana", "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra",
    "Rajasthan", "Assam", "Madhya Pradesh", "Uttar Pradesh", "Punjab",
    "Haryana", "Odisha", "West Bengal", "Gujarat", "Bihar", "Jharkhand", "Kerala"
  ];
  for (const st of states) {
    if (new RegExp(`\\b${st}\\b`, "i").test(text)) {
      return `${st} Jurisdiction`;
    }
  }

  return undefined;
}

/**
 * Extract government department or issuing authority.
 */
function extractDepartment(text: string): string | undefined {
  const deptMatch = text.match(
    /(?:department of agriculture|directorate of agriculture|revenue department|ministry of agriculture|icar|krishi bhavan|krishi vigyan kendra|rythu vedika|collectorate|sub-registrar office)/i
  );
  if (deptMatch) {
    return deptMatch[0].replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return undefined;
}

/**
 * Comprehensive Dynamic Document & Agronomic Crop Vision Analyzer.
 * Extracts genuine details from the image with ZERO hardcoded mock names or presets.
 */
export async function analyzeDocumentComprehensive(
  fileBase64: string,
  fileName: string = "",
  fileType: string = "",
  classification?: any
): Promise<
  ExtractedDocumentResult & {
    isAgriRelated?: boolean;
    scopeStatus?: string;
    reason?: string;
    suggestions?: string[];
  }
> {
  const lowerName = fileName.toLowerCase();

  // Run real Tesseract OCR on the file
  const ocrRawText = await performOcr(fileBase64);
  const lowerOcr = ocrRawText.toLowerCase();
  const cleanLines = getCleanLines(ocrRawText);

  // -------------------------------------------------------------------------
  // 1. STRICT OUT-OF-SCOPE REJECTION: Software / Developer / Tech Screens
  // -------------------------------------------------------------------------
  let techKeywordsFound = 0;
  for (const kw of TECH_CONSOLE_KEYWORDS) {
    if (lowerOcr.includes(kw)) techKeywordsFound++;
  }

  if (techKeywordsFound >= 2 || lowerOcr.includes("environment variables") || lowerOcr.includes("render.com")) {
    return {
      docType: "land_record",
      title: "Non-Agricultural Screen (Out of Scope)",
      confidenceScore: 0.98,
      isAgriRelated: false,
      scopeStatus: "out_of_scope",
      detectionSummary: "Uploaded image shows a computer screen, software terminal, or cloud settings interface.",
      reason:
        "The uploaded photo appears to be a computer screen / software interface (Render environment variables / console) rather than agricultural crops, soil, or official government welfare documents.",
      extractedTextSnippet: ocrRawText.slice(0, 200),
      extractedData: {},
      boundingBoxes: [],
      schemesUnlocked: [],
      suggestions: [
        "Capture a clear photo of an affected plant leaf showing pest or disease symptoms.",
        "Upload an official agricultural document (Land Patta, Pahani, RoR 1B, Sale Deed, or Soil Health Card).",
        "Avoid uploading developer dashboards or system settings screens.",
      ],
    };
  }
  // -------------------------------------------------------------------------
  // 2. MULTIMODAL NLP ANALYSIS SUITE (BERT + HMM + CRF + TF-IDF)
  // -------------------------------------------------------------------------
  const nlpResult = analyzeDocumentWithNlpSuite(ocrRawText, fileName, classification);

  // Augment with regex extractions if available
  const ownerName = extractDynamicName(ocrRawText, cleanLines);
  const surveyNumber = extractSurveyNumber(ocrRawText);
  const { extentStr } = extractLandExtent(ocrRawText);
  const financialAmount = extractFinancialAmount(ocrRawText);
  const location = extractLocation(ocrRawText);
  const department = extractDepartment(ocrRawText);

  if (ownerName && !nlpResult.extractedData.ownerName && !nlpResult.extractedData.citizenName) {
    nlpResult.extractedData.ownerName = ownerName;
  }
  if (surveyNumber && !nlpResult.extractedData.surveyNumber) {
    nlpResult.extractedData.surveyNumber = `Survey/Khata No: ${surveyNumber}`;
  }
  if (extentStr && !nlpResult.extractedData.landAreaAcres) {
    nlpResult.extractedData.landAreaAcres = extentStr;
  }
  if (financialAmount && !nlpResult.extractedData.considerationAmount) {
    nlpResult.extractedData.considerationAmount = financialAmount;
  }
  if (location && !nlpResult.extractedData.districtMandal) {
    nlpResult.extractedData.districtMandal = location;
  }
  if (department && !nlpResult.extractedData.issuingAuthority) {
    nlpResult.extractedData.issuingAuthority = department;
  }

  return {
    docType: nlpResult.docType,
    title: nlpResult.title,
    confidenceScore: nlpResult.confidenceScore,
    isAgriRelated: true,
    scopeStatus: 'in_scope',
    detectionSummary: nlpResult.detectionSummary,
    extractedTextSnippet: ocrRawText ? ocrRawText.slice(0, 300) : undefined,
    extractedData: nlpResult.extractedData,
    boundingBoxes: nlpResult.boundingBoxes,
    schemesUnlocked: nlpResult.schemesUnlocked,
    suggestions: nlpResult.suggestions,
    nlpBreakdown: nlpResult.nlpBreakdown,
  };
}
