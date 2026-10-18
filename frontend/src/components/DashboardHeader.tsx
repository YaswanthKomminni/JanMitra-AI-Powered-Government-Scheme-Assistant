"use client";

import React, { useState } from "react";
import {
  MapPin,
  Tractor,
  Droplets,
  Layers,
  FileCheck2,
  ScanLine,
  Mic,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  LogIn,
  UserPlus,
  MessageSquareText,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

export default function DashboardHeader() {
  const {
    currentFarmer,
    language,
    setActiveTab,
    setVerificationModalOpen,
    isAuthenticated,
    authStatus,
    setAuthModalOpen,
  } = useFarmerStore();

  const [gpsRefreshing, setGpsRefreshing] = useState(false);
  const t = translations[language];

  const handleRefreshGps = () => {
    setGpsRefreshing(true);
    setTimeout(() => setGpsRefreshing(false), 800);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/20 relative overflow-hidden mb-8 border border-emerald-700/50">
      {/* Background Decorative Graphic */}
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
        <Tractor className="w-80 h-80 text-emerald-300" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Demographics & Greeting */}
        {!isAuthenticated ? (
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {t.welcome}! {(t as any).guestHeroTitle || "Welcome to JanMithra"}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              {(t as any).guestHeroSubtitle ||
                "Explore government schemes and nearby farmer success stories. Sign in or create a free account to ask the AI assistant, scan documents, and keep your conversations saved."}
            </p>
            {authStatus !== "unknown" && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setAuthModalOpen(true, "login")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-900 font-black text-sm shadow-md hover:bg-emerald-50 transition active:scale-98"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
                <button
                  onClick={() => setAuthModalOpen(true, "signup")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700/80 border border-emerald-400/40 text-white font-black text-sm hover:bg-emerald-600 transition active:scale-98"
                >
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </button>
              </div>
            )}
          </div>
        ) : (
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {/* GPS Location Tag */}
            {(currentFarmer.village || currentFarmer.district || currentFarmer.state) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-xs font-bold text-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {[currentFarmer.village, currentFarmer.district, currentFarmer.state].filter(Boolean).join(", ")}
              </span>
              <button
                onClick={handleRefreshGps}
                className="hover:text-white transition p-0.5 ml-1"
                title="Refresh GPS Coordinates"
              >
                <RefreshCw
                  className={`w-3 h-3 ${gpsRefreshing ? "animate-spin text-white" : ""}`}
                />
              </button>
            </div>
            )}

            {/* Verified Documents Badge */}
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentFarmer.verifiedDocsCount} {t.verifiedStatus}
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{t.welcome}, {currentFarmer.name}!</span>
          </h1>

          {/* High-Contrast Land Profile Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            {currentFarmer.landSizeAcres > 0 && (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black text-emerald-100">
                {currentFarmer.landSizeAcres} {t.acres}
              </span>
            </div>
            )}

            {currentFarmer.soilTypeName && (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
              <span className="text-sm font-semibold text-emerald-200">
                🌱 {currentFarmer.soilTypeName}
              </span>
            </div>
            )}

            {currentFarmer.irrigationTypeName && (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-emerald-200">
                {currentFarmer.irrigationTypeName}
              </span>
            </div>
            )}

            {currentFarmer.primaryCrops.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/30 px-3.5 py-2 rounded-2xl">
              <span className="text-sm font-semibold text-amber-200">
                🌾 {currentFarmer.primaryCrops.join(", ")}
              </span>
            </div>
            )}
          </div>
        </div>
        )}

        {/* Right CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          <button
            onClick={() => setVerificationModalOpen(true)}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-98 transition group"
          >
            <ScanLine className="w-5 h-5 text-amber-950 group-hover:rotate-12 transition-transform" />
            <span>{t.verifyDocsTitle.split(" ")[0]} {t.verifyDocsTitle.split(" ")[1]}</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-sm border border-emerald-500/40 shadow-lg active:scale-98 transition"
          >
            {isAuthenticated ? (
              <Mic className="w-5 h-5 text-emerald-300 animate-bounce-subtle" />
            ) : (
              <MessageSquareText className="w-5 h-5 text-emerald-300" />
            )}
            <span>{t.tabs.chat}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
