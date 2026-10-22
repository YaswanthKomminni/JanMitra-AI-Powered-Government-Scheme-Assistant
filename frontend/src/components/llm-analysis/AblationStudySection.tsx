"use client";

import React, { useState } from "react";
import { ABLATION_STUDY_DATA, AblationRow } from "@/lib/data/llmAnalysisData";
import { HelpCircle } from "lucide-react";

interface ColumnDef {
  key: keyof AblationRow["values"];
  label: string;
  tooltip: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "p5", label: "P@5", tooltip: "Precision at top 5 retrieved documents" },
  { key: "r5", label: "R@5", tooltip: "Recall at top 5 retrieved documents" },
  { key: "mrr", label: "MRR", tooltip: "Mean Reciprocal Rank of first relevant document" },
  { key: "ild", label: "ILD", tooltip: "Intra-List Diversity of retrieved results" },
  { key: "uniqSrc", label: "Uniq. src", tooltip: "Unique Source Ratio across retrieved evidence" },
  { key: "verdictAcc", label: "Verdict acc", tooltip: "Verdict Accuracy on verified claims" },
  { key: "halluc", label: "Halluc.", tooltip: "Hallucination Rate (lower is better)" },
  { key: "citeValid", label: "Cite valid", tooltip: "Citation Validity and grounding ratio" },
  { key: "credBandAcc", label: "Cred. band acc", tooltip: "Credibility Band Accuracy" },
  { key: "mislRecall", label: "Misl. recall", tooltip: "Misleading claim detection recall" },
  { key: "rouge1", label: "ROUGE-1", tooltip: "ROUGE-1 unigram overlap score" },
  { key: "rouge2", label: "ROUGE-2", tooltip: "ROUGE-2 bigram overlap score" },
  { key: "rougeL", label: "ROUGE-L", tooltip: "ROUGE-L longest common subsequence" },
  { key: "factCov", label: "Fact cov.", tooltip: "Factual entity coverage ratio" },
];

export default function AblationStudySection() {
  const [highlightedCol, setHighlightedCol] = useState<string | null>(null);

  const toggleColumnHighlight = (colKey: string) => {
    if (highlightedCol === colKey) {
      setHighlightedCol(null);
    } else {
      setHighlightedCol(colKey);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-[#0c1322] text-stone-100 p-6 shadow-2xl">
      {/* Title & Description matching Screenshot 3 */}
      <div className="mb-4">
        <h3 className="text-lg font-black tracking-tight font-serif text-stone-100 sm:text-xl">
          Table 1 — Ablation study (Models 1–6)
        </h3>
        <p className="mt-1 text-xs text-stone-400">
          <span className="text-[#f43f5e] font-semibold">Red</span> = worse than the complete system,{" "}
          <span className="text-emerald-400 font-semibold">green</span> = better. Click a column header to highlight it.
        </p>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-stone-800/80 bg-stone-950/60 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 bg-[#080d18] text-stone-300">
              <th className="p-3 font-bold font-mono text-[11px] uppercase tracking-wider sticky left-0 bg-[#080d18] z-10 min-w-[200px]">
                Configuration
              </th>
              {COLUMNS.map((col) => {
                const isHighlighted = highlightedCol === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleColumnHighlight(col.key)}
                    title={col.tooltip}
                    className={`p-3 font-mono font-bold text-[11px] text-center cursor-pointer transition select-none min-w-[70px] ${
                      isHighlighted
                        ? "bg-emerald-950/80 text-emerald-300 border-x border-emerald-700/60 ring-1 ring-emerald-500"
                        : "hover:bg-stone-800 text-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{col.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono text-stone-200">
            {ABLATION_STUDY_DATA.map((row, rIdx) => {
              return (
                <tr
                  key={row.configuration}
                  className={`transition hover:bg-stone-900/50 ${
                    row.isBaseline ? "bg-stone-900/40 font-semibold" : ""
                  }`}
                >
                  {/* Configuration column (Sticky left) */}
                  <td className="p-3 sticky left-0 bg-[#0c1322] border-r border-stone-800/60 z-10">
                    <strong className="block text-stone-100 text-[12px] font-sans font-bold">
                      {row.configuration}
                    </strong>
                    <span className="text-[10px] text-stone-400 font-sans leading-tight">
                      {row.description}
                    </span>
                  </td>

                  {/* Value columns */}
                  {COLUMNS.map((col) => {
                    const item = row.values[col.key];
                    const isHighlighted = highlightedCol === col.key;
                    const delta = item?.delta;
                    const inverse = (item as any)?.inverseDelta;

                    // Determine red/green delta
                    let deltaColor = "text-stone-400";
                    let sign = "";
                    if (delta !== undefined && delta !== 0) {
                      if (inverse) {
                        // Higher is worse (e.g. hallucination)
                        deltaColor = delta > 0 ? "text-[#f43f5e]" : "text-emerald-400";
                      } else {
                        // Higher is better
                        deltaColor = delta < 0 ? "text-[#f43f5e]" : "text-emerald-400";
                      }
                      sign = delta > 0 ? "+" : "";
                    }

                    // Format main value
                    const formattedVal =
                      item.val === 0 ? "0" : item.val === 1 ? "1" : item.val.toFixed(3);

                    // Cell background tint if highlighted or has major impact
                    let cellBg = isHighlighted ? "bg-emerald-950/20" : "";
                    if (delta && Math.abs(delta) >= 0.3) {
                      cellBg = delta < 0 && !inverse ? "bg-rose-950/20" : cellBg;
                    }

                    return (
                      <td
                        key={col.key}
                        className={`p-2.5 text-center align-top border-r border-stone-800/30 ${cellBg} ${
                          isHighlighted ? "border-x border-emerald-800/40" : ""
                        }`}
                      >
                        <div className="font-bold text-stone-100 text-[12px]">{formattedVal}</div>
                        {delta !== undefined && delta !== 0 && (
                          <div className={`text-[10px] font-bold ${deltaColor} mt-0.5`}>
                            {sign}
                            {delta.toFixed(3)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
            <span>Metric degraded vs complete baseline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Metric improved vs complete baseline</span>
          </span>
        </div>
        <p className="text-[11px] text-stone-500 font-mono">
          Ablation suite executed across 500 test samples &bull; Temperature=0.0
        </p>
      </div>
    </div>
  );
}
