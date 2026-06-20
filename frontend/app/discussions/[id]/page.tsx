"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { API_BASE } from "../../utils/api";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../lib/AuthProvider";

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
  author: { id: number; name: string };
  createdAt: string;
  answers: Answer[];
};

export default function DiscussionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchDiscussion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/discussions/${id}`);
      const data = await res.json();
      if (!res.ok) { setDiscussion(null); return; }
      setDiscussion(data);
    } catch { setDiscussion(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchDiscussion(); }, [id]);

  const handleAnswer = async () => {
    if (!user) { router.push("/login"); return; }
    if (!answerBody.trim()) { setError("Answer cannot be empty"); return; }

    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/discussions/${id}/answers`, {
        method: "POST",
        body: JSON.stringify({ body: answerBody }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setAnswerBody("");
      fetchDiscussion();
    } catch { setError("Failed to post answer"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return <main className="min-h-screen bg-gray-100"><Navbar /><div className="text-center mt-20 text-slate-600 animate-pulse">Loading...</div></main>;
  }

  if (!discussion) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center mt-20 text-slate-600">
          <p className="text-xl font-bold mb-3">Discussion not found</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">← Go back</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <button onClick={() => router.push("/discussions")} className="text-blue-600 hover:underline text-sm">
          ← Back to Discussions
        </button>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{discussion.title}</h1>
          <p className="text-slate-700 leading-relaxed">{discussion.body}</p>
          <div className="flex items-center gap-4 mt-5 text-sm text-slate-400">
            <span>👤 {discussion.author.name}</span>
            <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Answers */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {discussion.answers.length} Answer{discussion.answers.length !== 1 ? "s" : ""}
          </h2>

          {discussion.answers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-slate-500">
              No answers yet. Be the first to answer!
            </div>
          ) : (
            <div className="space-y-4">
              {discussion.answers.map((answer, i) => (
                <div key={answer.id} className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-slate-700 leading-relaxed">{answer.body}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>👤 {answer.author.name}</span>
                        <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Answer */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Your Answer</h3>
          <textarea
            placeholder={user ? "Write your answer here..." : "Login to answer..."}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            rows={4}
            disabled={!user}
            className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-3">
            {user ? (
              <button
                onClick={handleAnswer}
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {submitting ? "Posting..." : "Post Answer"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Login to Answer
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
