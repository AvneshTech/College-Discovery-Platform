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
