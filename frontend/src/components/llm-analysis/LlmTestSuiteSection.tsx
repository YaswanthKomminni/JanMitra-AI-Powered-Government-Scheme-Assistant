"use client";

import React, { useState } from "react";
import {
  LLM_TEST_TEMPLATE_DATA,
  ALL_18_TEST_CASES,
  TestCaseRow,
} from "@/lib/data/llmAnalysisData";
import { CheckCircle2, XCircle, Filter, Cpu, ShieldCheck } from "lucide-react";

export default function LlmTestSuiteSection() {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PASS" | "FAIL">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const passedCount = ALL_18_TEST_CASES.filter((tc) => tc.status === "PASS").length;
  const totalCount = ALL_18_TEST_CASES.length;
  const passPercent = Math.round((passedCount / totalCount) * 100);

  const filteredCases = ALL_18_TEST_CASES.filter((tc) => {
    if (filterStatus !== "ALL" && tc.status !== filterStatus) return false;
    if (searchTerm) {
      const match =
        tc.tc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.metric.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-stone-800 bg-[#0c1322] text-stone-100 p-6 shadow-2xl space-y-6">
      {/* Title & Section Header matching Screenshot 4 */}
      <div>
        <h3 className="text-xl font-black tracking-tight font-serif text-stone-100 sm:text-2xl">
          Section VI — LLM test suite
        </h3>
        <h4 className="mt-1 text-sm font-bold text-stone-300 font-serif">
          Table 5 — Result-reporting template
        </h4>
      </div>

      {/* Table 5: Key Benchmark Threshold Reporting */}
      <div className="overflow-x-auto rounded-xl border border-stone-800/80 bg-stone-950/60 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 bg-[#080d18] text-stone-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="p-3">Metric</th>
              <th className="p-3">Target</th>
              <th className="p-3">Measured</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono text-stone-200">
            {LLM_TEST_TEMPLATE_DATA.map((row) => (
              <tr key={row.metric} className="hover:bg-stone-900/40 transition">
                <td className="p-3 font-sans font-medium text-stone-200 text-xs">{row.metric}</td>
                <td className="p-3 text-stone-400 text-xs">{row.target}</td>
                <td className="p-3 font-bold text-stone-100 text-xs">{row.measured}</td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      row.status === "PASS"
                        ? "bg-[#065f46] text-[#34d399] border border-[#059669]/60"
                        : "bg-[#881337] text-[#fda4af] border border-[#be123c]/60"
                    }`}
                  >
                    {row.status === "PASS" ? (
                      <CheckCircle2 className="w-3 h-3 text-[#34d399]" />
                    ) : (
                      <XCircle className="w-3 h-3 text-[#fda4af]" />
                    )}
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Header & Engine Metadata */}
      <div className="pt-4 border-t border-stone-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-extrabold text-stone-100 font-serif flex items-center gap-2">
              <span>All 18 LLM test cases — {passedCount}/{totalCount} passed</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                {passPercent}% Pass Rate
              </span>
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === "ALL"
                  ? "bg-stone-200 text-stone-950 font-bold"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus("PASS")}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === "PASS"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-stone-900 text-emerald-400 hover:bg-stone-800 border border-emerald-900/50"
              }`}
            >
              Pass ({passedCount})
            </button>
            <button
              onClick={() => setFilterStatus("FAIL")}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === "FAIL"
                  ? "bg-rose-600 text-white font-bold"
                  : "bg-stone-900 text-rose-400 hover:bg-stone-800 border border-rose-900/50"
              }`}
            >
              Fail ({totalCount - passedCount})
            </button>
          </div>
        </div>

        {/* JanMitra Engine Metadata Bar */}
        <div className="p-3 rounded-xl bg-[#080d18] border border-stone-800/90 text-[11px] font-mono text-stone-400 leading-relaxed overflow-x-auto">
          <p className="whitespace-pre-wrap">
            <strong className="text-stone-300">Engine:</strong> live_keys=configured &bull;{" "}
            vision=gemini-2.0-flash / groq:llama-3.2-11b-vision &bull;{" "}
            chat_reasoner=groq:llama-3.3-70b-versatile / gemini-2.0-flash &bull;{" "}
            judge=deepeval+grounded-rag &bull;{" "}
            retriever=sbert:all-MiniLM-L6-v2 + faiss.IndexFlatIP (128-dim dense index over 4,706 schemes) &bull;{" "}
            ocr=tesseract.js-wasm-v7.0.0 &bull; voice=web-speech-api (te/hi/ta/kn/bn/en)
          </p>
        </div>
      </div>

      {/* Comprehensive 18 Test Case Audit Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-800/80 bg-stone-950/60 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 bg-[#080d18] text-stone-400 font-mono text-[10px] uppercase tracking-wider">
              <th className="p-2.5">TC</th>
              <th className="p-2.5">Level</th>
              <th className="p-2.5">Component</th>
              <th className="p-2.5 min-w-[220px]">Scenario</th>
              <th className="p-2.5">Metric</th>
              <th className="p-2.5">Target</th>
              <th className="p-2.5">Measured</th>
              <th className="p-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono text-stone-200">
            {filteredCases.map((tc) => (
              <tr key={tc.tc} className="hover:bg-stone-900/40 transition">
                <td className="p-2.5 font-bold text-stone-300">{tc.tc}</td>
                <td className="p-2.5 text-stone-400 text-[11px]">{tc.level}</td>
                <td className="p-2.5 font-semibold text-stone-200 text-[11px]">{tc.component}</td>
                <td className="p-2.5 font-sans text-stone-300 text-xs leading-snug">{tc.scenario}</td>
                <td className="p-2.5 text-stone-400 text-[11px]">{tc.metric}</td>
                <td className="p-2.5 text-stone-400 text-[11px]">{tc.target}</td>
                <td className="p-2.5 font-bold text-stone-100 text-[11px]">{tc.measured}</td>
                <td className="p-2.5 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      tc.status === "PASS"
                        ? "bg-[#065f46] text-[#34d399]"
                        : "bg-[#881337] text-[#fda4af]"
                    }`}
                  >
                    {tc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
