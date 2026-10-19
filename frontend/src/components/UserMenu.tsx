"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LogIn, Settings, ChevronUp } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";

export default function UserMenu({ variant, showLabels = true, onNavigate }: { variant: "sidebar" | "header"; showLabels?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const { isAuthenticated, authStatus, currentFarmer, logout, setAuthModalOpen } = useFarmerStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (authStatus === "unknown") return <div className="h-9 w-9" aria-hidden />;

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => { onNavigate?.(); setAuthModalOpen(true, "login"); }}
        className={variant === "sidebar"
          ? `flex items-center gap-3 w-full h-11 rounded-xl px-3 text-sm font-medium text-jm-text2 hover:bg-jm-muted ${showLabels ? "" : "justify-center px-0"}`
          : "inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-jm-primary text-jm-onprimary text-sm font-semibold hover:bg-jm-hover"}
        aria-label="Sign in"
      >
        <LogIn className="h-[18px] w-[18px] shrink-0" />
        {(variant === "header" || showLabels) && <span>Sign in</span>}
      </button>
    );
  }

  const name = currentFarmer.name || "Account";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const sub = currentFarmer.email || (currentFarmer.phone ? `+91 ${currentFarmer.phone}` : "");

  const doLogout = async () => {
    setOpen(false);
    onNavigate?.();
    await logout();
    router.push("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={variant === "sidebar"
          ? `flex items-center gap-3 w-full rounded-xl p-2 hover:bg-jm-muted ${showLabels ? "" : "justify-center"}`
          : "grid place-items-center h-9 w-9 rounded-full"}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-jm-primary text-jm-onprimary text-xs font-semibold shrink-0">{initials}</span>
        {variant === "sidebar" && showLabels && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-jm-text">{name}</span>
              {sub && <span className="block truncate text-[11px] text-jm-text2">{sub}</span>}
            </span>
            <ChevronUp className="h-4 w-4 text-jm-text2" />
          </>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-56 rounded-xl border border-jm-border bg-jm-surface p-1.5 shadow-lg ${variant === "sidebar" ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"}`}
        >
          <div className="px-3 py-2 border-b border-jm-border mb-1">
            <p className="truncate text-sm font-medium text-jm-text">{name}</p>
            {sub && <p className="truncate text-xs text-jm-text2">{sub}</p>}
          </div>
          <Link href="/settings" role="menuitem" onClick={() => { setOpen(false); onNavigate?.(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-jm-text hover:bg-jm-muted">
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button role="menuitem" onClick={doLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
