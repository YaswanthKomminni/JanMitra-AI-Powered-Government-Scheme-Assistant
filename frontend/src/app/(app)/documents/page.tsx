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
            <li key={d.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3 text-sm text-jm-text"><FileText className="h-4 w-4 shrink-0 text-jm-primary" /><span className="truncate">{d.name}</span></span>
              <span className="shrink-0 text-xs text-jm-text2">Needed by {d.n} scheme{d.n === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
      )}
      {docs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).length > visible && <button className={primaryBtn + " mt-4"} onClick={() => setVisible(n => n + 30)}>Show more documents</button>}
      <p className="mt-4 text-xs text-jm-text2">This list is guidance based on scheme data. Always confirm requirements with the official scheme office or portal.</p>
    </PageContainer>
  );
}
