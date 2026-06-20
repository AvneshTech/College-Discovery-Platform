"use client";

import { useState } from "react";
import { apiFetch } from "../lib/apiClient";

// Pull the leading number out of a free-text amount like "2.2 LPA" / "₹3L".
function toNumber(v?: string): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

type Props = { onAdded?: () => void };

const FIELD_CONFIG = [
  { name: "name", label: "College Name", placeholder: "e.g. IIT Bombay", required: true, colSpan: 2 },
  { name: "city", label: "City", placeholder: "e.g. Mumbai", required: true },
  { name: "rating", label: "Rating (0–5)", placeholder: "e.g. 4.7", type: "number" },
  { name: "fees", label: "Annual Fees", placeholder: "e.g. 2.2 LPA" },
  { name: "courses", label: "Courses (comma-separated)", placeholder: "B.Tech,M.Tech,MBA" },
  { name: "avgPackage", label: "Avg Package", placeholder: "e.g. 18 LPA" },
  { name: "highestPackage", label: "Highest Package", placeholder: "e.g. 2.5 CPA" },
];

type FormData = Record<string, string>;

export default function AddCollegeForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({});
  const [overview, setOverview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.city?.trim()) {
      setError("College name and city are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Map free-text form fields to the backend's typed createCollegeSchema.
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        fees: toNumber(form.fees),
        avgPackage: toNumber(form.avgPackage),
        highestPackage: toNumber(form.highestPackage),
        courses: form.courses ? form.courses.split(",").map((c) => c.trim()).filter(Boolean) : undefined,
        overview: overview || undefined,
      };
      const res = await apiFetch(`/api/colleges`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({});
        setOverview("");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
          onAdded?.();
        }, 1200);
      } else {
        setError(data.message || "Failed to add college");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all font-semibold text-sm ${
          open
            ? "border-[#162348] text-[#162348] bg-blue-50/50"
            : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 bg-white"
        }`}
      >
        <span className={`text-lg transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
        {open ? "Close Form" : "Add a College to the Database"}
      </button>

      {open && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg mt-2 overflow-hidden animate-fade-up">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Add New College</h2>
            <span className="text-xs text-slate-400">* Required fields</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {FIELD_CONFIG.map((field) => (
                <div
                  key={field.name}
                  className={field.colSpan === 2 ? "md:col-span-2" : ""}
                >
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={field.type || "text"}
                    step={field.type === "number" ? "0.1" : undefined}
                    min={field.type === "number" ? "0" : undefined}
                    max={field.type === "number" ? "5" : undefined}
                    placeholder={field.placeholder}
                    value={form[field.name] || ""}
                    onChange={(e) => update(field.name, e.target.value)}
                    className="input"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Overview
                </label>
                <textarea
                  placeholder="Brief description of the college..."
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={3}
                  className="input"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
                <span>✓</span> College added successfully!
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Adding..." : "Add College"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}