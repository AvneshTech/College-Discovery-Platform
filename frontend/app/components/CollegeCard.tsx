"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, MapPin, TrendingUp, Award, Scale } from "lucide-react";
// NEW: shared image primitive that handles lazy-load, skeleton, fade-in & error fallback.
import SmartImage from "./SmartImage";

export type CollegeCardProps = {
  id: number;
  slug?: string;
  name: string;
  city: string;
  state?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  rating: number;
  reviewCount?: number;
  nirfRank?: number | null;
  naacGrade?: string | null;
  feesDisplay?: string | null;
  avgPackage?: number | null;
  highestPackage?: number | null;
  placementRate?: number | null;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
  onCompare?: (id: number) => void;
  compareSelected?: boolean;
  animationDelay?: number;
};

// A guaranteed-available generic campus photo used when the college has no
// bannerUrl AND the derived placeholder also fails to load.
const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=60";

function formatLakhs(amount?: number | null) {
  if (!amount) return "—";
  return `₹${(amount / 100000).toFixed(1)}L`;
}

export default function CollegeCard({
  id,
  name,
  city,
  state,
  logoUrl,
  bannerUrl,
  rating,
  reviewCount = 0,
  nirfRank,
  naacGrade,
  feesDisplay,
  avgPackage,
  highestPackage,
  placementRate,
  isSaved = false,
  onToggleSave,
  onCompare,
  compareSelected,
  animationDelay = 0,
}: CollegeCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  // Keep in sync when the parent's saved list loads/changes asynchronously.
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onToggleSave || saving) return;
    setSaving(true);
    setSaved((s) => !s); // optimistic
    try {
      await onToggleSave(id);
    } catch {
      setSaved((s) => !s); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  // Letter badge shown only when there is genuinely no logo image available.
  const logoFallback = (
    <span className="text-base font-bold text-slate-700">
      {(name?.charAt(0) || city?.charAt(0) || "?").toUpperCase()}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: animationDelay / 1000 }}
      whileHover={{ y: -6 }} // slightly stronger lift for a premium feel
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/90 backdrop-blur dark:bg-slate-900/80 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 ${
        compareSelected
          ? "border-amber-400 ring-2 ring-amber-300/60"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/*
        BANNER
        ------------------------------------------------------------------
        • Fixed height (h-36) so every card aligns in the grid.
        • SmartImage handles lazy-load + skeleton + smooth fade + fallback.
        • `overflow-visible` is NOT used here; the logo is positioned in a
          dedicated relative wrapper below so it can overlap cleanly.
      */}
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        <SmartImage
          src={bannerUrl}
          fallbackSrc={FALLBACK_BANNER}
          alt={`${name} campus`}
          fit="cover"
          wrapperClassName="h-full w-full"
          className="opacity-95 transition-transform duration-500 group-hover:scale-105"
        />

        {/* Subtle gradient so badges/logo read clearly over busy photos. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Save / favorite — z-20 keeps it clickable above the overlay. */}
        <button
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save college"}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow hover:scale-110 transition-transform"
        >
          <Heart
            size={17}
            className={saved ? "fill-rose-500 text-rose-500" : "text-slate-500"}
          />
        </button>

        {nirfRank && (
          <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow">
            <Award size={12} /> NIRF #{nirfRank}
          </span>
        )}
      </div>

      {/*
        LOGO — FIXED OVERLAP
        ------------------------------------------------------------------
        Problem before: the logo lived INSIDE the banner with `-bottom-5`,
        so the banner's `overflow-hidden` clipped its lower half.

        Fix: render the logo in a separate wrapper that sits BETWEEN the
        banner and the content. A negative top margin (-mt-9) pulls it
        upward so it straddles the seam — ~50% over the banner, ~50% over
        the content — and `z-10` + `relative` guarantee it paints on top
        and is never clipped. Responsive: 14 (mobile) → 16 (sm+).
      */}
      <div className="relative z-10 -mt-9 px-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-white bg-white shadow-md ring-1 ring-black/5 overflow-hidden">
          <SmartImage
            src={logoUrl}
            alt={`${name} logo`}
            fit="contain"
            wrapperClassName="h-full w-full bg-white"
            className="p-1.5"
            fallback={logoFallback}
          />
        </div>
      </div>

      {/* CONTENT — pt-3 gives clean spacing below the overlapping logo. */}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        {/* Title + location */}
        <div>
          <Link href={`/college/${id}`}>
            <h3 className="line-clamp-2 cursor-pointer text-[15px] font-bold leading-snug text-slate-900 hover:text-amber-600 dark:text-white">
              {name}
            </h3>
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400">
            <MapPin size={12} /> {city}
            {state ? `, ${state}` : ""}
          </p>
        </div>

        {/* Rating + NAAC */}
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            ★ {rating.toFixed(1)}
            <span className="font-normal text-slate-400">({reviewCount})</span>
          </span>
          {naacGrade && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              NAAC {naacGrade}
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Fees</p>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{feesDisplay || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Avg Pkg</p>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{formatLakhs(avgPackage)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Highest</p>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{formatLakhs(highestPackage)}</p>
          </div>
        </div>

        {placementRate !== undefined && placementRate !== null && (
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <TrendingUp size={13} className="text-emerald-500" />
            <span>{placementRate}% placement rate</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href={`/college/${id}`}
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            View Details
          </Link>
          {onCompare && (
            <button
              onClick={() => onCompare(id)}
              title={compareSelected ? "Remove from compare" : "Add to compare"}
              className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                compareSelected
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Scale size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
