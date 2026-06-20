"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { API_BASE } from "../../utils/api";
import { apiFetch } from "../../lib/apiClient";
import { isLoggedIn } from "../../utils/auth";

type Review = {
  id: number;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string;
  user: { name: string };
};

type Deadline = {
  id: number;
  title: string;
  date: string;
  notes?: string | null;
};

// Mirrors the shape returned by the backend GET /api/colleges/:id
// (collegesRepository.findById) and the Prisma College model.
type College = {
  id: number;
  name: string;
  city: string;
  state?: string | null;
  type?: string | null;
  rating: number;
  reviewCount?: number;
  nirfRank?: number | null;
  naacGrade?: string | null;
  fees?: number | null;
  feesDisplay?: string | null;
  avgPackage?: number | null;
  highestPackage?: number | null;
  placementRate?: number | null;
  courses?: string[];
  branches?: string[];
  overview?: string | null;
  website?: string | null;
  established?: number | null;
  reviews?: Review[];
  deadlines?: Deadline[];
};

// Format an annual-package figure (INR) into a compact, honest label.
// Returns "—" when there's no real data instead of inventing a number.
function formatINR(amount?: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CollegeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "placements" | "reviews">(
    "overview"
  );

  // Review form state
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState("");
  const [revBody, setRevBody] = useState("");
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revError, setRevError] = useState("");

  const loadCollege = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/colleges/${id}`);
      const data = await res.json();
      if (!res.ok) { setCollege(null); return; }
      setCollege(data);
    } catch { setCollege(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) loadCollege(); }, [id, loadCollege]);

  // Reflect the real saved state on load (instead of always starting "unsaved").
  useEffect(() => {
    if (!id || !isLoggedIn()) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/users/me/saved`);
        if (!res.ok) return;
        const list: { id: number }[] = await res.json();
        setSaved(list.some((c) => c.id === Number(id)));
      } catch { /* non-blocking */ }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    setSaveLoading(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const res = await apiFetch(`/api/users/me/saved/${id}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) setSaved(!next); // revert on failure
    } catch {
      setSaved(!next);
    } finally {
      setSaveLoading(false);
    }
  };

  const submitReview = async () => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    if (revBody.trim().length < 5) { setRevError("Please write at least 5 characters"); return; }
    setRevError("");
    setRevSubmitting(true);
    try {
      const res = await apiFetch(`/api/colleges/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: revRating,
          title: revTitle.trim() || undefined,
          body: revBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRevError(data.errors?.[0]?.message || data.message || "Failed to submit review");
        return;
      }
      setRevTitle("");
      setRevBody("");
      setRevRating(5);
      await loadCollege(); // refresh reviews + aggregate rating
    } catch {
      setRevError("Network error — please try again");
    } finally {
      setRevSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center mt-20 text-slate-600 text-lg animate-pulse">Loading...</div>
      </main>
    );
  }

  if (!college) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center mt-20 text-slate-600">
          <p className="text-2xl font-bold mb-4">College not found</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  const courseList = college.courses ?? [];
  const reviews = college.reviews ?? [];
  const deadlines = college.deadlines ?? [];
  const tabs = ["overview", "courses", "placements", "reviews"] as const;

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-200 hover:text-white text-sm mb-4 block"
          >
            ← Back to colleges
          </button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{college.name}</h1>
              <div className="flex flex-wrap gap-4 text-blue-100 mt-2">
                <span>📍 {college.city}{college.state ? `, ${college.state}` : ""}</span>
                <span>⭐ {college.rating} / 5.0</span>
                {college.feesDisplay && <span>💰 {college.feesDisplay}</span>}
                {college.nirfRank && <span>🏅 NIRF #{college.nirfRank}</span>}
                {college.naacGrade && <span>🎖 NAAC {college.naacGrade}</span>}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                saved
                  ? "bg-white text-blue-600 hover:bg-blue-50"
                  : "bg-blue-500 text-white hover:bg-blue-400 border border-blue-300"
              }`}
            >
              {saveLoading ? "..." : saved ? "✓ Saved" : "🔖 Save College"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold capitalize transition border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <section className="max-w-5xl mx-auto py-8 px-6">
        {activeTab === "overview" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About {college.name}</h2>
            {college.overview ? (
              <p className="text-slate-700 leading-relaxed text-base">{college.overview}</p>
            ) : (
              <p className="text-slate-400 italic">No overview available yet.</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{college.rating}</p>
                <p className="text-slate-600 text-sm mt-1">Overall Rating</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{courseList.length}</p>
                <p className="text-slate-600 text-sm mt-1">Programs</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{formatINR(college.avgPackage)}</p>
                <p className="text-slate-600 text-sm mt-1">Avg Package</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{formatINR(college.highestPackage)}</p>
                <p className="text-slate-600 text-sm mt-1">Highest Package</p>
              </div>
            </div>

            {(college.website || college.established) && (
              <div className="flex flex-wrap gap-6 mt-6 text-sm text-slate-600">
                {college.established && <span>📅 Established {college.established}</span>}
                {college.type && <span>🏛 {college.type}</span>}
                {college.website && (
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🔗 Official Website
                  </a>
                )}
              </div>
            )}

            {deadlines.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Admission Deadlines</h3>
                <ul className="space-y-2">
                  {deadlines.map((d) => (
                    <li key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-slate-700">{d.title}</span>
                      <span className="text-slate-500 text-sm">{new Date(d.date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "courses" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Courses Offered</h2>
            {courseList.length === 0 ? (
              <p className="text-slate-400 italic">No course information available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseList.map((course) => (
                  <div
                    key={course}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-blue-50 transition"
                  >
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                      🎓
                    </span>
                    <p className="font-semibold text-slate-900">{course}</p>
                  </div>
                ))}
              </div>
            )}

            {college.branches && college.branches.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Branches</h3>
                <div className="flex flex-wrap gap-2">
                  {college.branches.map((b) => (
                    <span key={b} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "placements" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Placement Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold">{formatINR(college.avgPackage)}</p>
                <p className="text-green-100 mt-2">Average Package</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold">{formatINR(college.highestPackage)}</p>
                <p className="text-blue-100 mt-2">Highest Package</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold">
                  {college.placementRate != null ? `${college.placementRate}%` : "—"}
                </p>
                <p className="text-purple-100 mt-2">Placement Rate</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Student Reviews{college.reviewCount ? ` (${college.reviewCount})` : ""}
            </h2>

            {/* Write a review */}
            <div className="border border-slate-200 rounded-xl p-5 mb-6 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3">Write a Review</h3>
              {isLoggedIn() ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRevRating(n)}
                        aria-label={`${n} star`}
                        className={`text-2xl leading-none ${n <= revRating ? "text-yellow-400" : "text-slate-300"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-500">{revRating}/5</span>
                  </div>
                  <input
                    type="text"
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={revBody}
                    onChange={(e) => setRevBody(e.target.value)}
                    rows={3}
                    placeholder="Share your experience..."
                    className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {revError && <p className="text-red-500 text-sm">{revError}</p>}
                  <button
                    onClick={submitReview}
                    disabled={revSubmitting}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                  >
                    {revSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  <button onClick={() => router.push("/login")} className="text-blue-600 font-semibold hover:underline">
                    Log in
                  </button>{" "}
                  to write a review.
                </p>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-slate-400 italic">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{review.user.name}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-yellow-400 text-lg">
                        {"⭐".repeat(Math.round(review.rating))}
                      </div>
                    </div>
                    {review.title && <p className="font-semibold text-slate-800 mb-1">{review.title}</p>}
                    <p className="text-slate-700 text-sm leading-relaxed">{review.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
