"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE } from "../utils/api";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../lib/AuthProvider";

type Discussion = {
  id: number;
  title: string;
  body: string;
  author: { id: number; name: string };
  createdAt: string;
  _count: { answers: number };
};

export default function DiscussionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/discussions`);
      const data = await res.json();
      setDiscussions(data);
    } catch { console.error("Failed to fetch discussions"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDiscussions(); }, []);

  const handleSubmit = async () => {
    if (!user) { router.push("/login"); return; }
    if (!title.trim() || !body.trim()) { setError("Both fields are required"); return; }

    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/discussions`, {
        method: "POST",
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setTitle("");
      setBody("");
      setShowForm(false);
      fetchDiscussions();
    } catch { setError("Failed to post question"); }
    finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="max-w-4xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">💬 Q&amp;A Discussions</h1>
            <p className="text-slate-500 mt-1">Ask questions, share experiences, help others</p>
          </div>
          <button
            onClick={() => {
              if (!user) { router.push("/login"); return; }
              setShowForm(!showForm);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-semibold"
          >
            + Ask Question
          </button>
        </div>

        {/* Ask Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Ask a Question</h2>
            <input
              type="text"
              placeholder="Question title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Describe your question in detail..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Question"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-slate-600 animate-pulse">Loading discussions...</div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-xl mb-3">No discussions yet</p>
            <p>Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/discussions/${d.id}`)}
              >
                <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition">
                  {d.title}
                </h3>
                <p className="text-slate-500 text-sm mt-1 line-clamp-2">{d.body}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                  <span>👤 {d.author.name}</span>
                  <span>💬 {d._count.answers} answers</span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
