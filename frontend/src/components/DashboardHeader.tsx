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
    <div className="relative overflow-hidden mb-8 rounded-[24px] bg-jm-primary text-jm-onprimary p-6 sm:p-8 lg:p-10">
      {/* Decorative graphic */}
      <div className="absolute right-6 bottom-5 hidden lg:block opacity-[0.08] pointer-events-none select-none" aria-hidden="true">
        <Tractor className="w-24 h-24 text-jm-onprimary" strokeWidth={1.5} />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] md:items-center gap-6 lg:gap-10">
        {/* Left: greeting */}
        {!isAuthenticated ? (
          <div className="min-w-0 space-y-4">
            <h1 className="text-[28px] sm:text-[34px] lg:text-[42px] font-semibold leading-[1.15]">
              {t.welcome}! {(t as any).guestHeroTitle || "Welcome to JanMithra"}
            </h1>
            <p className="text-base lg:text-[18px] leading-[1.6] opacity-95 max-w-[34rem]">
              {(t as any).guestHeroSubtitle ||
                "Explore government schemes and nearby farmer success stories. Sign in or create a free account to ask the AI assistant, scan documents, and keep your conversations saved."}
            </p>
            {authStatus !== "unknown" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setAuthModalOpen(true, "login")}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-jm-surface text-jm-text text-[15px] font-semibold border border-jm-surface hover:bg-jm-muted transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
                <button
                  onClick={() => setAuthModalOpen(true, "signup")}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-jm-onprimary/10 border border-jm-onprimary/40 text-jm-onprimary text-[15px] font-semibold hover:bg-jm-onprimary/20 transition-colors whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
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

            <h1 className="text-[28px] sm:text-[34px] lg:text-[42px] font-semibold leading-[1.15]">
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
        <div className="flex flex-col gap-3 w-full md:max-w-sm md:justify-self-end">
          <button
            onClick={() => setVerificationModalOpen(true)}
            className="flex w-full items-center justify-start gap-3 h-14 px-5 rounded-xl bg-jm-surface text-jm-text text-[15px] font-semibold border border-jm-surface hover:bg-jm-muted transition-colors"
          >
            <ScanLine className="w-5 h-5 text-jm-primary shrink-0" />
            <span className="truncate">{t.verifyDocsTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className="flex w-full items-center justify-start gap-3 h-14 px-5 rounded-xl bg-jm-surface text-jm-text text-[15px] font-semibold border border-jm-surface hover:bg-jm-muted transition-colors"
          >
            {isAuthenticated ? (
              <Mic className="w-5 h-5 text-jm-primary shrink-0" />
            ) : (
              <MessageSquareText className="w-5 h-5 text-jm-primary shrink-0" />
            )}
            <span className="truncate">{t.tabs.chat}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
