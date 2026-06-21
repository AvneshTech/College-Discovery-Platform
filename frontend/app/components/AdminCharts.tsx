"use client";

// app/components/AdminCharts.tsx — Phase 5/8/15.
// Recharts bar charts for the admin dashboard: Most Viewed / Most Saved /
// Most Compared colleges. Lazy-loaded via next/dynamic from the admin page so
// the Recharts bundle never ships to non-admin routes.

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export type ChartCollege = {
  id: number;
  name: string;
  viewsCount?: number;
  saveCount?: number;
  compareCount?: number;
};

function trim(name: string) {
  return name.length > 22 ? name.slice(0, 22) + "…" : name;
}

function MiniBar({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: ChartCollege[];
  dataKey: "viewsCount" | "saveCount" | "compareCount";
  color: string;
}) {
  const rows = data
    .map((c) => ({ name: trim(c.name), value: c[dataKey] ?? 0 }))
    .filter((r) => r.value > 0);

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm italic text-slate-400">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 38)}>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {rows.map((_, i) => (
                <Cell key={i} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AdminCharts({
  mostViewed,
  mostSaved,
  mostCompared,
}: {
  mostViewed: ChartCollege[];
  mostSaved: ChartCollege[];
  mostCompared: ChartCollege[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <MiniBar title="👁 Most Viewed Colleges" data={mostViewed} dataKey="viewsCount" color="#0ea5e9" />
      <MiniBar title="🔖 Most Saved Colleges" data={mostSaved} dataKey="saveCount" color="#f59e0b" />
      <MiniBar title="⚖️ Most Compared Colleges" data={mostCompared} dataKey="compareCount" color="#10b981" />
    </div>
  );
}
