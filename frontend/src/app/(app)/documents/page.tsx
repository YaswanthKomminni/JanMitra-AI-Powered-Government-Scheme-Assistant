"use client";

import React, { useMemo } from "react";
import { ScanLine, FileText } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { useSchemes } from "@/hooks/useSchemes";
import { PageContainer, PageTitle, LoadingState, ErrorState, EmptyState, primaryBtn } from "@/components/PageKit";

export default function DocumentsPage() {
  const setVerificationModalOpen = useFarmerStore((s) => s.setVerificationModalOpen);
  const { schemes, loading, error, reload } = useSchemes();

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
        description="See which documents schemes commonly ask for, and check a document with the scanner."
        actions={<button className={primaryBtn} onClick={() => setVerificationModalOpen(true)}><ScanLine className="h-4 w-4" /> Open document scanner</button>}
      />
      <h2 className="mb-3 text-lg font-semibold text-jm-text">Commonly required documents</h2>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No document information yet" description="Required documents will be listed here once scheme data is available." />
      ) : (
        <ul className="divide-y divide-jm-border rounded-2xl border border-jm-border bg-jm-surface">
          {docs.map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex min-w-0 items-center gap-3 text-sm text-jm-text"><FileText className="h-4 w-4 shrink-0 text-jm-primary" /><span className="truncate">{d.name}</span></span>
              <span className="shrink-0 text-xs text-jm-text2">Needed by {d.n} scheme{d.n === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-jm-text2">This list is guidance based on scheme data. Always confirm requirements with the official scheme office or portal.</p>
    </PageContainer>
  );
}
