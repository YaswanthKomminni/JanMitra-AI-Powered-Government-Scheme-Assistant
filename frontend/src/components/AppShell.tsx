"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import AuthModal from "@/components/AuthModal";
import DocumentVerificationModal from "@/components/DocumentVerificationModal";
import SchemeDetailModal from "@/components/SchemeDetailModal";
import VoiceModelReport from "@/components/VoiceModelReport";
import { useFarmerStore } from "@/store/useFarmerStore";
import { pathForTab, routeForPath } from "@/lib/routes";

/**
 * Shared shell: sidebar + header + the active route's content.
 * Also bridges legacy store actions that set `activeTab` (e.g. "open chat after sign-in")
 * to real navigation, and keeps `activeTab` aligned with the URL.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // True only while WE write activeTab from the URL, so the subscriber below ignores it.
  const syncingFromUrl = useRef(false);

  // URL is the single source of truth: mirror it into the legacy `activeTab` store field.
  useEffect(() => {
    const tab = routeForPath(pathname)?.tab ?? "dashboard";
    if (useFarmerStore.getState().activeTab === tab) return;
    syncingFromUrl.current = true;
    useFarmerStore.setState({ activeTab: tab });
    syncingFromUrl.current = false;
  }, [pathname]);

  // Legacy store actions (e.g. "open chat after sign-in") set activeTab on their own.
  // Navigate only for those, reading the live URL (no stale closures), and never for our own writes.
  useEffect(() => {
    return useFarmerStore.subscribe((state, prev) => {
      if (syncingFromUrl.current || state.activeTab === prev.activeTab) return;
      const target = pathForTab(state.activeTab);
      if (target && target !== window.location.pathname) router.push(target);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen bg-jm-bg text-jm-text">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="min-w-0 flex-1">{children}</main>
        {pathname === "/models" && <VoiceModelReport />}
      </div>
      <AuthModal />
      <DocumentVerificationModal />
      <SchemeDetailModal />
    </div>
  );
}
