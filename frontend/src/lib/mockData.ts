export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  state: string;
  district: string;
  village: string;
  lat: number;
  lng: number;
  landSizeAcres: number;
  soilType: "black_soil" | "red_soil" | "alluvial" | "dryland" | "wetland" | "";
  soilTypeName: string;
  primaryCrops: string[];
  irrigationType: "drip" | "borewell" | "canal" | "rainfed" | "";
  irrigationTypeName: string;
  preferredLanguage: string;
  annualIncomeSlab: string;
  verifiedDocsCount: number;
  avatarUrl: string;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  category: "subsidy" | "solar" | "insurance" | "soil" | "credit";
  categoryName: string;
  matchScore: number;
  subsidyAmount: string;
  description: string;
  benefits: string;
  eligibilitySummary: string;
  documentsRequired: string[];
  department: string;
  tagColor: string;
  applicationMode: "online" | "offline" | "both";
}

export interface PeerSuccessStory {
  id: string;
  farmerName: string;
  distanceKm: number;
  village: string;
  landType: string;
  cropsGrown: string;
  schemeId: string;
  schemeName: string;
  outcomeSummary: string;
  yieldIncreasePct: number;
  subsidyReceived: string;
  implementationDate: string;
  contactAllowed: boolean;
  contactPhone: string;
  avatar: string;
}

export interface MockOcrResult {
  docType: "land_record" | "soil_health_card" | "crop_disease" | "identity_card";
  title: string;
  previewUrl: string;
  confidenceScore: number;
  fileName?: string;
  detectionSummary?: string;
  extractedData: {
    ownerName?: string;
    surveyNumber?: string;
    landAreaAcres?: number;
    soilType?: string;
    soilPh?: number;
    nitrogenStatus?: string;
    phosphorusStatus?: string;
    potassiumStatus?: string;
    cropDetected?: string;
    pestIdentified?: string;
    infestationSeverity?: string;
    diseaseSymptoms?: string;
    recommendedAction?: string;
    districtMandal?: string;
    waterSource?: string;
    citizenName?: string;
    maskedIdNumber?: string;
    dbtLinkedBank?: string;
    stateDistrict?: string;
    revenueStatus?: string;
    organization?: string;
    noticeSubject?: string;
    dates?: string;
    venue?: string;
    authority?: string;
    department?: string;
    keyInitiative?: string;
    institution?: string;
    facultyDepartment?: string;
    admissionDegree?: string;
    affiliatedColleges?: string;
    [key: string]: any;
  };
  boundingBoxes?: Array<{
    id: string;
    label: string;
    text: string;
    box: { top: number; left: number; width: number; height: number };
    confidence: number;
  }>;
  schemesUnlocked?: string[];
}

/**
 * Placeholder profile shown to visitors who are not signed in.
 * It is NOT an account and cannot be used to authenticate; real profiles are
 * loaded from PostgreSQL via /api/auth/me after sign-in. (The old DEMO_FARMERS
 * one-click logins were removed.)
 */
export const GUEST_FARMER: FarmerProfile = {
  id: "guest",
  name: "",
  phone: "",
  email: "",
  state: "",
  district: "",
  village: "",
  lat: 17.1472,
  lng: 78.2882,
  landSizeAcres: 0,
  soilType: "",
  soilTypeName: "",
  primaryCrops: [],
  irrigationType: "",
  irrigationTypeName: "",
  preferredLanguage: "en",
  annualIncomeSlab: "",
  verifiedDocsCount: 0,
  avatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
};

