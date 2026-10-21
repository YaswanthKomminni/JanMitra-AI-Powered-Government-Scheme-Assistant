"use client";
import { useState } from "react";

export default function AiConnectionCheck() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function check() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/ai/check", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customApiKey: localStorage.getItem("janmitra_custom_vision_key") || undefined }), signal: AbortSignal.timeout(25000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sign in and try again.");
      if (!data.configured) setMessage("No AI provider key is available to this deployment. Configure GEMINI_API_KEY on Render or save a supported key here, then check again.");
      else setMessage(data.checks.map((item: { provider: string; connected: boolean; model?: string; failures: string[] }) =>
        item.connected ? `${item.provider}: image connection working (${item.model}).`
          : `${item.provider}: ${item.failures.includes("auth") ? "key or permissions rejected" : item.failures.includes("quota") ? "usage limit reached" : item.failures.includes("timeout") ? "connection timed out" : "no usable model response"}.`).join("\n")
          + `\nDocument questions: ${data.documentChat?.connected ? `working (${data.documentChat.provider}, ${data.documentChat.model})` : "no verified AI answer; the app is using limited local extraction"}.`
          + `\nOfficial-source research: ${data.officialResearchAvailable ? "working" : "not verified; check Gemini search access, quota or try again"}.`);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="mt-2 text-xs">
    <button type="button" onClick={check} disabled={busy} className="font-bold underline disabled:opacity-50">{busy ? "Checking AI connection…" : "Check AI connection"}</button>
    {message && <p role="status" className="mt-2 whitespace-pre-line">{message}</p>}
  </div>;
}
