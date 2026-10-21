"use client";

import React from "react";
import { Gift, FileText, ChevronRight } from "lucide-react";
import { Scheme } from "@/lib/mockData";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations, getLocalizedCategory, getLocalizedScheme } from "@/lib/i18n";

interface SchemeCardProps {
  scheme: Scheme;
}

const chip =
  "inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium whitespace-nowrap";

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const { language, setSelectedScheme } = useFarmerStore();
  const t = translations[language] || translations.en;
  const loc = getLocalizedScheme(scheme, language);

  return (
    <article className="jm-card group flex h-full flex-col rounded-[18px] border border-jm-border bg-jm-surface p-5 sm:p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:border-jm-primary/40 hover:shadow-[0_4px_14px_rgb(0_0_0/0.06)]">
      {/* A catalog search result is not an eligibility decision. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={`${chip} bg-jm-muted border border-jm-border text-jm-text2 max-w-full truncate`}>
            {loc.categoryName || getLocalizedCategory(scheme.categoryName, language)}
          </span>
        </div>
        {scheme.code && (
          <span className="text-xs font-medium text-jm-text2 whitespace-nowrap">{scheme.code}</span>
        )}
      </div>

      {/* Title + department */}
      <h3 className="mt-3 text-xl sm:text-[22px] lg:text-[23px] font-semibold leading-[1.3] text-jm-text break-words">
        {loc.name}
      </h3>
      <p className="mt-1 text-sm text-jm-text2">{loc.department}</p>

      {/* Benefit panel */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-jm-primary/20 bg-jm-soft px-3.5 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-jm-surface border border-jm-primary/20">
          <Gift className="h-4 w-4 text-jm-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-jm-text2">{scheme.id.startsWith("catalog:") ? (t.savedBenefitSummary || "Saved benefit summary · verify current terms") : t.subsidyAmount}</p>
          <p className="text-[15px] font-semibold leading-snug text-jm-text break-words line-clamp-3">{loc.subsidyAmount || t.checkCurrentTerms || "Check current scheme terms"}</p>
        </div>
      </div>

      {/* Description grows so documents and actions line up across cards */}
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-jm-text2 line-clamp-3">
        {loc.description}
      </p>

      {/* Required documents */}
      <div className="mt-4 border-t border-jm-border pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-jm-text">
          <FileText className="h-3.5 w-3.5 text-jm-text2" />
          {t.documentsRequired}
        </p>
        <div className="flex flex-wrap gap-2">
          {(loc.documentsRequired || []).slice(0, 3).map((doc: string, idx: number) => (
            <span
              key={idx}
              className="inline-flex max-w-full items-center rounded-md border border-jm-border bg-jm-muted px-2.5 py-1 text-xs leading-snug text-jm-text"
            >
              <span className="truncate">{doc}</span>
            </span>
          ))}
          {(!loc.documentsRequired || loc.documentsRequired.length === 0) && (
            <span className="text-xs text-jm-text2">
              {language === "te" ? "ప్రస్తుత అధికారిక పత్రాల జాబితాను పరిశీలించండి." :
               language === "hi" ? "वर्तमान आधिकारिक चेकलिस्ट की जांच करें।" :
               language === "ta" ? "தற்போதைய அதிகாரப்பூர்வ சரிபார்ப்புப் பட்டியலைச் சரிபார்க்கவும்." :
               language === "kn" ? "ಪ್ರಸ್ತುತ ಅಧಿಕೃತ ಪರಿಶೀಲನಾ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ." :
               language === "bn" ? "বর্তমান অফিসিয়াল নথি তালিকা পরীক্ষা করুন।" :
               "Check the current official checklist."}
            </span>
          )}
          {loc.documentsRequired && loc.documentsRequired.length > 3 && (
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs text-jm-text2">
              +{loc.documentsRequired.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => setSelectedScheme(loc)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-jm-primary px-4 text-sm font-semibold text-jm-onprimary transition hover:bg-jm-hover"
          title={t.viewDetails}
          aria-label={t.viewDetails}
        >
          <span>{t.viewDetails}</span><ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
