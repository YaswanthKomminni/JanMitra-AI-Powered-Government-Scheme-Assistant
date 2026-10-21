"use client";
import { useEffect, useState } from "react";
import ModelReportPanel from "@/components/ModelReportPanel";
import type { ModelReport } from "@/lib/modelReport";
export default function VoiceModelReport() {
  const [report, setReport] = useState<ModelReport>();
  useEffect(() => {
    const listener = (event: Event) => {
      const next = (event as CustomEvent<ModelReport>).detail;
      if (Array.isArray(next?.runs)) setReport(prev => ({ runs: [...(prev?.runs || []), ...next.runs].slice(-20), explanation: next.explanation }));
    };
    window.addEventListener("janmitra:model-report", listener);
    return () => window.removeEventListener("janmitra:model-report", listener);
  }, []);
  return report ? <aside className="mx-4 mb-4 text-xs"><p>Recent voice model executions</p><ModelReportPanel report={report} /></aside> : null;
}
