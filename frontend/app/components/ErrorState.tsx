"use client";

// app/components/ErrorState.tsx
// Phase 14 — shared error state (icon + message + retry), used anywhere a
// catch block previously degraded silently into an "empty" state. This makes a
// real network/server failure visually distinct from "no results".

import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Please check your connection and try again.",
  onRetry,
  className = "",
}: Props) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center dark:border-red-500/20 dark:bg-red-500/5 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15">
        <AlertTriangle size={26} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary btn-sm">
          <RotateCcw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
