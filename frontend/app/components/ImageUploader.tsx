"use client";

// app/components/ImageUploader.tsx
// ---------------------------------------------------------------------------
// Phase 1 — shared image-management primitive. Drag-and-drop OR click to pick,
// live preview, upload-progress bar, replace, optional delete, and explicit
// loading / error states. Parameterized by endpoint + extra form fields so the
// SAME component drives logo / banner (EditCollegeForm), avatar (Profile), and
// the gallery (GalleryManager).
//
// Uploads go through lib/uploadClient (multipart + progress + auth retry).

import { useCallback, useRef, useState } from "react";
import { UploadCloud, RefreshCw, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { uploadFile } from "../lib/uploadClient";

type UploadedShape = { url?: string; publicId?: string; gallery?: unknown };

type Props = {
  label: string;
  endpoint: string; // e.g. "/api/uploads/logo"
  extraFields?: Record<string, string>; // e.g. { collegeId: "12" }
  currentUrl?: string | null;
  fit?: "cover" | "contain";
  /** Called with the raw backend response after a successful upload. */
  onUploaded: (data: UploadedShape) => void;
  /** Optional delete handler (e.g. clear logo/banner). If omitted, no delete button. */
  onDelete?: () => void | Promise<void>;
  /** Height of the drop zone preview. */
  heightClass?: string;
  accept?: string;
  maxSizeMB?: number;
};

export default function ImageUploader({
  label,
  endpoint,
  extraFields = {},
  currentUrl,
  fit = "cover",
  onUploaded,
  onDelete,
  heightClass = "h-40",
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMB = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Image must be under ${maxSizeMB}MB.`);
        return;
      }
      // Instant local preview while the upload runs.
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setUploading(true);
      setProgress(0);

      const res = await uploadFile<UploadedShape>(endpoint, file, extraFields, (p) =>
        setProgress(p)
      );
      setUploading(false);

      if (res.ok) {
        if (res.data.url) setPreview(res.data.url);
        onUploaded(res.data);
      } else {
        setError(res.message);
        setPreview(currentUrl ?? null); // revert preview on failure
      }
      URL.revokeObjectURL(localUrl);
    },
    [endpoint, extraFields, currentUrl, maxSizeMB, onUploaded]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      setPreview(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) inputRef.current?.click();
        }}
        className={`relative ${heightClass} w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragOver
            ? "border-amber-400 bg-amber-50/60 dark:bg-amber-500/10"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/40"
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`${label} preview`}
              className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain p-2"}`}
            />
            {!uploading && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition hover:bg-black/40 hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800">
                  <RefreshCw size={13} /> Replace
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <UploadCloud size={26} />
            <p className="text-xs font-medium">
              Drag &amp; drop or <span className="text-amber-600">click to upload</span>
            </p>
            <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to {maxSizeMB}MB</p>
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white">
            <Loader2 size={22} className="animate-spin" />
            <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold">{progress}%</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-sm btn-outline"
        >
          <ImageIcon size={13} /> {preview ? "Replace" : "Choose Image"}
        </button>
        {preview && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="btn btn-sm btn-danger"
          >
            <Trash2 size={13} /> {deleting ? "Removing…" : "Remove"}
          </button>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
