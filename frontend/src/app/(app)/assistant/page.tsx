"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import ChatAssistant from "@/components/ChatAssistant";
import { useFarmerStore } from "@/store/useFarmerStore";
import { PageContainer, EmptyState, LoadingState, primaryBtn } from "@/components/PageKit";

export default function AssistantPage() {
  const { isAuthenticated, authStatus, setAuthModalOpen } = useFarmerStore();

  if (authStatus === "unknown") return <PageContainer><LoadingState label="Checking your sign-in…" /></PageContainer>;
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState
          icon={MessageSquare}
          title="Sign in to chat with JanMitra AI"
          description="Your conversations are saved to your account so you can continue where you left off."
          action={<button className={primaryBtn} onClick={() => setAuthModalOpen(true, "login")}>Sign in</button>}
        />
      </PageContainer>
    );
  }
  return (
    <div className="mx-auto w-full max-w-[1400px] p-3 sm:p-4 lg:p-6">
      <ChatAssistant variant="full" />
    </div>
  );
}