export const SCHEMES_DATABASE: Scheme[] = [
  {
    id: "SCH_KUSUM",
    code: "PM-KUSUM-B",
    name: "PM-KUSUM Solar Water Pump Subsidy",
    category: "solar",
    categoryName: "Solar & Energy",
    matchScore: 98,
    subsidyAmount: "60% Subsidy (Up to ₹1,42,000)",
    description: "Install 3HP to 7.5HP standalone solar agricultural pumps with 60% government subsidy, eliminating diesel and high grid electricity bills.",
    benefits: "Zero power bill for irrigation, 25-year solar panel life warranty, 30% state subsidy + 30% central subsidy.",
    eligibilitySummary: "Landowners with borewell or open well, dryland/black soil eligible, priority for small & marginal farmers.",
    documentsRequired: ["Pahani / Patta Land Deed", "Aadhaar Card", "Bank Passbook", "Borewell / Water Source Certificate"],
    department: "Ministry of New and Renewable Energy",
    tagColor: "bg-amber-100 text-amber-800 border-amber-300",
    applicationMode: "online",
  },
  {
    id: "SCH_KISAN",
    code: "PM-KISAN",
    name: "PM-KISAN Samman Nidhi Yojana",
    category: "subsidy",
    categoryName: "Direct Financial Support",
    matchScore: 95,
    subsidyAmount: "₹6,000 / Year in 3 Installments",
    description: "Flagship central government initiative providing assured annual financial assistance of ₹6,000 in three equal installments directly to bank accounts via DBT.",
    benefits: "Direct bank transfer (₹2,000 every 4 months) to support input purchases like seeds, manure, and fertilizers before sowing season.",
    eligibilitySummary: "All cultivable landholding farmer families with land records updated in State revenue portals.",
    documentsRequired: ["Aadhaar Card linked with Mobile", "Updated Land Record (Khata/Pahani)", "Bank Account with e-KYC verified"],
    department: "Ministry of Agriculture & Farmers Welfare",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    applicationMode: "both",
  },
  {
    id: "SCH_FASAL",
    code: "PMFBY",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    category: "insurance",
    categoryName: "Crop Insurance",
    matchScore: 92,
    subsidyAmount: "Full Crop Loss Cover (Only 1.5% Premium)",
    description: "Comprehensive financial support against unexpected crop loss due to non-preventable natural risks (drought, flood, unseasonal hail, pests).",
    benefits: "Farmers pay only 2% premium for Kharif crops, 1.5% for Rabi food/oilseeds; government absorbs remaining 80-90% premium cost.",
    eligibilitySummary: "All farmers growing notified crops in notified areas (both loanee and non-loanee farmers).",
    documentsRequired: ["Land Ownership Deed / Sowing Certificate", "Aadhaar Card", "Bank Passbook Copy", "Crop Sowing Declaration"],
    department: "Ministry of Agriculture & Farmers Welfare",
    tagColor: "bg-blue-100 text-blue-800 border-blue-300",
    applicationMode: "both",
  },
  {
    id: "SCH_SOIL",
    code: "SHC-2024",
    name: "National Soil Health Card Scheme",
    category: "soil",
    categoryName: "Soil Testing & Fertilizer",
    matchScore: 89,
    subsidyAmount: "100% Free Soil Test & Micronutrient Kit",
    description: "Government-sponsored scientific laboratory analysis of your field's soil profile covering 12 critical macro and micronutrients (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC).",
    benefits: "Stop over-fertilizing! Get custom fertilizer dosage guidance per crop to save up to ₹4,000/acre on DAP/Urea and boost yield.",
    eligibilitySummary: "Available to any farmer owning or leasing cultivable land.",
    documentsRequired: ["Land Record / Survey Number", "Farmer Mobile Number", "Soil Sample (Collected by Village Officer)"],
    department: "Department of Agriculture & Cooperation",
    tagColor: "bg-stone-100 text-stone-800 border-stone-300",
    applicationMode: "offline",
  },
  {
    id: "SCH_KCC",
    code: "KCC-LOAN",
    name: "Kisan Credit Card (KCC) Low-Interest Credit",
    category: "credit",
    categoryName: "Credit & Loans",
    matchScore: 86,
    subsidyAmount: "Up to ₹3 Lakh Loan at 4% Interest",
    description: "Simplified bank credit facility offering timely credit for cultivation expenses, crop maintenance, and post-harvest storage at heavily subsidized interest rates.",
    benefits: "Effective interest rate of only 4% per annum upon prompt repayment (3% Prompt Repayment Incentive by Central Govt).",
    eligibilitySummary: "Individual/joint borrowers who are owner cultivators, tenant farmers, or sharecroppers.",
    documentsRequired: ["Duly filled Application Form", "Identity & Address Proof (Aadhaar/Voter ID)", "Land Records certified by Revenue Official"],
    department: "Reserve Bank of India & NABARD",
    tagColor: "bg-purple-100 text-purple-800 border-purple-300",
    applicationMode: "both",
  },
];

