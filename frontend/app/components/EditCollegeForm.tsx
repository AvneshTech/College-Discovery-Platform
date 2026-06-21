"use client";

import { useState } from "react";
import { apiFetch } from "../lib/apiClient";
import ImageUploader from "./ImageUploader";
import { GalleryManager, type GalleryImage } from "./Gallery";
import { useToast } from "./Toast";

type CollegeLike = {
  id: number;
  name: string;
  city: string;
  state?: string | null;
  type?: string | null;
  email?: string | null;
  phone?: string | null;
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
  metaTitle?: string | null;
  metaDescription?: string | null;
  isFeatured?: boolean;
  isVerified?: boolean;
  gallery?: GalleryImage[] | null;
};

type Props = {
  college: CollegeLike;
  onClose: () => void;
  onSaved: () => void;
};

// Admin-only editor. Logo/banner/gallery now upload real files via the shared
// ImageUploader → Cloudinary (the backend persists logoUrl/bannerUrl/gallery
// immediately), so they are NOT part of the text PUT payload. Empty text fields
// are omitted so they keep their current value rather than being wiped.
export default function EditCollegeForm({ college, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: college.name ?? "",
    city: college.city ?? "",
    state: college.state ?? "",
    type: college.type ?? "",
    email: college.email ?? "",
    phone: college.phone ?? "",
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
    overview: college.overview ?? "",
    metaTitle: college.metaTitle ?? "",
    metaDescription: college.metaDescription ?? "",
  });
  const [featured, setFeatured] = useState(!!college.isFeatured);
  const [verified, setVerified] = useState(!!college.isVerified);
  const [logoUrl, setLogoUrl] = useState(college.logoUrl ?? null);
  const [bannerUrl, setBannerUrl] = useState(college.bannerUrl ?? null);
  const [gallery, setGallery] = useState<GalleryImage[]>(
    Array.isArray(college.gallery) ? college.gallery : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirtyImages, setDirtyImages] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const numOrUndef = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const strOrUndef = (v: string) => (v.trim() === "" ? undefined : v.trim());
  const listOrUndef = (v: string) => (v.trim() === "" ? undefined : v.split(",").map((s) => s.trim()).filter(Boolean));

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
        email: strOrUndef(form.email),
        phone: strOrUndef(form.phone),
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
        overview: strOrUndef(form.overview),
        metaTitle: strOrUndef(form.metaTitle),
        metaDescription: strOrUndef(form.metaDescription),
        isFeatured: featured,
        isVerified: verified,
      };
      const res = await apiFetch(`/api/colleges/${college.id}`, { method: "PUT", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || "Update failed");
        return;
      }
      toast.success("College updated");
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
    { key: "email", label: "Contact Email" },
    { key: "phone", label: "Contact Phone" },
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
  ];

  // Close with a refresh if images changed (so parent re-reads new URLs).
  const handleClose = () => {
    if (dirtyImages) onSaved();
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit College</h2>
          <button onClick={handleClose} className="text-xl leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>

        <div className="space-y-5 p-6">
          {/* Image management (Phase 1) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageUploader
              label="Logo"
              endpoint="/api/uploads/logo"
              extraFields={{ collegeId: String(college.id) }}
              currentUrl={logoUrl}
              fit="contain"
              heightClass="h-32"
              onUploaded={(data) => {
                if (data.url) {
                  setLogoUrl(data.url);
                  setDirtyImages(true);
                }
              }}
            />
            <ImageUploader
              label="Banner"
              endpoint="/api/uploads/banner"
              extraFields={{ collegeId: String(college.id) }}
              currentUrl={bannerUrl}
              fit="cover"
              heightClass="h-32"
              onUploaded={(data) => {
                if (data.url) {
                  setBannerUrl(data.url);
                  setDirtyImages(true);
                }
              }}
            />
          </div>

          {/* Text fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{f.label}</label>
                <input type="text" value={form[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} className="input" />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Overview</label>
            <textarea rows={4} value={form.overview} onChange={(e) => set("overview", e.target.value)} className="input" />
          </div>

          {/* SEO fields (Phase 11) */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">SEO</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Meta Title</label>
                <input type="text" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder="Custom <title> (≤70 chars)" className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Meta Description</label>
                <textarea rows={2} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder="Search snippet (≤160 chars)" className="input" />
              </div>
            </div>
          </div>

          {/* Status toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> ⭐ Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> ✓ Verified
            </label>
          </div>

          {/* Gallery management (Phase 5) */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Gallery</p>
            <GalleryManager
              collegeId={college.id}
              images={gallery}
              onChange={(next) => {
                setGallery(next);
                setDirtyImages(true);
              }}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? "Saving..." : "Save Changes"}</button>
            <button onClick={handleClose} className="btn btn-ghost">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
