"use client";

import { useEffect } from "react";
import { useFarmerStore } from "@/store/useFarmerStore";

/**
 * Restores the signed-in user (profile + conversation history) from the
 * server session on every page load, and re-checks when the tab becomes
 * visible again so a sign-out in another tab is picked up.
 */
export default function AuthBootstrap() {
  useEffect(() => {
    useFarmerStore.getState().initAuth();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        useFarmerStore.getState().initAuth({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}
