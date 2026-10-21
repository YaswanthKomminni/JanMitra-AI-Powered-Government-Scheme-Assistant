"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFarmerStore } from "@/store/useFarmerStore";
import { SOIL_TYPES, IRRIGATION_TYPES, LANGUAGE_CODES } from "@/lib/userProfile";
import ModelReportPanel from "@/components/ModelReportPanel";
import type { ModelReport } from "@/lib/modelReport";
export default function ProfileEditor() {
  const farmer = useFarmerStore(s => s.currentFarmer);
  const setFarmer = useFarmerStore(s => s.setCurrentFarmer);
  const [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [docs, setDocs] = useState<any[]>([]), [shareContact, setShareContact] = useState(false);
  const [savedShareContact, setSavedShareContact] = useState(false);
  const [form, setForm] = useState<any>({});
  const [uploadReport, setUploadReport] = useState("");
  const [modelReport, setModelReport] = useState<ModelReport>();
  async function loadDocuments() {
    const res = await fetch("/api/profile/documents"); const data = await res.json();
    if (!res.ok) throw new Error(data.message); setDocs(data.documents);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/profile").then(r => r.json()).then(d => { if (active && d.user) { setShareContact(d.shareContact); setSavedShareContact(d.shareContact); } }).catch(() => undefined);
    void loadDocuments().catch(() => { if (active) setUploadReport("Saved documents could not load. Reload to retry."); });
    return () => { active = false; };
  }, []);
  function edit() {
    setForm({ ...farmer, primaryCrops: farmer.primaryCrops.join(", "), landSizeAcres: farmer.landSizeAcres || "" });
    setShareContact(savedShareContact);
    setMessage(""); setEditing(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, shareContact }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message);
      setFarmer(data.user); setSavedShareContact(data.shareContact); setEditing(false); setMessage("Your profile is saved. New assistant answers will use these details.");
    } catch (err) { setMessage((err as Error).message); } finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return; if (file.size > 8 * 1024 * 1024) { setUploadReport("Please choose a file smaller than 8 MB."); return; }
    setBusy(true); setUploadReport("Reading and saving your document…");
    try {
      const data = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
      const res = await fetch("/api/profile/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, name: file.name }), signal: AbortSignal.timeout(60000) });
      const reply = await res.json(); if (!res.ok) throw new Error(reply.message);
      setUploadReport(reply.message); setModelReport(reply.modelReport); await loadDocuments();
    } catch (err) { setUploadReport((err as Error).message || "Upload failed. Please retry."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true);
    try { const res = await fetch(`/api/profile/documents/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Could not remove the document."); await loadDocuments(); setUploadReport("Removed from your profile. Earlier chat messages keep the information already shared in those chats."); }
    catch (e) { setUploadReport((e as Error).message); } finally { setBusy(false); }
  }
  const input = "w-full rounded-lg border border-jm-border bg-jm-surface p-2 text-sm";
  return <div className="mt-4 space-y-5">
    {!editing ? <button className="rounded-lg bg-jm-primary px-4 py-2 text-sm font-semibold text-jm-onprimary" onClick={edit}>Edit profile</button> : <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-jm-text2">Add your location and optional farm details for personalized guidance. These details do not establish scheme eligibility.</p>
      <div className="grid gap-3 sm:grid-cols-2">{[["name","Name"],["phone","Mobile number"],["email","Email (optional)"],["state","State"],["district","District"],["village","Village / town"],["primaryCrops","Crops (optional, comma separated)"],["landSizeAcres","Land size in acres (optional)"],["annualIncomeSlab","Annual income range (optional)"]].map(([key,label]) => <label key={key} className="space-y-1 text-sm"><span>{label}</span><input className={input} type={key === "email" ? "email" : key === "landSizeAcres" ? "number" : key === "phone" ? "tel" : "text"} min={key === "landSizeAcres" ? 0 : undefined} max={key === "landSizeAcres" ? 999 : undefined} step={key === "landSizeAcres" ? ".01" : undefined} required={key === "name" || key === "phone"} value={form[key] ?? ""} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
      {[["soilType","Soil type",SOIL_TYPES],["irrigationType","Irrigation",IRRIGATION_TYPES],["preferredLanguage","Preferred language",LANGUAGE_CODES]].map(([key,label,options]) => <label key={key as string} className="text-sm">{label as string}<select className={input} value={form[key as string] || ""} onChange={e => setForm({ ...form, [key as string]: e.target.value })}>{key !== "preferredLanguage" && <option value="">Not provided</option>}{(options as readonly string[]).map(o => <option key={o} value={o}>{({ en: "English", te: "తెలుగు", hi: "हिन्दी", ta: "தமிழ்", kn: "ಕನ್ನಡ", bn: "বাংলা" } as Record<string,string>)[o] || o.replace(/_/g," ")}</option>)}</select></label>)}
      </div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={shareContact} onChange={e => setShareContact(e.target.checked)} />Share my name, village, crops and mobile number with other signed-in farmers in my district so they can call me. I can turn this off at any time.</label>
      <button disabled={busy} className="rounded-lg bg-jm-primary px-4 py-2 text-jm-onprimary disabled:opacity-50">{busy ? "Saving…" : "Save profile"}</button><button type="button" className="ml-3 underline" onClick={() => setEditing(false)}>Cancel</button>
    </form>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <section className="space-y-3 border-t border-jm-border pt-4"><h3 className="font-semibold">My saved documents</h3>
      <p className="text-sm text-jm-text2">Save Aadhaar, land records, soil reports or scheme documents privately (up to 10, 8 MB each). Your signed-in assistant can read their extracted text and send relevant passages to the configured AI provider for guidance. Originals are accessible only through your account. Uploading does not verify a document.</p>
      <label className="block text-sm">Add a document<input disabled={busy} type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" className="mt-2 block w-full" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
      {uploadReport && <p role="status" className="text-sm">{uploadReport}</p>}
      <ModelReportPanel report={modelReport} />
      {!docs.length && <p className="text-sm text-jm-text2">No saved documents yet.</p>}
      {docs.map(d => <div key={d.id} className="rounded-xl border border-jm-border p-3 text-sm"><strong className="break-words">{d.file_name}</strong><p className="text-xs text-jm-text2">{Number(d.characters || 0).toLocaleString()} readable characters · {new Date(d.created_at).toLocaleDateString()}</p><div className="mt-2 flex flex-wrap gap-4"><Link className="underline" href={`/assistant?document=${d.id}`}>Ask about this document</Link><a className="underline" href={`/api/profile/documents/${d.id}`}>Download original</a><button disabled={busy} onClick={() => void remove(d.id)} className="text-red-700 underline">Remove</button></div></div>)}
    </section>
  </div>;
}
