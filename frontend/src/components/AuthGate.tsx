"use client";

import React from "react";
import { Sprout, ShieldCheck, BadgeCheck, Wheat } from "lucide-react";
import AuthForm from "@/components/AuthForm";

/**
 * Full-width sign-in / sign-up panel (brand column + shared AuthForm).
 * Uses the same server session as the AuthModal and the /login page.
 * The old MySQL-password banner and one-click demo logins were removed.
 */
export default function AuthGate({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div className="py-6 sm:py-12 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-emerald-500/20 overflow-hidden">
        {/* Left Side: Brand & Visual Highlights */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 p-6 sm:p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/70 border border-emerald-400/40 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none">JanMithra</h2>
                <p className="text-xs text-emerald-200/90 font-bold mt-1">AI Welfare & Agriculture Assistant</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Wheat className="w-4 h-4 text-amber-300" />
                  <h4 className="font-extrabold text-sm">4,706+ Government Schemes</h4>
                </div>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Personalized eligibility for PM-KISAN, PM-KUSUM 60% Solar Pump, PMFBY, and Soil Health.
                </p>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <h4 className="font-extrabold text-sm">Saved Conversations</h4>
                </div>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Your questions and answers are stored securely so you can continue any time.
                </p>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="w-4 h-4 text-cyan-300" />
                  <h4 className="font-extrabold text-sm">AI Vision OCR Verification</h4>
                </div>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Verify land records, soil health cards and crop photos with your camera.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/80 text-xs text-emerald-200 flex items-center justify-between font-semibold">
            <span>Secure Access</span>
            <span>Toll-Free Helpline: 1551</span>
          </div>
        </div>

        <div className="md:col-span-7 p-6 sm:p-8">
          <AuthForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
