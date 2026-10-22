"use client";

import React, { useState } from "react";
import ModelCardsSection from "./ModelCardsSection";
import AblationStudySection from "./AblationStudySection";
import LlmTestSuiteSection from "./LlmTestSuiteSection";
import InteractiveXaiSandbox from "./InteractiveXaiSandbox";
import { Sparkles, Layers, Sliders, CheckSquare, BarChart3, ShieldCheck } from "lucide-react";

export default function LlmXaiAnalysisSuite() {
  const [activeTab, setActiveTab] = useState<"ALL" | "MODELS" | "ABLATION" | "TESTS" | "SANDBOX">("ALL");

  return (
    <section className="my-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-800 bg-gradient-to-r from-[#0b101d] via-[#0f172a] to-[#1e1b4b] p-6 text-stone-100 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40">
                Empirical Evaluation Suite
              </span>
              <span className="text-xs font-mono text-stone-400">
                Models 1–5 &bull; 18-Case Benchmark
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight font-serif text-white sm:text-3xl">
              LLM Model Benchmark &amp; Explainable AI (XAI) Suite
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              Comprehensive empirical evaluation reproducing dense retrieval (FAISS), summarization (Qwen 4B), claim classification (BERT-LIAR), fake-news article discrimination (BERT ISOT-Bharat), LLM reasoning (DeepSeek-R1 / Gemma2), systematic ablation, and interactive LIME &amp; SHAP attribution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="#sandbox"
              onClick={() => setActiveTab("SANDBOX")}
              className="px-4 py-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch XAI Sandbox</span>
            </a>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-stone-800/80 flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "All Analysis Sections", icon: Layers },
            { id: "MODELS", label: "Model Cards (1–5)", icon: BarChart3 },
            { id: "ABLATION", label: "Table 1 — Ablation Study", icon: Sliders },
            { id: "TESTS", label: "Section VI — LLM Test Suite", icon: CheckSquare },
            { id: "SANDBOX", label: "Interactive XAI Sandbox", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
                  isActive
                    ? "bg-white text-stone-900 font-bold shadow-md"
                    : "bg-stone-900/90 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#e11d48]" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: Model Cards 1–5 */}
      {(activeTab === "ALL" || activeTab === "MODELS") && (
        <div id="models" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-stone-900 font-serif flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              <span>Empirical Model Evaluation Cards (Models 1–5)</span>
            </h3>
            <span className="text-xs font-mono text-stone-500">
              Pipelines A &amp; B &bull; Accuracy, ROC-AUC, Confusion Matrices
            </span>
          </div>
          <ModelCardsSection />
        </div>
      )}

      {/* SECTION 2: Table 1 — Ablation study (Models 1–6) */}
      {(activeTab === "ALL" || activeTab === "ABLATION") && (
        <div id="ablation" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-stone-900 font-serif flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Systematic Ablation Study (Models 1–6)</span>
            </h3>
            <span className="text-xs font-mono text-stone-500">
              Leave-One-Module-Out Delta Telemetry
            </span>
          </div>
          <AblationStudySection />
        </div>
      )}

      {/* SECTION 3: Section VI — LLM test suite */}
      {(activeTab === "ALL" || activeTab === "TESTS") && (
        <div id="tests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-stone-900 font-serif flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Section VI — LLM Test Suite &amp; Target Validation</span>
            </h3>
            <span className="text-xs font-mono text-stone-500">
              18 Standardized Test Cases (15/18 Passed)
            </span>
          </div>
          <LlmTestSuiteSection />
        </div>
      )}

      {/* SECTION 4: Interactive XAI sandbox */}
      {(activeTab === "ALL" || activeTab === "SANDBOX") && (
        <div id="sandbox" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-stone-900 font-serif flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Interactive XAI Sandbox (LIME Perturbation &amp; SHAP Waterfall)</span>
            </h3>
            <span className="text-xs font-mono text-stone-500">
              Live Mathematical Attribution Playground
            </span>
          </div>
          <InteractiveXaiSandbox />
        </div>
      )}
    </section>
  );
}
