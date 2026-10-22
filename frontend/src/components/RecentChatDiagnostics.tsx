"use client";
import { useFarmerStore } from "@/store/useFarmerStore";
import ModelReportPanel from "@/components/ModelReportPanel";
/** Technical reports stay on the diagnostics page, not inside farmer-facing replies. */
export default function RecentChatDiagnostics() {
  const messages = useFarmerStore(s => s.chatMessages);
  const recent = messages.filter(m => m.sender === "ai" && (m.modelReport || m.docDetection?.modelReport)).slice(-5).reverse();
  if (!recent.length) return null;
  return <section className="my-6 rounded-xl border border-jm-border p-4">
    <h2 className="text-lg font-semibold">Recent chatbot diagnostics</h2>
    <p className="mt-1 text-sm text-jm-text2">Actual model attempts from your loaded conversation. Failures, quota responses and timing are shown here.</p>
    {recent.map(m => <ModelReportPanel key={m.id} report={{ runs: [...(m.docDetection?.modelReport?.runs || []), ...(m.modelReport?.runs || [])], explanation: m.modelReport?.explanation }} />)}
  </section>;
}
