"use client";

import { useCallback, useEffect, useState } from "react";
import type { Scheme } from "@/lib/mockData";

let cache: Scheme[] | null = null;

/** Loads the public saved scheme catalog without exposing model vectors. */
export function useSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schemes");
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.schemes)) throw new Error("Unexpected response");
      cache = data.schemes as Scheme[];
      setSchemes(cache);
    } catch {
      setError("Could not load schemes. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cache) void load();
  }, [load]);

  return { schemes, loading, error, reload: load };
}
