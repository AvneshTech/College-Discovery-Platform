"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE } from "../utils/api";

// Matches the Prisma College model returned by POST /api/colleges/compare.
type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  fees?: number | null;
  feesDisplay?: string | null;
  courses?: string[];
  avgPackage?: number | null;
  highestPackage?: number | null;
};

const COMPARE_FIELDS = [
  { key: "city" as const,           label: "📍 Location" },
  { key: "rating" as const,         label: "⭐ Rating" },
  { key: "fees" as const,           label: "💰 Annual Fees" },
  { key: "courses" as const,        label: "📚 Courses" },
  { key: "avgPackage" as const,     label: "💼 Avg Package" },
  { key: "highestPackage" as const, label: "🚀 Highest Package" },
];

// Compact INR formatter — "—" when there's no real value (no fake numbers).
function formatINR(amount?: number | null): string {
  if (amount == null) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatCell(key: (typeof COMPARE_FIELDS)[number]["key"], c: College): string {
  switch (key) {
    case "city": return c.city || "—";
    case "rating": return c.rating != null ? c.rating.toFixed(1) : "—";
    case "fees": return c.feesDisplay || formatINR(c.fees);
    case "courses": return c.courses && c.courses.length ? c.courses.join(", ") : "—";
    case "avgPackage": return formatINR(c.avgPackage);
    case "highestPackage": return formatINR(c.highestPackage);
    default: return "—";
  }
}

const PALETTE = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-emerald-600",
];

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0) : [];

  useEffect(() => {
    if (ids.length < 2) return;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/colleges/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message); return; }
        setColleges(data);
      } catch {
        setError("Failed to load comparison data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  if (ids.length < 2) {
    return (
      <div className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 gap-5">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-4xl">
            ⚖️
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Compare Colleges</h1>
          <p className="text-slate-500 max-w-md">
            Select 2 or 3 colleges on the homepage using the &quot;+ Compare&quot; button, then come back here to see a side-by-side comparison.
          </p>
          <button onClick={() => router.push("/")} className="btn btn-primary btn-lg">
            Browse & Select Colleges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      {/* Header */}
      <div className="hero-navy">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-white/50 hover:text-white/90 text-sm mb-4 transition-colors">
            ← Back to Colleges
          </button>
          <h1 className="text-3xl font-bold text-white">College Comparison</h1>
          <p className="text-white/50 mt-1 text-sm">
            Comparing {ids.length} colleges side by side
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl w-full" />)}
          </div>
        )}
        {error && (
          <div className="card p-8 text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={() => router.push("/")} className="btn btn-primary mt-4">
              Go Back
            </button>
          </div>
        )}

        {!loading && colleges.length >= 2 && (
          <div className="space-y-4 animate-fade-up">
            {/* College header cards */}
            <div className={`grid gap-4 ${colleges.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
              {colleges.map((c, i) => (
                <div
                  key={c.id}
                  className="card p-5 text-center cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/college/${c.id}`)}
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: `hsl(${(c.id * 47) % 360}, 55%, 38%)` }}
                  >
                    {c.city.charAt(0)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{c.name}</h3>
                  <p className="text-slate-400 text-xs">📍 {c.city}</p>
                  <div className={`mt-3 h-1 rounded-full ${PALETTE[i]}`} />
                </div>
              ))}
            </div>

            {/* Rating visual comparison */}
            <div className="card p-6">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-5">Rating Comparison</h3>
              <div className="space-y-4">
                {colleges.map((c, i) => {
                  const maxRating = Math.max(...colleges.map((x) => x.rating));
                  const isBest = c.rating === maxRating;
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <p className="text-sm font-medium text-slate-600 w-32 truncate shrink-0">{c.name.split(" ").slice(0, 2).join(" ")}</p>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            i === 0 ? "bg-blue-500" : i === 1 ? "bg-purple-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${(c.rating / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-12 text-right ${isBest ? "text-green-600" : "text-slate-600"}`}>
                        {c.rating.toFixed(1)} {isBest && "🏆"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th className="text-sm font-semibold text-left w-40">Feature</th>
                      {colleges.map((c) => (
                        <th key={c.id} className="text-sm font-semibold text-center">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FIELDS.map(({ key, label }) => {
                      const maxRating = key === "rating" ? Math.max(...colleges.map((c) => c.rating)) : null;
                      return (
                        <tr key={key}>
                          <td className="font-medium text-slate-500 text-sm">{label}</td>
                          {colleges.map((c) => {
                            const isBest = key === "rating" && c.rating === maxRating;
                            return (
                              <td
                                key={c.id}
                                className={`text-center text-sm ${isBest ? "compare-best" : ""}`}
                              >
                                {formatCell(key, c)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => router.push("/")} className="btn btn-outline">
                Change Selection
              </button>
              <button onClick={() => router.push("/predictor")} className="btn btn-primary">
                Use Predictor →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-1)" }}>
        <div className="animate-pulse text-slate-400">Loading comparison...</div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}