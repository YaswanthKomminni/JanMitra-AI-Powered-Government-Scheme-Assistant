"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Landmark } from "lucide-react";
import SchemeCard from "@/components/SchemeCard";
import { useSchemes } from "@/hooks/useSchemes";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { PageContainer, PageTitle, EmptyState, LoadingState, ErrorState, secondaryBtn } from "@/components/PageKit";

type Sort = "match" | "name";

export default function SchemesPage() {
  const language = useFarmerStore((s) => s.language);
  const t = translations[language] || translations.en;

  const { schemes, loading, error, reload } = useSchemes();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("match");
  const [visible, setVisible] = useState(24);
  const [state, setState] = useState("all");
  const states = useMemo(() => Array.from(new Set(schemes.map(s => s.jurisdiction).filter((s): s is string => !!s && !s.startsWith("Central")))).sort(), [schemes]);
  useEffect(() => setVisible(24), [query, category, state, sort]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    schemes.forEach((s) => map.set(s.categoryName, s.categoryName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [schemes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schemes
      .filter((s) => category === "all" || s.categoryName === category)
      .filter(s => state === "all" || s.jurisdiction === state || !s.jurisdiction || s.jurisdiction.startsWith("Central"))
      .filter((s) => !q || [s.name, s.code, s.description, s.categoryName, s.department].some((f) => (f || "").toLowerCase().includes(q)))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.matchScore - a.matchScore));
  }, [schemes, query, category, sort, state]);

  const chip = (active: boolean) =>
    `h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${active ? "border-jm-primary bg-jm-primary text-jm-onprimary" : "border-jm-border bg-jm-surface text-jm-text2 hover:bg-jm-muted"}`;

  return (
    <PageContainer wide>
      <PageTitle
        title={t.navSchemes || "Explore Schemes"}
        description={t.recommendedSchemesSubtitle || "Browse agriculture and welfare support across India. These are saved listings; confirm current rules before applying."}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-text2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by scheme name or keyword"
            aria-label="Search schemes"
            className="h-10 w-full rounded-lg border border-jm-border bg-jm-surface pl-9 pr-3 text-sm text-jm-text placeholder:text-jm-text2 focus:border-jm-primary focus:outline-none"
          />
        </div>
        <select value={state} onChange={e => setState(e.target.value)} aria-label="Filter by state" className="h-10 rounded-lg border border-jm-border bg-jm-surface px-3 text-sm text-jm-text">
          <option value="all">All states</option>{states.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort schemes" className="h-10 rounded-lg border border-jm-border bg-jm-surface px-3 text-sm text-jm-text">
          <option value="match">Best match</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
        <button className={chip(category === "all")} onClick={() => setCategory("all")}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={chip(category === c.id)} onClick={() => setCategory(c.id)}>{c.name}</button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading schemes…" /> : error ? <ErrorState message={error} onRetry={reload} /> : results.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No schemes match your search"
          description="Try a different keyword or clear the filters."
          action={<button className={secondaryBtn} onClick={() => { setQuery(""); setCategory("all"); setState("all"); }}>Clear filters</button>}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-jm-text2">{results.length} scheme{results.length === 1 ? "" : "s"}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-5">
            {results.slice(0, visible).map((s) => <SchemeCard key={s.id} scheme={s} />)}
          </div>
          {visible < results.length && <div className="mt-6 text-center"><button className={secondaryBtn} onClick={() => setVisible(n => n + 24)}>Show 24 more schemes</button><p className="mt-2 text-xs text-jm-text2">Showing {Math.min(visible, results.length)} of {results.length}</p></div>}
        </>
      )}
    </PageContainer>
  );
}
