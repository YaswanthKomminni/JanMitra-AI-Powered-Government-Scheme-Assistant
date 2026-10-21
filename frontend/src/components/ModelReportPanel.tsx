"use client";
import type { ModelReport } from "@/lib/modelReport";
export default function ModelReportPanel({ report }: { report?: ModelReport }) {
  if (!report || (!report.runs?.length && !report.explanation)) return null;
  return <details className="mt-3 rounded-xl border border-jm-border p-3 text-xs text-jm-text2">
    <summary className="cursor-pointer font-semibold">Models, measured performance & explanation</summary>
    {!report.runs?.length && <p className="mt-2">No model inference was recorded for this operation.</p>}
    <div className="mt-3 space-y-2">{report.runs.map((run, i) => <div key={i} className="rounded-lg bg-jm-muted p-2">
      <strong>{run.model}</strong><p>{run.task} · {run.status} · {run.latencyMs} ms</p>
      {run.inputTokens != null && <p>Input tokens: {run.inputTokens}; output tokens: {run.outputTokens ?? "not supplied"}</p>}
      {run.score != null && <p>Model score: {run.score.toFixed(3)} — not an accuracy measure</p>}
      {run.detail && <p>{run.detail}</p>}
    </div>)}</div>
    {report.explanation && <div className="mt-3"><strong>{report.explanation.method}</strong><ul className="list-disc pl-4">{report.explanation.evidence.map((text, i) => <li key={i}>{text}</li>)}</ul></div>}
    <p className="mt-2">Accuracy / precision / recall / F1 require labeled evaluation data. They are not inferred from a confidence score. <a className="underline" href="/models">View model evaluation and XAI report</a></p>
  </details>;
}
