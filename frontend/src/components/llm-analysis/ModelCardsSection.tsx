"use client";

import React, { useState } from "react";
import { MODEL_EVALUATION_CARDS, ModelCardData } from "@/lib/data/llmAnalysisData";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

export default function ModelCardsSection() {
  const [openBaselines, setOpenBaselines] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{ modelId: string; row: number; col: number; val: number } | null>(null);

  const model1 = MODEL_EVALUATION_CARDS.find((m) => m.id === "model-1")!;
  const model2 = MODEL_EVALUATION_CARDS.find((m) => m.id === "model-2")!;
  const model3 = MODEL_EVALUATION_CARDS.find((m) => m.id === "model-3")!;
  const model4 = MODEL_EVALUATION_CARDS.find((m) => m.id === "model-4")!;
  const model5 = MODEL_EVALUATION_CARDS.find((m) => m.id === "model-5")!;

  return (
    <div className="space-y-6">
      {/* Row 1: Models 1, 2, 3 in 3-column grid matching Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ModelCard item={model1} />
        <ModelCard item={model2} />
        <ModelCard
          item={model3}
          hoveredCell={hoveredCell}
          setHoveredCell={setHoveredCell}
        />
      </div>

      {/* Row 2: Models 4 & 5 in 2-column grid matching Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ModelCard
          item={model4}
          openBaselines={openBaselines}
          setOpenBaselines={setOpenBaselines}
          hoveredCell={hoveredCell}
          setHoveredCell={setHoveredCell}
        />
        <ModelCard
          item={model5}
          hoveredCell={hoveredCell}
          setHoveredCell={setHoveredCell}
        />
      </div>
    </div>
  );
}

function ModelCard({
  item,
  openBaselines,
  setOpenBaselines,
  hoveredCell,
  setHoveredCell,
}: {
  item: ModelCardData;
  openBaselines?: boolean;
  setOpenBaselines?: (val: boolean) => void;
  hoveredCell?: { modelId: string; row: number; col: number; val: number } | null;
  setHoveredCell?: (val: { modelId: string; row: number; col: number; val: number } | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-[#0c1322] text-stone-200 p-5 shadow-2xl flex flex-col justify-between transition hover:border-stone-700">
      <div>
        {/* Model ID Badge */}
        <div className="mb-2">
          <span className="text-[11px] font-black tracking-widest text-[#f43f5e] uppercase">
            {item.badge}
          </span>
        </div>

        {/* Model Title */}
        <h3 className="font-extrabold text-stone-100 text-base leading-snug tracking-tight font-serif sm:text-lg">
          {item.title}
        </h3>

        {/* Subtitle / Pipeline */}
        <p className="mt-1 text-xs text-stone-400 font-mono">
          {item.pipeline} <span className="text-stone-600">&bull;</span> backend: <span className="text-stone-300">{item.backend}</span>
        </p>

        {/* Metrics Table */}
        <div className="mt-5 space-y-2 text-xs">
          {item.metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between py-0.5 border-b border-stone-800/60">
              <span className="text-stone-400 font-sans">{m.label}</span>
              <span className="font-mono font-bold text-stone-100 text-[13px]">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Optional Per-Class F1 */}
        {item.perClassF1 && (
          <div className="mt-5 pt-3 border-t border-stone-800/80">
            <h4 className="text-[11px] font-mono uppercase tracking-wider font-bold text-stone-400 mb-2.5">
              PER-CLASS F1
            </h4>
            <div className="space-y-1.5 text-xs">
              {item.perClassF1.map((c) => {
                const pct = Math.round(c.score * 100);
                return (
                  <div key={c.name} className="flex items-center justify-between gap-3">
                    <span className="text-stone-400 font-mono text-[11px] w-24 truncate">{c.name}</span>
                    <div className="flex-1 bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800/80">
                      <div
                        className="bg-[#f43f5e] h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-stone-200 text-right w-12 text-[11px]">
                      {c.score.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Confusion Matrix */}
        {item.confusionMatrix && (
          <div className="mt-5 pt-3 border-t border-stone-800/80">
            <h4 className="text-[11px] font-mono text-stone-400 mb-2 font-bold flex items-center justify-between">
              <span>{item.confusionMatrix.caption}</span>
              <span className="text-[10px] text-stone-500 font-normal">gold &darr; / pred &rarr;</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-stone-800">
                    <th className="p-1 text-left text-stone-500 text-[9px] font-semibold">
                      gold &darr;<br />pred &rarr;
                    </th>
                    {item.confusionMatrix.labels.map((lbl) => (
                      <th key={lbl} className="p-1 font-bold text-stone-300 truncate max-w-[48px]" title={lbl}>
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.confusionMatrix.matrix.map((row, rIdx) => {
                    const rowLabel = item.confusionMatrix!.labels[rIdx];
                    return (
                      <tr key={rIdx} className="border-b border-stone-800/40">
                        <td className="p-1 text-left text-stone-400 font-semibold truncate max-w-[60px]" title={rowLabel}>
                          {rowLabel}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          let bgClass = "bg-stone-900/60 text-stone-400";
                          if (isDiagonal && val > 0) {
                            bgClass = "bg-[#059669] text-white font-extrabold shadow-inner"; // emerald for correct
                          } else if (val > 10) {
                            bgClass = "bg-[#881337] text-rose-200 font-bold"; // dark rose for major error
                          } else if (val > 0) {
                            bgClass = "bg-[#4c0519]/70 text-rose-300"; // subtle red for minor error
                          }

                          return (
                            <td
                              key={cIdx}
                              onMouseEnter={() =>
                                setHoveredCell &&
                                setHoveredCell({ modelId: item.id, row: rIdx, col: cIdx, val })
                              }
                              onMouseLeave={() => setHoveredCell && setHoveredCell(null)}
                              className={`p-1.5 transition-colors cursor-default border border-stone-900/80 ${bgClass}`}
                              title={`Gold: ${rowLabel}, Pred: ${item.confusionMatrix!.labels[cIdx]}, Count: ${val}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Optional Baselines Dropdown */}
        {item.baselines && (
          <div className="mt-4 pt-2 border-t border-stone-800/80">
            <button
              onClick={() => setOpenBaselines && setOpenBaselines(!openBaselines)}
              className="flex items-center gap-1.5 text-xs font-mono text-stone-400 hover:text-stone-200 transition py-1"
            >
              {openBaselines ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Baselines ({item.baselines.map((b) => b.name).join(", ")})</span>
            </button>
            {openBaselines && (
              <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
                {item.baselines.map((b) => (
                  <div key={b.name} className="space-y-0.5">
                    <p className="font-mono font-bold text-emerald-400">{b.name}</p>
                    <p className="font-mono text-[11px] text-stone-400">{b.metrics}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-2 flex items-center justify-between text-[10px] text-stone-500 font-mono">
        <span>Deterministic offline evaluation</span>
        <span className="text-emerald-500 font-bold">&bull; Benchmark Verified</span>
      </div>
    </div>
  );
}
