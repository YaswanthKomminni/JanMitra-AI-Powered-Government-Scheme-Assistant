export type ThemeId = "neon-porcelain" | "quantum-blue" | "clay-brown" | "signal-violet" | "forest-graphite";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  primary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  onPrimary: string;
  isDefault?: boolean;
}

export const DEFAULT_THEME: ThemeId = "neon-porcelain";

export const THEMES: ThemeDef[] = [
  { id: "neon-porcelain", name: "Neon Porcelain", description: "Warm, modern, clean, welcoming.", primary: "#FF6115", background: "#FFFCF4", surface: "#FFFFFF", text: "#20201E", border: "#E9E4DA", onPrimary: "#FFFFFF", isDefault: true },
  { id: "quantum-blue", name: "Quantum Blue + Iceglass", description: "Futuristic, bold, technical, high contrast.", primary: "#B6FF2E", background: "#23262F", surface: "#2C303B", text: "#F5F6F8", border: "#3B404C", onPrimary: "#14170C" },
  { id: "clay-brown", name: "Clay Brown + Soft Butter", description: "Earthy, calm, warm, approachable.", primary: "#6B252A", background: "#FFF1A6", surface: "#FFF8D1", text: "#33201F", border: "#E7D78D", onPrimary: "#FFFFFF" },
  { id: "signal-violet", name: "Signal Violet + Mist Gray", description: "Elegant, contemporary, sophisticated.", primary: "#7A35FF", background: "#F0F2F5", surface: "#FFFFFF", text: "#22232A", border: "#DCE0E7", onPrimary: "#FFFFFF" },
  { id: "forest-graphite", name: "Forest Graphite + Acid Mint", description: "Premium, natural, sophisticated, modern.", primary: "#B7FF72", background: "#18251D", surface: "#223128", text: "#F0F5EF", border: "#34463A", onPrimary: "#0F1A12" },
];

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

/** Non-secret, per-user key. Anonymous/guests share the "guest" key. */
export const themeStorageKey = (userId?: string | null) => `janmitra:theme:${userId || "guest"}`;
export const LAST_THEME_KEY = "janmitra:theme:last";

export function readTheme(userId?: string | null): ThemeId {
  try {
    const v = localStorage.getItem(themeStorageKey(userId));
    return isThemeId(v) ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);
}
