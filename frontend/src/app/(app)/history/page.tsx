"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { History, Plus, Trash2, MessageSquare } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { relativeTime } from "@/components/ConversationSidebar";
import { PageContainer, PageTitle, EmptyState, LoadingState, ErrorState, primaryBtn, secondaryBtn } from "@/components/PageKit";

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, authStatus, conversations, conversationsLoading, conversationsError, loadConversations, openConversation, startNewConversation, deleteConversation, setAuthModalOpen, isAwaitingReply, language } = useFarmerStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language] || translations.en;

  if (authStatus === "unknown") return <PageContainer><LoadingState /></PageContainer>;
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState icon={History} title="Sign in to see your chat history" description="Conversations are saved to your account." action={<button className={primaryBtn} onClick={() => setAuthModalOpen(true, "login")}>Sign in</button>} />
      </PageContainer>
    );
  }

  const open = async (id: string) => { await openConversation(id); router.push("/assistant"); };
  const remove = async (id: string) => {
    setBusyId(id); setError(null);
    const r = await deleteConversation(id);
    setBusyId(null); setConfirmId(null);
    if (!r.success) setError(r.message);
  };

  return (
    <PageContainer>
      <PageTitle
        title={t.navHistory || "Chat History"}
        description="Open a previous conversation to continue where you left off."
        actions={<button className={primaryBtn} onClick={() => { startNewConversation(); router.push("/assistant"); }}><Plus className="h-4 w-4" /> {t.newChat || "New conversation"}</button>}
      />
      {error && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {conversationsLoading ? <LoadingState /> : conversationsError ? <ErrorState message={conversationsError} onRetry={() => loadConversations()} /> : conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No conversations yet" description="Start a conversation with the assistant and it will appear here." action={<button className={primaryBtn} onClick={() => router.push("/assistant")}>Ask JanMitra AI</button>} />
      ) : (
        <ul className="divide-y divide-jm-border rounded-2xl border border-jm-border bg-jm-surface">
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => open(c.id)} disabled={isAwaitingReply} className="min-w-0 flex-1 text-left disabled:opacity-60">
                <span className="block truncate text-sm font-medium text-jm-text">{c.title}</span>
                {c.lastMessage && <span className="block truncate text-xs text-jm-text2">{c.lastMessage}</span>}
                <span className="block text-xs text-jm-text2">{relativeTime(c.updatedAt)} · {c.messageCount} message{c.messageCount === 1 ? "" : "s"}</span>
              </button>
              {confirmId === c.id ? (
                <span className="flex shrink-0 items-center gap-2">
                  <button onClick={() => remove(c.id)} disabled={busyId === c.id} className="h-9 rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">{busyId === c.id ? "Deleting…" : "Delete"}</button>
                  <button onClick={() => setConfirmId(null)} className={secondaryBtn + " !h-9"}>Cancel</button>
                </span>
              ) : (
                <button onClick={() => setConfirmId(c.id)} aria-label={`Delete conversation ${c.title}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-jm-text2 hover:bg-jm-muted hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
