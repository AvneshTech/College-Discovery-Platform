"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import ErrorState from "../components/ErrorState";
import { API_BASE } from "../utils/api";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../lib/AuthProvider";
import { useToast } from "../components/Toast";

type Discussion = {
  id: number;
  title: string;
  body: string;
  tags?: string[];
  viewsCount?: number;
  author: { id: number; name: string };
  createdAt: string;
  _count: { answers: number };
};

type SortBy = "recent" | "trending" | "popular";

export default function DiscussionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [tag, setTag] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ page: String(page), sortBy });
      if (tag) params.set("tag", tag);
      const res = await fetch(`${API_BASE}/api/discussions?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      // FIX (§1): backend now returns { discussions, total, page, totalPages }
      // — not a bare array. Reading `data` directly used to crash the page.
      setDiscussions(data.discussions ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setLoadError(true);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, tag]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, tag]);

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (title.trim().length < 5 || body.trim().length < 10) {
      setError("Title needs 5+ characters and body needs 10+ characters.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
      const res = await apiFetch(`/api/discussions`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || "Failed to post question");
        return;
      }
      setTitle("");
      setBody("");
      setTagsInput("");
      setShowForm(false);
      toast.success("Question posted!");
      fetchDiscussions();
    } catch {
      setError("Failed to post question");
    } finally {
      setSubmitting(false);
    }
  };

  const SORTS: { id: SortBy; label: string }[] = [
    { id: "recent", label: "Recent" },
    { id: "trending", label: "Trending" },
    { id: "popular", label: "Popular" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">💬 Q&amp;A Discussions</h1>
            <p className="mt-1 text-slate-500">Ask questions, share experiences, help others</p>
          </div>
          <button
            onClick={() => {
              if (!user) {
                router.push("/login");
                return;
              }
              setShowForm((v) => !v);
            }}
            className="btn btn-accent"
          >
            + Ask Question
          </button>
        </div>

        {/* Sort + tag filter */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="tab-bar" role="tablist" aria-label="Sort discussions">
            {SORTS.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={sortBy === s.id}
                onClick={() => setSortBy(s.id)}
                className={`tab-item ${sortBy === s.id ? "active" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Filter by tag…"
            className="input !w-auto !py-2 !text-sm"
          />
          {tag && (
            <button onClick={() => setTag("")} className="text-xs font-medium text-amber-600 underline">
              clear tag
            </button>
          )}
          {!loading && !loadError && (
            <span className="ml-auto text-sm text-slate-500">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> discussions
            </span>
          )}
        </div>

        {/* Ask form */}
        {showForm && (
          <div className="card animate-fade-up mb-8 p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Ask a Question</h2>
            <input
              type="text"
              placeholder="Question title (min 5 characters)…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input mb-3"
            />
            <textarea
              placeholder="Describe your question in detail (min 10 characters)…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="input mb-3"
            />
            <input
              type="text"
              placeholder="Tags (comma-separated, optional) — e.g. JEE, CSE, hostel"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="input mb-3"
            />
            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
                {submitting ? "Posting…" : "Post Question"}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title="Couldn't load discussions"
            message="There was a problem reaching the server. Please try again."
            onRetry={fetchDiscussions}
          />
        ) : discussions.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="mb-3 text-xl">No discussions {tag ? "with that tag" : "yet"}</p>
            <p>Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((d) => (
              <div
                key={d.id}
                className="card cursor-pointer p-6 transition hover:shadow-md"
                onClick={() => router.push(`/discussions/${d.id}`)}
              >
                <h3 className="text-lg font-semibold text-slate-900 transition hover:text-amber-600 dark:text-white">
                  {d.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{d.body}</p>
                {d.tags && d.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.tags.map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTag(t);
                        }}
                        className="badge badge-navy hover:opacity-80"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span>👤 {d.author.name}</span>
                  <span>💬 {d._count.answers} answers</span>
                  <span>👁 {d.viewsCount ?? 0} views</span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && !loadError && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="px-3 text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
