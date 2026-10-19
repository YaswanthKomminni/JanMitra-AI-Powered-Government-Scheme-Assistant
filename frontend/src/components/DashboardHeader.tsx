"use client";

import React, { useState } from "react";
import {
  MapPin,
  Tractor,
  Droplets,
  Layers,
  ScanLine,
  Mic,
  ShieldCheck,
  RefreshCw,
  LogIn,
  UserPlus,
  MessageSquareText,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

const pill =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-jm-onprimary/15 border border-jm-onprimary/25 text-[13px] font-medium text-jm-onprimary";

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
    <div className="relative overflow-hidden mb-8 rounded-[20px] border border-jm-onprimary/10 bg-gradient-to-br from-jm-primary to-jm-hover text-jm-onprimary p-5 sm:p-7 shadow-sm">
      {/* Decorative graphic */}
      <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none" aria-hidden="true">
        <Tractor className="w-64 h-64 text-jm-onprimary" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: greeting */}
        {!isAuthenticated ? (
          <div className="min-w-0 max-w-2xl space-y-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight">
              {t.welcome}! {(t as any).guestHeroTitle || "Welcome to JanMithra"}
            </h1>
            <p className="text-[15px] sm:text-base leading-relaxed opacity-90">
              {(t as any).guestHeroSubtitle ||
                "Explore government schemes and nearby farmer success stories. Sign in or create a free account to ask the AI assistant, scan documents, and keep your conversations saved."}
            </p>
            {authStatus !== "unknown" && (
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => setAuthModalOpen(true, "login")}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-jm-surface text-jm-text text-sm font-semibold border border-jm-border shadow-sm hover:bg-jm-muted active:translate-y-px transition"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
                <button
                  onClick={() => setAuthModalOpen(true, "signup")}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-jm-onprimary/15 border border-jm-onprimary/35 text-jm-onprimary text-sm font-semibold hover:bg-jm-onprimary/25 active:translate-y-px transition"
                >
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0 max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(currentFarmer.village || currentFarmer.district || currentFarmer.state) && (
                <div className={pill}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[16rem]">
                    {[currentFarmer.village, currentFarmer.district, currentFarmer.state].filter(Boolean).join(", ")}
                  </span>
                  <button
                    onClick={handleRefreshGps}
                    className="p-0.5 -mr-1 rounded hover:opacity-80 transition"
                    title="Refresh GPS Coordinates"
                    aria-label="Refresh GPS Coordinates"
                  >
                    <RefreshCw className={`w-3 h-3 ${gpsRefreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
              <div className={pill}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {currentFarmer.verifiedDocsCount} {t.verifiedStatus}
                </span>
              </div>
            </div>

            <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight">
              {t.welcome}, {currentFarmer.name}!
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {currentFarmer.landSizeAcres > 0 && (
                <div className={pill}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {currentFarmer.landSizeAcres} {t.acres}
                  </span>
                </div>
              )}
              {currentFarmer.soilTypeName && (
                <div className={pill}>
                  <span>🌱 {currentFarmer.soilTypeName}</span>
                </div>
              )}
              {currentFarmer.irrigationTypeName && (
                <div className={pill}>
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{currentFarmer.irrigationTypeName}</span>
                </div>
              )}
              {currentFarmer.primaryCrops.length > 0 && (
                <div className={pill}>
                  <span>🌾 {currentFarmer.primaryCrops.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: actions (same size, one primary + one secondary) */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 md:w-72">
          <button
            onClick={() => setVerificationModalOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-5 rounded-xl bg-jm-surface text-jm-text text-sm font-semibold border border-jm-border shadow-sm hover:bg-jm-muted active:translate-y-px transition"
          >
            <ScanLine className="w-[18px] h-[18px] text-jm-primary shrink-0" />
            <span className="truncate">{t.verifyDocsTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-5 rounded-xl bg-jm-onprimary/15 border border-jm-onprimary/35 text-jm-onprimary text-sm font-semibold hover:bg-jm-onprimary/25 active:translate-y-px transition"
          >
            {isAuthenticated ? (
              <Mic className="w-[18px] h-[18px] shrink-0" />
            ) : (
              <MessageSquareText className="w-[18px] h-[18px] shrink-0" />
            )}
            <span className="truncate">{t.tabs.chat}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
