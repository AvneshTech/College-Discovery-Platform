"use client";

import { useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { useToast } from "./Toast";

// Pull the leading number out of a free-text amount like "2.2 LPA" / "₹3L".
function toNumber(v?: string): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

type Props = { onAdded?: () => void };

// NOTE: the no-op `rating` field was removed (audit §9) — rating is computed
// server-side from real reviews and always starts at 0. Image uploads need a
// collegeId, which only exists after creation, so logo/banner here are optional
// URLs; admins upload real files afterwards via Edit → ImageUploader.
const FIELD_CONFIG: { name: string; label: string; placeholder?: string; type?: string; colSpan?: number }[] = [
  { name: "name", label: "College Name", placeholder: "e.g. IIT Bombay", colSpan: 2 },
  { name: "city", label: "City", placeholder: "e.g. Mumbai" },
  { name: "state", label: "State", placeholder: "e.g. Maharashtra" },
  { name: "type", label: "Type", placeholder: "Government / Private / Deemed" },
  { name: "established", label: "Established (year)", placeholder: "e.g. 1958", type: "number" },
  { name: "nirfRank", label: "NIRF Rank", placeholder: "e.g. 3", type: "number" },
  { name: "naacGrade", label: "NAAC Grade", placeholder: "e.g. A++" },
  { name: "fees", label: "Annual Fees (₹)", placeholder: "e.g. 220000" },
  { name: "placementRate", label: "Placement Rate (%)", placeholder: "e.g. 95", type: "number" },
  { name: "avgPackage", label: "Avg Package (₹)", placeholder: "e.g. 2100000" },
  { name: "highestPackage", label: "Highest Package (₹)", placeholder: "e.g. 35000000" },
  { name: "email", label: "Contact Email", placeholder: "info@college.edu" },
  { name: "phone", label: "Contact Phone", placeholder: "+91 ..." },
  { name: "website", label: "Website URL", placeholder: "https://...", colSpan: 2 },
  { name: "courses", label: "Courses (comma-separated)", placeholder: "B.Tech, M.Tech, MBA", colSpan: 2 },
  { name: "branches", label: "Branches (comma-separated)", placeholder: "CSE, ECE, Mechanical", colSpan: 2 },
  { name: "logoUrl", label: "Logo URL (optional)", placeholder: "https://.../logo.png", colSpan: 2 },
  { name: "bannerUrl", label: "Photo / Banner URL (optional)", placeholder: "https://.../campus.jpg", colSpan: 2 },
  { name: "metaTitle", label: "SEO Meta Title (optional)", placeholder: "Custom <title> for search engines", colSpan: 2 },
  { name: "metaDescription", label: "SEO Meta Description (optional)", placeholder: "≤160 chars for search snippet", colSpan: 2 },
];

type FormData = Record<string, string>;

export default function AddCollegeForm({ onAdded }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({});
  const [overview, setOverview] = useState("");
  const [featured, setFeatured] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));
  const list = (v?: string) => (v ? v.split(",").map((c) => c.trim()).filter(Boolean) : undefined);
  const str = (v?: string) => (v?.trim() ? v.trim() : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.city?.trim()) {
      setError("College name and city are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        state: str(form.state),
        type: str(form.type),
        email: str(form.email),
        phone: str(form.phone),
        established: toNumber(form.established),
        nirfRank: toNumber(form.nirfRank),
        naacGrade: str(form.naacGrade),
        fees: toNumber(form.fees),
        placementRate: toNumber(form.placementRate),
        avgPackage: toNumber(form.avgPackage),
        highestPackage: toNumber(form.highestPackage),
        courses: list(form.courses),
        branches: list(form.branches),
        website: str(form.website),
        logoUrl: str(form.logoUrl),
        bannerUrl: str(form.bannerUrl),
        overview: overview || undefined,
        metaTitle: str(form.metaTitle),
        metaDescription: str(form.metaDescription),
        isFeatured: featured || undefined,
        isVerified: verified || undefined,
      };
      const res = await apiFetch(`/api/colleges`, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setForm({});
        setOverview("");
        setFeatured(false);
        setVerified(false);
        toast.success("College added! Upload logo/banner/gallery via Edit.");
        setOpen(false);
        onAdded?.();
      } else {
        setError(data.errors?.[0]?.message || data.message || "Failed to add college");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mb-8 max-w-3xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-semibold transition-all ${
          open ? "border-[#162348] bg-blue-50/50 text-[#162348]" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-500 dark:bg-slate-900/60"
        }`}
      >
        <span className={`text-lg transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
        {open ? "Close Form" : "Add a College to the Database"}
      </button>

      {open && (
        <div className="card animate-fade-up mt-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New College</h2>
            <span className="text-xs text-slate-400">Name &amp; city required</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {FIELD_CONFIG.map((field) => (
                <div key={field.name} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {field.label}
                    {(field.name === "name" || field.name === "city") && <span className="text-red-400"> *</span>}
                  </label>
                  <input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={form[field.name] || ""}
                    onChange={(e) => update(field.name, e.target.value)}
                    className="input"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Overview</label>
                <textarea placeholder="Brief description of the college..." value={overview} onChange={(e) => setOverview(e.target.value)} rows={3} className="input" />
              </div>
              <div className="flex items-center gap-4 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> ⭐ Featured
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> ✓ Verified
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? "Adding..." : "Add College"}</button>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
