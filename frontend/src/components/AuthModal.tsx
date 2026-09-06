"use client";

import React, { useState } from "react";
import {
  Smartphone,
  ShieldCheck,
  Delete,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Globe2,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { SUPPORTED_LANGUAGES, translations } from "@/lib/i18n";
import { DEMO_FARMERS } from "@/lib/mockData";

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    language,
    setLanguage,
    loginWithPhone,
    setCurrentFarmer,
  } = useFarmerStore();

  const [phone, setPhone] = useState("9876543210");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [activeInputIndex, setActiveInputIndex] = useState<number>(0);

  const t = translations[language];

  if (!authModalOpen) return null;

  const handleKeypadPress = (val: string) => {
    if (step === "phone") {
      if (val === "backspace") {
        setPhone((prev) => prev.slice(0, -1));
      } else if (phone.length < 10) {
        setPhone((prev) => prev + val);
      }
    } else {
      // OTP Step
      if (val === "backspace") {
        const nextOtp = [...otp];
        const prevIdx = activeInputIndex > 0 ? activeInputIndex - 1 : 0;
        nextOtp[prevIdx] = "";
        setOtp(nextOtp);
        setActiveInputIndex(prevIdx);
      } else {
        if (activeInputIndex < 4) {
          const nextOtp = [...otp];
          nextOtp[activeInputIndex] = val;
          setOtp(nextOtp);
          if (activeInputIndex < 3) {
            setActiveInputIndex(activeInputIndex + 1);
          }
        }
      }
    }
  };

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setStep("otp");
      setOtp(["5", "2", "8", "9"]); // Pre-fill mock OTP for smooth zero-friction test
      setActiveInputIndex(3);
    }
  };

  const handleVerifyOtp = () => {
    loginWithPhone(phone, otp.join(""));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-emerald-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-700/80">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
              {t.appName} Secure Farmer ID
            </span>
          </div>
          <h2 className="text-2xl font-black">{t.loginTitle}</h2>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            {t.loginSubtitle}
          </p>

          {/* Quick Language bar */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
            <Globe2 className="w-4 h-4 text-emerald-300 shrink-0" />
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 ${
                  language === l.code
                    ? "bg-white text-emerald-950 shadow"
                    : "bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900"
                }`}
              >
                {l.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {step === "phone" ? (
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                {t.enterPhone}
              </label>
              <div className="flex items-center border-2 border-emerald-600 rounded-2xl p-3 bg-emerald-50/50 shadow-inner">
                <span className="font-extrabold text-emerald-900 text-lg mr-3">
                  +91
                </span>
                <input
                  type="text"
                  readOnly
                  value={phone}
                  placeholder="98765 43210"
                  className="w-full bg-transparent text-2xl font-black tracking-widest text-stone-900 focus:outline-none"
                />
                <Smartphone className="w-6 h-6 text-emerald-700" />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length !== 10}
                className={`w-full mt-4 py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition ${
                  phone.length === 10
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98 shadow-emerald-800/30"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <span>{t.sendOtp}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-stone-700">
                  {t.enterOtp}
                </label>
                <button
                  onClick={() => setStep("phone")}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  {t.changePhone}
                </button>
              </div>

              {/* 4 Large Digit Boxes */}
              <div className="flex justify-center gap-3 my-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveInputIndex(idx)}
                    className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black cursor-pointer transition ${
                      activeInputIndex === idx
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-600/30"
                        : otp[idx]
                        ? "border-emerald-300 bg-white text-stone-900"
                        : "border-stone-300 bg-stone-50 text-stone-400"
                    }`}
                  >
                    {otp[idx] || "•"}
                  </div>
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                className="w-full mt-3 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                <span>{t.verifyOtp}</span>
              </button>
            </div>
          )}

          {/* Tactile Big Number Keypad (Designed for rural tactile accessibility) */}
          <div className="bg-stone-50 p-4 rounded-3xl border border-stone-200 shadow-inner">
            <div className="grid grid-cols-3 gap-2.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="h-14 rounded-2xl bg-white border border-stone-200 text-stone-900 text-2xl font-black shadow-sm active:bg-emerald-100 active:scale-95 transition flex items-center justify-center hover:border-emerald-400"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => {
                  if (step === "phone") setPhone("");
                  else {
                    setOtp(["", "", "", ""]);
                    setActiveInputIndex(0);
                  }
                }}
                className="h-14 rounded-2xl bg-stone-100 text-stone-600 text-xs font-bold shadow-sm active:bg-stone-200 transition flex items-center justify-center uppercase"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeypadPress("0")}
                className="h-14 rounded-2xl bg-white border border-stone-200 text-stone-900 text-2xl font-black shadow-sm active:bg-emerald-100 active:scale-95 transition flex items-center justify-center hover:border-emerald-400"
              >
                0
              </button>
              <button
                onClick={() => handleKeypadPress("backspace")}
                className="h-14 rounded-2xl bg-stone-200 text-stone-800 text-lg font-bold shadow-sm active:bg-stone-300 transition flex items-center justify-center"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Quick Demo Farmer Switcher */}
          <div className="pt-2 border-t border-stone-200">
            <p className="text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t.demoLogin}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_FARMERS.map((df) => (
                <button
                  key={df.id}
                  onClick={() => {
                    setCurrentFarmer(df);
                    setAuthModalOpen(false);
                  }}
                  className="p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 transition text-left flex items-center gap-2"
                >
                  <img
                    src={df.avatarUrl}
                    alt={df.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-extrabold text-xs text-stone-900 leading-tight">
                      {df.name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-emerald-800 font-medium">
                      {df.state.slice(0, 8)} • {df.landSizeAcres} Ac
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
