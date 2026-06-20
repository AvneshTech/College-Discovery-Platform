"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { apiFetch } from "../lib/apiClient";

// Matches backend predictorSchema (colleges.schema.js) + recommendation.engine.js
const EXAMS = ["JEE Main", "JEE Advanced", "BITSAT", "State CET"] as const;
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"] as const;
const BRANCHES = ["CSE", "ECE", "EEE", "IT", "Mechanical", "Civil", "Chemical", "Aerospace", "Biotech"];

type Breakdown = {
  admissionChance: number;
  branchMatch: number;
  budgetFit: number;
  placementStrength: number;
  reputation: number;
  location: number;
};

type Recommendation = {
  collegeId: number;
  name: string;
  city: string;
  matchScore: number;
  admissionBand: "Safe" | "Moderate" | "Ambitious" | "Reach";
  breakdown: Breakdown;
};

const BAND_STYLES: Record<string, string> = {
  Safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-blue-50 text-blue-700 border-blue-200",
  Ambitious: "bg-amber-50 text-amber-700 border-amber-200",
  Reach: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function PredictorPage() {
  const [exam, setExam] = useState<string>("JEE Main");
  const [rank, setRank] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [branchPreferences, setBranchPreferences] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Recommendation[] | null>(null);

  const toggleBranch = (b: string) =>
    setBranchPreferences((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const handlePredict = async () => {
    if (!rank || Number(rank) <= 0) {
      setError("Please enter a valid rank");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const res = await apiFetch("/api/colleges/predictor", {
        method: "POST",
        body: JSON.stringify({
          exam,
          rank: Number(rank),
          category,
          branchPreferences,
          ...(maxBudget ? { maxBudget: Number(maxBudget) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Prediction failed");
        return;
      }
      setResults(data.results || []);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="hero-navy">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 badge badge-amber mb-5 py-1.5 px-4 text-sm">
            <span>🤖</span> AI-Powered Recommendation Engine
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">College Predictor</h1>
          <p className="text-white/65 text-lg max-w-xl mx-auto">
            Get a personalized match score from your rank, preferences, and budget — weighted across
            admission chance, placements, reputation, and fit.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Input form */}
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Exam</label>
              <select value={exam} onChange={(e) => setExam(e.target.value)} className="input">
                {EXAMS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Your Rank</label>
              <input
                type="number" min="1" value={rank} placeholder="e.g. 1500"
                onChange={(e) => setRank(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Max Annual Fees (₹, optional)</label>
              <input
                type="number" min="0" value={maxBudget} placeholder="e.g. 300000"
                onChange={(e) => setMaxBudget(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Preferred Branches (optional)</label>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBranch(b)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    branchPreferences.includes(b)
                      ? "bg-amber-500 text-[#0a0f1e] border-amber-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span>⚠</span> {error}
            </div>
          )}

          <button onClick={handlePredict} disabled={loading} className="btn btn-primary w-full">
            {loading ? "Analyzing..." : "Predict My Colleges"}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-8">
            {results.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-5xl">🔍</div>
                <h3 className="text-lg font-bold text-slate-700">No matches found</h3>
                <p className="text-slate-500 text-sm">
                  We don&apos;t have cutoff data for this exam/category yet. Try a different combination.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  {results.length} recommended colleges
                </h2>
                <div className="space-y-3">
                  {results.map((r) => (
                    <Link
                      key={r.collegeId}
                      href={`/college/${r.collegeId}`}
                      className="card p-4 flex items-center gap-4 hover:shadow-md transition"
                    >
                      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[#0a0f1e] text-white">
                        <span className="text-lg font-bold leading-none">{r.matchScore}</span>
                        <span className="text-[9px] uppercase tracking-wide text-white/60">match</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 truncate">{r.name}</h3>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${BAND_STYLES[r.admissionBand]}`}>
                            {r.admissionBand}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1.5">📍 {r.city}</p>
                        {/* Score breakdown bar */}
                        <div className="flex gap-3 text-[11px] text-slate-500">
                          <span>Admission {r.breakdown.admissionChance}</span>
                          <span>Placement {r.breakdown.placementStrength}</span>
                          <span>Reputation {r.breakdown.reputation}</span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
