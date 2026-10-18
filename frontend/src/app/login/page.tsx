"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, ShieldCheck, BadgeCheck, PhoneCall, Wheat, Loader2, ArrowRight, LogOut } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import AuthForm from "@/components/AuthForm";

/** Only allow same-site relative redirects such as "/" (never "//evil.com"). */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  return raw;
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const intent = params.get("intent"); // e.g. "chat" -> open the assistant after sign-in
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const { authStatus, isAuthenticated, currentFarmer, logout, setActiveTab } = useFarmerStore();

  const goOn = () => {
    if (intent === "chat") setActiveTab("chat");
    router.push(next);
  };

  // Remember where the visitor wanted to go when they arrive unauthenticated.
  useEffect(() => {
    if (intent === "chat" && !isAuthenticated) {
      useFarmerStore.setState({ pendingAction: { type: "open_chat" } });
    }
  }, [intent, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden">
        {/* Left Side: Brand & Benefits */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/60 border border-emerald-400/30 flex items-center justify-center text-white shadow-lg">
                <Sprout className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none">JanMithra</h1>
                <p className="text-xs text-emerald-200/90 font-bold mt-1">AI Government Scheme Assistant</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <Wheat className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">4,706+ Welfare Schemes</h4>
                  <p className="text-xs text-emerald-100/70">PM-KISAN, PM-KUSUM Solar, PMFBY Crop Insurance & Soil Health.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">Your Conversations, Saved</h4>
                  <p className="text-xs text-emerald-100/70">Sign in on any device and continue where you stopped.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <BadgeCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">Vision OCR Verification</h4>
                  <p className="text-xs text-emerald-100/70">Scan Land Patta or Soil Cards for instant eligibility checks.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-end">
            <span className="font-bold flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" /> Kisan: 1551
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          {authStatus === "unknown" ? (
            <div className="flex-1 flex items-center justify-center py-16 text-stone-500 gap-2 text-sm font-bold">
              <Loader2 className="w-5 h-5 animate-spin" /> Checking your sign-in…
            </div>
          ) : isAuthenticated ? (
            <div className="flex-1 flex flex-col justify-center gap-4 py-10 text-center">
              <p className="text-sm text-stone-600">You are signed in as</p>
              <p className="text-2xl font-black text-stone-900">{currentFarmer.name}</p>
              <p className="text-sm text-stone-500">+91 {currentFarmer.phone}</p>
              <button
                onClick={goOn}
                className="mx-auto mt-2 px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-2"
              >
                Continue to JanMithra <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                className="mx-auto text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <AuthForm initialMode={initialMode} onSuccess={goOn} />
          )}

          <div className="pt-4 text-center">
            <Link href="/" className="text-xs font-bold text-emerald-800 hover:underline">
              ← Back to JanMithra Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
