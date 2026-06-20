"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE } from "../utils/api";
import { authHeaders, isLoggedIn } from "../utils/auth";

type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  fees: string | null;
};

export default function SavedPage() {
  const router = useRouter();
  const [savedColleges, setSavedColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    const fetchSaved = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me/saved`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) setSavedColleges(data);
      } catch { console.error("Failed to fetch saved colleges"); }
      finally { setLoading(false); }
    };
    fetchSaved();
  }, [router]);

  const handleRemove = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/users/me/saved/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setSavedColleges((prev) => prev.filter((c) => c.id !== id));
    } catch { console.error("Remove failed"); }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="max-w-5xl mx-auto p-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">🔖 Saved Colleges</h1>
        <p className="text-slate-500 mb-8">Your personal college shortlist</p>

        {loading ? (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {college.fees && <p className="text-slate-500 text-sm">💰 {college.fees}</p>}
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
