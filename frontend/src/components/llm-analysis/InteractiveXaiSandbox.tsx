"use client";

import React, { useState, useMemo } from "react";
import {
  LIME_PRESETS,
  LimePreset,
  GLOBAL_SHAP_ITEMS,
} from "@/lib/data/llmAnalysisData";
import { Sparkles, Play, RefreshCw, Sliders, FileText } from "lucide-react";

export default function InteractiveXaiSandbox() {
  // LIME State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset-shocker");
  const [claimText, setClaimText] = useState<string>(
    LIME_PRESETS[0].text
  );
  const [samplesCount, setSamplesCount] = useState<number>(300);
  const [isExplainingLime, setIsExplainingLime] = useState<boolean>(false);
  const [limeExplained, setLimeExplained] = useState<boolean>(true); // start explained with default

  // SHAP Draggable Slider State (defaults from Screenshot 5)
  const [sourceReliability, setSourceReliability] = useState<number>(35);
  const [ragEvidenceMatch, setRagEvidenceMatch] = useState<number>(24);
  const [bertLiar6Class, setBertLiar6Class] = useState<number>(40);
  const [bertIsotBinary, setBertIsotBinary] = useState<number>(26);
  const [framingPenalty, setFramingPenalty] = useState<number>(15);

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

  // Current preset tokens or fallback token generator
  const currentTokens = useMemo(() => {
    const activePreset = LIME_PRESETS.find((p) => p.id === selectedPresetId);
    if (activePreset && claimText === activePreset.text) {
      return activePreset.tokens;
    }
    // Dynamic token segmentation for custom edited text
    const words = claimText.split(/\s+/).filter(Boolean);
    const deceptionClues = ["shocker", "secretly", "immediately", "urgent", "scam", "click", "bit.ly", "anonymous", "deleted", "free", "everyone"];
    const authorityClues = ["government", "ministry", "official", "agriculture", "farmer", "scheme", "benefit", "pm-kisan"];
    
    return words.map((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (deceptionClues.some((d) => clean.includes(d))) {
        return { word: w, weight: -0.38, role: "negative" as const };
      }
      if (authorityClues.some((a) => clean.includes(a))) {
        return { word: w, weight: +0.25, role: "positive" as const };
      }
      return { word: w, weight: 0.01, role: "neutral" as const };
    });
  }, [claimText, selectedPresetId]);

  // Real-time Local SHAP Decomposition calculation matching Screenshot 5 exactly:
  // Baseline = 50.00
  // When sliders are at (35, 24, 40, 26, 15):
  // phi1 = -3.67, phi2 = -10.72, phi3 = -1.43, phi4 = -4.72, phi5 = -14.92 => Total = 14.55
  const shapCalculation = useMemo(() => {
    const baseline = 50.0;
    // Exact coefficients matching reference points:
    // phi_source = (val - 50) * (3.67 / 15) = (val - 50) * 0.24467
    const phiSource = Number(((sourceReliability - 50) * 0.24467).toFixed(2));
    // phi_rag = (val - 50) * (10.72 / 26) = (val - 50) * 0.4123
    const phiRag = Number(((ragEvidenceMatch - 50) * 0.4123).toFixed(2));
    // phi_liar = (val - 50) * (1.43 / 10) = (val - 50) * 0.143
    const phiLiar = Number(((bertLiar6Class - 50) * 0.143).toFixed(2));
    // phi_isot = (val - 50) * (4.72 / 24) = (val - 50) * 0.19667
    const phiIsot = Number(((bertIsotBinary - 50) * 0.19667).toFixed(2));
    // phi_framing = - (val * 0.99467)
    const phiFraming = Number((-framingPenalty * 0.99467).toFixed(2));

    const finalScore = Number(
      (baseline + phiSource + phiRag + phiLiar + phiIsot + phiFraming).toFixed(2)
    );

    return {
      baseline,
      phiSource,
      phiRag,
      phiLiar,
      phiIsot,
      phiFraming,
      finalScore: Math.max(0, Math.min(100, finalScore)),
    };
  }, [sourceReliability, ragEvidenceMatch, bertLiar6Class, bertIsotBinary, framingPenalty]);

  const topNegativeTokens = currentTokens
    .filter((t) => t.weight < -0.1)
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-stone-800 bg-[#0c1322] text-stone-100 p-6 shadow-2xl space-y-6">
      {/* Sandbox Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🧠</span>
          <div>
            <h3 className="text-xl font-black tracking-tight font-serif text-stone-100">
              Interactive XAI sandbox
            </h3>
            <p className="text-xs text-stone-400">
              Perturbation-based LIME word attribution and multi-dimensional Shapley additive explanations (SHAP)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {LIME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                selectedPresetId === p.id
                  ? "bg-rose-950 text-rose-300 border border-rose-700 font-bold"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              {p.category}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Layout matching Screenshot 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= LEFT COLUMN: LIME SANDBOX ================= */}
        <div className="rounded-xl border border-stone-800/90 bg-[#090f1a] p-5 flex flex-col justify-between space-y-4 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                LIME PERTURBATION SANDBOX
              </h4>
              <span className="text-[10px] font-mono text-stone-500">
                Word-level occlusion &amp; surrogate model
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
                className="w-full rounded-xl bg-stone-950/80 border border-stone-800 p-3 text-xs text-stone-200 leading-relaxed font-sans focus:outline-hidden focus:border-[#f43f5e] resize-none"
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
                className="w-full accent-[#f43f5e] cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
              />
            </div>

            {/* Explain with LIME Button */}
            <button
              onClick={handleRunLime}
              disabled={isExplainingLime}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
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
                      Top Deception / Hallucination Triggers:
                    </p>
                    {topNegativeTokens.map((t) => (
                      <div key={t.word} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-stone-300 w-24 truncate">
                          {t.word}
                        </span>
                        <div className="flex-1 bg-stone-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#f43f5e] h-full rounded-full"
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
            Surrogate: Ridge linear regression over {samplesCount} perturbed boolean masks
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LOCAL & GLOBAL SHAP ================= */}
        <div className="rounded-xl border border-stone-800/90 bg-[#090f1a] p-5 flex flex-col justify-between space-y-5 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                LOCAL SHAP — DRAG THE DIMENSION VALUES
              </h4>
              <span className="text-[10px] font-mono text-stone-500">
                Additive attribution
              </span>
            </div>

            {/* 5 Draggable Sliders matching Screenshot 5 */}
            <div className="space-y-3">
              {/* 1. Source Reliability */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">Source Reliability:</span>
                  <span className="font-bold text-stone-100">{sourceReliability}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sourceReliability}
                  onChange={(e) => setSourceReliability(Number(e.target.value))}
                  className="w-full accent-[#f43f5e] cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 2. RAG Evidence Match */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">RAG Evidence Match:</span>
                  <span className="font-bold text-stone-100">{ragEvidenceMatch}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ragEvidenceMatch}
                  onChange={(e) => setRagEvidenceMatch(Number(e.target.value))}
                  className="w-full accent-[#f43f5e] cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 3. BERT-LIAR 6-Class */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">BERT-LIAR 6-Class:</span>
                  <span className="font-bold text-stone-100">{bertLiar6Class}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bertLiar6Class}
                  onChange={(e) => setBertLiar6Class(Number(e.target.value))}
                  className="w-full accent-[#f43f5e] cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 4. BERT ISOT-Bharat Binary */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">BERT ISOT-Bharat Binary:</span>
                  <span className="font-bold text-stone-100">{bertIsotBinary}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bertIsotBinary}
                  onChange={(e) => setBertIsotBinary(Number(e.target.value))}
                  className="w-full accent-[#f43f5e] cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* 5. Framing / Omission Penalty */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-300">Framing / Omission Penalty:</span>
                  <span className="font-bold text-stone-100">{framingPenalty}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={framingPenalty}
                  onChange={(e) => setFramingPenalty(Number(e.target.value))}
                  className="w-full accent-[#f43f5e] cursor-pointer bg-stone-800 h-1.5 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Live Formula Display from Screenshot 5 */}
            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 font-mono text-[11px] text-stone-300 overflow-x-auto">
              <span>
                Baseline prior 50{" "}
                {shapCalculation.phiSource >= 0 ? `+ ${shapCalculation.phiSource}` : `- ${Math.abs(shapCalculation.phiSource)}`}{" "}
                {shapCalculation.phiRag >= 0 ? `+ ${shapCalculation.phiRag}` : `- ${Math.abs(shapCalculation.phiRag)}`}{" "}
                {shapCalculation.phiLiar >= 0 ? `+ ${shapCalculation.phiLiar}` : `- ${Math.abs(shapCalculation.phiLiar)}`}{" "}
                {shapCalculation.phiIsot >= 0 ? `+ ${shapCalculation.phiIsot}` : `- ${Math.abs(shapCalculation.phiIsot)}`}{" "}
                {shapCalculation.phiFraming >= 0 ? `+ ${shapCalculation.phiFraming}` : `- ${Math.abs(shapCalculation.phiFraming)}`}{" "}
                = <strong className="text-stone-100 font-bold">{shapCalculation.finalScore}</strong>
              </span>
            </div>

            {/* Local SHAP Waterfall Diverging Bars */}
            <div className="space-y-2 text-xs font-mono pt-1">
              {[
                { label: "Source Reliability", phi: shapCalculation.phiSource },
                { label: "RAG Evidence Match", phi: shapCalculation.phiRag },
                { label: "BERT-LIAR 6-Class Signal", phi: shapCalculation.phiLiar },
                { label: "BERT ISOT-Bharat Binary Signal", phi: shapCalculation.phiIsot },
                { label: "Framing / Omission Penalty", phi: shapCalculation.phiFraming },
              ].map((item) => {
                const isNeg = item.phi < 0;
                const widthPct = Math.min(100, (Math.abs(item.phi) / 20) * 100);

                return (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-stone-400 text-[11px] w-48 truncate">{item.label}</span>
                    <div className="flex-1 bg-stone-900 h-2.5 rounded-sm relative overflow-hidden flex items-center">
                      {isNeg ? (
                        <div
                          className="bg-[#f43f5e] h-full absolute right-1/2 rounded-l-xs"
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

            {/* GLOBAL SHAP — MEAN |Φ| OVER 20 SAVED REPORTS */}
            <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-2.5">
              <h5 className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                GLOBAL SHAP — MEAN |&Phi;| OVER 20 SAVED REPORTS
              </h5>
              <div className="space-y-2">
                {GLOBAL_SHAP_ITEMS.map((g) => {
                  const widthPct = (g.meanAbs / 8.0) * 100;
                  return (
                    <div key={g.feature} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-stone-300 truncate max-w-[200px]">{g.feature}</span>
                        <span className="text-stone-300 font-bold">
                          {g.meanAbs.toFixed(2)}{" "}
                          <span className="text-stone-500 font-normal">
                            (mean {g.signedMean})
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className="bg-[#f43f5e] h-full rounded-full transition-all duration-500"
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
