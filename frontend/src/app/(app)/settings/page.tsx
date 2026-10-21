"use client";

import React from "react";
import ThemeSelectorCards from "@/components/ThemeSelectorCards";
import ProfileEditor from "@/components/ProfileEditor";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "" || value === 0) return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-jm-border last:border-0 text-sm">
      <dt className="text-jm-text2">{label}</dt>
      <dd className="font-medium text-jm-text text-right break-words min-w-0">{value}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, authStatus, currentFarmer: f, logout, setAuthModalOpen, language } = useFarmerStore();
  const t = translations[language] || translations.en;
  const isTe = language === "te";
  const initials = (f.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-8 space-y-10">
        <h1 className="text-[25px] sm:text-[32px] leading-tight font-semibold">{t.navSettings || "Settings"}</h1>

        <section aria-labelledby="profile-h" className="space-y-3">
          <h2 id="profile-h" className="text-xl sm:text-[22px] font-semibold">{isTe ? "రైతు ప్రొఫైల్" : "Profile"}</h2>
          <div className="rounded-xl border border-jm-border bg-jm-surface p-5">
            {authStatus === "unknown" ? (
              <p className="text-sm text-jm-text2">{isTe ? "ఖాతా వివరాలు తనిఖీ చేస్తున్నాము…" : "Checking your sign-in…"}</p>
            ) : isAuthenticated ? (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <span className="grid place-items-center w-14 h-14 rounded-full bg-jm-primary text-jm-onprimary text-lg font-semibold">{initials}</span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{f.name}</p>
                    {f.email && <p className="text-sm text-jm-text2 truncate">{f.email}</p>}
                  </div>
                </div>
                <dl>
                  <Row label={isTe ? "ఫోన్ నంబర్" : "Phone"} value={f.phone ? `+91 ${f.phone}` : ""} />
                  <Row label={isTe ? "ఈమెయిల్" : "Email"} value={f.email} />
                  <Row label={isTe ? "గ్రామం" : "Village"} value={f.village} />
                  <Row label={isTe ? "రాష్ట్రం" : "State"} value={(f as any).state} />
                  <Row label={isTe ? "జిల్లా" : "District"} value={(f as any).district} />
                  <Row label={isTe ? "పంటలు" : "Crops"} value={f.primaryCrops.join(", ")} />
                  <Row label={isTe ? "భూమి (ఎకరాలు)" : "Land (acres)"} value={f.landSizeAcres} />
                  <Row label={isTe ? "నేల రకం" : "Soil"} value={f.soilTypeName} />
                  <Row label={isTe ? "నీటిపారుదల" : "Irrigation"} value={f.irrigationTypeName} />
                  <Row label={isTe ? "ఎంచుకున్న భాష" : "Preferred language"} value={f.preferredLanguage} />
                </dl>
                <ProfileEditor />
              </>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-jm-text2">{isTe ? "మీ ప్రొఫైల్ చూడటానికి లాగిన్ అవ్వండి." : "Sign in to see your profile."}</p>
                <button onClick={() => setAuthModalOpen(true, "login")} className="h-10 px-4 rounded-lg bg-jm-primary text-jm-onprimary text-sm font-semibold hover:opacity-90">{isTe ? "లాగిన్ అవ్వండి" : "Sign in"}</button>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="appearance-h" className="space-y-3">
          <div>
            <h2 id="appearance-h" className="text-xl sm:text-[22px] font-semibold">Make JanMitra yours</h2>
            <p className="text-sm text-jm-text2 mt-1">Choose the colors that make you feel most comfortable using JanMitra.</p>
          </div>
          <ThemeSelectorCards />
        </section>

        {isAuthenticated && (
          <section aria-labelledby="account-h" className="space-y-3">
            <h2 id="account-h" className="text-xl sm:text-[22px] font-semibold">Account</h2>
            <div className="rounded-xl border border-jm-border bg-jm-surface p-5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-jm-text2">Sign out of this device.</p>
              <button onClick={() => logout()} className="h-10 px-4 rounded-lg border border-jm-border text-sm font-semibold hover:bg-jm-muted">Sign out</button>
            </div>
          </section>
        )}
      </div>
      
    </>
  );
}
