"use client";

import React from "react";
import { Check } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeSelectorCards() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {THEMES.map((th) => {
        const active = th.id === theme;
        return (
          <button
            key={th.id}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(th.id)}
            className="text-left rounded-xl p-3 border-2 transition hover:-translate-y-0.5 bg-jm-surface"
            style={{ borderColor: active ? th.primary : undefined }}
          >
            {/* mini preview */}
            <div className="flex h-24 rounded-lg overflow-hidden border" style={{ background: th.background, borderColor: th.border }}>
              <div className="w-1/4 p-1.5 space-y-1" style={{ background: th.surface, borderRight: `1px solid ${th.border}` }}>
                <div className="h-2 rounded" style={{ background: th.primary }} />
                <div className="h-1.5 rounded" style={{ background: th.border }} />
                <div className="h-1.5 rounded" style={{ background: th.border }} />
              </div>
              <div className="flex-1 p-2 flex flex-col justify-between">
                <div className="rounded p-1.5 space-y-1" style={{ background: th.surface, border: `1px solid ${th.border}` }}>
                  <div className="h-1.5 w-2/3 rounded" style={{ background: th.text, opacity: 0.7 }} />
                  <div className="h-1.5 w-1/2 rounded" style={{ background: th.text, opacity: 0.3 }} />
                </div>
                <div className="self-start rounded px-2 py-0.5 text-[9px] font-semibold" style={{ background: th.primary, color: th.onPrimary }}>Button</div>
              </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-jm-text flex items-center gap-2 flex-wrap">
                  {th.name}
                  {th.isDefault && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-jm-soft text-jm-text border border-jm-border">DEFAULT</span>}
                </p>
                <p className="text-xs text-jm-text2 mt-0.5">{th.description}</p>
              </div>
              {active && (
                <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.primary, color: th.onPrimary }}>
                  <Check className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <div className="mt-2 flex gap-1.5">
              <span className="w-5 h-5 rounded-full border border-jm-border" style={{ background: th.primary }} />
              <span className="w-5 h-5 rounded-full border border-jm-border" style={{ background: th.background }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
