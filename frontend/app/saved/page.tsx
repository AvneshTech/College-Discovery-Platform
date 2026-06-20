"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../lib/AuthProvider";

type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  feesDisplay?: string | null;
  fees?: number | null;
};

export default function SavedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [savedColleges, setSavedColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  // Wait for the session bootstrap (refresh cookie) before redirecting.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await apiFetch("/api/users/me/saved");
        if (res.ok) setSavedColleges(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const handleRemove = async (id: number) => {
    // optimistic
    const prev = savedColleges;
    setSavedColleges((list) => list.filter((c) => c.id !== id));
    try {
      const res = await apiFetch(`/api/users/me/saved/${id}`, { method: "DELETE" });
      if (!res.ok) setSavedColleges(prev); // revert on failure
    } catch {
      setSavedColleges(prev);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="max-w-5xl mx-auto p-6 sm:p-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">🔖 Saved Colleges</h1>
        <p className="text-slate-500 mb-8">Your personal college shortlist</p>

        {authLoading || loading ? (
          <div className="text-center py-20 text-slate-600 animate-pulse">Loading...</div>
        ) : savedColleges.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg mb-4">No saved colleges yet.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
            >
              Browse Colleges
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedColleges.map((college) => (
              <div key={college.id} className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
                <h3
                  className="text-xl font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                  onClick={() => router.push(`/college/${college.id}`)}
                >
                  {college.name}
                </h3>
                <p className="text-slate-600 text-sm mt-1">📍 {college.city}</p>
                <p className="mt-2 text-slate-700">⭐ {college.rating}</p>
                {(college.feesDisplay || college.fees) && (
                  <p className="text-slate-500 text-sm">💰 {college.feesDisplay || college.fees}</p>
                )}
                <button
                  onClick={() => handleRemove(college.id)}
                  className="mt-4 w-full bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-semibold transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
