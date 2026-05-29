"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import CollegeCard from "./components/CollegeCard";
import AddCollegeForm from "./components/AddCollegeForm";
import { API_BASE } from "./utils/api";

type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  fees: string | null;
  courses: string | null;
};

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");
  const [courseType, setCourseType] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (city) params.set("city", city);
      if (minRating) params.set("minRating", minRating);
      if (courseType) params.set("courseType", courseType);

      const res = await fetch(`${API_BASE}/api/colleges?${params.toString()}`);
      const data = await res.json();

      setColleges(data.colleges || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch colleges:", error);
    } finally {
      setLoading(false);
    }
  }, [search, city, minRating, courseType, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchColleges, 300);
    return () => clearTimeout(debounce);
  }, [fetchColleges]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, city, minRating, courseType]);

  const handleCompare = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const goToCompare = () => {
    router.push(`/compare?ids=${compareIds.join(",")}`);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero */}
      <section className="text-center py-16 px-6 bg-gradient-to-b from-blue-600 to-blue-500 text-white">
        <h1 className="text-5xl font-bold mb-4">Find Your Dream College</h1>
        <p className="text-blue-100 text-lg mb-8">
          Search and compare colleges by city, fees, rating, and courses
        </p>

        {/* Search + Filters */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search colleges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-3 rounded-xl border-0 bg-white text-slate-900 placeholder:text-slate-400 shadow"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="p-3 rounded-xl border-0 bg-white text-slate-900 placeholder:text-slate-400 shadow"
          />
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="p-3 rounded-xl border-0 bg-white text-slate-900 shadow"
          >
            <option value="">Min Rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="4.7">4.7+</option>
            <option value="5">5.0</option>
          </select>
          <select
            value={courseType}
            onChange={(e) => setCourseType(e.target.value)}
            className="p-3 rounded-xl border-0 bg-white text-slate-900 shadow"
          >
            <option value="">Course Type</option>
            <option value="B.Tech">B.Tech</option>
            <option value="M.Tech">M.Tech</option>
            <option value="MBA">MBA</option>
            <option value="MCA">MCA</option>
            <option value="BCA">BCA</option>
          </select>
        </div>
      </section>

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <div className="sticky top-0 z-10 bg-yellow-400 text-slate-900 px-6 py-3 flex items-center justify-between shadow">
          <span className="font-semibold">
            {compareIds.length} college{compareIds.length > 1 ? "s" : ""} selected for comparison
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setCompareIds([])}
              className="text-sm px-3 py-1 bg-white rounded-lg hover:bg-gray-100"
            >
              Clear
            </button>
            <button
              onClick={goToCompare}
              disabled={compareIds.length < 2}
              className="text-sm px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* Add College Form */}
      <section className="px-6 pt-8">
        <AddCollegeForm onAdded={fetchColleges} />
      </section>

      {/* Results */}
      <section className="px-6 py-8">
        {!loading && (
          <p className="text-slate-500 text-sm mb-4">
            Showing {colleges.length} of {total} colleges
          </p>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-600 text-lg">Loading colleges...</div>
        ) : colleges.length === 0 ? (
          <div className="text-center py-20 text-slate-600 text-lg">No colleges found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {colleges.map((college) => (
              <CollegeCard
                key={college.id}
                id={college.id}
                name={college.name}
                city={college.city}
                rating={college.rating}
                fees={college.fees}
                onCompare={handleCompare}
                compareSelected={compareIds.includes(college.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
