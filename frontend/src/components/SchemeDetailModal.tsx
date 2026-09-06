"use client";

import React from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  Building2,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

export default function SchemeDetailModal() {
  const {
    selectedScheme,
    setSelectedScheme,
    setVerificationModalOpen,
    language,
    currentFarmer,
  } = useFarmerStore();

  const t = translations[language];

  if (!selectedScheme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-emerald-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={() => setSelectedScheme(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400 text-emerald-950">
              {selectedScheme.matchScore}% {t.matchScore}
            </span>
            <span className="text-xs text-emerald-200 uppercase font-bold">
              {selectedScheme.code}
            </span>
          </div>
          <h2 className="text-2xl font-black">{selectedScheme.name}</h2>
          <p className="text-xs text-emerald-200 mt-1">
            {selectedScheme.department}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Subsidy Highlight */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {t.subsidyAmount}
              </p>
              <p className="text-lg font-black text-amber-950">
                {selectedScheme.subsidyAmount}
              </p>
            </div>
          </div>

          {/* Detailed Benefits */}
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">
              Key Scheme Benefits
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200">
              {selectedScheme.benefits}
            </p>
          </div>

          {/* Eligibility Breakdown */}
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">
              Eligibility Criteria
            </h4>
            <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <p className="text-sm text-emerald-950 font-medium">
                {selectedScheme.eligibilitySummary}
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-200/60">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300">
                  Land Size: {currentFarmer.landSizeAcres} Acres (Eligible)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300">
                  Soil Type: {currentFarmer.soilTypeName} (Eligible)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300">
                  Income: {currentFarmer.annualIncomeSlab} (Eligible)
                </span>
              </div>
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">
              {t.documentsRequired}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedScheme.documentsRequired.map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Offline CSC Center note */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium">
            <Building2 className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Nearest Assistance Center:</p>
              <p className="text-stone-600">
                MeeSeva / Common Service Center (CSC), {currentFarmer.village}, Mandal Office (Open Mon-Sat, 9AM-5PM).
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            onClick={() => setSelectedScheme(null)}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              setSelectedScheme(null);
              setVerificationModalOpen(true);
            }}
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{t.verifyAndApply}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
