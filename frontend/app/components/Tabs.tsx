"use client";

// app/components/Tabs.tsx
// Phase 13 — accessible tab-bar primitive. Renders a proper
// role="tablist" / role="tab" / aria-selected group with arrow-key navigation,
// so screen readers announce it as a single tab group instead of N unrelated
// buttons. Reused on the college detail page and the admin panel.

import { useRef } from "react";

export type TabItem<T extends string = string> = {
  id: T;
  label: React.ReactNode;
};

type Props<T extends string> = {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Visual variant: "underline" (detail page) or "pill" (admin). */
  variant?: "underline" | "pill";
  className?: string;
  ariaLabel?: string;
};

export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = "underline",
  className = "",
  ariaLabel = "Tabs",
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (idx + dir + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  if (variant === "pill") {
    return (
      <div role="tablist" aria-label={ariaLabel} className={`tab-bar ${className}`}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`tabpanel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`tab-item ${active === t.id ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-0 overflow-x-auto ${className}`}
    >
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`tabpanel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-semibold capitalize transition ${
            active === t.id
              ? "border-blue-600 text-blue-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
