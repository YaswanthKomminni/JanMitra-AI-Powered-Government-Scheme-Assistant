import { Home, MessageSquare, Landmark, Users, ScanLine, History, Settings } from "lucide-react";
import type { TabId } from "@/store/useFarmerStore";

export interface AppRoute {
  href: string;
  label: string;
  title: string;
  icon: React.ElementType;
  /** Legacy store tab this route corresponds to (kept in sync for store actions). */
  tab?: TabId;
}

export const MAIN_ROUTES: AppRoute[] = [
  { href: "/", label: "Home", title: "Home", icon: Home, tab: "dashboard" },
  { href: "/assistant", label: "AI Assistant", title: "AI Assistant", icon: MessageSquare, tab: "chat" },
  { href: "/schemes", label: "Explore Schemes", title: "Explore Schemes", icon: Landmark, tab: "schemes" },
  { href: "/peers", label: "Nearby Farmers", title: "Nearby Farmers", icon: Users, tab: "peers" },
  { href: "/documents", label: "Documents", title: "Documents", icon: ScanLine },
  { href: "/models", label: "Models & XAI", title: "Models & XAI", icon: ScanLine },
  { href: "/history", label: "Chat History", title: "Chat History", icon: History },
];

export const SETTINGS_ROUTE: AppRoute = { href: "/settings", label: "Settings", title: "Settings", icon: Settings };

export const ALL_ROUTES = [...MAIN_ROUTES, SETTINGS_ROUTE];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function routeForPath(pathname: string): AppRoute | undefined {
  return ALL_ROUTES.find((r) => isActivePath(pathname, r.href));
}

export function pathForTab(tab: TabId): string | null {
  return MAIN_ROUTES.find((r) => r.tab === tab)?.href ?? (tab === "verify" ? "/documents" : null);
}
