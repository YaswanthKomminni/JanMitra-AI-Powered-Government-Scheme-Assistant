"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Landmark, ScanLine, History, Users, ArrowRight, Sparkles } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { useSchemes } from "@/hooks/useSchemes";
import { translations } from "@/lib/i18n";
import { PageContainer, EmptyState, LoadingState, ErrorState, primaryBtn, secondaryBtn } from "@/components/PageKit";
import { relativeTime } from "@/components/ConversationSidebar";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, authStatus, currentFarmer, conversations, conversationsLoading, openConversation, setSelectedScheme, authNotice, language } = useFarmerStore();
  const { schemes, loading, error, reload } = useSchemes();

  const t = translations[language] || translations.en;

  const quickActions = [
    { href: "/assistant", icon: MessageSquare, title: t.navAssistant || "Ask AI Assistant", desc: t.chatSubtitle || "Ask about schemes in your language, by text or voice." },
    { href: "/schemes", icon: Landmark, title: t.navSchemes || "Explore Schemes", desc: t.recommendedSchemesSubtitle || "Browse and filter government schemes." },
    { href: "/documents", icon: ScanLine, title: t.navDocuments || "Check Documents", desc: t.documentsSubtitle || "See what you need and scan a document." },
    { href: "/peers", icon: Users, title: t.navPeers || "Nearby Farmers", desc: t.peersSubtitle || "See what worked for farmers near you." },
  ];

  const firstName = isAuthenticated ? (currentFarmer.name || "").split(" ")[0] : "";
  const top = [...schemes].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);

  return (
    <PageContainer>
      {authNotice && (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <span>{authNotice}</span>
          <button onClick={() => useFarmerStore.setState({ authNotice: null })} className="rounded-lg px-2 py-1 hover:bg-amber-100">Dismiss</button>
        </div>
      )}

      <section className="rounded-2xl border border-jm-border bg-jm-surface p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-jm-text sm:text-[28px]">
          {firstName ? `${t.welcome || "Namaste"}, ${firstName}` : (t.appName || "JanMitra")}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-jm-text2">
          {t.appTagline || "JanMitra helps you discover government schemes you may qualify for, understand the benefits and required documents, and get answers in your own language."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/assistant" className={primaryBtn}><Sparkles className="h-4 w-4" /> {t.navAssistant || "Ask JanMitra AI"}</Link>
          <Link href="/schemes" className={secondaryBtn}>{t.navSchemes || "Explore Schemes"}</Link>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Quick actions">
        {quickActions.map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="group flex h-full flex-col rounded-2xl border border-jm-border bg-jm-surface p-5 transition-colors hover:border-jm-primary/50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-jm-soft text-jm-primary"><Icon className="h-5 w-5" /></span>
            <h3 className="mt-3 text-[15px] font-semibold text-jm-text">{title}</h3>
            <p className="mt-1 text-sm text-jm-text2">{desc}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="rec-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="rec-h" className="text-lg font-semibold text-jm-text">Recommended schemes</h2>
            <Link href="/schemes" className="inline-flex items-center gap-1 text-sm font-medium text-jm-primary hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {loading ? <LoadingState label="Loading schemes…" /> : error ? <ErrorState message={error} onRetry={reload} /> : top.length === 0 ? (
            <EmptyState icon={Landmark} title="No schemes available yet" description="Schemes will appear here once they are available." />
          ) : (
            <div className="space-y-3">
              {top.map((s) => (
                <article key={s.id} className="rounded-2xl border border-jm-border bg-jm-surface p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-jm-border bg-jm-muted px-2.5 py-1 text-jm-text2">{s.categoryName}</span>
                    {s.code && <span className="text-jm-text2">{s.code}</span>}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-jm-text">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-jm-text2">{s.description}</p>
                  {s.eligibilitySummary && <p className="mt-2 line-clamp-2 text-sm text-jm-text"><span className="font-medium">Eligibility: </span>{s.eligibilitySummary}</p>}
                  <button onClick={() => setSelectedScheme(s)} className="mt-3 inline-flex h-9 items-center rounded-lg border border-jm-border px-3 text-sm font-medium text-jm-text hover:bg-jm-muted">View Details</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2" aria-labelledby="act-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="act-h" className="text-lg font-semibold text-jm-text">Recent activity</h2>
            {isAuthenticated && conversations.length > 0 && <Link href="/history" className="text-sm font-medium text-jm-primary hover:underline">See all</Link>}
          </div>
          {authStatus === "unknown" || conversationsLoading ? <LoadingState /> : !isAuthenticated ? (
            <EmptyState icon={History} title="Sign in to see your activity" description="Your conversations are saved to your account." action={<button className={primaryBtn} onClick={() => useFarmerStore.getState().setAuthModalOpen(true, "login")}>Sign in</button>} />
          ) : conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" description="Ask the assistant a question to get started." action={<Link href="/assistant" className={primaryBtn}>Ask JanMitra AI</Link>} />
          ) : (
            <ul className="divide-y divide-jm-border rounded-2xl border border-jm-border bg-jm-surface">
              {conversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button onClick={() => { void openConversation(c.id); router.push("/assistant"); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-jm-muted">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-jm-text">{c.title}</span>
                      <span className="block text-xs text-jm-text2">{relativeTime(c.updatedAt)}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-jm-text2" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
