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
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { SUPPORTED_LANGUAGES, SupportedLanguage, translations } from "@/lib/i18n";
import { DEMO_FARMERS } from "@/lib/mockData";

export default function Navbar() {
  const {
    language,
    setLanguage,
    currentFarmer,
    setCurrentFarmer,
    isAuthenticated,
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Sprout className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl text-emerald-950 tracking-tight">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-stone-600 hidden sm:block font-medium">
                {t.appTagline}
              </p>
            </div>
          </div>

          {/* Center Call Center Pill (Accessible emergency support) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amberGold-50 border border-amberGold-500/30 text-amberGold-700 text-xs font-semibold">
            <PhoneCall className="w-4 h-4 text-amberGold-600 animate-pulse" />
            <a href="tel:1551" className="hover:underline">
              {t.kisanHelpline}
            </a>
          </div>

          {/* Right Side Actions: Language Selector & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Indicator if AI is speaking */}
            {isSpeaking && (
              <button
                onClick={stopAudio}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-300 text-red-700 text-xs font-bold animate-pulse hover:bg-red-200 transition"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.stopSpeaking}</span>
              </button>
            )}

            {/* Language Picker Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 transition text-sm font-bold active:scale-95"
                title={t.selectLanguage}
              >
                <Globe2 className="w-4 h-4 text-emerald-700" />
                <span className="font-bold">
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

            {/* Farmer Profile / Switcher */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition active:scale-95"
                >
                  <img
                    src={currentFarmer.avatarUrl}
                    alt={currentFarmer.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-emerald-950 leading-tight">
                      {currentFarmer.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {currentFarmer.landSizeAcres} {t.acres} • {currentFarmer.village.split(" ")[0]}
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
                        +91 {currentFarmer.phone} • {currentFarmer.village}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                          {currentFarmer.landSizeAcres} {t.acres}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-200 text-stone-800">
                          {currentFarmer.soilTypeName.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-stone-500 uppercase px-2 mb-2">
                      Switch Demo Farmer
                    </div>
                    {DEMO_FARMERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setCurrentFarmer(f);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left text-xs transition mb-1 ${
                          currentFarmer.id === f.id
                            ? "bg-emerald-100/70 text-emerald-950 font-bold"
                            : "hover:bg-stone-100 text-stone-700"
                        }`}
                      >
                        <img
                          src={f.avatarUrl}
                          alt={f.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold">{f.name}</p>
                          <p className="text-[10px] text-stone-500">
                            {f.state} • {f.landSizeAcres} Acres • {f.primaryCrops[0]}
                          </p>
                        </div>
                      </button>
                    ))}

                    <div className="border-t border-stone-100 mt-3 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setAuthModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      >
                        <UserCheck className="w-4 h-4" />
                        Sign Up New Farmer / Login
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
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition"
              >
                {t.loginTitle}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Only when authenticated) */}
        {isAuthenticated && (
          <div className="flex sm:hidden items-center justify-around py-2 border-t border-emerald-100 text-xs font-bold">
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
