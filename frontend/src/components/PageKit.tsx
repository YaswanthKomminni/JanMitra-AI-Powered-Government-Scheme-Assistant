"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export function PageContainer({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 ${wide ? "max-w-[1400px]" : "max-w-[1100px]"}`}>
      {children}
    </div>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-jm-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-jm-text2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon?: React.ElementType; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-jm-border bg-jm-surface px-6 py-12 text-center">
      {Icon && (
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-jm-soft text-jm-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-base font-semibold text-jm-text">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-jm-text2">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-jm-text2">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertCircle className="h-6 w-6 text-red-600" />
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="h-9 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-800 hover:bg-red-100">
          Try again
        </button>
      )}
    </div>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-jm-primary text-jm-onprimary text-sm font-semibold hover:bg-jm-hover transition-colors disabled:opacity-60";
export const secondaryBtn =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-jm-border bg-jm-surface text-jm-text text-sm font-semibold hover:bg-jm-muted transition-colors";