export const NEARBY_PEERS: PeerSuccessStory[] = [
  {
    id: "peer_01",
    farmerName: "Rameshwar Reddy",
    distanceKm: 3.8,
    village: "Kothur, Mandal Rangareddy",
    landType: "3.0 Acres • Black Soil",
    cropsGrown: "Cotton & Red Gram",
    schemeId: "SCH_KUSUM",
    schemeName: "PM-KUSUM 5HP Solar Pump",
    outcomeSummary: "Replaced 6HP diesel pump with 5HP solar. Saved ₹4,600 per month on fuel. Cotton yield rose by 32% with reliable daytime irrigation.",
    yieldIncreasePct: 32,
    subsidyReceived: "₹1,32,000 (60% Subsidy)",
    implementationDate: "March 2024",
    contactAllowed: true,
    contactPhone: "+91 98480 34120",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "peer_02",
    farmerName: "Anjaiah Kuruma",
    distanceKm: 6.4,
    village: "Nandigama, Rangareddy",
    landType: "2.8 Acres • Red Sandy Loam",
    cropsGrown: "Chilli & Groundnut",
    schemeId: "SCH_FASAL",
    schemeName: "PMFBY Crop Insurance Claim",
    outcomeSummary: "Severe hailstorm damaged unharvested chilli crops in October. Received ₹42,500 direct compensation in bank account within 35 days.",
    yieldIncreasePct: 0,
    subsidyReceived: "₹42,500 Claim Paid",
    implementationDate: "November 2023",
    contactAllowed: true,
    contactPhone: "+91 94401 89761",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "peer_03",
    farmerName: "Laxmi Bai",
    distanceKm: 11.2,
    village: "Shadnagar Rural",
    landType: "4.2 Acres • Mixed Loam",
    cropsGrown: "Paddy & Vegetables",
    schemeId: "SCH_SOIL",
    schemeName: "Soil Health Card Fertilizer Optimization",
    outcomeSummary: "Soil test showed high potassium but zinc & nitrogen deficiency. Applied targeted bio-fertilizer, reduced urea cost by ₹5,200, yield up by 22%.",
    yieldIncreasePct: 22,
    subsidyReceived: "Free Testing + ₹3,000 Kit",
    implementationDate: "January 2024",
    contactAllowed: true,
    contactPhone: "+91 99890 12389",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },
];

