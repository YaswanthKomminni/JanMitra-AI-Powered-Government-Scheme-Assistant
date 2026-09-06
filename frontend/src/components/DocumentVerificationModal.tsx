"use client";

import React, { useState } from "react";
import {
  X,
  UploadCloud,
  FileText,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { MOCK_OCR_PRESETS } from "@/lib/mockData";

export default function DocumentVerificationModal() {
  const {
    verificationModalOpen,
    setVerificationModalOpen,
    language,
    currentFarmer,
    verificationScanning,
    verificationResult,
    selectedPresetKey,
    startMockVerification,
    confirmExtractedData,
    resetVerification,
  } = useFarmerStore();

  const [dragActive, setDragActive] = useState(false);
  const t = translations[language];

  if (!verificationModalOpen) return null;

  const handlePresetSelect = (key: string) => {
    startMockVerification(key);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    // Auto-trigger land patta mock scan on file drop
    startMockVerification("land_patta");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-emerald-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={() => {
              setVerificationModalOpen(false);
              resetVerification();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-lg bg-emerald-700/80">
              <ScanLine className="w-4 h-4 text-emerald-300" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
              Llama 3.2 Vision OCR Engine
            </span>
          </div>
          <h2 className="text-2xl font-black">{t.verifyDocsTitle}</h2>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            {t.verifyDocsSubtitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Pickers for instant testing */}
          <div>
            <p className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t.sampleDocsPrompt}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handlePresetSelect("land_patta")}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                  selectedPresetKey === "land_patta"
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                    : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">📜</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Land Patta
                  </span>
                </div>
                <p className="text-xs font-extrabold text-stone-900 leading-tight">
                  {t.sampleLandPatta}
                </p>
              </button>

              <button
                onClick={() => handlePresetSelect("soil_card")}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                  selectedPresetKey === "soil_card"
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                    : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🧪</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Soil Card
                  </span>
                </div>
                <p className="text-xs font-extrabold text-stone-900 leading-tight">
                  {t.sampleSoilCard}
                </p>
              </button>

              <button
                onClick={() => handlePresetSelect("crop_disease")}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                  selectedPresetKey === "crop_disease"
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30"
                    : "border-stone-200 hover:border-emerald-400 bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🍃</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    Crop Pest
                  </span>
                </div>
                <p className="text-xs font-extrabold text-stone-900 leading-tight">
                  {t.sampleCropLeaf}
                </p>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Zone or Active Document Viewer */}
          {!verificationResult && !verificationScanning ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => handlePresetSelect("land_patta")}
              className={`border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? "border-emerald-600 bg-emerald-50/70"
                  : "border-stone-300 hover:border-emerald-500 bg-stone-50/50"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-extrabold text-stone-900">
                  {t.dropzoneText}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {t.dropzoneSubtext}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-full border border-emerald-300 shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  Mobile Camera Ready
                </span>
              </div>
            </div>
          ) : null}

          {/* Scanning Animation */}
          {verificationScanning && (
            <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500 bg-stone-950 p-6 flex flex-col items-center justify-center min-h-[260px]">
              {selectedPresetKey && (
                <img
                  src={MOCK_OCR_PRESETS[selectedPresetKey]?.previewUrl}
                  alt="Scanning document"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-[1px]"
                />
              )}

              {/* Laser Scan Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan-laser top-6"></div>

              {/* Scanning status */}
              <div className="relative z-10 text-center space-y-3 bg-stone-900/80 p-5 rounded-2xl backdrop-blur border border-emerald-500/30">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-black text-white">
                  {t.scanningProgress}
                </p>
                <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-300 font-bold">
                  <span>Bounding Box Extraction</span> • <span>Spatial OCR</span> • <span>Entity Normalization</span>
                </div>
              </div>
            </div>
          )}

          {/* Verification Results Display */}
          {verificationResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      {verificationResult.title}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      Confidence Score: {(verificationResult.confidenceScore * 100).toFixed(0)}% • Llama 3.2 Vision
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetVerification}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 underline"
                >
                  Scan Another
                </button>
              </div>

              {/* Extracted Key-Value Parameters */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200">
                <p className="text-xs font-black text-stone-700 uppercase tracking-wider mb-3">
                  {t.detectedData}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {verificationResult.extractedData.ownerName && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Owner Name:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.ownerName}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.landAreaAcres && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Verified Land Area:</span>
                      <span className="font-extrabold text-emerald-800 text-sm">
                        {verificationResult.extractedData.landAreaAcres} Acres
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.surveyNumber && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Survey / Khata No:</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.surveyNumber}
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
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Soil pH Value:</span>
                      <span className="font-extrabold text-cyan-800 text-sm">
                        pH {verificationResult.extractedData.soilPh} (Neutral Optimal)
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.nitrogenStatus && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                      <span className="text-stone-400 font-bold block">Nitrogen (N):</span>
                      <span className="font-extrabold text-stone-900 text-sm">
                        {verificationResult.extractedData.nitrogenStatus}
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

                  {verificationResult.extractedData.diseaseSymptoms && (
                    <div className="p-3 rounded-xl bg-white border border-stone-200 sm:col-span-2">
                      <span className="text-stone-400 font-bold block">Diagnosis / Symptoms:</span>
                      <span className="font-extrabold text-red-700 text-sm">
                        {verificationResult.extractedData.diseaseSymptoms}
                      </span>
                    </div>
                  )}

                  {verificationResult.extractedData.recommendedAction && (
                    <div className="p-3 rounded-xl bg-emerald-100/60 border border-emerald-300 sm:col-span-2">
                      <span className="text-emerald-900 font-bold block">Agronomist Recommendation:</span>
                      <span className="font-bold text-emerald-950 text-xs">
                        {verificationResult.extractedData.recommendedAction}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setVerificationModalOpen(false);
              resetVerification();
            }}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition"
          >
            Cancel
          </button>

          {verificationResult && (
            <button
              onClick={confirmExtractedData}
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center gap-2 active:scale-98 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{t.confirmAndUpdate}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
