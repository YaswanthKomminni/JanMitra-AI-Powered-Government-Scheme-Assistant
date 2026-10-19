"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Landmark, Users, MessageSquare, ScanLine, Settings, Plus, PanelLeftClose, PanelLeftOpen, X, LogIn, Sprout,
} from "lucide-react";
import { useFarmerStore, TabId } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

export const TOGGLE_SIDEBAR_EVENT = "janmitra:toggle-sidebar";
const COLLAPSE_KEY = "janmitra:sidebar-collapsed";

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    language, activeTab, setActiveTab, setVerificationModalOpen, startNewConversation, openConversation,
    conversations, activeConversationId, isAuthenticated, authStatus, currentFarmer, setAuthModalOpen, isAwaitingReply,
  } = useFarmerStore();
  const t = translations[language];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* ignore */ }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* ignore */ }
      return !c;
    });
  };

  useEffect(() => {
    const open = () => setMobileOpen((o) => !o);
    window.addEventListener(TOGGLE_SIDEBAR_EVENT, open);
    return () => window.removeEventListener(TOGGLE_SIDEBAR_EVENT, open);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [mobileOpen]);
  useEffect(() => setMobileOpen(false), [pathname]);

  const onHome = pathname === "/";
  const go = useCallback((fn: () => void) => {
    fn();
    setMobileOpen(false);
    if (!onHome) router.push("/");
  }, [onHome, router]);

  const items: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: t.tabs.dashboard, icon: Home },
    { id: "chat", label: t.tabs.chat, icon: MessageSquare },
    { id: "schemes", label: t.tabs.schemes, icon: Landmark },
    { id: "peers", label: t.tabs.peers, icon: Users },
  ];

  const Tip = ({ label }: { label: string }) => (
    <span role="tooltip" className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-jm-text text-jm-bg px-2 py-1 text-xs font-medium opacity-0 group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100 shadow-md">
      {label}
    </span>
  );

  const navBtn = (active: boolean) =>
    `group/nav relative flex items-center gap-3 w-full h-11 rounded-xl text-[14px] font-medium transition-colors ${
      collapsed ? "justify-center md:px-0 px-3" : "px-3"
    } ${active ? "bg-jm-soft text-jm-text" : "text-jm-text2 hover:bg-jm-muted hover:text-jm-text"}`;

  const showLabels = !collapsed || mobileOpen;
  const initials = (currentFarmer.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const content = (
    <div className="flex h-full flex-col bg-jm-surface border-r border-jm-border">
      {/* Brand */}
      <div className={`flex items-center h-16 px-3 gap-2 ${showLabels ? "justify-between" : "justify-center"}`}>
        <button onClick={() => go(() => setActiveTab("dashboard"))} className="flex items-center gap-2 min-w-0" aria-label="JanMitra home">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-jm-primary text-jm-onprimary shrink-0"><Sprout className="w-5 h-5" /></span>
          {showLabels && <span className="text-[17px] font-semibold text-jm-text truncate">JanMitra</span>}
        </button>
        {showLabels && (
          <>
            <button onClick={toggleCollapsed} className="hidden md:grid place-items-center w-8 h-8 rounded-lg text-jm-text2 hover:bg-jm-muted" aria-label="Collapse sidebar">
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen(false)} className="md:hidden grid place-items-center w-8 h-8 rounded-lg text-jm-text2 hover:bg-jm-muted" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {!showLabels && (
        <div className="px-3">
          <button onClick={toggleCollapsed} className="group/nav relative grid place-items-center w-full h-9 rounded-lg text-jm-text2 hover:bg-jm-muted" aria-label="Expand sidebar">
            <PanelLeftOpen className="w-4 h-4" /><Tip label="Expand sidebar" />
          </button>
        </div>
      )}

      {/* New chat */}
      <div className="px-3 pt-2 pb-3">
        <button
          onClick={() => go(() => { startNewConversation(); setActiveTab("chat"); })}
          disabled={isAwaitingReply}
          className={`group/nav relative flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-jm-primary text-jm-onprimary text-[14px] font-semibold hover:bg-jm-hover disabled:opacity-60 disabled:cursor-not-allowed transition`}
          aria-label="New chat"
        >
          <Plus className="w-4 h-4" />
          {showLabels && <span>New Chat</span>}
          {!showLabels && <Tip label="New Chat" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1.5" aria-label="Main">
        {items.map(({ id, label, icon: Icon }) => {
          const active = onHome && activeTab === id;
          return (
            <button key={id} onClick={() => go(() => setActiveTab(id))} className={navBtn(active)} aria-current={active ? "page" : undefined}>
              {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-jm-primary" />}
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-jm-primary" : ""}`} />
              {showLabels && <span className="truncate">{label}</span>}
              {!showLabels && <Tip label={label} />}
            </button>
          );
        })}
        <button onClick={() => go(() => setVerificationModalOpen(true))} className={navBtn(false)}>
          <ScanLine className="w-[18px] h-[18px] shrink-0" />
          {showLabels && <span className="truncate">{t.tabs.verify}</span>}
          {!showLabels && <Tip label={t.tabs.verify} />}
        </button>
      </nav>

      {/* Recent conversations (real data) */}
      <div className="flex-1 min-h-0 mt-4 px-3 overflow-y-auto">
        {showLabels && isAuthenticated && conversations.length > 0 && (
          <>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-jm-text2">Recent</p>
            <ul className="space-y-0.5">
              {conversations.map((c) => {
                const active = onHome && activeTab === "chat" && c.id === activeConversationId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => go(() => { setActiveTab("chat"); if (c.id !== activeConversationId) openConversation(c.id); })}
                      disabled={isAwaitingReply && c.id !== activeConversationId}
                      title={c.title}
                      className={`w-full text-left h-9 px-2 rounded-lg text-[13px] truncate transition-colors disabled:opacity-60 ${active ? "bg-jm-soft text-jm-text font-medium" : "text-jm-text2 hover:bg-jm-muted hover:text-jm-text"}`}
                      aria-current={active ? "true" : undefined}
                    >
                      {c.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Settings + profile */}
      <div className="p-3 border-t border-jm-border space-y-1.5">
        <button onClick={() => { setMobileOpen(false); router.push("/settings"); }} className={navBtn(pathname === "/settings")} aria-current={pathname === "/settings" ? "page" : undefined}>
          {pathname === "/settings" && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-jm-primary" />}
          <Settings className={`w-[18px] h-[18px] shrink-0 ${pathname === "/settings" ? "text-jm-primary" : ""}`} />
          {showLabels && <span>Settings</span>}
          {!showLabels && <Tip label="Settings" />}
        </button>
        {authStatus !== "unknown" && (isAuthenticated ? (
          <button onClick={() => { setMobileOpen(false); router.push("/settings"); }} className={`group/nav relative flex items-center gap-3 w-full rounded-xl p-2 hover:bg-jm-muted ${showLabels ? "" : "justify-center"}`} aria-label="Account">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-jm-primary text-jm-onprimary text-xs font-semibold shrink-0">{initials}</span>
            {showLabels && (
              <span className="min-w-0 text-left">
                <span className="block text-[13px] font-medium text-jm-text truncate">{currentFarmer.name}</span>
                <span className="block text-[11px] text-jm-text2 truncate">{currentFarmer.email || (currentFarmer.phone ? `+91 ${currentFarmer.phone}` : "")}</span>
              </span>
            )}
            {!showLabels && <Tip label={currentFarmer.name} />}
          </button>
        ) : (
          <button onClick={() => setAuthModalOpen(true, "login")} className={navBtn(false)}>
            <LogIn className="w-[18px] h-[18px] shrink-0" />
            {showLabels && <span>Sign in</span>}
            {!showLabels && <Tip label="Sign in" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet rail */}
      <aside
        className={`hidden md:block sticky top-0 h-screen shrink-0 z-30 transition-[width] duration-200 ease-out ${collapsed ? "w-[72px]" : "w-[260px]"}`}
        aria-label="Sidebar"
      >
        {content}
      </aside>
      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileOpen}>
        <div onClick={() => setMobileOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute left-0 top-0 h-full w-[280px] max-w-[85vw] transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} role="dialog" aria-label="Navigation">
          {content}
        </aside>
      </div>
    </>
  );
}
