// Loading skeletons. `CollegeCardSkeleton` now mirrors the real CollegeCard
// layout (banner + overlapping logo + stats) so the loading->loaded swap is
// visually seamless instead of a layout jump.

export function CollegeCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      {/* Banner */}
      <div className="skeleton h-36 w-full" />

      {/* Overlapping logo (matches CollegeCard's -mt-9 offset) */}
      <div className="relative z-10 -mt-9 px-4">
        <div className="skeleton h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-white" />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
        <div className="skeleton h-4 w-4/5 rounded-lg" />
        <div className="skeleton h-3 w-2/5 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-4 w-12 rounded-full" />
          <div className="skeleton h-4 w-16 rounded-full" />
        </div>
        {/* Stats grid */}
        <div className="skeleton h-14 w-full rounded-xl" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-9 flex-1 rounded-lg" />
          <div className="skeleton h-9 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <CollegeCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Additional skeleton variants (Phase 14) ────────────────────────────────

/** Profile page skeleton — avatar + fields, mirrors the rebuilt profile. */
export function ProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="skeleton h-24 w-24 rounded-full" />
        <div className="skeleton h-5 w-40 rounded-lg" />
        <div className="skeleton h-3 w-52 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Admin table skeleton — header bar + N rows. */
export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="skeleton h-11 w-full" />
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="skeleton h-4 w-1/3 rounded-lg" />
            <div className="skeleton h-4 w-1/4 rounded-lg" />
            <div className="skeleton ml-auto h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Gallery skeleton — responsive grid of image placeholders. */
export function GallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-video w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Saved-colleges grid skeleton — reuses the card skeleton. */
export function SavedGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CollegeCardSkeleton key={i} />
      ))}
    </div>
  );
}
