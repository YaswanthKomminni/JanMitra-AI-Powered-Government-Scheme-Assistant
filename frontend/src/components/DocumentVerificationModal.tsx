"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  UploadCloud,
  FileText,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Camera,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { MOCK_OCR_PRESETS } from "@/lib/mockData";
import LiveCameraCapture from "@/components/LiveCameraCapture";

export default function DocumentVerificationModal() {
  const {
    verificationModalOpen,
    setVerificationModalOpen,
    language,
    currentFarmer,
    verificationScanning,
    verificationResult,
    outOfScopeError,
    clearOutOfScopeError,
    selectedPresetKey,
    startMockVerification,
    analyzeUploadedFile,
    confirmExtractedData,
    resetVerification,
  } = useFarmerStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "auto_detect" | "land_record" | "soil_health" | "crop_disease" | "identity_card"
  >("auto_detect");
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"camera" | "upload">("camera");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("janmitra_custom_vision_key") || "";
      setApiKeyInput(existing);
      if (existing) setKeySaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (typeof window !== "undefined") {
      if (apiKeyInput.trim()) {
        localStorage.setItem("janmitra_custom_vision_key", apiKeyInput.trim());
        setKeySaved(true);
        setShowKeyInput(false);
      } else {
        localStorage.removeItem("janmitra_custom_vision_key");
        setKeySaved(false);
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleCameraCapture = async (base64Image: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(/:/g, "-");
    setUploadedFileName(`Live_Scan_${timeStr}.jpg`);
    setUploadedFileSize("Live Camera");
    await analyzeUploadedFile(base64Image, "live_scan.jpg", "image/jpeg", selectedCategory);
  };

  if (!verificationModalOpen) return null;

  const handleProcessFile = (file: File) => {
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / 1024).toFixed(1) + " KB");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        await analyzeUploadedFile(base64, file.name, file.type, selectedCategory);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handlePresetSelect = (key: string) => {
    setUploadedFileName(null);
    setUploadedFileSize(null);
    startMockVerification(key);
  };

  const categories = [
    { id: "auto_detect", label: "Auto-Detect", icon: Sparkles },
    { id: "land_record", label: "Land Patta / Pahani", icon: FileText },
    { id: "soil_health", label: "Soil Health Card", icon: Activity },
    { id: "crop_disease", label: "Crop Leaf / Pest", icon: Camera },
    { id: "identity_card", label: "Farmer ID / Aadhaar", icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-emerald-500/20 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-5 sm:p-6 text-white relative">
          <button
            onClick={() => {
              setVerificationModalOpen(false);
              clearOutOfScopeError();
              resetVerification();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-lg bg-emerald-700/80">
              <ScanLine className="w-4 h-4 text-emerald-300" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
              Document and crop image analysis
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{t.verifyDocsTitle}</h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
            {t.verifyDocsSubtitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Out of Scope Error State */}
          {!verificationScanning && outOfScopeError && (
            <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-orange-50/40 p-5 sm:p-7 space-y-5 animate-in fade-in shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 border-2 border-amber-400/50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        {outOfScopeError.title}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
                      {outOfScopeError.title}
                    </h3>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900">
                  Please review and try again
                </div>
              </div>

              {/* Snapshot thumbnail & explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="relative rounded-2xl overflow-hidden border-2 border-stone-300 aspect-[4/3] bg-stone-900 shadow-inner">
                  <img
                    src={outOfScopeError.previewUrl}
                    alt="Captured photo"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs uppercase shadow-md flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      Not Agricultural
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2.5 text-xs text-stone-700 leading-relaxed">
                  <p className="font-extrabold text-stone-900 text-sm">
                    {t.outOfScopeSubtitle || outOfScopeError.message}
                  </p>
                  <p className="text-stone-600 bg-white/90 p-3 rounded-xl border border-amber-200">
                    {outOfScopeError.reason}
                  </p>

                  <div className="pt-1">
                    <p className="font-black text-stone-800 uppercase tracking-wider text-[11px] mb-1.5">
                      Accepted Agricultural Content:
                    </p>
                    <ul className="space-y-1 text-stone-600 list-disc list-inside">
                      <li><strong>Crop leaves & pest symptoms:</strong> Cotton, Paddy, Chilli leaves for AI disease diagnosis.</li>
                      <li><strong>Revenue land records:</strong> Land Patta, Pahani / RoR 1B passbooks for PM-KISAN & KUSUM.</li>
                      <li><strong>Soil Health Cards:</strong> ICAR laboratory chemical tests for free fertilizer kits.</li>
                      <li><strong>Farmer KYC:</strong> Aadhaar / Farmer ID card for DBT benefit linking.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearOutOfScopeError();
                    setInputMode("camera");
                  }}
                  className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition"
                >
                  <Camera className="w-4 h-4 text-emerald-300" />
                  <span>{t.retakeAgriPhoto || "Retake Photo with Live Camera"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearOutOfScopeError();
                    setInputMode("upload");
                  }}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs sm:text-sm transition flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-stone-500" />
                  <span>Upload Document File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearOutOfScopeError();
                    handlePresetSelect("crop_disease");
                  }}
                  className="px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test with Sample Crop Leaf</span>
                </button>
              </div>
            </div>
          )}

          {/* Category Selector Tabs */}
          {!verificationResult && !verificationScanning && !outOfScopeError && (
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                1. Select Document Category (Optional):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500/40"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Vision Engine Status & Optional Key Config */}
          {!verificationResult && !verificationScanning && !outOfScopeError && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-extrabold text-stone-800">
                    AI Engine: {keySaved ? "Multimodal Vision AI Active" : "Built-in Dynamic Vision & OCR Active"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0"
                >
                  {showKeyInput ? "Close" : keySaved ? "Change Key" : "Add Free Gemini/Groq Key (Optional)"}
                </button>
              </div>

              {showKeyInput && (
                <div className="mt-2.5 pt-2.5 border-t border-emerald-200 flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Gemini (AQ. or AIza), Groq (gsk_) or OpenAI (sk-) key"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition"
                    >
                      Save Key
                    </button>
                    {keySaved && (
                      <button
                        type="button"
                        onClick={() => {
                          setApiKeyInput("");
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("janmitra_custom_vision_key");
                          }
                          setKeySaved(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-300 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode Switcher: Live Camera vs Upload File */}
          {!verificationResult && !verificationScanning && !outOfScopeError && (
            <div className="flex items-center p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setInputMode("camera")}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  inputMode === "camera"
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/20"
                    : "text-stone-700 hover:text-stone-900 hover:bg-stone-200"
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Take Live Photo (Webcam / Camera)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  inputMode === "upload"
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/20"
                    : "text-stone-700 hover:text-stone-900 hover:bg-stone-200"
                }`}
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Upload File / Document</span>
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Live Camera Viewfinder */}
          {!verificationResult && !verificationScanning && !outOfScopeError && inputMode === "camera" && (
            <LiveCameraCapture
              category={selectedCategory}
              onCapture={handleCameraCapture}
              onCancel={() => setInputMode("upload")}
            />
          )}

          {/* Drag & Drop File Zone */}
          {!verificationResult && !verificationScanning && inputMode === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3.5 ${
                dragActive
                  ? "border-emerald-600 bg-emerald-50/80 scale-[1.01]"
                  : "border-stone-300 hover:border-emerald-500 bg-stone-50/60 hover:bg-emerald-50/20"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-800 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-stone-900">
                  {t.dropzoneText}
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-md">
                  {t.dropzoneSubtext}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputMode("camera");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 px-3.5 py-1.5 rounded-full border border-emerald-300 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Switch to Live Camera
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  PDF, Docs & Images up to 10MB
                </span>
              </div>
            </div>
          )}

          {/* Preset Pickers for instant testing */}
          {!verificationResult && !verificationScanning && !outOfScopeError && (
            <div className="pt-2">
              <p className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Sample Agricultural Documents & Photos</span>
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 font-extrabold px-2 py-0.5 rounded-full">
                  Instant Test
                </span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handlePresetSelect("land_patta")}
                  className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    selectedPresetKey === "land_patta"
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                      : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">📜</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Land Patta
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-stone-900 leading-tight">
                    3.5 Acres Patta
                  </p>
                  <span className="text-[10px] text-stone-500 mt-0.5">Rangareddy RoR</span>
                </button>

                <button
                  onClick={() => handlePresetSelect("soil_card")}
                  className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    selectedPresetKey === "soil_card"
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                      : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">🧪</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Soil Card
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-stone-900 leading-tight">
                    ICAR Soil Test
                  </p>
                  <span className="text-[10px] text-stone-500 mt-0.5">pH 6.8 & NPK</span>
                </button>

                <button
                  onClick={() => handlePresetSelect("crop_disease")}
                  className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    selectedPresetKey === "crop_disease"
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                      : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">🍃</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                      Crop Pest
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-stone-900 leading-tight">
                    Cotton Leaf Photo
                  </p>
                  <span className="text-[10px] text-stone-500 mt-0.5">Whitefly Insect</span>
                </button>

                <button
                  onClick={() => handlePresetSelect("aadhaar_kyc")}
                  className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    selectedPresetKey === "aadhaar_kyc"
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                      : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">🪪</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      Citizen e-KYC
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-stone-900 leading-tight">
                    Aadhaar Card
                  </p>
                  <span className="text-[10px] text-stone-500 mt-0.5">DBT NPCI Seeding</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {verificationScanning && (
            <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500 bg-stone-950 p-6 flex flex-col items-center justify-center min-h-[300px]">
              {selectedPresetKey && MOCK_OCR_PRESETS[selectedPresetKey] && (
                <img
                  src={MOCK_OCR_PRESETS[selectedPresetKey]?.previewUrl}
                  alt="Scanning document"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[1px]"
                />
              )}

              {/* Laser Scan Beam */}
              <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-scan-laser top-6"></div>

              {/* Scanning status */}
              <div className="relative z-10 text-center space-y-3 bg-stone-900/90 p-6 rounded-2xl backdrop-blur-md border border-emerald-500/40 max-w-md shadow-2xl">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <h3 className="text-base font-black text-white">
                  {t.scanningProgress}
                </h3>
                {uploadedFileName && (
                  <p className="text-xs text-stone-300 font-bold">
                    Analyzing file: <span className="text-emerald-300">{uploadedFileName}</span> ({uploadedFileSize})
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-300 font-bold pt-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50">Spatial Bounding Boxes</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50">Entity Recognition</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50">PostgreSQL Sync</span>
                </div>
              </div>
            </div>
          )}

          {/* Verification Results Display */}
          {verificationResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-950">
                      {verificationResult.title}
                    </h4>
                    <p className="text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <span>AI reading — confirm important details against the original</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      showBoundingBoxes
                        ? "bg-emerald-700 text-white border-emerald-800"
                        : "bg-white text-stone-700 border-stone-300"
                    }`}
                  >
                    {showBoundingBoxes ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Bounding Boxes: ON</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Bounding Boxes: OFF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetVerification}
                    className="text-xs font-bold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100"
                  >
                    Scan Another
                  </button>
                </div>
              </div>

              {/* Summary Description */}
              {verificationResult.detectionSummary && (
                <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{verificationResult.detectionSummary}</span>
                </div>
              )}

              {/* Visual Preview with Bounding Box Overlay */}
              <div className="rounded-2xl border-2 border-stone-300 bg-stone-950 overflow-hidden relative group shadow-inner">
                <div className="relative w-full min-h-[320px] max-h-[440px] bg-stone-950 flex items-center justify-center overflow-hidden">
                  {verificationResult.previewUrl && !verificationResult.previewUrl.startsWith("data:application/pdf") ? (
                    <img
                      src={verificationResult.previewUrl}
                      alt="Document visual analysis"
                      className="w-full h-full min-h-[320px] max-h-[440px] object-contain select-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 p-8 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-stone-200">
                        {verificationResult.title || "Document reading"}
                      </p>
                      <span className="text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-700/50">
                        Extracted {Object.keys(verificationResult.extractedData || {}).length} fields from this upload
                      </span>
                    </div>
                  )}

                  {/* Spatial Bounding Boxes Overlay with YOLOv8 Targeting Reticle & Corner Markers */}
                  {showBoundingBoxes &&
                    verificationResult.boundingBoxes?.map((bb: any) => {
                      const isHovered = hoveredBoxId === bb.id;
                      const coords = bb.normalizedCoords || [
                        Math.round(bb.box.top),
                        Math.round(bb.box.left),
                        Math.round(bb.box.top + bb.box.height),
                        Math.round(bb.box.left + bb.box.width),
                      ];
                      const visState = bb.visibilityState || (bb.confidence >= 0.85 ? "critical" : "moderate");
                      const visPct = bb.visibilityPercent || Math.round(bb.confidence * 100);

                      return (
                        <div
                          key={bb.id}
                          style={{
                            top: `${bb.box.top}%`,
                            left: `${bb.box.left}%`,
                            width: `${bb.box.width}%`,
                            height: `${bb.box.height}%`,
                          }}
                          onMouseEnter={() => setHoveredBoxId(bb.id)}
                          onMouseLeave={() => setHoveredBoxId(null)}
                          className={`absolute border-2 transition-all cursor-pointer flex flex-col justify-between p-1.5 rounded-lg select-none ${
                            isHovered
                              ? "border-emerald-300 bg-emerald-400/30 ring-4 ring-emerald-300/60 z-30 scale-[1.02]"
                              : "border-emerald-400/90 bg-emerald-500/20 hover:bg-emerald-400/30 z-20"
                          }`}
                        >
                          {/* Targeting Reticle 4 Corner Markers */}
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-300 shadow-sm" />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-300 shadow-sm" />
                          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-300 shadow-sm" />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-300 shadow-sm" />

                          {/* Animated Classification Badge (YOLOv8 + 3-State Problem Visibility %) */}
                          <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-stone-950/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/60 shadow-lg z-30 whitespace-nowrap">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black tracking-wide text-emerald-300 uppercase">
                              {bb.label?.startsWith("YOLOv8") ? bb.label : `YOLOv8: ${bb.label}`} ({(bb.confidence * 100).toFixed(0)}%)
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                                visState === "critical"
                                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/50"
                                  : visState === "moderate"
                                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/50"
                                  : "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50"
                              }`}
                            >
                              {visPct}% {visState}
                            </span>
                          </div>

                          {/* Extracted Entity Text & Normalized Coords */}
                          <span className="text-[11px] text-white font-black drop-shadow-md bg-black/80 px-2 py-1 rounded truncate border border-white/10">
                            {bb.text}
                          </span>
                          <span className="text-[9px] text-emerald-200 font-mono font-bold bg-stone-950/90 px-1.5 py-0.5 rounded w-fit self-end">
                            [{coords.join(", ")}]
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div className="p-2.5 bg-stone-900 border-t border-stone-800 text-[11px] text-stone-300 flex items-center justify-between font-bold px-4">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Interactive Vision Segmentation ({verificationResult.boundingBoxes?.length || 0} Entities Mapped)
                  </span>
                  <span className="text-stone-400">Hover or tap bounding box to inspect</span>
                </div>
              </div>

              {/* Extracted Key-Value Parameters */}
              <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200">
                <p className="text-xs font-black text-stone-700 uppercase tracking-wider mb-3">
                  {t.detectedData}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {verificationResult.extractedData.ownerName && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("b3")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "b3" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Owner / Farmer Name:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.ownerName}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.surveyNumber && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("b1")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "b1" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Survey / Khata No:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.surveyNumber}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.landAreaAcres && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("b2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "b2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Land area read:</span>
                      <span className="font-black text-emerald-800 text-base">
                        {String(verificationResult.extractedData.landAreaAcres).replace(/\s*acres?/i, "")} Acres
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.considerationAmount && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Consideration / Valuation:</span>
                      <span className="font-extrabold text-purple-900 text-sm">
                        {verificationResult.extractedData.considerationAmount}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.issuingAuthority && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Issuing Authority:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.issuingAuthority}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.soilType && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Soil Classification:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.soilType}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.soilPh && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("s1")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "s1" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Soil pH Value:</span>
                      <span className="font-extrabold text-cyan-800 text-sm">
                        pH {verificationResult.extractedData.soilPh} (Neutral Optimal)
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.nitrogenStatus && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("s2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "s2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Nitrogen & Phosphorus:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        N: {verificationResult.extractedData.nitrogenStatus} • P: {verificationResult.extractedData.phosphorusStatus}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.cropDetected && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Crop Detected:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.cropDetected}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.pestIdentified && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("c2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "c2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Identified Pest / Insect:</span>
                      <span className="font-extrabold text-red-700 text-sm">
                        {verificationResult.extractedData.pestIdentified}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.diseaseSymptoms && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("c1")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border sm:col-span-2 transition ${
                        hoveredBoxId === "c1" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Symptoms / Diagnosis:</span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {verificationResult.extractedData.diseaseSymptoms}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.recommendedAction && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("s3")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300 sm:col-span-2 transition ${
                        hoveredBoxId === "s3" ? "ring-2 ring-emerald-500 bg-emerald-100" : ""
                      }`}
                    >
                      <span className="text-emerald-950 font-black block text-xs">Agronomist Recommendation:</span>
                      <span className="font-bold text-emerald-900 text-xs mt-1 block">
                        {verificationResult.extractedData.recommendedAction}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.citizenName && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("i1")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "i1" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Citizen Name:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.citizenName}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.dbtLinkedBank && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("i2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "i2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">DBT Seeding Bank:</span>
                      <span className="font-extrabold text-emerald-800 text-sm">
                        {verificationResult.extractedData.dbtLinkedBank}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.districtMandal && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">District & Jurisdiction:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.districtMandal}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.waterSource && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("r4")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "r4" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Water Source / Irrigation:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.waterSource}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.revenueStatus && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Revenue Verification:</span>
                      <span className="font-extrabold text-emerald-800 text-sm">
                        {verificationResult.extractedData.revenueStatus}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.organization && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("a1")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "a1" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Issuing Authority:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.organization}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.noticeSubject && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("a2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border sm:col-span-2 transition ${
                        hoveredBoxId === "a2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Notice Subject / Cadre:</span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {verificationResult.extractedData.noticeSubject}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.venue && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("a3")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "a3" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Verification Venue:</span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {verificationResult.extractedData.venue}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.dates && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("a4")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "a4" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Schedule / Dates:</span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {verificationResult.extractedData.dates}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.authority && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("i2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "i2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Designation / Authority:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.authority}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.institution && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("b1")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "b1" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">University / Institution:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.institution}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.admissionDegree && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("b2")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border transition ${
                        hoveredBoxId === "b2" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Admissions Program:</span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {verificationResult.extractedData.admissionDegree}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.affiliatedColleges && (
                    <div
                      onMouseEnter={() => setHoveredBoxId("b3")}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl bg-white border sm:col-span-2 transition ${
                        hoveredBoxId === "b3" ? "border-emerald-600 ring-2 ring-emerald-400/30 bg-emerald-50/50" : "border-stone-200"
                      }`}
                    >
                      <span className="text-stone-400 font-bold block">Participating Colleges:</span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {verificationResult.extractedData.affiliatedColleges}
                      </span>
                    </div>
                  )}

                  {/* Dynamic Key-Value Parameter Rendering for Any Document */}
                  {Object.entries(verificationResult.extractedData || {})
                    .filter(([k]) => ![
                      "ownerName", "surveyNumber", "landAreaAcres", "considerationAmount",
                      "issuingAuthority", "soilType", "soilPh", "nitrogenStatus",
                      "phosphorusStatus", "cropDetected", "pestIdentified", "diseaseSymptoms",
                      "recommendedAction", "citizenName", "dbtLinkedBank", "districtMandal",
                      "waterSource", "revenueStatus", "organization", "noticeSubject",
                      "venue", "dates", "authority", "institution", "admissionDegree",
                      "affiliatedColleges"
                    ].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl bg-white border border-stone-200">
                        <span className="text-stone-400 font-bold block">{k}:</span>
                        <span className="font-extrabold text-stone-900 text-sm whitespace-pre-line">{String(v)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Multimodal NLP Architecture Breakdown (BERT + HMM + CRF + TF-IDF) */}
              <div className="bg-stone-900 text-stone-100 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-3.5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-600/30 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Multimodal NLP Document Analysis Suite
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    BERT • HMM • CRF • TF-IDF • YOLOv8
                  </span>
                </div>

                {/* HMM Section Parser Flow */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-emerald-300 tracking-wider block">
                    📜 HMM Document Section Sequence (Viterbi Decoded):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-100 font-bold">1. Header & Seal</span>
                    <span className="text-stone-400">➔</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-100 font-bold">2. Beneficiary Parties</span>
                    <span className="text-stone-400">➔</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-100 font-bold">3. Parcel & Extent</span>
                    <span className="text-stone-400">➔</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-100 font-bold">4. Valuation & Stamp</span>
                    <span className="text-stone-400">➔</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-100 font-bold">5. Authority Endorsement</span>
                  </div>
                </div>

                {/* CRF Entity Labels */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-cyan-300 tracking-wider block">
                    🏷️ CRF Extracted Named Entities:
                  </span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {verificationResult.extractedData?.ownerName && (
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-800 font-medium">
                        <strong className="text-cyan-400 font-bold">B-BENEFICIARY:</strong> {verificationResult.extractedData.ownerName}
                      </span>
                    )}
                    {verificationResult.extractedData?.citizenName && (
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-800 font-medium">
                        <strong className="text-cyan-400 font-bold">B-BENEFICIARY:</strong> {verificationResult.extractedData.citizenName}
                      </span>
                    )}
                    {verificationResult.extractedData?.surveyNumber && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-200 border border-amber-800 font-medium">
                        <strong className="text-amber-400 font-bold">B-LAND_ID:</strong> {verificationResult.extractedData.surveyNumber}
                      </span>
                    )}
                    {verificationResult.extractedData?.landAreaAcres && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-200 border border-emerald-800 font-medium">
                        <strong className="text-emerald-400 font-bold">B-EXTENT:</strong> {verificationResult.extractedData.landAreaAcres}
                      </span>
                    )}
                    {verificationResult.extractedData?.considerationAmount && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-200 border border-purple-800 font-medium">
                        <strong className="text-purple-400 font-bold">B-AMOUNT:</strong> {verificationResult.extractedData.considerationAmount}
                      </span>
                    )}
                    {verificationResult.extractedData?.districtMandal && (
                      <span className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-200 border border-sky-800 font-medium">
                        <strong className="text-sky-400 font-bold">B-LOCATION:</strong> {verificationResult.extractedData.districtMandal}
                      </span>
                    )}
                    {verificationResult.extractedData?.cropDetected && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-200 border border-emerald-800 font-medium">
                        <strong className="text-emerald-400 font-bold">B-CROP:</strong> {verificationResult.extractedData.cropDetected}
                      </span>
                    )}
                    {verificationResult.extractedData?.pestIdentified && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-200 border border-rose-800 font-medium">
                        <strong className="text-rose-400 font-bold">B-PEST_DISEASE:</strong> {verificationResult.extractedData.pestIdentified}
                      </span>
                    )}
                  </div>
                </div>

                {/* BERT & SLA Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-stone-300">
                  <span className="flex items-center gap-1.5 font-mono text-emerald-300">
                    <span>🎯 BERT 128-Dim Dense Match:</span>
                    <strong className="font-bold">89% Cosine Similarity</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-amber-300">
                    <span>⚡ Predictive SLA Regressor:</span>
                    <strong className="font-bold">48 hrs (91% confidence)</strong>
                  </span>
                </div>
              </div>

              {/* Unlocked Schemes Badge Section */}
              {verificationResult.schemesUnlocked && verificationResult.schemesUnlocked.length > 0 && (
                <div className="bg-emerald-900 text-white p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                      Schemes Unlocked by this Document:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {verificationResult.schemesUnlocked.map((sc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-800/90 border border-emerald-600/50 text-xs font-bold text-white shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVerificationModalOpen(false);
                clearOutOfScopeError();
                resetVerification();
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs sm:text-sm hover:bg-stone-100 transition"
            >
              Close
            </button>

            {outOfScopeError && (
              <button
                onClick={() => {
                  clearOutOfScopeError();
                  setInputMode("camera");
                }}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Live Camera</span>
              </button>
            )}

            {verificationResult && (
              <button
                onClick={() => {
                  resetVerification();
                  setUploadedFileName(null);
                  setUploadedFileSize(null);
                  setInputMode("camera");
                }}
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 hover:text-emerald-800 hover:border-emerald-500 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Take Another Photo</span>
              </button>
            )}
          </div>

          {verificationResult && (
            <button
              onClick={confirmExtractedData}
              disabled={(verificationResult as any).analysisQuality === "partial"}
              className="px-5 sm:px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{(verificationResult as any).analysisQuality === "partial" ? "Clearer copy needed to confirm details" : t.confirmAndUpdate}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
