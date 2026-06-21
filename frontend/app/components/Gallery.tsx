"use client";

// app/components/Gallery.tsx
// Phase 5/7 — renders College.gallery (JSON array of { url, publicId, caption }).
//   • <GalleryGrid>    — public, responsive grid with a click-to-zoom lightbox.
//   • <GalleryManager> — admin: append (ImageUploader → /api/uploads/gallery)
//                        and delete (/api/uploads/gallery/:collegeId/:publicId).

import { useState } from "react";
import { X } from "lucide-react";
import SmartImage from "./SmartImage";
import ImageUploader from "./ImageUploader";
import { apiFetch } from "../lib/apiClient";
import { useToast } from "./Toast";

export type GalleryImage = { url: string; publicId: string; caption?: string | null };

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<GalleryImage | null>(null);
  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) => (
          <button
            key={img.publicId}
            onClick={() => setActive(img)}
            className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
            aria-label={img.caption || "View photo"}
          >
            <SmartImage src={img.url} alt={img.caption || "Campus photo"} fit="cover" wrapperClassName="h-full w-full" className="transition-transform duration-300 group-hover:scale-105" />
            {img.caption && (
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-left text-[11px] text-white">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.caption || "Campus photo"}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function GalleryManager({
  collegeId,
  images,
  onChange,
}: {
  collegeId: number;
  images: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (publicId: string) => {
    setBusy(publicId);
    try {
      const res = await apiFetch(
        `/api/uploads/gallery/${collegeId}/${encodeURIComponent(publicId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const data = await res.json();
        onChange(data.gallery ?? []);
        toast.success("Image removed");
      } else {
        toast.error("Failed to remove image");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.publicId} className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <SmartImage src={img.url} alt={img.caption || "Gallery image"} fit="cover" wrapperClassName="h-full w-full" />
              <button
                onClick={() => remove(img.publicId)}
                disabled={busy === img.publicId}
                aria-label="Delete image"
                className="absolute right-1.5 top-1.5 rounded-full bg-red-500/90 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ImageUploader
        label="Add gallery image"
        endpoint="/api/uploads/gallery"
        extraFields={{ collegeId: String(collegeId) }}
        fit="cover"
        heightClass="h-32"
        onUploaded={(data) => {
          if (Array.isArray((data as { gallery?: GalleryImage[] }).gallery)) {
            onChange((data as { gallery: GalleryImage[] }).gallery);
            toast.success("Image added to gallery");
          }
        }}
      />
    </div>
  );
}
