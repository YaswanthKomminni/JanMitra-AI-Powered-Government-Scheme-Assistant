"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  X,
  FileCheck2,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations, getLocalizedScheme } from "@/lib/i18n";

export default function SchemeDetailModal() {
  const {
    selectedScheme,
    setSelectedScheme,
    language,
    currentFarmer,
  } = useFarmerStore();

  const router = useRouter();
  const sendMessage = useFarmerStore(s => s.sendChatMessage);
  const t = translations[language] || translations.en;

  if (!selectedScheme) return null;
  const loc = getLocalizedScheme(selectedScheme, language);

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
            <span className="text-xs text-emerald-200 uppercase font-bold">
              {selectedScheme.code}
            </span>
          </div>
          <h2 className="text-2xl font-black">{loc.name}</h2>
          <p className="text-xs text-emerald-200 mt-1">
            {loc.department}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            {language === "te" ? "ఇది సేవ్ చేయబడిన పథకం సారాంశం. దరఖాస్తు చేసే ముందు అధికారిక పోర్టల్‌లో ప్రస్తుత నిబంధనలు, ప్రయోజనాలు మరియు పత్రాలను తనిఖీ చేయండి." :
             language === "hi" ? "यह एक सहेजा गया योजना सारांश है। आवेदन करने से पहले आधिकारिक स्रोत से वर्तमान नियम और शर्तें सत्यापित करें।" :
             "This is a saved scheme summary. Check current rules, benefits, documents and application dates with the official scheme source before applying."}
          </p>
          {/* Subsidy Highlight */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white font-bold">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {t.subsidyAmount}
              </p>
              <p className="text-lg font-black text-amber-950">
                {loc.subsidyAmount || t.checkCurrentTerms || "Check current scheme terms"}
              </p>
            </div>
          </div>

          {/* Detailed Benefits */}
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">
              {t.keySchemeBenefits || "Key Scheme Benefits"}
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200">
              {loc.benefits || loc.description}
            </p>
          </div>

          {/* Eligibility Breakdown */}
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">
              {t.eligibilityToCheck || "Eligibility to check"}
            </h4>
            <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <p className="text-sm text-emerald-950 font-medium">
                {loc.eligibilitySummary}
              </p>
              {currentFarmer.landSizeAcres > 0 || currentFarmer.soilTypeName || currentFarmer.annualIncomeSlab ? (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-200/60">
                {currentFarmer.landSizeAcres > 0 && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300">
                  {t.yourLand || "Your land"}: {currentFarmer.landSizeAcres} {t.acres || "acres"}
                </span>
                )}
                {currentFarmer.soilTypeName && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300">
                  {t.yourSoil || "Your soil"}: {currentFarmer.soilTypeName}
                </span>
                )}
                {currentFarmer.annualIncomeSlab && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300">
                  Your saved income range: {currentFarmer.annualIncomeSlab}
                </span>
                )}
              </div>
              ) : (
                <p className="pt-2 border-t border-emerald-200/60 text-xs font-semibold text-emerald-900/80">
                  Add your details to discuss which published conditions still need checking.
                </p>
              )}
            </div>
          </div>

          {/* Required Documents Checklist */}
          <div>
            <h4 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">
              {t.documentsRequired}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(loc.documentsRequired || []).map((doc: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
            {(!loc.documentsRequired || loc.documentsRequired.length === 0) && (
              <p className="text-sm text-stone-600">
                {language === "te" ? "ప్రస్తుత అధికారిక పత్రాల జాబితాను పరిశీలించండి." :
                 language === "hi" ? "वर्तमान आधिकारिक चेकलिस्ट की जांच करें।" :
                 "The saved entry does not list a verified document checklist. Check the current official scheme page."}
              </p>
            )}
          </div>

          {/* The implementing authority can confirm current local process. */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium">
            <Building2 className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Where to check:</p>
              <p className="text-stone-600">
                Check the implementing department or official scheme directory for the application channel, local office, and current deadline{currentFarmer.district ? ` in ${currentFarmer.district}` : ""}.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4 flex flex-wrap gap-3">
          <button className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white" onClick={() => {
            const name = selectedScheme.name; setSelectedScheme(null); router.push("/assistant");
            void sendMessage(`Guide me through ${name}. Explain the current eligibility, required documents, application steps and any verified deadline for my profile.`);
          }}>Guide me through this scheme</button>
        </div>
        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            onClick={() => setSelectedScheme(null)}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition"
          >
            Close
          </button>
          <a href={selectedScheme.sourceUrl || "https://www.myscheme.gov.in/search"} target="_blank" rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center gap-2 transition">
            <ExternalLink className="w-4 h-4" />
            <span>{selectedScheme.sourceUrl ? "Open official source" : "Search official scheme directory"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
