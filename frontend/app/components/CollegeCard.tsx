"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, MapPin, TrendingUp, Award, Scale } from "lucide-react";

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
  useEffect(() => { setSaved(isSaved); }, [isSaved]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: animationDelay / 1000 }}
      whileHover={{ y: -4 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/90 backdrop-blur dark:bg-slate-900/80 shadow-sm transition-shadow hover:shadow-xl ${
        compareSelected
          ? "border-amber-400 ring-2 ring-amber-300/60"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Banner image */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt={`${name} campus`}
            fill
            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        {/* Save / favorite */}
        <button
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save college"}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow hover:scale-110 transition-transform"
        >
          <Heart
            size={17}
            className={saved ? "fill-rose-500 text-rose-500" : "text-slate-500"}
          />
        </button>
        {nirfRank && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow">
            <Award size={12} /> NIRF #{nirfRank}
          </span>
        )}
        {/* Logo overlapping the banner */}
        <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
          {logoUrl ? (
            <Image src={logoUrl} alt={`${name} logo`} width={48} height={48} className="object-cover" />
          ) : (
            <span className="text-sm font-bold text-slate-700">{city.charAt(0)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-7">
        {/* Title + location */}
        <div>
          <Link href={`/college/${id}`}>
            <h3 className="line-clamp-2 cursor-pointer text-[15px] font-bold leading-snug text-slate-900 hover:text-amber-600 dark:text-white">
              {name}
            </h3>
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400">
            <MapPin size={12} /> {city}{state ? `, ${state}` : ""}
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
