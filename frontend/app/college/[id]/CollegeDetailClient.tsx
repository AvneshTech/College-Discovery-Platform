"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Share2, Scale, Mail, Phone, Globe, Calendar, Building2, BadgeCheck, Star,
  ThumbsUp, Pencil, Trash2, MapPin,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Tabs from "../../components/Tabs";
import ErrorState from "../../components/ErrorState";
import { GalleryGrid, GalleryManager, type GalleryImage } from "../../components/Gallery";
import EditCollegeForm from "../../components/EditCollegeForm";
import { API_BASE } from "../../utils/api";
import { apiFetch } from "../../lib/apiClient";
import { collegeLogo, collegeBanner } from "../../utils/collegeImages";
import { useAuth } from "../../lib/AuthProvider";
import { useToast } from "../../components/Toast";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=70";

const badgePill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 9999,
  background: "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)", padding: "4px 12px", fontWeight: 600,
};
const heroBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 9999, padding: "12px 24px",
  fontWeight: 600, boxShadow: "0 8px 20px rgba(0,0,0,0.25)", border: "none", cursor: "pointer",
};

type Review = {
  id: number;
  userId: number;
  rating: number;
  title?: string | null;
  body: string;
  likesCount?: number;
  createdAt: string;
  user: { name: string };
};
type Deadline = { id: number; title: string; date: string; notes?: string | null };
type College = {
  id: number; slug?: string | null; name: string; city: string; state?: string | null; type?: string | null;
  logoUrl?: string | null; bannerUrl?: string | null; rating: number; reviewCount?: number;
  nirfRank?: number | null; naacGrade?: string | null; fees?: number | null; feesDisplay?: string | null;
  avgPackage?: number | null; highestPackage?: number | null; placementRate?: number | null;
  courses?: string[]; branches?: string[]; overview?: string | null; website?: string | null;
  established?: number | null; email?: string | null; phone?: string | null; gallery?: GalleryImage[] | null;
  isFeatured?: boolean; isVerified?: boolean; reviews?: Review[]; deadlines?: Deadline[];
};

