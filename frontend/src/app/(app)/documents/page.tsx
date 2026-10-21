"use client";

import React, { useMemo, useState } from "react";
import { ScanLine, FileText, Search, X } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { useSchemes } from "@/hooks/useSchemes";
import { translations } from "@/lib/i18n";
import { PageContainer, PageTitle, LoadingState, ErrorState, EmptyState, primaryBtn } from "@/components/PageKit";

function canonicalizeDocName(raw: string): { key: string; displayName: string } {
  let cleaned = raw.trim().replace(/[.,;:_\-]+$/, "").trim();
  cleaned = cleaned.replace(/\s+/g, " ");
  const lower = cleaned.toLowerCase();

  if (lower.startsWith("aadhaar") || lower.includes("aadhaar") || lower.includes("aadhar")) {
    return { key: "aadhaar_card", displayName: "Aadhaar Card" };
  }
  if (lower.includes("bank account details") || lower.includes("bank account")) {
    return { key: "bank_account_details", displayName: "Bank Account Details" };
  }
  if (lower.includes("bank passbook") || lower.includes("bank pass book")) {
    return { key: "bank_passbook", displayName: "Bank Passbook" };
  }
  if (lower.includes("income certificate")) {
    return { key: "income_certificate", displayName: "Income Certificate" };
  }
  if (lower.includes("caste certificate") || lower.includes("community certificate")) {
    return { key: "caste_certificate", displayName: "Caste Certificate" };
  }
  if (
    lower.includes("passport size photo") ||
    lower.includes("passport size photograph") ||
    lower.includes("passport size photographs") ||
    lower.includes("passport photo") ||
    lower.includes("passport size")
  ) {
    return { key: "passport_photo", displayName: "Passport Size Photograph" };
  }
  if (lower.includes("ration card")) {
    return { key: "ration_card", displayName: "Ration Card" };
  }
  if (
    lower.includes("land record") ||
    lower.includes("land ownership") ||
    lower.includes("land document") ||
    lower.includes("pahani") ||
    lower.includes("patta") ||
    lower.includes("ror") ||
    lower.includes("khasra")
  ) {
    return { key: "land_records", displayName: "Land Records / Patta / RoR" };
  }
  if (lower.includes("residence certificate") || lower.includes("domicile certificate") || lower.includes("residential certificate")) {
    return { key: "domicile_certificate", displayName: "Domicile / Residence Certificate" };
  }
  if (lower.includes("voter id") || lower.includes("epic card")) {
    return { key: "voter_id", displayName: "Voter ID Card" };
  }
  if (lower.includes("pan card") || lower === "pan") {
    return { key: "pan_card", displayName: "PAN Card" };
  }
  if (lower.includes("soil health card")) {
    return { key: "soil_health_card", displayName: "Soil Health Card" };
  }
  if (lower.includes("kisan credit card") || lower.includes("kcc")) {
    return { key: "kcc_card", displayName: "Kisan Credit Card (KCC)" };
  }
  if (lower.includes("disability certificate")) {
    return { key: "disability_certificate", displayName: "Disability Certificate" };
  }
  if (lower.includes("birth certificate")) {
    return { key: "birth_certificate", displayName: "Birth Certificate" };
  }
  if (lower.includes("electricity bill")) {
    return { key: "electricity_bill", displayName: "Electricity Bill" };
  }
  if (lower.includes("self declaration")) {
    return { key: "self_declaration", displayName: "Self Declaration / Affidavit" };
  }
  if (lower.includes("quotation") || lower.includes("invoice")) {
    return { key: "equipment_quotation", displayName: "Equipment Quotation / Invoice" };
  }

  // Fallback: Title case formatting
  const words = cleaned.split(" ");
  const titleCased = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return { key: lower, displayName: titleCased };
}

