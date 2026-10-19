"use client";

import React from "react";
import { Gift, FileText, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { Scheme } from "@/lib/mockData";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

interface SchemeCardProps {
  scheme: Scheme;
}

const chip =
  "inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium whitespace-nowrap";

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const { language, setSelectedScheme, setVerificationModalOpen } = useFarmerStore();
  const t = translations[language];

  return (
    <article className="group flex h-full flex-col rounded-[18px] border border-jm-border bg-jm-surface p-5 sm:p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:border-jm-primary/40 hover:shadow-[0_4px_14px_rgb(0_0_0/0.06)]">
      {/* Header: match score, category, code */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={`${chip} gap-1 bg-jm-soft border border-jm-primary/25 text-jm-text`}>
            <Sparkles className="w-3 h-3 text-jm-primary" />
            {scheme.matchScore}% {t.matchScore}
          </span>
          <span className={`${chip} bg-jm-muted border border-jm-border text-jm-text2 max-w-full truncate`}>
            {scheme.categoryName}
          </span>
        </div>
        {scheme.code && (
          <span className="text-xs font-medium text-jm-text2 whitespace-nowrap">{scheme.code}</span>
        )}
      </div>

      {/* Title + department */}
      <h3 className="mt-3 text-xl sm:text-[22px] lg:text-[23px] font-semibold leading-[1.3] text-jm-text break-words">
        {scheme.name}
      </h3>
      <p className="mt-1 text-sm text-jm-text2">{scheme.department}</p>

      {/* Benefit panel */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-jm-primary/20 bg-jm-soft px-3.5 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-jm-surface border border-jm-primary/20">
          <Gift className="h-4 w-4 text-jm-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-jm-text2">{t.subsidyAmount}</p>
          <p className="text-[15px] font-semibold leading-snug text-jm-text break-words">{scheme.subsidyAmount}</p>
        </div>
      </div>

      {/* Description grows so documents and actions line up across cards */}
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-jm-text2 line-clamp-3">
        {scheme.description}
      </p>

      {/* Required documents */}
      <div className="mt-4 border-t border-jm-border pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-jm-text">
          <FileText className="h-3.5 w-3.5 text-jm-text2" />
          {t.documentsRequired}
        </p>
        <div className="flex flex-wrap gap-2">
          {scheme.documentsRequired.slice(0, 3).map((doc, idx) => (
            <span
              key={idx}
              className="inline-flex max-w-full items-center rounded-md border border-jm-border bg-jm-muted px-2.5 py-1 text-xs leading-snug text-jm-text"
            >
              <span className="truncate">{doc}</span>
            </span>
          ))}
          {scheme.documentsRequired.length > 3 && (
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs text-jm-text2">
              +{scheme.documentsRequired.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => setVerificationModalOpen(true)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-jm-primary px-4 text-sm font-semibold text-jm-onprimary transition hover:bg-jm-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="truncate">{t.verifyAndApply}</span>
        </button>

        <button
          onClick={() => setSelectedScheme(scheme)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-jm-border bg-jm-surface text-jm-text transition hover:bg-jm-muted disabled:cursor-not-allowed disabled:opacity-50"
          title={t.viewDetails}
          aria-label={t.viewDetails}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
