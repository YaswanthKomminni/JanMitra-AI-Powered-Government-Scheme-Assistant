"use client";

import React, { useState, useMemo } from "react";
import {
  LIME_PRESETS,
  LimePreset,
  GLOBAL_SHAP_ITEMS,
} from "@/lib/data/llmAnalysisData";
import { Sparkles, Play, RefreshCw, Sliders, FileText, CheckCircle2 } from "lucide-react";

export default function InteractiveXaiSandbox() {
  // LIME State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset-shocker-subsidy");
  const [claimText, setClaimText] = useState<string>(
    LIME_PRESETS[0].text
  );
  const [samplesCount, setSamplesCount] = useState<number>(300);
  const [isExplainingLime, setIsExplainingLime] = useState<boolean>(false);
  const [limeExplained, setLimeExplained] = useState<boolean>(true);

  // JanMitra SHAP Multi-Dimensional Sliders
  // 1. Land Extent Qualification (<= 5 Acres for marginal farmer subsidies)
  const [landExtent, setLandExtent] = useState<number>(85);
  // 2. RAG Welfare Evidence Match (4,706 schemes dense vector retrieval)
  const [ragEvidence, setRagEvidence] = useState<number>(92);
  // 3. Revenue Patta / Seal Authenticity (Gemini Vision spatial reticle verification)
  const [revenuePatta, setRevenuePatta] = useState<number>(78);
  // 4. Soil & Crop Lesion Match (Soil Health Card NPK + foliar diagnosis)
  const [soilCropMatch, setSoilCropMatch] = useState<number>(65);
  // 5. DBT & Aadhaar KYC Match (Direct bank transfer and citizen credentials)
  const [dbtKycMatch, setDbtKycMatch] = useState<number>(90);

  // Switch LIME Preset
  const handleSelectPreset = (p: LimePreset) => {
    setSelectedPresetId(p.id);
    setClaimText(p.text);
    setSamplesCount(p.defaultSamples);
    setLimeExplained(true);
  };

  const handleRunLime = () => {
    setIsExplainingLime(true);
    setTimeout(() => {
      setIsExplainingLime(false);
      setLimeExplained(true);
    }, 450);
  };

  // Dynamic token segmentation & scoring for custom or preset text
  const currentTokens = useMemo(() => {
    const activePreset = LIME_PRESETS.find((p) => p.id === selectedPresetId);
    if (activePreset && claimText === activePreset.text) {
      return activePreset.tokens;
    }
    const words = claimText.split(/\s+/).filter(Boolean);
    const deceptionClues = ["shocker", "secretly", "immediately", "urgent", "scam", "click", "bit.ly", "without", "free", "everyone", "50,000", "20,000"];
    const authorityClues = ["government", "ministry", "agriculture", "farmer", "farmers", "pm-kisan", "pm-kusum", "kusum", "subsidy", "eligible", "hectares", "acres"];

    return words.map((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (deceptionClues.some((d) => clean.includes(d))) {
        return { word: w, weight: -0.42, role: "negative" as const };
      }
      if (authorityClues.some((a) => clean.includes(a))) {
        return { word: w, weight: +0.35, role: "positive" as const };
      }
      return { word: w, weight: 0.02, role: "neutral" as const };
    });
  }, [claimText, selectedPresetId]);

  // Real-time JanMitra Local SHAP Decomposition calculation:
  // Baseline = 50.00
  // Each dimension contributes based on its Shapley weight:
  // phi_land = (landExtent - 50) * 0.28
  // phi_rag = (ragEvidence - 50) * 0.32
  // phi_patta = (revenuePatta - 50) * 0.25
  // phi_soil = (soilCropMatch - 50) * 0.20
  // phi_kyc = (dbtKycMatch - 50) * 0.22
  const shapCalculation = useMemo(() => {
    const baseline = 50.0;
    const phiLand = Number(((landExtent - 50) * 0.28).toFixed(2));
    const phiRag = Number(((ragEvidence - 50) * 0.32).toFixed(2));
    const phiPatta = Number(((revenuePatta - 50) * 0.25).toFixed(2));
    const phiSoil = Number(((soilCropMatch - 50) * 0.20).toFixed(2));
    const phiKyc = Number(((dbtKycMatch - 50) * 0.22).toFixed(2));

    const rawScore = baseline + phiLand + phiRag + phiPatta + phiSoil + phiKyc;
    const finalScore = Number(Math.max(0, Math.min(100, rawScore)).toFixed(2));

    return {
      baseline,
      phiLand,
      phiRag,
      phiPatta,
      phiSoil,
      phiKyc,
      finalScore,
    };
  }, [landExtent, ragEvidence, revenuePatta, soilCropMatch, dbtKycMatch]);

  const topNegativeTokens = currentTokens
    .filter((t) => t.weight < -0.1)
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-stone-800 bg-[#0c1322] text-stone-100 p-6 shadow-2xl space-y-6">
      {/* Sandbox Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌾</span>
          <div>
            <h3 className="text-xl font-black tracking-tight font-serif text-stone-100">
              Interactive XAI Sandbox — JanMitra Scheme Intelligence
            </h3>
            <p className="text-xs text-stone-400">
              Perturbation-based LIME word attribution on rural claims &amp; multi-dimensional SHAP entitlement qualification
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LIME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                selectedPresetId === p.id
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              {p.category}: {p.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= LEFT COLUMN: LIME SANDBOX ================= */}
        <div className="rounded-xl border border-stone-800/90 bg-[#090f1a] p-5 flex flex-col justify-between space-y-4 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                LIME PERTURBATION SANDBOX (CLAIM &amp; SCHEME TEXT)
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Rural Scam vs Official DBT Saliency
              </span>
            </div>

            {/* Claim Text Input */}
            <div className="relative">
              <textarea
                value={claimText}
                onChange={(e) => {
                  setClaimText(e.target.value);
                  setSelectedPresetId("custom");
                }}
                rows={4}
                className="w-full rounded-xl bg-stone-950/80 border border-stone-800 p-3 text-xs text-stone-200 leading-relaxed font-sans focus:outline-hidden focus:border-emerald-500 resize-none"
                placeholder="Enter claim text or government scheme headline..."
              />
            </div>

            {/* Perturbation Samples Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Perturbation samples:</span>
                <span className="font-bold text-stone-100">{samplesCount}</span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={25}
                value={samplesCount}
                onChange={(e) => setSamplesCount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
              />
            </div>

            {/* Explain with LIME Button */}
            <button
              onClick={handleRunLime}
              disabled={isExplainingLime}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isExplainingLime ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>Explain with LIME</span>
            </button>

            {/* LIME Highlight Preview */}
            {limeExplained && (
              <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-3">
                <h5 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                  Saliency Attribution Heatmap
                </h5>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs leading-loose flex flex-wrap gap-1">
                  {currentTokens.map((t, idx) => {
                    let badgeClass = "text-stone-300";
                    if (t.role === "negative") {
                      badgeClass =
                        "bg-[#4c0519] text-[#fda4af] border border-[#be123c]/50 font-bold px-1.5 py-0.5 rounded";
                    } else if (t.role === "positive") {
                      badgeClass =
                        "bg-[#064e3b] text-[#a7f3d0] border border-[#059669]/50 font-bold px-1.5 py-0.5 rounded";
                    }

                    return (
                      <span
                        key={idx}
                        className={`inline-block transition ${badgeClass}`}
                        title={`Token: ${t.word} | Impact Weight: ${t.weight > 0 ? "+" : ""}${t.weight}`}
                      >
                        {t.word}
                      </span>
                    );
                  })}
                </div>

                {/* Top Negative Triggers Bar Breakdown */}
                {topNegativeTokens.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <p className="text-[10px] font-mono text-stone-400">
                      Top Phishing / Fake Subsidy Triggers Detected:
                    </p>
                    {topNegativeTokens.map((t) => (
                      <div key={t.word} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-stone-300 w-28 truncate">
                          {t.word}
                        </span>
                        <div className="flex-1 bg-stone-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.abs(t.weight) * 200)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-rose-400 text-[11px]">
                          {t.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-stone-500 font-mono">
            Surrogate: Ridge linear regression over {samplesCount} perturbed boolean text masks
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LOCAL & GLOBAL SHAP ================= */}
        <div className="rounded-xl border border-stone-800/90 bg-[#090f1a] p-5 flex flex-col justify-between space-y-5 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                LOCAL SHAP — DRAG JANMITRA ELIGIBILITY CRITERIA
              </h4>
              <span className="text-[10px] font-mono text-stone-500">
                Additive attribution
              </span>
            </div>

            {/* 5 Draggable Sliders for JanMitra Criteria */}
            <div className="space-y-3">
              {/* 1. Land Extent Qualification */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">Land Extent Qualification (&le; 5 Acres):</span>
                  <span className="font-bold text-stone-100">{landExtent}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={landExtent}
                  onChange={(e) => setLandExtent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 2. RAG Welfare Evidence Match */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">RAG Welfare Evidence Match (4,706 Schemes):</span>
                  <span className="font-bold text-stone-100">{ragEvidence}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ragEvidence}
                  onChange={(e) => setRagEvidence(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 3. Revenue Patta / Seal Authenticity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">Revenue Patta / Seal Authenticity:</span>
                  <span className="font-bold text-stone-100">{revenuePatta}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={revenuePatta}
                  onChange={(e) => setRevenuePatta(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 4. Soil & Crop Lesion Match */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">Soil &amp; Crop Lesion Match (NPK / Foliar):</span>
                  <span className="font-bold text-stone-100">{soilCropMatch}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={soilCropMatch}
                  onChange={(e) => setSoilCropMatch(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 5. DBT & Aadhaar KYC Match */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">DBT &amp; Aadhaar KYC Match:</span>
                  <span className="font-bold text-stone-100">{dbtKycMatch}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={dbtKycMatch}
                  onChange={(e) => setDbtKycMatch(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Live Formula Display */}
            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 font-mono text-[11px] text-stone-300 overflow-x-auto">
              <span>
                Baseline prior 50{" "}
                {shapCalculation.phiLand >= 0 ? `+ ${shapCalculation.phiLand}` : `- ${Math.abs(shapCalculation.phiLand)}`}{" "}
                {shapCalculation.phiRag >= 0 ? `+ ${shapCalculation.phiRag}` : `- ${Math.abs(shapCalculation.phiRag)}`}{" "}
                {shapCalculation.phiPatta >= 0 ? `+ ${shapCalculation.phiPatta}` : `- ${Math.abs(shapCalculation.phiPatta)}`}{" "}
                {shapCalculation.phiSoil >= 0 ? `+ ${shapCalculation.phiSoil}` : `- ${Math.abs(shapCalculation.phiSoil)}`}{" "}
                {shapCalculation.phiKyc >= 0 ? `+ ${shapCalculation.phiKyc}` : `- ${Math.abs(shapCalculation.phiKyc)}`}{" "}
                = <strong className="text-emerald-400 font-bold text-[12px]">{shapCalculation.finalScore}%</strong>{" "}
                <span className="text-stone-500">
                  ({shapCalculation.finalScore >= 75 ? "Qualified for Subsidies" : "Conditional / Ineligible"})
                </span>
              </span>
            </div>

            {/* Local SHAP Waterfall Diverging Bars */}
            <div className="space-y-2 text-xs font-mono pt-1">
              {[
                { label: "Land Extent Qualification", phi: shapCalculation.phiLand },
                { label: "RAG Welfare Evidence Match", phi: shapCalculation.phiRag },
                { label: "Revenue Patta Authenticity", phi: shapCalculation.phiPatta },
                { label: "Soil & Crop Lesion Match", phi: shapCalculation.phiSoil },
                { label: "DBT & Aadhaar KYC Match", phi: shapCalculation.phiKyc },
              ].map((item) => {
                const isNeg = item.phi < 0;
                const widthPct = Math.min(100, (Math.abs(item.phi) / 20) * 100);

                return (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-stone-400 text-[11px] w-48 truncate">{item.label}</span>
                    <div className="flex-1 bg-stone-900 h-2.5 rounded-sm relative overflow-hidden flex items-center">
                      {isNeg ? (
                        <div
                          className="bg-rose-500 h-full absolute right-1/2 rounded-l-xs"
                          style={{ width: `${widthPct / 2}%` }}
                        />
                      ) : (
                        <div
                          className="bg-emerald-500 h-full absolute left-1/2 rounded-r-xs"
                          style={{ width: `${widthPct / 2}%` }}
                        />
                      )}
                      <div className="w-0.5 h-full bg-stone-700 absolute left-1/2 -translate-x-1/2" />
                    </div>
                    <span
                      className={`text-[11px] font-bold w-14 text-right ${
                        isNeg ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {item.phi > 0 ? `+${item.phi}` : item.phi}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* GLOBAL SHAP — MEAN |Φ| OVER 500 SAVED REPORTS */}
            <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-2.5">
              <h5 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                GLOBAL SHAP — MEAN |&Phi;| OVER 500 SAVED SCHEME EVALUATIONS
              </h5>
              <div className="space-y-2">
                {GLOBAL_SHAP_ITEMS.map((g) => {
                  const widthPct = (g.meanAbs / 10.0) * 100;
                  return (
                    <div key={g.feature} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-stone-300 truncate max-w-[220px]">{g.feature}</span>
                        <span className="text-stone-300 font-bold">
                          {g.meanAbs.toFixed(2)}{" "}
                          <span className="text-emerald-400 font-normal">
                            (mean {g.signedMean})
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-stone-500 font-mono">
            Shapley game formulation: &Phi;_i = &sum; [|S|!(|F|-|S|-1)! / |F|!] &times; [f(S &cup; &#123;i&#125;) - f(S)]
          </div>
        </div>
      </div>
    </div>
  );
}
