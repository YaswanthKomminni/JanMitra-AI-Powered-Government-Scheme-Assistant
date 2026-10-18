"use client";

import React, { useState } from "react";
import { History, Loader2, MessageSquarePlus, MessageSquareText, RefreshCw, Trash2, X, AlertCircle } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";

export function relativeTime(isoDate: string): string {
  const t = new Date(isoDate).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(t).toLocaleDateString([], { day: "numeric", month: "short", year: days > 300 ? "numeric" : undefined });
}

/** The signed-in user's conversation history: new chat, open, switch, delete. */
export default function ConversationSidebar({ onSelect }: { onSelect?: () => void }) {
  const {
    conversations,
    conversationsLoading,
    conversationsError,
    activeConversationId,
    openConversation,
    startNewConversation,
    deleteConversation,
    loadConversations,
    isAwaitingReply,
  } = useFarmerStore();

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    const result = await deleteConversation(id);
    setDeletingId(null);
    setConfirmId(null);
    if (!result.success) setDeleteError(result.message);
  };

  return (
    <aside className="flex flex-col h-full bg-stone-50 border-r border-stone-200" aria-label="Conversation history">
      <div className="p-3 border-b border-stone-200 space-y-2">
        <button
          onClick={() => {
            startNewConversation();
            onSelect?.();
          }}
          disabled={isAwaitingReply}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-sm shadow-sm transition active:scale-98"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Your conversations
          </span>
          <button
            onClick={() => loadConversations()}
            className="p-1 rounded-lg text-stone-500 hover:bg-stone-200 hover:text-stone-800"
            title="Refresh"
            aria-label="Refresh conversations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${conversationsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversationsError && (
          <div className="m-1 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-bold text-red-800 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{conversationsError}</span>
          </div>
        )}
        {deleteError && (
          <div className="m-1 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-bold text-red-800 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{deleteError}</span>
            <button onClick={() => setDeleteError(null)} aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {conversationsLoading && conversations.length === 0 ? (
          <div className="space-y-2 p-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-stone-200/70 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 && !conversationsError ? (
          <div className="text-center px-3 py-8 text-xs text-stone-500">
            <MessageSquareText className="w-7 h-7 mx-auto mb-2 text-stone-300" />
            No conversations yet. Ask your first question — it will be saved here.
          </div>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeConversationId;
            const confirming = confirmId === c.id;
            return (
              <div
                key={c.id}
                className={`group relative rounded-xl border transition ${
                  active ? "bg-emerald-50 border-emerald-300" : "bg-white border-transparent hover:border-stone-200"
                }`}
              >
                {confirming ? (
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-stone-800 mb-2">Delete this conversation? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-1"
                      >
                        {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (!active) openConversation(c.id);
                        onSelect?.();
                      }}
                      disabled={isAwaitingReply && !active}
                      className="w-full text-left p-2.5 pr-9 disabled:opacity-60"
                      aria-current={active ? "true" : undefined}
                    >
                      <p className={`text-xs font-black truncate ${active ? "text-emerald-950" : "text-stone-800"}`}>{c.title}</p>
                      {c.lastMessage && <p className="text-[11px] text-stone-500 truncate mt-0.5">{c.lastMessage}</p>}
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {relativeTime(c.updatedAt)} • {c.messageCount} {c.messageCount === 1 ? "message" : "messages"}
                      </p>
                    </button>
                    <button
                      onClick={() => setConfirmId(c.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition"
                      title="Delete conversation"
                      aria-label={`Delete conversation ${c.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