function formatINR(amount?: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

type TabId = "overview" | "courses" | "placements" | "gallery" | "reviews";

export default function CollegeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Review form
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState("");
  const [revBody, setRevBody] = useState("");
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revError, setRevError] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [likeBusy, setLikeBusy] = useState<number | null>(null);

  const loadCollege = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`${API_BASE}/api/colleges/${id}`);
      if (!res.ok) {
        setCollege(null);
        return;
      }
      setCollege(await res.json());
    } catch {
      setCollege(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadCollege();
  }, [id, loadCollege]);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/users/me/saved`);
        if (!res.ok) return;
        const list: { id: number }[] = await res.json();
        setSaved(list.some((c) => c.id === Number(id)));
      } catch {
        /* non-blocking */
      }
    })();
  }, [id, user]);

  const handleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSaveLoading(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await apiFetch(`/api/users/me/saved/${id}`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) setSaved(!next);
      else toast.success(next ? "Saved to your list" : "Removed from saved");
    } catch {
      setSaved(!next);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: college?.name || "CollegeEdge", text: `Check out ${college?.name} on CollegeEdge`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled share — ignore */
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this college permanently? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/colleges/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("College deleted");
        router.push("/");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const startEditReview = (r: Review) => {
    setEditingReviewId(r.id);
    setRevRating(r.rating);
    setRevTitle(r.title ?? "");
    setRevBody(r.body);
    setActiveTab("reviews");
    setRevError("");
  };

  const submitReview = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (revBody.trim().length < 5) {
      setRevError("Please write at least 5 characters");
      return;
    }
    setRevError("");
    setRevSubmitting(true);
    try {
      const payload = JSON.stringify({
        rating: revRating,
        title: revTitle.trim() || undefined,
        body: revBody.trim(),
      });
      const res = editingReviewId
        ? await apiFetch(`/api/colleges/${id}/reviews/${editingReviewId}`, { method: "PUT", body: payload })
        : await apiFetch(`/api/colleges/${id}/reviews`, { method: "POST", body: payload });
      const data = await res.json();
      if (!res.ok) {
        setRevError(data.errors?.[0]?.message || data.message || "Failed to submit review");
        return;
      }
      setRevTitle("");
      setRevBody("");
      setRevRating(5);
      setEditingReviewId(null);
      toast.success(editingReviewId ? "Review updated" : "Review submitted");
      await loadCollege();
    } catch {
      setRevError("Network error — please try again");
    } finally {
      setRevSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const res = await apiFetch(`/api/colleges/${id}/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Review deleted");
        await loadCollege();
      } else {
        toast.error("Failed to delete review");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const likeReview = async (reviewId: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLikeBusy(reviewId);
    // optimistic
    setCollege((c) =>
      c
        ? { ...c, reviews: c.reviews?.map((r) => (r.id === reviewId ? { ...r, likesCount: (r.likesCount ?? 0) + 1 } : r)) }
        : c
    );
    try {
      const res = await apiFetch(`/api/colleges/${id}/reviews/${reviewId}/like`, { method: "POST" });
      if (!res.ok) await loadCollege(); // revert by refetch
    } catch {
      await loadCollege();
    } finally {
      setLikeBusy(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="skeleton h-[clamp(380px,46vw,560px)] w-full rounded-2xl" />
          <div className="mt-6 space-y-4">
            <div className="skeleton h-8 w-1/2 rounded-lg" />
            <div className="skeleton h-40 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !college) {
    return (
      <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-20">
          <ErrorState
            title="College not found"
            message="We couldn't load this college. It may have been removed."
            onRetry={loadError ? loadCollege : undefined}
          />
          <div className="mt-4 text-center">
            <button onClick={() => router.push("/")} className="text-amber-600 hover:underline">
              ← Back to colleges
            </button>
          </div>
        </div>
      </main>
    );
  }

  const courseList = college.courses ?? [];
  const reviews = college.reviews ?? [];
  const deadlines = college.deadlines ?? [];
  const gallery = (Array.isArray(college.gallery) ? college.gallery : []) as GalleryImage[];
  const bannerUrl = collegeBanner(college);
  const logoUrl = collegeLogo(college);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "courses", label: "Courses" },
    { id: "placements", label: "Placements" },
    { id: "gallery", label: `Gallery${gallery.length ? ` (${gallery.length})` : ""}` },
    { id: "reviews", label: `Reviews${college.reviewCount ? ` (${college.reviewCount})` : ""}` },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      {/* HERO */}
      <section className="relative w-full overflow-hidden text-white" style={{ height: "clamp(380px, 46vw, 560px)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl}
          alt={`${college.name} campus`}
          loading="eager"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== FALLBACK_BANNER) img.src = FALLBACK_BANNER;
          }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.25))", pointerEvents: "none" }} />

        <div className="mx-auto max-w-6xl" style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", padding: "24px 20px" }}>
          <button onClick={() => router.back()} style={{ width: "fit-content", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
            ← Back to colleges
          </button>

          <div style={{ marginTop: "auto" }} className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div style={{ width: "clamp(80px, 11vw, 120px)", height: "clamp(80px, 11vw, 120px)", flexShrink: 0, background: "#fff", borderRadius: 14, padding: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={`${college.name} logo`} onError={(e) => (e.currentTarget.style.display = "none")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 36, fontWeight: 700, color: "#334155" }}>
                    {(college.name?.charAt(0) || college.city?.charAt(0) || "?").toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {college.isFeatured && (
                    <span style={{ ...badgePill, background: "rgba(245,158,11,0.95)", color: "#0f172a" }}>
                      <Star size={13} /> Featured
                    </span>
                  )}
                  {college.isVerified && (
                    <span style={{ ...badgePill, background: "rgba(16,185,129,0.95)", color: "#052e1f" }}>
                      <BadgeCheck size={13} /> Verified
                    </span>
                  )}
                </div>
                <h1 className="font-extrabold" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.5)", margin: 0 }}>
                  {college.name}
                </h1>
                <p style={{ marginTop: 8, fontSize: 16, color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                  📍 {college.city}{college.state ? `, ${college.state}` : ""}
                </p>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span style={{ ...badgePill, color: "#fcd34d" }}>⭐ {college.rating} / 5.0</span>
                  {college.nirfRank && <span style={{ ...badgePill, color: "#fde68a" }}>🏅 NIRF #{college.nirfRank}</span>}
                  {college.naacGrade && <span style={{ ...badgePill, color: "#a7f3d0" }}>🎖 NAAC {college.naacGrade}</span>}
                  {college.feesDisplay && <span style={{ ...badgePill, color: "rgba(255,255,255,0.92)" }}>💰 {college.feesDisplay}</span>}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 md:shrink-0">
              <button onClick={handleSave} disabled={saveLoading} style={{ ...heroBtn, background: saved ? "#2563eb" : "#fff", color: saved ? "#fff" : "#0f172a" }}>
                {saveLoading ? "..." : saved ? "✓ Saved" : "🔖 Save"}
              </button>
              <button onClick={handleShare} style={{ ...heroBtn, background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }} aria-label="Share">
                <Share2 size={16} /> Share
              </button>
              <button onClick={() => router.push(`/?compare=${college.id}`)} style={{ ...heroBtn, background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }}>
                <Scale size={16} /> Compare
              </button>
              <button onClick={() => router.push(`/contact?subject=${encodeURIComponent(`Inquiry about ${college.name}`)}`)} style={{ ...heroBtn, background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }}>
                <Mail size={16} /> Contact
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => setShowEdit(true)} style={{ ...heroBtn, background: "#fbbf24", color: "#0f172a" }}>✏️ Edit</button>
                  <button onClick={handleDelete} style={{ ...heroBtn, background: "#ef4444", color: "#fff" }}>🗑 Delete</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-sm dark:bg-slate-900">
        <div className="mx-auto max-w-5xl">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" ariaLabel="College sections" />
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-6 py-8" id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "overview" && (
          <div className="card p-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">About {college.name}</h2>
            {college.overview ? (
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{college.overview}</p>
            ) : (
              <p className="italic text-slate-400">No overview available yet.</p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat color="blue" value={String(college.rating)} label="Overall Rating" />
              <Stat color="green" value={String(courseList.length)} label="Programs" />
              <Stat color="purple" value={formatINR(college.avgPackage)} label="Avg Package" />
              <Stat color="orange" value={formatINR(college.highestPackage)} label="Highest Package" />
            </div>

            {/* Contact + meta */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
              {college.established && <span className="inline-flex items-center gap-1.5"><Calendar size={15} /> Established {college.established}</span>}
              {college.type && <span className="inline-flex items-center gap-1.5"><Building2 size={15} /> {college.type}</span>}
              {college.email && (
                <a href={`mailto:${college.email}`} className="inline-flex items-center gap-1.5 text-amber-600 hover:underline">
                  <Mail size={15} /> {college.email}
                </a>
              )}
              {college.phone && (
                <a href={`tel:${college.phone}`} className="inline-flex items-center gap-1.5 text-amber-600 hover:underline">
                  <Phone size={15} /> {college.phone}
                </a>
              )}
              {college.website && (
                <a href={college.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-amber-600 hover:underline">
                  <Globe size={15} /> Official Website
                </a>
              )}
            </div>

            {deadlines.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Admission Deadlines</h3>
                <ul className="space-y-2">
                  {deadlines.map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 dark:bg-slate-800/60">
                      <span className="text-slate-700 dark:text-slate-200">{d.title}</span>
                      <span className="text-sm text-slate-500">{new Date(d.date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "courses" && (
          <div className="card p-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Courses Offered</h2>
            {courseList.length === 0 ? (
              <p className="italic text-slate-400">No course information available yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {courseList.map((course) => (
                  <div key={course} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-amber-50/60 dark:border-slate-800 dark:hover:bg-amber-500/5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-600 dark:bg-amber-500/15">🎓</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{course}</p>
                  </div>
                ))}
              </div>
            )}
            {college.branches && college.branches.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Branches</h3>
                <div className="flex flex-wrap gap-2">
                  {college.branches.map((b) => (
                    <span key={b} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "placements" && (
          <div className="card p-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Placement Statistics</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-center text-white">
                <p className="text-4xl font-bold">{formatINR(college.avgPackage)}</p>
                <p className="mt-2 text-green-100">Average Package</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center text-white">
                <p className="text-4xl font-bold">{formatINR(college.highestPackage)}</p>
                <p className="mt-2 text-blue-100">Highest Package</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-center text-white">
                <p className="text-4xl font-bold">{college.placementRate != null ? `${college.placementRate}%` : "—"}</p>
                <p className="mt-2 text-purple-100">Placement Rate</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="card p-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Campus Gallery</h2>
            {isAdmin ? (
              <GalleryManager
                collegeId={college.id}
                images={gallery}
                onChange={(next) => setCollege((c) => (c ? { ...c, gallery: next } : c))}
              />
            ) : gallery.length > 0 ? (
              <GalleryGrid images={gallery} />
            ) : (
              <p className="italic text-slate-400">No photos yet.</p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="card p-8">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
              Student Reviews{college.reviewCount ? ` (${college.reviewCount})` : ""}
            </h2>

            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
                {editingReviewId ? "Edit Your Review" : "Write a Review"}
              </h3>
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRevRating(n)} aria-label={`${n} star`} className={`text-2xl leading-none ${n <= revRating ? "text-yellow-400" : "text-slate-300"}`}>
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-500">{revRating}/5</span>
                  </div>
                  <input type="text" value={revTitle} onChange={(e) => setRevTitle(e.target.value)} placeholder="Title (optional)" className="input" />
                  <textarea value={revBody} onChange={(e) => setRevBody(e.target.value)} rows={3} placeholder="Share your experience..." className="input" />
                  {revError && <p className="text-sm text-red-500">{revError}</p>}
                  <div className="flex gap-2">
                    <button onClick={submitReview} disabled={revSubmitting} className="btn btn-primary">
                      {revSubmitting ? "Submitting…" : editingReviewId ? "Update Review" : "Submit Review"}
                    </button>
                    {editingReviewId && (
                      <button
                        onClick={() => {
                          setEditingReviewId(null);
                          setRevTitle("");
                          setRevBody("");
                          setRevRating(5);
                          setRevError("");
                        }}
                        className="btn btn-ghost"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  <button onClick={() => router.push("/login")} className="font-semibold text-amber-600 hover:underline">Log in</button> to write a review.
                </p>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="italic text-slate-400">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => {
                  const mine = user?.id === review.userId;
                  return (
                    <div key={review.id} className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {review.user.name} {mine && <span className="text-xs font-normal text-amber-600">(you)</span>}
                          </p>
                          <p className="text-sm text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-lg text-yellow-400">{"⭐".repeat(Math.round(review.rating))}</div>
                      </div>
                      {review.title && <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">{review.title}</p>}
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{review.body}</p>

                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <button
                          onClick={() => likeReview(review.id)}
                          disabled={likeBusy === review.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <ThumbsUp size={14} /> {review.likesCount ?? 0}
                        </button>
                        {(mine || isAdmin) && (
                          <>
                            {mine && (
                              <button onClick={() => startEditReview(review)} className="inline-flex items-center gap-1 text-slate-500 hover:text-amber-600">
                                <Pencil size={14} /> Edit
                              </button>
                            )}
                            <button onClick={() => deleteReview(review.id)} className="inline-flex items-center gap-1 text-slate-500 hover:text-red-500">
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {showEdit && (
        <EditCollegeForm
          college={college}
          onClose={() => setShowEdit(false)}
          onSaved={async () => {
            setShowEdit(false);
            await loadCollege();
          }}
        />
      )}
    </main>
  );
}

function Stat({ color, value, label }: { color: "blue" | "green" | "purple" | "orange"; value: string; label: string }) {
  const map = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  };
  return (
    <div className={`rounded-xl p-4 text-center ${map[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  );
}
