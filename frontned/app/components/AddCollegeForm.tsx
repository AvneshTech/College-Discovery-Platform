"use client";

import { useState } from "react";
import { API_BASE } from "../utils/api";

type Props = {
  onAdded?: () => void;
};

export default function AddCollegeForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState("");
  const [fees, setFees] = useState("");
  const [courses, setCourses] = useState("");
  const [overview, setOverview] = useState("");
  const [avgPackage, setAvgPackage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) { setError("Name and city are required"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/colleges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, rating, fees, courses, overview, avgPackage }),
      });
      if (res.ok) {
        setName(""); setCity(""); setRating(""); setFees("");
        setCourses(""); setOverview(""); setAvgPackage("");
        setOpen(false);
        if (onAdded) onAdded();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add college");
      }
    } catch { setError("Failed to add college"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-white border-2 border-dashed border-slate-300 text-slate-500 p-4 rounded-2xl hover:border-blue-400 hover:text-blue-600 transition font-semibold"
      >
        {open ? "— Close Form" : "+ Add a College"}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow mt-2 space-y-3"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-2">Add New College</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="College Name *" value={name} onChange={(e) => setName(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" step="0.1" min="0" max="5" placeholder="Rating (0–5)" value={rating} onChange={(e) => setRating(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Fees (e.g. 2 LPA)" value={fees} onChange={(e) => setFees(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Courses (e.g. B.Tech,MBA)" value={courses} onChange={(e) => setCourses(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Avg Package (e.g. 12 LPA)" value={avgPackage} onChange={(e) => setAvgPackage(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <textarea placeholder="Overview (optional)" value={overview} onChange={(e) => setOverview(e.target.value)} rows={3}
            className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold transition disabled:opacity-50">
            {loading ? "Adding..." : "Add College"}
          </button>
        </form>
      )}
    </div>
  );
}
