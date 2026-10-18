"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import DashboardHeader from "@/components/DashboardHeader";
import SchemeCard from "@/components/SchemeCard";
import PeerNetwork from "@/components/PeerNetwork";
import ChatAssistant from "@/components/ChatAssistant";
import DocumentVerificationModal from "@/components/DocumentVerificationModal";
import SchemeDetailModal from "@/components/SchemeDetailModal";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { SCHEMES_DATABASE } from "@/lib/mockData";
import {
  Sparkles,
  Filter,
  Mic,
  ScanLine,
  Camera,
  PhoneCall,
  ExternalLink,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const {
    language,
    activeTab,
    setActiveTab,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    setVerificationModalOpen,
    authNotice,
  } = useFarmerStore();

  const t = translations[language];

  // Filter schemes
  const filteredSchemes = SCHEMES_DATABASE.filter((scheme) => {
    if (selectedCategoryFilter === "all") return true;
    return scheme.category === selectedCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 sm:pb-12">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {authNotice && (
          <div role="status" className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm font-bold text-amber-900 flex items-center justify-between gap-3">
            <span>{authNotice}</span>
            <button
              onClick={() => useFarmerStore.setState({ authNotice: null })}
              className="px-2 py-1 rounded-lg hover:bg-amber-100 text-amber-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Farmer Dashboard Header */}
        <DashboardHeader />

        {/* Tab View Switcher (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center justify-between border-b border-stone-200 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-2.5 rounded-2xl font-black text-sm transition ${
                activeTab === "dashboard"
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {t.tabs.dashboard}
            </button>
            <button
              onClick={() => setActiveTab("schemes")}
              className={`px-5 py-2.5 rounded-2xl font-black text-sm transition ${
                activeTab === "schemes"
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {t.tabs.schemes}
            </button>
            <button
              onClick={() => setActiveTab("peers")}
              className={`px-5 py-2.5 rounded-2xl font-black text-sm transition ${
                activeTab === "peers"
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {t.tabs.peers}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-5 py-2.5 rounded-2xl font-black text-sm transition flex items-center gap-2 ${
                activeTab === "chat"
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                  : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300"
              }`}
            >
              <Mic className="w-4 h-4 text-emerald-600" />
              <span>{t.tabs.chat}</span>
            </button>
          </div>

          <button
            onClick={() => setVerificationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-emerald-600 text-emerald-900 font-extrabold text-sm hover:bg-emerald-50 transition active:scale-95 shadow-sm"
          >
            <ScanLine className="w-4 h-4 text-emerald-700" />
            <span>{t.tabs.verify}</span>
          </button>
        </div>

        {/* Dynamic Content Views */}
        {activeTab === "chat" ? (
          <div className="max-w-6xl mx-auto my-4">
            <ChatAssistant variant="full" />
          </div>
        ) : activeTab === "peers" ? (
          <PeerNetwork />
        ) : (
          /* Dashboard or Schemes view */
          <div className="space-y-12">
            {/* Scheme Discovery Section */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                      <Sparkles className="w-5 h-5 text-emerald-700" />
                    </span>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                      Personalized AI Matching
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                    {t.recommendedSchemesTitle}
                  </h2>
                  <p className="text-sm text-stone-600 mt-0.5">
                    {t.recommendedSchemesSubtitle}
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
                  <button
                    onClick={() => setSelectedCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedCategoryFilter === "all"
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {t.filterAll}
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter("solar")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedCategoryFilter === "solar"
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {t.filterSolar}
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter("subsidy")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedCategoryFilter === "subsidy"
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {t.filterSubsidy}
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter("insurance")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedCategoryFilter === "insurance"
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {t.filterInsurance}
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter("soil")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedCategoryFilter === "soil"
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {t.filterSoil}
                  </button>
                </div>
              </div>

              {/* Grid of Recommended Schemes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchemes.map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))}
              </div>
            </section>

            {/* In Dashboard View: Show Nearby Peer Network */}
            <PeerNetwork />

            {/* Embedded Multi-modal Assistant preview in Dashboard */}
            <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-3xl border-2 border-emerald-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                <div className="max-w-xl space-y-3">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-700 text-white">
                    {(t as any).voiceAdvisoryBadge || "24/7 AI Voice Advisory"}
                  </span>
                  <h3 className="text-2xl font-black text-stone-900">
                    {t.chatAssistantTitle}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {(t as any).voiceAdvisoryDesc || "Have doubts about pesticide spraying, soil testing, or subsidy eligibility? Speak directly in your mother tongue using speech-to-text or upload leaf photos for disease diagnostics."}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center gap-2 active:scale-98 transition"
                    >
                      <Mic className="w-4 h-4 text-emerald-300" />
                      <span>{(t as any).startVoiceChatNow || "Start Voice Chat Now"}</span>
                    </button>
                    <button
                      onClick={() => setVerificationModalOpen(true)}
                      className="px-5 py-3 rounded-2xl bg-white border border-emerald-300 text-emerald-900 font-extrabold text-sm hover:bg-emerald-50 transition flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>{(t as any).takeLivePhotoScan || "Take Live Photo / Scan Doc"}</span>
                    </button>
                  </div>
                </div>

                <div className="w-full lg:max-w-md">
                  <ChatAssistant variant="compact" />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar for Mobile */}
      <div className="sm:hidden fixed bottom-4 inset-x-4 z-30 flex items-center gap-3">
        <button
          onClick={() => setActiveTab("chat")}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-800 text-white font-black text-sm shadow-2xl flex items-center justify-center gap-2 border border-emerald-500/40 active:scale-95 transition"
        >
          <Mic className="w-5 h-5 text-emerald-300 animate-pulse" />
          <span>{t.tabs.chat}</span>
        </button>

        <button
          onClick={() => setVerificationModalOpen(true)}
          className="p-3.5 rounded-2xl bg-amber-500 text-amber-950 font-black shadow-2xl active:scale-95 transition"
          title="Scan Document"
        >
          <ScanLine className="w-6 h-6" />
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 text-center text-xs text-stone-500 space-y-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-black text-stone-800 text-sm">
              JanMithra • AI Agricultural & Government Scheme Discovery
            </p>
            <p className="text-stone-500 mt-0.5">
              Empowering Indian Farmers with Grounded RAG, Llama 3.3 Reasoning, and Llama 3.2 Vision OCR
            </p>
          </div>
          <div className="flex items-center gap-4 text-stone-600 font-bold">
            <a
              href="https://github.com/YaswanthKomminni/JanMitra-AI-Powered-Government-Scheme-Assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-emerald-700 transition"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-stone-300">•</span>
            <a href="tel:1551" className="hover:text-emerald-700 transition">
              Kisan Helpline: 1551
            </a>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal />
      <DocumentVerificationModal />
      <SchemeDetailModal />
    </div>
  );
}
