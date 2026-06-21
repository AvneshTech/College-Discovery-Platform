"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import CollegeCard from "./components/CollegeCard";
import AddCollegeForm from "./components/AddCollegeForm";
import { PageSkeleton } from "./components/Skeleton";
import ErrorState from "./components/ErrorState";
import { API_BASE } from "./utils/api";
import { apiFetch } from "./lib/apiClient";
import { collegeLogo, collegeBanner } from "./utils/collegeImages";
import { useAuth } from "./lib/AuthProvider";
import { useToast } from "./components/Toast";

type College = {
  id: number;
  slug?: string | null;
  website?: string | null;
  name: string;
  city: string;
  state?: string | null;
  rating: number;
  reviewCount?: number;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  nirfRank?: number | null;
  naacGrade?: string | null;
  feesDisplay?: string | null;
  avgPackage?: number | null;
  highestPackage?: number | null;
  placementRate?: number | null;
};

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "nirfRank", label: "NIRF Rank" },
  { value: "avgPackage", label: "Avg Package" },
  { value: "fees", label: "Lowest Fees" },
  { value: "viewsCount", label: "Most Viewed" },
  { value: "saveCount", label: "Most Saved" },
  { value: "createdAt", label: "Newest" },
];

const STATES = [
  "Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];
const COURSES = ["B.Tech", "B.E.", "M.Tech", "M.E.", "MBA", "BBA", "B.Sc", "MBBS"];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [minRating, setMinRating] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [maxFees, setMaxFees] = useState("");
  const [featured, setFeatured] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Discovery rails (only shown on the unfiltered first view).
  const [featuredList, setFeaturedList] = useState<College[]>([]);
  const [trendingList, setTrendingList] = useState<College[]>([]);

  const hasFilters = !!(
    search || city || stateFilter || minRating || branch || course || maxFees || featured || verified
  );

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const params = new URLSearchParams({ page: String(page), sortBy });
      if (search) params.set("search", search);
      if (city) params.set("city", city);
      if (stateFilter) params.set("state", stateFilter);
      if (minRating) params.set("minRating", minRating);
      if (branch) params.set("branch", branch);
      if (course) params.set("course", course);
      if (maxFees) params.set("maxFees", maxFees);
      if (featured) params.set("featured", "true");
      if (verified) params.set("verified", "true");

      const res = await fetch(`${API_BASE}/api/colleges?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setColleges(data.colleges || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setLoadError(true);
      setColleges([]);
    } finally {
      setLoading(false);
    }
  }, [search, city, stateFilter, minRating, branch, course, maxFees, featured, verified, sortBy, page]);

  useEffect(() => {
    const t = setTimeout(fetchColleges, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchColleges]);

  useEffect(() => {
    setPage(1);
  }, [search, city, stateFilter, minRating, branch, course, maxFees, featured, verified, sortBy]);

  // Featured + trending rails (one-shot, unfiltered).
  useEffect(() => {
    (async () => {
      try {
        const [fRes, tRes] = await Promise.all([
          fetch(`${API_BASE}/api/colleges/featured?limit=6`),
          fetch(`${API_BASE}/api/colleges/trending?limit=6`),
        ]);
        if (fRes.ok) setFeaturedList(await fRes.json());
        if (tRes.ok) setTrendingList(await tRes.json());
      } catch {
        /* rails are non-critical */
      }
    })();
  }, []);

  const handleCompare = (id: number) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );

  // Deep-link: the college detail page's "Compare" button routes here as
  // /?compare=<id> — preselect that college so the user can add a second.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cid = Number(new URLSearchParams(window.location.search).get("compare"));
    if (cid > 0) {
      setCompareIds((prev) => (prev.includes(cid) ? prev : [...prev, cid]));
      toast.info("Added to comparison — pick another college to compare.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    (async () => {
      try {
        const res = await apiFetch("/api/users/me/saved");
        if (!res.ok) return;
        const list: { id: number }[] = await res.json();
        setSavedIds(new Set(list.map((c) => c.id)));
      } catch {
        /* non-blocking */
      }
    })();
  }, [user]);

  const handleToggleSave = async (id: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    const isSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const res = await apiFetch(`/api/users/me/saved/${id}`, { method: isSaved ? "DELETE" : "POST" });
      if (!res.ok) throw new Error("save failed");
      toast.success(isSaved ? "Removed from saved" : "Saved to your list");
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
      toast.error("Couldn't update your saved list");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setStateFilter("");
    setMinRating("");
    setBranch("");
    setCourse("");
    setMaxFees("");
    setFeatured(false);
    setVerified(false);
    setSortBy("rating");
  };

  const renderCard = (college: College, i: number) => (
    <CollegeCard
      key={college.id}
      id={college.id}
      name={college.name}
      city={college.city}
      state={college.state}
      rating={college.rating}
      reviewCount={college.reviewCount}
      nirfRank={college.nirfRank}
      naacGrade={college.naacGrade}
      logoUrl={collegeLogo(college)}
      bannerUrl={collegeBanner(college)}
      feesDisplay={college.feesDisplay}
      avgPackage={college.avgPackage}
      highestPackage={college.highestPackage}
      placementRate={college.placementRate}
      isSaved={savedIds.has(college.id)}
      onToggleSave={handleToggleSave}
      onCompare={handleCompare}
      compareSelected={compareIds.includes(college.id)}
      animationDelay={i * 40}
    />
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero-navy">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 badge badge-amber mb-6 py-1.5 px-4 text-sm">
              <span>🎓</span> India&apos;s College Discovery Platform
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Find Your <span className="text-amber-400">Dream</span> College
            </h1>
            <p className="text-white/65 text-lg mb-10 max-w-xl mx-auto">
              Search, compare, and shortlist from hundreds of top colleges. Get predictions based on your rank.
            </p>

            <div className="relative max-w-lg mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search colleges, cities, courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search colleges"
                className="input pl-12 pr-4 py-3.5 text-base rounded-xl shadow-lg border-0 bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {total > 0 && (
            <div className="flex justify-center mt-12">
              <div className="text-center">
                <p className="text-amber-400 text-2xl font-bold">{total.toLocaleString("en-IN")}</p>
                <p className="text-white/50 text-xs mt-1">{total === 1 ? "College Listed" : "Colleges Listed"}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Compare floating bar ─────────────────────────────────────── */}
      {compareIds.length > 0 && (
        <div className="sticky top-16 z-40 animate-fade-in">
          <div className="bg-amber-500 text-[#0a0f1e] px-4 py-2.5 flex items-center justify-between shadow-lg">
            <span className="font-semibold text-sm">{compareIds.length} / 3 colleges selected</span>
            <div className="flex gap-2">
              <button onClick={() => setCompareIds([])} className="btn btn-sm bg-white/30 text-[#0a0f1e] hover:bg-white/50 border-0">
                Clear
              </button>
              <button
                onClick={() => router.push(`/compare?ids=${compareIds.join(",")}`)}
                disabled={compareIds.length < 2}
                className="btn btn-sm bg-[#0a0f1e] text-white hover:bg-[#162348] border-0 disabled:opacity-50"
              >
                Compare Now →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* ─── Discovery rails (only on the clean, unfiltered first view) ── */}
        {!hasFilters && page === 1 && (featuredList.length > 0 || trendingList.length > 0) && (
          <div className="mb-12 space-y-10">
            {featuredList.length > 0 && (
              <Rail title="⭐ Featured Colleges" subtitle="Hand-picked top institutions">
                {featuredList.map((c, i) => renderCard(c, i))}
              </Rail>
            )}
            {trendingList.length > 0 && (
              <Rail title="🔥 Trending This Week" subtitle="Most viewed in the last 7 days">
                {trendingList.map((c, i) => renderCard(c, i))}
              </Rail>
            )}
          </div>
        )}

        {/* ─── Filter + sort bar ────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500">
              {loading ? (
                <span className="animate-pulse">Loading colleges...</span>
              ) : (
                <>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> colleges found
                  {hasFilters && (
                    <button onClick={clearFilters} className="ml-2 text-amber-600 hover:text-amber-700 font-medium underline text-xs">
                      clear filters
                    </button>
                  )}
                </>
              )}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500" htmlFor="sort">
                Sort
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input !w-auto !py-2 !text-sm !rounded-lg"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap gap-2">
            <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city" className="input !w-auto !py-2 !text-sm !rounded-lg">
              <option value="">All Cities</option>
              {["Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Pune", "Noida", "Vellore", "Manipal", "Ahmedabad", "Pilani", "Kharagpur", "Tiruchirappalli", "Coimbatore"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} aria-label="Filter by state" className="input !w-auto !py-2 !text-sm !rounded-lg">
              <option value="">All States</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Filter by course" className="input !w-auto !py-2 !text-sm !rounded-lg">
              <option value="">All Courses</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Filter by branch" className="input !w-auto !py-2 !text-sm !rounded-lg">
              <option value="">All Branches</option>
              {["CSE", "ECE", "EEE", "IT", "Mechanical", "Civil", "Chemical", "Aerospace", "Biotech"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Minimum rating" className="input !w-auto !py-2 !text-sm !rounded-lg">
              <option value="">Any Rating</option>
              <option value="4">4.0+ ⭐</option>
              <option value="4.3">4.3+ ⭐</option>
              <option value="4.5">4.5+ ⭐</option>
              <option value="4.7">4.7+ ⭐</option>
            </select>

            <select value={maxFees} onChange={(e) => setMaxFees(e.target.value)} aria-label="Maximum fees" className="input !w-auto !py-2 !text-sm !rounded-lg">
              <option value="">Any Fees</option>
              <option value="100000">Under ₹1L</option>
              <option value="300000">Under ₹3L</option>
              <option value="500000">Under ₹5L</option>
              <option value="1000000">Under ₹10L</option>
            </select>

            <button
              onClick={() => setFeatured((v) => !v)}
              aria-pressed={featured}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                featured ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              ⭐ Featured
            </button>
            <button
              onClick={() => setVerified((v) => !v)}
              aria-pressed={verified}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                verified ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              ✓ Verified
            </button>
          </div>
        </div>

        {user?.role === "ADMIN" && <AddCollegeForm onAdded={fetchColleges} />}

        {/* Results */}
        {loading ? (
          <PageSkeleton />
        ) : loadError ? (
          <ErrorState
            title="Couldn't load colleges"
            message="We hit a problem reaching the server. Check your connection and try again."
            onRetry={fetchColleges}
          />
        ) : colleges.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-6xl">🔍</div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No colleges found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {hasFilters ? "Try adjusting your filters or search terms" : "No colleges in the database yet"}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-primary">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {colleges.map((college, i) => renderCard(college, i))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && !loadError && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline btn-sm disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                if (pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                      pg === page ? "bg-[#111d3a] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline btn-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Horizontal scrolling rail used for Featured / Trending sections.
function Rail({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] snap-x">
        {Array.isArray(children) &&
          (children as React.ReactNode[]).map((child, i) => (
            <div key={i} className="w-[300px] shrink-0 snap-start">
              {child}
            </div>
          ))}
      </div>
    </div>
  );
}
