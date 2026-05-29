"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { API_BASE } from "../../utils/api";
import { authHeaders, isLoggedIn } from "../../utils/auth";

type College = {
  id: number;
  name: string;
  city: string;
  rating: number;
  fees: string | null;
  courses: string | null;
  overview: string | null;
  avgPackage: string | null;
  highestPackage: string | null;
};

export default function CollegeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "placements" | "reviews">(
    "overview"
  );

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/colleges/${id}`);
        const data = await res.json();
        if (!res.ok) { setCollege(null); return; }
        setCollege(data);
      } catch { setCollege(null); }
      finally { setLoading(false); }
    };
    if (id) fetchCollege();
  }, [id]);

  const handleSave = async () => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/saved/${id}`, {
        method: saved ? "DELETE" : "POST",
        headers: authHeaders(),
      });
      if (res.ok) setSaved(!saved);
    } catch { console.error("Save failed"); }
    finally { setSaveLoading(false); }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center mt-20 text-slate-600 text-lg animate-pulse">Loading...</div>
      </main>
    );
  }

  if (!college) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="text-center mt-20 text-slate-600">
          <p className="text-2xl font-bold mb-4">College not found</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  const courseList = college.courses
    ? college.courses.split(",").map((c) => c.trim()).filter(Boolean)
    : ["B.Tech", "M.Tech", "MBA", "MCA"];

  const tabs = ["overview", "courses", "placements", "reviews"] as const;

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-200 hover:text-white text-sm mb-4 block"
          >
            ← Back to colleges
          </button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{college.name}</h1>
              <div className="flex flex-wrap gap-4 text-blue-100 mt-2">
                <span>📍 {college.city}</span>
                <span>⭐ {college.rating} / 5.0</span>
                {college.fees && <span>💰 {college.fees}</span>}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                saved
                  ? "bg-white text-blue-600 hover:bg-blue-50"
                  : "bg-blue-500 text-white hover:bg-blue-400 border border-blue-300"
              }`}
            >
              {saveLoading ? "..." : saved ? "✓ Saved" : "🔖 Save College"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold capitalize transition border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <section className="max-w-5xl mx-auto py-8 px-6">
        {activeTab === "overview" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About {college.name}</h2>
            <p className="text-slate-700 leading-relaxed text-base">
              {college.overview ||
                `${college.name} is one of the leading institutes located in ${college.city}, India. Known for its excellent academic programs, state-of-the-art infrastructure, and strong industry connections, it offers quality education across multiple disciplines. The institute is committed to holistic development and prepares students for the ever-evolving global job market.`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{college.rating}</p>
                <p className="text-slate-600 text-sm mt-1">Overall Rating</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{courseList.length}</p>
                <p className="text-slate-600 text-sm mt-1">Programs</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{college.avgPackage || "12 LPA"}</p>
                <p className="text-slate-600 text-sm mt-1">Avg Package</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{college.highestPackage || "50 LPA"}</p>
                <p className="text-slate-600 text-sm mt-1">Highest Package</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Courses Offered</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseList.map((course) => (
                <div
                  key={course}
                  className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-blue-50 transition"
                >
                  <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                    🎓
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{course}</p>
                    <p className="text-sm text-slate-500">4 years • Full-time</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "placements" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Placement Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold">{college.avgPackage || "12 LPA"}</p>
                <p className="text-green-100 mt-2">Average Package</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold">{college.highestPackage || "50 LPA"}</p>
                <p className="text-blue-100 mt-2">Highest Package</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold">95%</p>
                <p className="text-purple-100 mt-2">Placement Rate</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Top Recruiters</h3>
            <div className="flex flex-wrap gap-3">
              {["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro", "Flipkart", "Paytm"].map(
                (company) => (
                  <span
                    key={company}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                  >
                    {company}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Student Reviews</h2>
            <div className="space-y-6">
              {[
                {
                  name: "Rahul Sharma",
                  rating: 5,
                  text: "Excellent faculty and great placement opportunities. The campus is beautiful and well-maintained. Highly recommend!",
                  year: "2023 Batch",
                },
                {
                  name: "Priya Singh",
                  rating: 4,
                  text: "Good infrastructure and active student clubs. The curriculum is up-to-date with industry standards.",
                  year: "2022 Batch",
                },
                {
                  name: "Amit Kumar",
                  rating: 4,
                  text: "Strong alumni network and good placement cell. Library resources are excellent.",
                  year: "2024 Batch",
                },
              ].map((review, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{review.name}</p>
                      <p className="text-sm text-slate-500">{review.year}</p>
                    </div>
                    <div className="text-yellow-400 text-lg">
                      {"⭐".repeat(review.rating)}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
