"use client";

import React from "react";
import AppSidebar from "@/components/AppSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-jm-bg text-jm-text">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
