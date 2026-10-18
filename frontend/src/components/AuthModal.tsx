"use client";

import React, { useEffect } from "react";
import { ShieldCheck, X, MessageSquareLock } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import AuthForm from "@/components/AuthForm";

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, authModalReason, authModalMode, pendingAction } = useFarmerStore();

  // Close on Escape
  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authModalOpen, setAuthModalOpen]);

  if (!authModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-6 text-white relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-700/80 text-emerald-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>JanMithra Secure Portal</span>
            </span>
          </div>

          <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-black tracking-tight">
            {authModalMode === "signup" ? "Create Your Farmer Account" : "Farmer Sign In"}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Access personalized welfare schemes, the AI assistant and your saved conversations.
          </p>
        </div>

        {/* Why we are asking */}
        {authModalReason && (
          <div className="px-5 py-3 text-xs sm:text-sm font-bold flex items-start gap-2.5 bg-amber-50 text-amber-950 border-b border-amber-200">
            <MessageSquareLock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p>{authModalReason}</p>
              {pendingAction?.type === "send_message" && pendingAction.text && (
                <p className="mt-1 font-semibold text-amber-900/80">
                  Your question will be kept: “{pendingAction.text.length > 80 ? pendingAction.text.slice(0, 77) + "…" : pendingAction.text}”
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          <AuthForm initialMode={authModalMode} />
        </div>
      </div>
    </div>
  );
}
