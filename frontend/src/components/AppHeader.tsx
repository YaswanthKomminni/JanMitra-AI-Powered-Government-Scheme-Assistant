"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Volume2 } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n";
import { routeForPath } from "@/lib/routes";
import { TOGGLE_SIDEBAR_EVENT } from "@/components/AppSidebar";
import UserMenu from "@/components/UserMenu";

export default function AppHeader() {
  const pathname = usePathname();
  const { language, setLanguage, isSpeaking, stopAudio } = useFarmerStore();
  const route = routeForPath(pathname);
  const title = route?.title ?? "JanMitra";

  useEffect(() => {
    document.title = route ? `${route.title} · JanMitra` : "JanMitra";
  }, [route]);

  return (
    <header className="sticky top-0 z-40 border-b border-jm-border bg-jm-surface">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-jm-text hover:bg-jm-muted md:hidden" aria-label="Open menu" onClick={() => window.dispatchEvent(new Event(TOGGLE_SIDEBAR_EVENT))}>
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-jm-text">{title}</h2>

        {isSpeaking && (
          <button onClick={stopAudio} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-jm-border px-3 text-sm text-jm-text hover:bg-jm-muted">
            <Volume2 className="h-4 w-4 text-jm-primary" /> <span className="hidden sm:inline">Stop audio</span>
          </button>
        )}
        <label className="sr-only" htmlFor="app-language">Language</label>
        <select
          id="app-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="h-9 rounded-lg border border-jm-border bg-jm-surface px-2 text-sm text-jm-text"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.nativeName}</option>
          ))}
        </select>
        <UserMenu variant="header" />
      </div>
    </header>
  );
}
