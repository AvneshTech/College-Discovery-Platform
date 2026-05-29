"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE } from "../utils/api";

type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  fees: string | null;
  courses: string | null;
};

type PredictorResult = {
  colleges: College[];
  tier: string;
  exam: string;
  rank: number;
};

export default function PredictorPage() {
  const router = useRouter();
  const [exam, setExam] = useState("");
  const [rank, setRank] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictorResult | null>(null);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    if (!exam || !rank) { setError("Please fill all fields"); return; }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/predictor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, rank: Number(rank) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setResult(data);
    } catch { setError("Prediction failed. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">🎯 College Predictor</h1>
          <p className="text-slate-500 text-lg">
            Enter your exam and rank to find colleges you can get into
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Exam</label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Exam</option>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="CAT">CAT</option>
                <option value="GATE">GATE</option>
                <option value="NEET">NEET</option>
                <option value="CUET">CUET</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your Rank</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Predicting..." : "🔍 Predict My Colleges"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
              <p className="text-blue-800 font-semibold text-lg">
                📊 {result.exam} Rank: {result.rank.toLocaleString()}
              </p>
              <p className="text-blue-600 text-sm mt-1">Category: {result.tier}</p>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Recommended Colleges ({result.colleges.length})
            </h2>

            {result.colleges.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No matching colleges found. Try a different rank.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.colleges.map((college, i) => (
                  <div
                    key={college.id}
                    className="bg-white rounded-xl shadow p-5 flex gap-4 items-start hover:shadow-md transition cursor-pointer"
                    onClick={() => router.push(`/college/${college.id}`)}
                  >
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{college.name}</p>
                      <p className="text-slate-500 text-sm">📍 {college.city}</p>
                      <p className="text-slate-600 text-sm mt-1">⭐ {college.rating}</p>
                      {college.fees && (
                        <p className="text-slate-500 text-sm">💰 {college.fees}</p>
                      )}
                    </div>
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
