"use client";

import React, { useState } from "react";
import {
  Sprout,
  Globe2,
  PhoneCall,
  UserCheck,
  Mic,
  ChevronDown,
  Volume2,
  FileCheck2,
  LogOut,
  Loader2,
  MessageSquareText,
  Menu,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { SUPPORTED_LANGUAGES, SupportedLanguage, translations } from "@/lib/i18n";

export default function Navbar() {
  const {
    language,
    setLanguage,
    currentFarmer,
    isAuthenticated,
    authStatus,
    conversations,
    setAuthModalOpen,
    logout,
    activeTab,
    setActiveTab,
    setVerificationModalOpen,
    isSpeaking,
    stopAudio,
  } = useFarmerStore();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-jm-surface/90 backdrop-blur border-b border-jm-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-16">
          {/* Logo & Brand */}
          <button type="button" className="md:hidden grid place-items-center w-10 h-10 shrink-0 rounded-lg text-stone-700 hover:bg-stone-100" aria-label="Open menu" onClick={() => window.dispatchEvent(new Event("janmitra:toggle-sidebar"))}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 cursor-pointer md:hidden min-w-0" onClick={() => setActiveTab("dashboard")}>
            <div className="w-9 h-9 rounded-xl bg-jm-primary flex items-center justify-center text-jm-onprimary shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg text-jm-text tracking-tight truncate">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-jm-soft text-jm-text border border-jm-border">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-jm-text2 hidden lg:block">
                {t.appTagline}
              </p>
            </div>
          </div>

          {/* Center Call Center Pill (Accessible emergency support) */}
          <div className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-jm-soft border border-jm-primary/25 text-jm-text text-[13px] font-medium">
            <PhoneCall className="w-4 h-4 text-jm-primary" />
            <a href="tel:1551" className="hover:underline">
              {t.kisanHelpline}
            </a>
          </div>

          {/* Right Side Actions: Language Selector & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            {/* Audio Indicator if AI is speaking */}
            {isSpeaking && (
              <button
                onClick={stopAudio}
                className="flex items-center gap-2 h-10 px-3 rounded-xl bg-red-100 border border-red-300 text-red-700 text-[13px] font-medium hover:bg-red-200 transition"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.stopSpeaking}</span>
              </button>
            )}

            {/* Language Picker Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 h-10 px-3 rounded-xl bg-jm-surface hover:bg-jm-muted text-jm-text border border-jm-border transition text-sm font-medium active:scale-95"
                title={t.selectLanguage}
              >
                <Globe2 className="w-4 h-4 text-jm-primary" />
                <span className="hidden min-[420px]:inline">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}
                </span>
                <ChevronDown className="w-4 h-4 text-stone-500" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    {t.selectLanguage}
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition hover:bg-emerald-50 ${
                        language === lang.code
                          ? "bg-emerald-50 text-emerald-800 font-bold border-r-4 border-emerald-600"
                          : "text-stone-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <div>
                          <p className="leading-tight font-bold">{lang.nativeName}</p>
                          <p className="text-xs text-stone-500">{lang.name}</p>
                        </div>
                      </div>
                      {language === lang.code && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Farmer Profile (signed in) / Sign-in button */}
            {authStatus === "unknown" ? (
              <div className="w-10 h-10 flex items-center justify-center" aria-label="Checking sign-in">
                <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
              </div>
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 h-10 px-1.5 sm:px-2.5 rounded-xl bg-jm-surface border border-jm-border hover:bg-jm-muted transition active:scale-95"
                >
                  <img
                    src={currentFarmer.avatarUrl}
                    alt={currentFarmer.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-jm-primary"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-emerald-950 leading-tight">
                      {currentFarmer.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {[
                        currentFarmer.landSizeAcres ? `${currentFarmer.landSizeAcres} ${t.acres}` : "",
                        currentFarmer.village.split(" ")[0],
                      ]
                        .filter(Boolean)
                        .join(" • ") || `+91 ${currentFarmer.phone}`}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-emerald-800 hidden sm:block" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-3 z-50">
                    <div className="p-3 bg-emerald-50 rounded-xl mb-3">
                      <p className="text-xs font-bold text-emerald-900 uppercase">
                        {t.profileBadge}
                      </p>
                      <p className="text-base font-extrabold text-stone-900">
                        {currentFarmer.name}
                      </p>
                      <p className="text-xs text-stone-600">
                        +91 {currentFarmer.phone}
                        {currentFarmer.village ? ` • ${currentFarmer.village}` : ""}
                      </p>
                      {currentFarmer.email && (
                        <p className="text-xs text-stone-500 truncate">{currentFarmer.email}</p>
                      )}
                      {(currentFarmer.landSizeAcres > 0 || currentFarmer.soilTypeName) && (
                        <div className="mt-2 flex items-center gap-2">
                          {currentFarmer.landSizeAcres > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                              {currentFarmer.landSizeAcres} {t.acres}
                            </span>
                          )}
                          {currentFarmer.soilTypeName && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-200 text-stone-800">
                              {currentFarmer.soilTypeName.split(" ")[0]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-100 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab("chat");
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      >
                        <MessageSquareText className="w-4 h-4" />
                        My Conversations ({conversations.length})
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true, "login")}
                className="h-10 px-4 rounded-xl bg-jm-primary hover:bg-jm-hover text-jm-onprimary font-semibold text-sm transition whitespace-nowrap"
              >
                {t.loginTitle}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (chat asks guests to sign in) */}
        {authStatus !== "unknown" && (
          <div className="flex sm:hidden items-center justify-around py-2 border-t border-jm-border text-[13px] font-medium">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "dashboard"
                  ? "bg-emerald-700 text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {t.tabs.dashboard}
            </button>
            <button
              onClick={() => setActiveTab("schemes")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "schemes"
                  ? "bg-emerald-700 text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {t.tabs.schemes}
            </button>
            <button
              onClick={() => setActiveTab("peers")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "peers"
                  ? "bg-emerald-700 text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {t.tabs.peers}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === "chat"
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-800 bg-emerald-100"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.tabs.chat}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
