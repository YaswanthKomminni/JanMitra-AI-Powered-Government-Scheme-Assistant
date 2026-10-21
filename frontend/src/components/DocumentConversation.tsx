"use client";
import { useEffect, useState } from "react";
import { useFarmerStore } from "@/store/useFarmerStore";
import type { SupportedLanguage } from "@/lib/i18n";
import { documentChatContext } from "@/lib/documentChatContext";
import ImageExplanation from "@/components/ImageExplanation";
import ModelReportPanel from "@/components/ModelReportPanel";
import ChatText from "@/components/ChatText";
import { useRouter } from "next/navigation";

export default function DocumentConversation({ detection, language }: { detection: any; language: SupportedLanguage }) {
  const [summary, setSummary] = useState(detection.assistantAnalysis || detection.detectionSummary || "");
  const [aiState, setAiState] = useState(detection.aiStatus);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [report, setReport] = useState(detection.modelReport);
  useEffect(() => {
    const controller = new AbortController();
    setSummaryBusy(true);
    fetch("/api/ocr/answer", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ question: "Summarize this upload and explain its key details and useful next steps.", document: documentChatContext(detection), language,
        customApiKey: localStorage.getItem("janmitra_custom_vision_key") || undefined }) })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.message || "Summary unavailable"); if (!controller.signal.aborted) { setSummary(data.text); setAiState(data.aiStatus); setReport({ ...data.modelReport, runs: [...(detection.modelReport?.runs || []), ...(data.modelReport?.runs || [])] }); } })
      .catch(() => { if (!controller.signal.aborted) setError("The upload reading was retained, but its AI explanation could not finish. Ask a question below to retry."); })
      .finally(() => { if (!controller.signal.aborted) setSummaryBusy(false); });
    return () => controller.abort();
  }, [detection, language]);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const close = useFarmerStore(s => s.setVerificationModalOpen);
  const send = useFarmerStore(s => s.sendChatMessage);
  const router = useRouter();
  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim() || busy) return;
    setBusy(true); setError("");
    const current = question.trim();
    try {
      const res = await fetch("/api/ocr/answer", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current, document: documentChatContext(detection), history: [{ role: "user", content: "Analyze this uploaded document" }, { role: "assistant", content: detection.assistantAnalysis || detection.detectionSummary || "" }, ...turns], language,
          customApiKey: localStorage.getItem("janmitra_custom_vision_key") || undefined }), signal: AbortSignal.timeout(40000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Please sign in and try again.");
      setReport(data.modelReport);
      setTurns(t => [...t, { role: "user", content: current }, { role: "assistant", content: data.text }]); setQuestion("");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
    <h3 className="font-bold text-stone-900">Understand your upload</h3>
    {summaryBusy && <p role="status" className="text-xs">Preparing a source-based explanation…</p>}
    <div className="text-sm leading-relaxed text-stone-800"><ChatText text={summary || ""} /></div>
    {aiState?.state === "fallback" && <p className="text-xs text-amber-900">{aiState.reason || "AI connection unavailable. This is local source extraction."}</p>}
    {detection.previewUrl?.startsWith("data:") && <button type="button" className="ml-4 text-sm font-semibold text-emerald-800 underline" onClick={() => {
      const context = turns.slice(-4).map(t => `${t.role}: ${t.content.slice(0, 500)}`).join("\n");
      close(false); router.push("/assistant");
      void send(`Continue guiding me about this upload. Use its contents for my follow-up questions.${context ? `\nRecent questions from the document panel:\n${context}` : ""}`,
        detection.previewUrl, detection.fileName || "uploaded_document", detection.previewUrl.match(/^data:([^;]+)/)?.[1]);
    }}>Continue with this upload in chat</button>}
    {turns.map((turn, i) => <div key={i} className={`jm-message rounded-xl p-3 text-sm leading-relaxed ${turn.role === "user" ? "bg-emerald-100 text-emerald-950" : "bg-white text-stone-800"}`}><ChatText text={turn.content} /></div>)}
    <form onSubmit={ask} className="flex gap-2"><input aria-label="Question about this upload" value={question} onChange={e => setQuestion(e.target.value)} maxLength={4000} placeholder="Ask about this document or photo…" className="min-w-0 flex-1 rounded-xl border border-stone-300 p-3 text-sm" /><button disabled={busy || !question.trim()} className="rounded-xl bg-emerald-700 px-4 text-white disabled:opacity-50">{busy ? "Reading…" : "Ask"}</button></form>
    <ModelReportPanel report={report} />
    <ImageExplanation image={detection.previewUrl} />
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </section>;
}
