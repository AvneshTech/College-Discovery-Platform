"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import CollegeCard from "../components/CollegeCard";
import { SavedGridSkeleton } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import { apiFetch } from "../lib/apiClient";
import { collegeLogo, collegeBanner } from "../utils/collegeImages";
import { useAuth } from "../lib/AuthProvider";
import { useToast } from "../components/Toast";

type College = {
  id: number;
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
  fees?: number | null;
  avgPackage?: number | null;
  highestPackage?: number | null;
  placementRate?: number | null;
};

export default function SavedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [savedColleges, setSavedColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    setLoadError(false);
    try {
      const res = await apiFetch("/api/users/me/saved");
      if (!res.ok) throw new Error("fetch failed");
      setSavedColleges(await res.json());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const handleRemove = async (id: number) => {
    const prev = savedColleges;
    setSavedColleges((list) => list.filter((c) => c.id !== id));
    try {
      const res = await apiFetch(`/api/users/me/saved/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setSavedColleges(prev);
        toast.error("Couldn't remove college");
      } else {
        toast.success("Removed from saved");
      }
    } catch {
      setSavedColleges(prev);
      toast.error("Network error");
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="mx-auto max-w-7xl p-6 sm:p-10">
        <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">🔖 Saved Colleges</h1>
        <p className="mb-8 text-slate-500">Your personal college shortlist</p>

        {authLoading || loading ? (
          <SavedGridSkeleton />
        ) : loadError ? (
          <ErrorState title="Couldn't load saved colleges" onRetry={load} />
        ) : savedColleges.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-lg text-slate-500">No saved colleges yet.</p>
            <button onClick={() => router.push("/")} className="btn btn-primary">
              Browse Colleges
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedColleges.map((college, i) => (
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
                isSaved
                onToggleSave={handleRemove}
                animationDelay={i * 40}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
