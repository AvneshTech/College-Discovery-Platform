"use client";

// app/components/NotificationBell.tsx
// ---------------------------------------------------------------------------
// Phase 3 + 6 — notification bell with unread badge, dropdown, mark-read /
// mark-all-read, empty state, and LIVE updates via the shared socket
// (`notification:new` on the user's personal room). Falls back to a poll-on-open
// fetch so it works even if the socket is briefly disconnected.
//
// Backend contract:
//   GET   /api/notifications            -> { items, unreadCount, page, limit }
//   PATCH /api/notifications/:id/read
//   PATCH /api/notifications/read-all

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, MessageSquare, Tag, Calendar, Info } from "lucide-react";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../lib/AuthProvider";
import { useSocket } from "../hooks/useSocket";

type Notification = {
  id: number;
  type: "REPLY" | "SAVE_PRICE_DROP" | "DEADLINE_REMINDER" | "SYSTEM";
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON = {
  REPLY: MessageSquare,
  SAVE_PRICE_DROP: Tag,
  DEADLINE_REMINDER: Calendar,
  SYSTEM: Info,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const socket = useSocket();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications?limit=15");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setUnread(data.unreadCount ?? 0);
      }
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial unread count + list once the user is known.
  useEffect(() => {
    if (user) load();
    else {
      setItems([]);
      setUnread(0);
    }
  }, [user, load]);

  // Live push: prepend new notifications and bump the unread badge.
  useEffect(() => {
    if (!user || !socket) return;
    const handler = (payload: Notification) => {
      setItems((prev) => [payload, ...prev].slice(0, 20));
      setUnread((c) => c + 1);
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [user, socket]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const markRead = async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      /* optimistic — ignore */
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
    } catch {
      /* optimistic — ignore */
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="theme-toggle relative"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell size={26} className="text-slate-300" />
                <p className="text-sm text-slate-400">You&apos;re all caught up</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const body = (
                  <div
                    className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      n.isRead ? "" : "bg-amber-50/50 dark:bg-amber-500/5"
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                      setOpen(false);
                    }}
                    className="block"
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className="block w-full text-left"
                  >
                    {body}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
