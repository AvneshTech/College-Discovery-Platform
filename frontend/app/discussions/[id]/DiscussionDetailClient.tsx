"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ErrorState from "../../components/ErrorState";
import { API_BASE } from "../../utils/api";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../lib/AuthProvider";
import { useToast } from "../../components/Toast";
import { useSocket } from "../../hooks/useSocket";

type Answer = {
  id: number;
  body: string;
  author: { id: number; name: string };
  createdAt: string;
};
type Discussion = {
  id: number;
  title: string;
  body: string;
  tags?: string[];
  viewsCount?: number;
  author: { id: number; name: string };
  createdAt: string;
  answers: Answer[];
};

export default function DiscussionDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const socket = useSocket();

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [typingName, setTypingName] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDiscussion = async () => {
    setLoadError(false);
    try {
      const res = await fetch(`${API_BASE}/api/discussions/${id}`);
      if (!res.ok) {
        setDiscussion(null);
        return;
      }
      setDiscussion(await res.json());
    } catch {
      setDiscussion(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDiscussion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Realtime (Phase 9) ────────────────────────────────────────────────
  // Join the discussion room, append answers pushed by the server (deduped by
  // id so our own optimistic insert never doubles up), and show a typing pill.
  useEffect(() => {
    if (!id || !socket) return;
    const room = Number(id);

    const onConnect = () => {
      socket.emit("discussion:join", room);
      setLive(true);
    };
    if (socket.connected) onConnect();
    socket.on("connect", onConnect);
    socket.on("disconnect", () => setLive(false));

    const onNewAnswer = (answer: Answer) => {
      setDiscussion((d) =>
        d && !d.answers.some((a) => a.id === answer.id)
          ? { ...d, answers: [...d.answers, answer] }
          : d
      );
    };
    const onTyping = ({ name }: { name: string }) => {
      setTypingName(name);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(""), 2500);
    };

    socket.on("answer:new", onNewAnswer);
    socket.on("discussion:typing", onTyping);

    return () => {
      socket.emit("discussion:leave", room);
      socket.off("connect", onConnect);
      socket.off("answer:new", onNewAnswer);
      socket.off("discussion:typing", onTyping);
    };
  }, [id, socket]);

  const handleAnswer = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!answerBody.trim()) {
      setError("Answer cannot be empty");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/discussions/${id}/answers`, {
        method: "POST",
        body: JSON.stringify({ body: answerBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to post answer");
        return;
      }
      setAnswerBody("");
      toast.success("Answer posted");
      // Append immediately (deduped). If the socket also delivers it, the
      // dedupe-by-id guard keeps it from appearing twice.
      setDiscussion((d) =>
        d && !d.answers.some((a) => a.id === data.id) ? { ...d, answers: [...d.answers, data] } : d
      );
    } catch {
      setError("Failed to post answer");
    } finally {
      setSubmitting(false);
    }
  };

  const onType = () => {
    if (socket && user && id) socket.emit("discussion:typing", { discussionId: Number(id), name: user.name });
  };

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-4">
          <div className="skeleton h-40 w-full rounded-2xl" />
          <div className="skeleton h-24 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (loadError || !discussion) {
    return (
      <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-20">
          <ErrorState
            title="Discussion not found"
            message="This discussion may have been removed or flagged."
            onRetry={loadError ? fetchDiscussion : undefined}
          />
          <div className="mt-4 text-center">
            <button onClick={() => router.push("/discussions")} className="text-amber-600 hover:underline">
              ← Back to discussions
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/discussions")} className="text-sm text-amber-600 hover:underline">
            ← Back to Discussions
          </button>
          {live && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
          )}
        </div>

        {/* Question */}
        <div className="card p-8">
          <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">{discussion.title}</h1>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">{discussion.body}</p>
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {discussion.tags.map((t) => (
                <span key={t} className="badge badge-navy">#{t}</span>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span>👤 {discussion.author.name}</span>
            <span>👁 {discussion.viewsCount ?? 0} views</span>
            <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Answers */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            {discussion.answers.length} Answer{discussion.answers.length !== 1 ? "s" : ""}
          </h2>

          {discussion.answers.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">No answers yet. Be the first to answer!</div>
          ) : (
            <div className="space-y-4">
              {discussion.answers.map((answer, i) => (
                <div key={answer.id} className="card p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-500/15">
                      {i + 1}
                    </div>
                    <div>
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200">{answer.body}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                        <span>👤 {answer.author.name}</span>
                        <span>{new Date(answer.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {typingName && (
            <p className="mt-3 animate-pulse text-sm italic text-slate-400">{typingName} is typing…</p>
          )}
        </div>

        {/* Post Answer */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Your Answer</h3>
          <textarea
            placeholder={user ? "Write your answer here..." : "Login to answer..."}
            value={answerBody}
            onChange={(e) => {
              setAnswerBody(e.target.value);
              onType();
            }}
            rows={4}
            disabled={!user}
            className="input disabled:opacity-60"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <div className="mt-3">
            {user ? (
              <button onClick={handleAnswer} disabled={submitting} className="btn btn-primary">
                {submitting ? "Posting…" : "Post Answer"}
              </button>
            ) : (
              <button onClick={() => router.push("/login")} className="btn btn-primary">
                Login to Answer
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
