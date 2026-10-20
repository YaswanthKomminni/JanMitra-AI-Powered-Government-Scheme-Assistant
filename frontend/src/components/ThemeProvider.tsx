"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useFarmerStore } from "@/store/useFarmerStore";
import {
  DEFAULT_THEME, LAST_THEME_KEY, ThemeId, applyTheme, isThemeId, readTheme, themeStorageKey,
} from "@/lib/themes";

const Ctx = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});
export const useTheme = () => useContext(Ctx);

/** Per-user theme preference (client-side, non-secret). Defaults to Neon Porcelain. */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const userId = useFarmerStore((s) => (s.isAuthenticated ? s.currentFarmer.id : null));
  const authStatus = useFarmerStore((s) => s.authStatus);
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  // Before auth resolves, show the last-used theme on this device (avoids a flash);
  // once resolved, use the preference scoped to the current user (or guest).
  useEffect(() => {
    if (authStatus === "unknown") {
      try {
        const last = localStorage.getItem(LAST_THEME_KEY);
        const t = isThemeId(last) ? last : DEFAULT_THEME;
        setThemeState(t);
        applyTheme(t);
      } catch { /* ignore */ }
      return;
    }
    const t = readTheme(userId);
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(LAST_THEME_KEY, t); } catch { /* ignore */ }
  }, [userId, authStatus]);

  const setTheme = useCallback(
    (t: ThemeId) => {
      if (!isThemeId(t)) return;
      setThemeState(t);
      applyTheme(t);
      try {
        localStorage.setItem(themeStorageKey(userId), t);
        localStorage.setItem(LAST_THEME_KEY, t);
      } catch { /* storage unavailable */ }
    },
    [userId]
  );

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}