export const MOCK_OCR_PRESETS: Record<string, MockOcrResult> = {
  land_patta: {
    docType: "land_record",
    title: "Telangana Dharani Land Patta Record",
    previewUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
    confidenceScore: 0.96,
    detectionSummary: "Official State Revenue Seal, Survey Khata, and Landholding acreage confirmed.",
    extractedData: {
      ownerName: "Ramesh Goud s/o Narayana Goud",
      surveyNumber: "142/2A (Khata: 894)",
      landAreaAcres: 3.5,
      soilType: "Black Cotton Soil (Regur)",
      cropDetected: "Cotton (Kharif), Chilli",
      districtMandal: "Rangareddy, Kothur Mandal",
      waterSource: "Open Well & Borewell (Drip Connected)",
    },
    boundingBoxes: [
      {
        id: "b1",
        label: "Survey / Khata No",
        text: "Survey No: 142/2A • Khata 894",
        box: { top: 18, left: 14, width: 44, height: 12 },
        confidence: 0.98,
      },
      {
        id: "b2",
        label: "Verified Area",
        text: "3.50 Acres (3 Acres 20 Guntas)",
        box: { top: 36, left: 14, width: 50, height: 13 },
        confidence: 0.97,
      },
      {
        id: "b3",
        label: "Owner Name",
        text: "Ramesh Goud s/o Narayana Goud",
        box: { top: 54, left: 14, width: 62, height: 12 },
        confidence: 0.96,
      },
      {
        id: "b4",
        label: "Revenue Seal",
        text: "Tahsildar Digital Signature & QR Code",
        box: { top: 72, left: 60, width: 32, height: 20 },
        confidence: 0.99,
      },
    ],
    schemesUnlocked: [
      "PM-KUSUM 60% Solar Pump (Eligible for 5HP unit)",
      "PM-KISAN ₹6,000 Annual Direct Benefit Transfer",
      "PMFBY Comprehensive Crop Loss Insurance",
    ],
  },
  soil_card: {
    docType: "soil_health_card",
    title: "Government Soil Health Card (ICAR Lab)",
    previewUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop&q=80",
    confidenceScore: 0.94,
    detectionSummary: "12-parameter soil chemical profile analyzed. Macronutrients and micronutrients extracted.",
    extractedData: {
      soilPh: 6.8,
      nitrogenStatus: "Medium (280 kg/ha)",
      phosphorusStatus: "Low (14 kg/ha) - Needs DAP",
      potassiumStatus: "High (310 kg/ha) - Skip MOP",
      recommendedAction: "Apply 25kg Zinc Sulphate per acre + Neem Coated Urea in split doses.",
    },
    boundingBoxes: [
      {
        id: "s1",
        label: "Soil pH (Acidity/Alkalinity)",
        text: "pH: 6.8 (Optimal Neutral Range)",
        box: { top: 22, left: 16, width: 36, height: 11 },
        confidence: 0.96,
      },
      {
        id: "s2",
        label: "Nitrogen & Phosphorus",
        text: "N: 280 kg/ha (Med) • P: 14 kg/ha (Low)",
        box: { top: 40, left: 16, width: 56, height: 14 },
        confidence: 0.95,
      },
      {
        id: "s3",
        label: "Lab Recommendation",
        text: "DAP 50kg + Zinc Sulphate 25kg / Acre",
        box: { top: 68, left: 12, width: 75, height: 20 },
        confidence: 0.93,
      },
    ],
    schemesUnlocked: [
      "National Soil Health Free Fertilizer Kit Subsidy",
      "Paramparagat Krishi Vikas Yojana (PKVY) Organic Incentive",
    ],
  },
  crop_disease: {
    docType: "crop_disease",
    title: "Cotton Leaf Pest Inspection (Camera)",
    previewUrl: "https://images.unsplash.com/photo-1599818816935-51786576b509?w=600&auto=format&fit=crop&q=80",
    confidenceScore: 0.92,
    detectionSummary: "Computer Vision leaf inspection detected Whitefly pest infestation on Cotton leaves.",
    extractedData: {
      cropDetected: "Bt Cotton (Gossypium hirsutum)",
      diseaseSymptoms: "Curling leaves with honey-dew secretions. Whitefly nymph infestation detected.",
      pestIdentified: "Whitefly (Bemisia tabaci) - Nymph Stage",
      infestationSeverity: "Moderate (Action Threshold Exceeded)",
      recommendedAction: "Spray Neem Oil (10,000 ppm) @ 2ml/litre water, or Diafenthiuron 50% WP @ 1g/litre at evening hours.",
    },
    boundingBoxes: [
      {
        id: "c1",
        label: "Infected Leaf Margin",
        text: "Curling and chlorotic yellowing",
        box: { top: 20, left: 24, width: 48, height: 32 },
        confidence: 0.94,
      },
      {
        id: "c2",
        label: "Whitefly Colony",
        text: "Active Nymph Cluster Detected",
        box: { top: 54, left: 32, width: 36, height: 28 },
        confidence: 0.91,
      },
    ],
    schemesUnlocked: [
      "PMFBY Pest Attack Crop Compensation Coverage",
      "Sub-Mission on Plant Protection & Integrated Pest Management Subsidy",
    ],
  },
  aadhaar_kyc: {
    docType: "identity_card",
    title: "Farmer e-KYC Identity Verification",
    previewUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    confidenceScore: 0.98,
    detectionSummary: "Citizen Aadhaar / Ration Card e-KYC verified with Government DBT records.",
    extractedData: {
      citizenName: "Ramesh Goud",
      maskedIdNumber: "•••• •••• 9842",
      dbtLinkedBank: "State Bank of India (SBI) - A/C ending 4108",
      stateDistrict: "Telangana, Rangareddy",
    },
    boundingBoxes: [
      {
        id: "i1",
        label: "Citizen Name",
        text: "Ramesh Goud",
        box: { top: 30, left: 30, width: 45, height: 14 },
        confidence: 0.99,
      },
      {
        id: "i2",
        label: "DBT Linked Account",
        text: "Aadhaar Seeding Active (NPCI Verified)",
        box: { top: 58, left: 20, width: 60, height: 16 },
        confidence: 0.98,
      },
    ],
    schemesUnlocked: [
      "PM-KISAN DBT Direct Beneficiary Access",
      "Kisan Credit Card (KCC) 4% Concessional Credit",
    ],
  },
  rajasthan_land_cert: {
    docType: "land_record",
    title: "राजस्थान सरकार - भूमि प्रमाण पत्र (Bhumi Praman Patra)",
    previewUrl: "/documents/rajasthan_land_certificate.jpg",
    confidenceScore: 0.98,
    fileName: "rajasthan_land_certificate.jpg",
    detectionSummary: "Official State Revenue Seal, Up-Tehsil Ghantiyali, Jodhpur. Khata 125, Khasra 5/6 (35 Bigha Barani Land) confirmed.",
    extractedData: {
      ownerName: "प्रार्थी खातेदार (APHPM3517J)",
      surveyNumber: "Khata: 125 • Khasra: 5/6 (हिस्सा 11/6300)",
      landAreaAcres: 14.5,
      soilType: "Arid Sandy Loam / Barani (वर्षा आधारित बारानी)",
      districtMandal: "Jodhpur (Ghantiyali, Bap Tehsil), Rajasthan",
      waterSource: "Barani / Unirrigated (असिंचित - No pond or canal connection)",
      revenueStatus: "Certified Khatedar (Not a Trespasser / गैर अतिक्रमी), Revenue 2020/190",
      recommendedAction: "Eligible for Solar Water Pump & Rainwater Farm Pond harvesting under State & Central subsidies.",
    },
    boundingBoxes: [
      {
        id: "r1",
        label: "State Govt & Up-Tehsil",
        text: "राजस्थान सरकार • उप-तहसील घंटियाली, जोधपुर",
        box: { top: 7, left: 28, width: 44, height: 11 },
        confidence: 0.99,
      },
      {
        id: "r2",
        label: "Khata & Khasra No.",
        text: "खाता संख्या: 125 • खसरा नंबर: 5/6",
        box: { top: 48, left: 11, width: 52, height: 6 },
        confidence: 0.98,
      },
      {
        id: "r3",
        label: "Verified Rakba",
        text: "रकबा: 35 बीघा (किस्म-बी 4 कृषि भूमि)",
        box: { top: 48, left: 45, width: 44, height: 6 },
        confidence: 0.97,
      },
      {
        id: "r4",
        label: "Irrigation Status",
        text: "असिंचित / बारानी (कोई तालाब या जरिया नहीं)",
        box: { top: 62, left: 11, width: 68, height: 5 },
        confidence: 0.96,
      },
      {
        id: "r5",
        label: "Official Revenue Seal & Sign",
        text: "उप तहसीलदार घंटियाली (भू-अ) जिला जोधपुर",
        box: { top: 80, left: 36, width: 48, height: 16 },
        confidence: 0.99,
      },
    ],
    schemesUnlocked: [
      "PM-KUSUM Component-B (60-70% Solar Pump Subsidy for Barani Desert Land)",
      "PM-KISAN ₹6,000 Annual Direct Benefit Transfer",
      "Rajasthan Khet Talai (Farm Pond) 70% Subsidy Scheme for Barani Land",
      "PMFBY Weather-Based Drought Crop Insurance",
    ],
  },
  assam_aea_notice: {
    docType: "land_record",
    title: "Government of Assam - Directorate of Agriculture AEA Notice",
    previewUrl: "/documents/assam_agri_extension_notice.jpg",
    confidenceScore: 0.97,
    fileName: "assam_agri_extension_notice.jpg",
    detectionSummary: "Official Assam Directorate of Agriculture verification notice for 1800 Agriculture Extension Assistant posts at Krishi Bhawan, Khanapara.",
    extractedData: {
      organization: "Directorate of Agriculture, Government of Assam",
      noticeSubject: "Document Verification for Agriculture Extension Assistant (AEA - 1800 Posts)",
      venue: "Playground within Agriculture Campus, Krishi Bhawan, Khanapara, Guwahati-22",
      dates: "08th and 09th November, 2025 (10:00 AM to 04:00 PM)",
      districtMandal: "Khanapara, Guwahati, Kamrup Metropolitan, Assam",
      recommendedAction: "Carry original Class 10 admit card, HSSLC Science pass certificate, Employment Exchange registration, and caste certificate.",
    },
    boundingBoxes: [
      {
        id: "a1",
        label: "State Agriculture Department",
        text: "GOVERNMENT OF ASSAM • DIRECTORATE OF AGRICULTURE",
        box: { top: 14, left: 18, width: 64, height: 8 },
        confidence: 0.99,
      },
      {
        id: "a2",
        label: "Cadre & Posts",
        text: "Agriculture Extension Assistant (AEA) - 1800 Posts",
        box: { top: 29, left: 12, width: 78, height: 9 },
        confidence: 0.98,
      },
      {
        id: "a3",
        label: "Venue & Campus",
        text: "Krishi Bhawan, Khanapara, Guwahati-22",
        box: { top: 64, left: 12, width: 80, height: 8 },
        confidence: 0.97,
      },
      {
        id: "a4",
        label: "Document Verification Dates",
        text: "08th and 09th November, 2025 (10:00 AM - 04:00 PM)",
        box: { top: 60, left: 12, width: 80, height: 5 },
        confidence: 0.96,
      },
    ],
    schemesUnlocked: [
      "Chief Minister's Samagra Gramya Unnayan Yojana (CMSGUY Assam Farm Mechanization)",
      "Sub-Mission on Agricultural Mechanization (SMAM Assam - 50% Subsidy)",
      "Assam Agriculture Extension Services & Free Certified Seed Distribution",
    ],
  },
  icar_agronomy: {
    docType: "soil_health_card",
    title: "ICAR & Ministry of Agriculture - Agronomy & Land Restoration",
    previewUrl: "/documents/icar_agronomy_foreword.jpg",
    confidenceScore: 0.98,
    fileName: "icar_agronomy_foreword.jpg",
    detectionSummary: "Official ICAR & Ministry of Agriculture foreword by DG Dr. Himanshu Pathak on Agronomy, Soil Health, Degraded Land Restoration (26M ha by 2030), and Millets.",
    extractedData: {
      authority: "Dr. Himanshu Pathak, Secretary (DARE) & Director General (ICAR)",
      department: "Ministry of Agriculture and Farmers Welfare, Krishi Bhavan, New Delhi",
      keyInitiative: "Agronomic Interventions, Degraded Land Restoration (26M ha by 2030), Millets 2023",
      soilType: "Degraded & Rice-Fallow Land Reclamation / Conservation Agriculture",
      districtMandal: "Krishi Bhavan, New Delhi (All-India Mandate)",
      recommendedAction: "Adopt conservation agriculture, precision water & nutrient management, organic farming, and solar energy for sustainable food production.",
    },
    boundingBoxes: [
      {
        id: "i1",
        label: "Ministry & Council",
        text: "ICAR • Ministry of Agriculture & Farmers Welfare, Krishi Bhavan",
        box: { top: 8, left: 40, width: 56, height: 14 },
        confidence: 0.99,
      },
      {
        id: "i2",
        label: "Director General ICAR",
        text: "Dr. Himanshu Pathak, Secretary (DARE) & DG (ICAR)",
        box: { top: 17, left: 9, width: 26, height: 9 },
        confidence: 0.98,
      },
      {
        id: "i3",
        label: "Mission Focus",
        text: "Degraded Land Restoration (26M ha) & Frontier Agronomy",
        box: { top: 52, left: 10, width: 80, height: 18 },
        confidence: 0.97,
      },
      {
        id: "i4",
        label: "Official Signature",
        text: "Signed (Himanshu Pathak) • 3rd November 2023",
        box: { top: 83, left: 68, width: 28, height: 10 },
        confidence: 0.99,
      },
    ],
    schemesUnlocked: [
      "National Mission on Sustainable Agriculture (NMSA Rainfed Area Development)",
      "Paramparagat Krishi Vikas Yojana (PKVY ₹50,000/ha Organic Cluster Scheme)",
      "Shree Anna Mission - High Value Millet Cultivation & Seed Minikits",
      "Soil Health Card Micronutrient Management Subsidy",
    ],
  },
  bau_ranchi_admission: {
    docType: "land_record",
    title: "Birsa Agricultural University - B.Sc. Agriculture Admission",
    previewUrl: "/documents/bau_ranchi_admission_notice.jpg",
    confidenceScore: 0.97,
    fileName: "bau_ranchi_admission_notice.jpg",
    detectionSummary: "Official Birsa Agricultural University (BAU Kanke, Ranchi) document checklist and counseling schedule for B.Sc. (Honours) Agriculture, Horticulture, and Agricultural Engineering.",
    extractedData: {
      institution: "Birsa Agricultural University (BAU), Kanke, Ranchi",
      facultyDepartment: "Faculty of Agriculture, Kanke, Ranchi",
      admissionDegree: "B.Sc. (Hon's) Agriculture / Horticulture / B.Tech (Ag. Engg.)",
      affiliatedColleges: "Ranchi Agri College, College of Ag. Engg., Chaibasa Horticulture, Godda, Deoghar, Garhwa",
      districtMandal: "Kanke, Ranchi, Jharkhand",
      dates: "Reporting: 06.09.2023 to 12.09.2023 (10:30 AM to 05:00 PM)",
      recommendedAction: "Submit original JCECE Allotment Letter, Admit Card, Academic mark sheets, Residential & Caste Certificate, and Aadhaar card.",
    },
    boundingBoxes: [
      {
        id: "b1",
        label: "University & Faculty",
        text: "FACULTY OF AGRICULTURE • BIRSA AGRICULTURAL UNIVERSITY, KANKE, RANCHI",
        box: { top: 3, left: 24, width: 56, height: 8 },
        confidence: 0.99,
      },
      {
        id: "b2",
        label: "Eligible Degrees",
        text: "B.Sc. (Hon's) Agriculture / Horticulture / B.Tech (Ag. Engg.)",
        box: { top: 14, left: 10, width: 80, height: 6 },
        confidence: 0.98,
      },
      {
        id: "b3",
        label: "Participating Colleges Table",
        text: "Ranchi, Chaibasa, Godda, Deoghar & Garhwa Agriculture Colleges",
        box: { top: 50, left: 9, width: 82, height: 32 },
        confidence: 0.97,
      },
      {
        id: "b4",
        label: "Dean & Registrar Authority",
        text: "Dean & Assistant Registrar, Faculty of Agriculture, BAU Kanke",
        box: { top: 83, left: 8, width: 86, height: 14 },
        confidence: 0.99,
      },
    ],
    schemesUnlocked: [
      "ICAR National Talent Scholarship (NTS - ₹3,000/month for UG Agriculture)",
      "Agri-Clinics & Agri-Business Centres (ACABC - up to ₹20 Lakhs Loan with 36-44% Subsidy)",
      "Student READY Stipend Scheme (Rural Entrepreneurship Awareness Development)",
      "Birsa Harit Gram Yojana (Jharkhand Horticulture Orchard Incentive)",
    ],
  },
};
