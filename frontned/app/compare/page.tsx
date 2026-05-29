"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE } from "../utils/api";

type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  fees: string | null;
  courses: string | null;
  avgPackage: string | null;
  highestPackage: string | null;
};

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").map(Number).filter(Boolean) : [];

  useEffect(() => {
    if (ids.length < 2) return;
    const fetchCompare = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/colleges/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message); return; }
        setColleges(data);
      } catch { setError("Failed to fetch comparison"); }
      finally { setLoading(false); }
    };
    fetchCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  const fields = [
    { label: "📍 City", key: "city" as const },
    { label: "⭐ Rating", key: "rating" as const },
    { label: "💰 Fees", key: "fees" as const },
    { label: "🎓 Courses", key: "courses" as const },
    { label: "💼 Avg Package", key: "avgPackage" as const },
    { label: "🚀 Highest Package", key: "highestPackage" as const },
  ];

  if (ids.length < 2) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-2xl font-bold text-slate-700 mb-2">Select 2–3 colleges to compare</p>
          <p className="text-slate-500 mb-6">Go to the homepage and click &quot;+ Compare&quot; on colleges</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
          >
            Browse Colleges
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />
      <section className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Compare Colleges</h1>
          <button onClick={() => router.push("/")} className="text-blue-600 hover:underline text-sm">
            ← Change Selection
          </button>
        </div>

        {loading && <div className="text-center py-20 text-slate-600 animate-pulse">Loading...</div>}
        {error && <div className="text-center py-20 text-red-500">{error}</div>}

        {!loading && colleges.length > 0 && (
          <div className="overflow-x-auto rounded-2xl shadow">
            <table className="w-full bg-white overflow-hidden">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-4 text-left w-40 text-sm font-semibold">Feature</th>
                  {colleges.map((c) => (
                    <th key={c.id} className="p-4 text-center text-sm font-semibold">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(({ label, key }, rowIdx) => {
                  const maxRating = key === "rating" ? Math.max(...colleges.map((c) => c.rating)) : null;
                  return (
                    <tr key={key} className={rowIdx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-4 font-semibold text-slate-600 text-sm">{label}</td>
                      {colleges.map((c) => {
                        const val = c[key];
                        const isBest = key === "rating" && c.rating === maxRating;
                        return (
                          <td
                            key={c.id}
                            className={`p-4 text-center text-sm ${
                              isBest ? "font-bold text-green-600 bg-green-50" : "text-slate-700"
                            }`}
                          >
                            {String(val ?? "—")}
                            {isBest && <span className="ml-1 text-xs">🏆</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center text-slate-600">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
