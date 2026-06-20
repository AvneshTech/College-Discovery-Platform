"use client";

import { useState } from "react";
import { apiFetch } from "../lib/apiClient";

type CollegeLike = {
  id: number;
  name: string;
  city: string;
  state?: string | null;
  type?: string | null;
  nirfRank?: number | null;
  naacGrade?: string | null;
  fees?: number | null;
  avgPackage?: number | null;
  highestPackage?: number | null;
  placementRate?: number | null;
  courses?: string[];
  branches?: string[];
  website?: string | null;
  established?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  overview?: string | null;
};

type Props = {
  college: CollegeLike;
  onClose: () => void;
  onSaved: () => void;
};

// Admin-only editor. Submits a partial update to PUT /api/colleges/:id
// (RBAC-enforced on the backend). Empty fields are omitted, so they keep
// their current value rather than being wiped.
export default function EditCollegeForm({ college, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: college.name ?? "",
    city: college.city ?? "",
    state: college.state ?? "",
    type: college.type ?? "",
    nirfRank: college.nirfRank?.toString() ?? "",
    naacGrade: college.naacGrade ?? "",
    fees: college.fees?.toString() ?? "",
    avgPackage: college.avgPackage?.toString() ?? "",
    highestPackage: college.highestPackage?.toString() ?? "",
    placementRate: college.placementRate?.toString() ?? "",
    courses: (college.courses ?? []).join(", "),
    branches: (college.branches ?? []).join(", "),
    website: college.website ?? "",
    established: college.established?.toString() ?? "",
    logoUrl: college.logoUrl ?? "",
    bannerUrl: college.bannerUrl ?? "",
    overview: college.overview ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const numOrUndef = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const strOrUndef = (v: string) => (v.trim() === "" ? undefined : v.trim());
  const listOrUndef = (v: string) =>
    v.trim() === "" ? undefined : v.split(",").map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      setError("Name and city are required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        state: strOrUndef(form.state),
        type: strOrUndef(form.type),
        nirfRank: numOrUndef(form.nirfRank),
        naacGrade: strOrUndef(form.naacGrade),
        fees: numOrUndef(form.fees),
        avgPackage: numOrUndef(form.avgPackage),
        highestPackage: numOrUndef(form.highestPackage),
        placementRate: numOrUndef(form.placementRate),
        courses: listOrUndef(form.courses),
        branches: listOrUndef(form.branches),
        website: strOrUndef(form.website),
        established: numOrUndef(form.established),
        logoUrl: strOrUndef(form.logoUrl),
        bannerUrl: strOrUndef(form.bannerUrl),
        overview: strOrUndef(form.overview),
      };
      const res = await apiFetch(`/api/colleges/${college.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || "Update failed");
        return;
      }
      onSaved();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; placeholder?: string; wide?: boolean }[] = [
    { key: "name", label: "College Name", wide: true },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "type", label: "Type (Government / Private / Deemed)" },
    { key: "nirfRank", label: "NIRF Rank" },
    { key: "naacGrade", label: "NAAC Grade" },
    { key: "fees", label: "Annual Fees (₹, number)" },
    { key: "placementRate", label: "Placement Rate (%)" },
    { key: "avgPackage", label: "Avg Package (₹)" },
    { key: "highestPackage", label: "Highest Package (₹)" },
    { key: "established", label: "Established (year)" },
    { key: "website", label: "Website URL" },
    { key: "courses", label: "Courses (comma-separated)", placeholder: "B.Tech, M.Tech, MBA", wide: true },
    { key: "branches", label: "Branches (comma-separated)", placeholder: "CSE, ECE, Mechanical", wide: true },
    { key: "logoUrl", label: "Logo URL", wide: true },
    { key: "bannerUrl", label: "Photo / Banner URL", wide: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Edit College</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Overview</label>
            <textarea
              rows={4}
              value={form.overview}
              onChange={(e) => set("overview", e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
