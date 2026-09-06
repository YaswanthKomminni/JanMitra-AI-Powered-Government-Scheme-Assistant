"use client";

import React from "react";
import {
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Scheme } from "@/lib/mockData";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

interface SchemeCardProps {
  scheme: Scheme;
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const {
    language,
    setSelectedScheme,
    setVerificationModalOpen,
  } = useFarmerStore();

  const t = translations[language];

  const getMatchScoreColor = (score: number) => {
    if (score >= 95) return "bg-emerald-600 text-white ring-4 ring-emerald-200";
    if (score >= 90) return "bg-emerald-500 text-white ring-4 ring-emerald-100";
    return "bg-amber-500 text-white ring-4 ring-amber-100";
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-400 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges: Match Score & Category */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1 shadow-sm ${getMatchScoreColor(
                scheme.matchScore
              )}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{scheme.matchScore}% {t.matchScore}</span>
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
              {scheme.categoryName}
            </span>
          </div>

          <span className="text-xs font-bold text-stone-500 tracking-wider">
            {scheme.code}
          </span>
        </div>

        {/* Scheme Name */}
        <h3 className="text-xl font-extrabold text-stone-900 group-hover:text-emerald-900 transition-colors leading-snug">
          {scheme.name}
        </h3>
        <p className="text-xs text-stone-500 font-medium mt-1">
          {scheme.department}
        </p>

        {/* Subsidy Highlight Box (High Contrast Warm Amber) */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
              {t.subsidyAmount}
            </p>
            <p className="text-base font-black text-amber-950">
              {scheme.subsidyAmount}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-700 font-normal mt-4 line-clamp-2 leading-relaxed">
          {scheme.description}
        </p>

        {/* Required Documents Pills */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-xs font-bold text-stone-600 mb-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            {t.documentsRequired}:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {scheme.documentsRequired.slice(0, 3).map((doc, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                {doc}
              </span>
            ))}
            {scheme.documentsRequired.length > 3 && (
              <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-600">
                +{scheme.documentsRequired.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-3">
        <button
          onClick={() => setVerificationModalOpen(true)}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>{t.verifyAndApply}</span>
        </button>

        <button
          onClick={() => setSelectedScheme(scheme)}
          className="p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition active:scale-95"
          title={t.viewDetails}
        >
          <ChevronRight className="w-5 h-5 text-stone-700" />
        </button>
      </div>
    </div>
  );
}
