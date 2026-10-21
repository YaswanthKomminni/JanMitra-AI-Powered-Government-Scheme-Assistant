"use client";

import React, { useMemo, useState } from "react";
import { ScanLine, FileText } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { useSchemes } from "@/hooks/useSchemes";
import { PageContainer, PageTitle, LoadingState, ErrorState, EmptyState, primaryBtn } from "@/components/PageKit";

export default function DocumentsPage() {
  const setVerificationModalOpen = useFarmerStore((s) => s.setVerificationModalOpen);
  const { schemes, loading, error, reload } = useSchemes();
  const [visible, setVisible] = useState(30);
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const selectScheme = useFarmerStore(s => s.setSelectedScheme);

  // Documents most often required across the available schemes (from scheme data).
  const docs = useMemo(() => {
    const count = new Map<string, number>();
    schemes.forEach((s) => (s.documentsRequired || []).forEach((d) => count.set(d, (count.get(d) || 0) + 1)));
    return Array.from(count, ([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [schemes]);

  return (
    <PageContainer>
      <PageTitle
        title="Documents"
        description="Upload a PDF, Word document or crop photo to get an explanation, hear the key points and ask follow-up questions about its contents."
        actions={<button className={primaryBtn} onClick={() => setVerificationModalOpen(true)}><ScanLine className="h-4 w-4" /> Open document scanner</button>}
      />
      <input type="search" aria-label="Search document checklist" value={query} onChange={e => { setQuery(e.target.value); setVisible(30); }} placeholder="Search the document checklist" className="mb-4 w-full rounded-xl border border-jm-border p-3 text-sm" />
      <h2 className="mb-3 text-lg font-semibold text-jm-text">Commonly required documents</h2>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No document information yet" description="Required documents will be listed here once scheme data is available." />
      ) : (
        <ul className="divide-y divide-jm-border rounded-2xl border border-jm-border bg-jm-surface">
          {docs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, visible).map((d) => (
            <li key={d.name} className="px-4 py-3">
              <button onClick={() => setSelectedDoc(selectedDoc === d.name ? null : d.name)} aria-expanded={selectedDoc === d.name} className="flex w-full items-center justify-between gap-3 text-left">
              <span className="flex min-w-0 items-center gap-3 text-sm text-jm-text"><FileText className="h-4 w-4 shrink-0 text-jm-primary" /><span className="truncate">{d.name}</span></span>
              <span className="shrink-0 text-xs text-jm-text2">Needed by {d.n} scheme{d.n === 1 ? "" : "s"}</span>
              </button>
              {selectedDoc === d.name && <div className="mt-3 space-y-2 border-t border-jm-border pt-3"><p className="text-xs text-jm-text2">These saved scheme checklists mention this document. This does not establish your eligibility.</p>{schemes.filter(s => s.documentsRequired?.includes(d.name)).map(s => <button key={s.id} onClick={() => selectScheme(s)} className="block w-full rounded-lg bg-jm-muted p-3 text-left text-sm hover:underline"><strong>{s.name}</strong><span className="block text-xs text-jm-text2">{s.department}</span></button>)}</div>}
            </li>
          ))}
        </ul>
      )}
      {docs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).length > visible && <button className={primaryBtn + " mt-4"} onClick={() => setVisible(n => n + 30)}>Show more documents</button>}
      <p className="mt-4 text-xs text-jm-text2">This list is guidance based on scheme data. Always confirm requirements with the official scheme office or portal.</p>
    </PageContainer>
  );
}