export default function DocumentsPage() {
  const setVerificationModalOpen = useFarmerStore((s) => s.setVerificationModalOpen);
  const language = useFarmerStore((s) => s.language);
  const selectScheme = useFarmerStore((s) => s.setSelectedScheme);
  const { schemes, loading, error, reload } = useSchemes();

  const [visible, setVisible] = useState(30);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const t = translations[language] || translations.en;

  // Documents deduplicated, punctuation-stripped, and summed across schemes
  const docs = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        displayName: string;
        n: number;
        schemes: typeof schemes;
      }
    >();

    schemes.forEach((s) => {
      const seenKeysInThisScheme = new Set<string>();
      (s.documentsRequired || []).forEach((raw) => {
        if (!raw || !raw.trim()) return;
        const { key, displayName } = canonicalizeDocName(raw);
        if (!seenKeysInThisScheme.has(key)) {
          seenKeysInThisScheme.add(key);
          const existing = map.get(key);
          if (existing) {
            existing.n += 1;
            existing.schemes.push(s);
          } else {
            map.set(key, { key, displayName, n: 1, schemes: [s] });
          }
        }
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => b.n - a.n || a.displayName.localeCompare(b.displayName)
    );
  }, [schemes]);

  const filteredDocs = useMemo(() => {
    if (!query.trim()) return docs;
    const q = query.toLowerCase().trim();
    return docs.filter((d) => d.displayName.toLowerCase().includes(q));
  }, [docs, query]);

  return (
    <PageContainer>
      <PageTitle
        title={t.documentsTitle || "Documents"}
        description={
          t.documentsSubtitle ||
          "Upload a PDF, Word document or crop photo to get an explanation, hear the key points and ask follow-up questions about its contents."
        }
        actions={
          <button className={primaryBtn} onClick={() => setVerificationModalOpen(true)}>
            <ScanLine className="h-4 w-4" /> {t.openScanner || "Open document scanner"}
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-jm-text">
          {t.commonlyRequiredDocs || "Commonly required documents"}
        </h2>

        {/* Search checklist input */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-text2" />
          <input
            type="search"
            aria-label="Search document checklist"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(30);
            }}
            placeholder={t.searchDocsPlaceholder || "Search the document checklist..."}
            className="h-10 w-full rounded-xl border border-jm-border bg-jm-surface pl-9 pr-8 text-sm text-jm-text placeholder:text-jm-text2 focus:border-jm-primary focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-jm-text2 hover:text-jm-text"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={query ? "No matching documents found" : "No document information yet"}
          description={
            query
              ? `No document matched "${query}". Try a different search term.`
              : "Required documents will be listed here once scheme data is available."
          }
        />
      ) : (
        <ul className="divide-y divide-jm-border rounded-2xl border border-jm-border bg-jm-surface">
          {filteredDocs.slice(0, visible).map((d) => {
            const isExpanded = selectedKey === d.key;
            return (
              <li key={d.key} className="px-4 py-3 hover:bg-jm-muted/30 transition-colors">
                <button
                  onClick={() => setSelectedKey(isExpanded ? null : d.key)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-3 text-sm text-jm-text">
                    <FileText className="h-4 w-4 shrink-0 text-jm-primary" />
                    <span className="truncate font-medium">{d.displayName}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-jm-text2 bg-jm-muted/80 px-2.5 py-1 rounded-full border border-jm-border">
                    {typeof t.neededByCount === "function" ? t.neededByCount(d.n) : `Needed by ${d.n} schemes`}
                  </span>
                </button>

                {/* Scheme Checklist Accordion Expansion */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-jm-border pt-3">
                    <p className="text-xs text-jm-text2">
                      These saved scheme checklists mention this document. This does not establish your eligibility.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {d.schemes.slice(0, 10).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => selectScheme(s)}
                          className="block w-full rounded-xl bg-jm-muted p-3 text-left text-sm hover:underline transition-all"
                        >
                          <strong className="block truncate text-jm-text">{s.name}</strong>
                          <span className="block text-xs text-jm-text2 truncate">{s.department}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {filteredDocs.length > visible && (
        <button
          className={primaryBtn + " mt-4"}
          onClick={() => setVisible((n) => n + 30)}
        >
          Show more documents
        </button>
      )}

      <p className="mt-4 text-xs text-jm-text2">
        {t.guidanceNote || "This list is guidance based on scheme data. Always confirm requirements with the official scheme office or portal."}
      </p>
    </PageContainer>
  );
}
