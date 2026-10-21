"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, PanelLeftClose, PanelLeftOpen, X, Sprout } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { MAIN_ROUTES, SETTINGS_ROUTE, isActivePath, type AppRoute } from "@/lib/routes";
import { translations } from "@/lib/i18n";
import UserMenu from "@/components/UserMenu";

export const TOGGLE_SIDEBAR_EVENT = "janmitra:toggle-sidebar";
const COLLAPSE_KEY = "janmitra:sidebar-collapsed";

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { startNewConversation, openConversation, conversations, activeConversationId, isAuthenticated, isAwaitingReply, language } = useFarmerStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const t = translations[language] || translations.en;

  const getRouteLabel = (href: string, fallback: string): string => {
    switch (href) {
      case "/": return t.navHome || fallback;
      case "/assistant": return t.navAssistant || fallback;
      case "/schemes": return t.navSchemes || fallback;
      case "/peers": return t.navPeers || fallback;
      case "/documents": return t.navDocuments || fallback;
      case "/history": return t.navHistory || fallback;
      case "/models": return t.navModels || fallback;
      case "/settings": return t.navSettings || fallback;
      default: return fallback;
    }
  };

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
    const toggle = () => setMobileOpen((o) => !o);
    window.addEventListener(TOGGLE_SIDEBAR_EVENT, toggle);
    return () => window.removeEventListener(TOGGLE_SIDEBAR_EVENT, toggle);
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

  const showLabels = !collapsed || mobileOpen;

  const Tip = ({ label }: { label: string }) => (
    <span role="tooltip" className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-jm-text px-2 py-1 text-xs font-medium text-jm-bg opacity-0 shadow-md group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100">
      {label}
    </span>
  );

  const navClass = (active: boolean) =>
    `group/nav relative flex items-center gap-3 w-full h-11 rounded-xl text-[14px] font-medium transition-colors ${showLabels ? "px-3" : "justify-center"} ${
      active ? "bg-jm-soft text-jm-text" : "text-jm-text2 hover:bg-jm-muted hover:text-jm-text"
    }`;

  const NavLink = ({ route }: { route: AppRoute }) => {
    const active = isActivePath(pathname, route.href);
    const Icon = route.icon;
    const label = getRouteLabel(route.href, route.label);
    return (
      <Link href={route.href} className={navClass(active)} aria-current={active ? "page" : undefined} aria-label={label}>
        {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-jm-primary" />}
        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-jm-primary" : ""}`} />
        {showLabels && <span className="truncate">{label}</span>}
        {!showLabels && <Tip label={label} />}
      </Link>
    );
  };

  const recent = conversations.slice(0, 6);

  const content = (
    <div className="flex h-full flex-col border-r border-jm-border bg-jm-surface">
      <div className={`flex h-16 items-center gap-2 px-3 ${showLabels ? "justify-between" : "justify-center"}`}>
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="JanMitra home">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-jm-primary text-jm-onprimary"><Sprout className="h-5 w-5" /></span>
          {showLabels && <span className="truncate text-[17px] font-semibold text-jm-text">JanMitra</span>}
        </Link>
        {showLabels && (
          <>
            <button onClick={toggleCollapsed} className="hidden h-8 w-8 place-items-center rounded-lg text-jm-text2 hover:bg-jm-muted md:grid" aria-label="Collapse sidebar">
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-jm-text2 hover:bg-jm-muted md:hidden" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {!showLabels && (
        <div className="px-3">
          <button onClick={toggleCollapsed} className="group/nav relative grid h-9 w-full place-items-center rounded-lg text-jm-text2 hover:bg-jm-muted" aria-label="Expand sidebar">
            <PanelLeftOpen className="h-4 w-4" /><Tip label="Expand sidebar" />
          </button>
        </div>
      )}

      <div className="px-3 pb-3 pt-2">
        <button
          onClick={() => { startNewConversation(); router.push("/assistant"); }}
          disabled={isAwaitingReply}
          className="group/nav relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jm-primary text-[14px] font-semibold text-jm-onprimary transition-colors hover:bg-jm-hover disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t.newChat || "New Chat"}
        >
          <Plus className="h-4 w-4" />
          {showLabels ? <span>{t.newChat || "New Chat"}</span> : <Tip label={t.newChat || "New Chat"} />}
        </button>
      </div>

      <nav className="space-y-1 px-3" aria-label="Main">
        {MAIN_ROUTES.map((r) => <NavLink key={r.href} route={r} />)}
      </nav>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3">
        {showLabels && isAuthenticated && recent.length > 0 && (
          <>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-jm-text2">{t.recent || "Recent"}</p>
            <ul className="space-y-0.5">
              {recent.map((c) => {
                const active = pathname === "/assistant" && c.id === activeConversationId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => { if (c.id !== activeConversationId) void openConversation(c.id); router.push("/assistant"); }}
                      disabled={isAwaitingReply && c.id !== activeConversationId}
                      title={c.title}
                      aria-current={active ? "true" : undefined}
                      className={`h-9 w-full truncate rounded-lg px-2 text-left text-[13px] transition-colors disabled:opacity-60 ${active ? "bg-jm-soft font-medium text-jm-text" : "text-jm-text2 hover:bg-jm-muted hover:text-jm-text"}`}
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

      <div className="space-y-1 border-t border-jm-border p-3">
        <NavLink route={SETTINGS_ROUTE} />
        <UserMenu variant="sidebar" showLabels={showLabels} onNavigate={() => setMobileOpen(false)} />
      </div>
    </div>
  );

  return (
    <>
      <aside className={`sticky top-0 z-30 hidden h-screen shrink-0 transition-[width] duration-200 ease-out md:block ${collapsed ? "w-[72px]" : "w-[260px]"}`} aria-label="Sidebar">
        {content}
      </aside>
      <div className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileOpen}>
        <div onClick={() => setMobileOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute left-0 top-0 h-full w-[280px] max-w-[85vw] transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} role="dialog" aria-label="Navigation">
          {content}
        </aside>
      </div>
    </>
  );
}
