"use client";
import { useState } from "react";
import ModelReportPanel from "@/components/ModelReportPanel";
export default function ImageExplanation({ image }: { image?: string }) {
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!image?.startsWith("data:image/")) return null;
  return <section className="rounded-xl border border-jm-border p-3 text-xs">
    <button disabled={busy} className="font-semibold underline" onClick={async () => {
      setBusy(true); setError("");
      try {
        const response = await fetch("/api/ai/explain-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }), signal: AbortSignal.timeout(40000) });
        const data = await response.json(); if (!response.ok) throw new Error(data.message); setResult(data);
      } catch { setError("Image explanation is unavailable right now. Please retry."); }
      finally { setBusy(false); }
    }}>{busy ? "Testing masked image regions…" : "Explain this image decision (XAI)"}</button>
    {result && <div className="mt-3 space-y-2"><strong>{result.method}</strong><p>Scene: {result.label}; baseline score: {result.baselineScore.toFixed(3)}</p>
      <div className="relative h-48 bg-stone-200" style={{ backgroundImage: `url(${image})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}>
        {result.regions.map((r: any, i: number) => <div key={i} className="absolute grid place-items-center border border-white text-xs font-bold" style={{ left: `${r.col * 50}%`, top: `${r.row * 50}%`, width: "50%", height: "50%", backgroundColor: `rgba(220,38,38,${Math.min(.75, Math.max(0, r.scoreDrop) * 4)})` }}>Score change: {r.scoreDrop.toFixed(3)}</div>)}
      </div><p>{result.limitation}</p><ModelReportPanel report={result.modelReport} /></div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
