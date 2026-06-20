"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type ComparedCollege = {
  id: number;
  name: string;
  rating: number;
  fees: number | null; // annual, INR
  avgPackage: number | null;
  highestPackage: number | null;
  placementRate: number | null;
  nirfRank: number | null;
};

const COLORS = ["#f59e0b", "#0f172a", "#0ea5e9", "#10b981"];

function normalize(value: number | null, max: number, invert = false) {
  if (value === null || value === undefined) return 0;
  const pct = Math.min(100, (value / max) * 100);
  return invert ? 100 - pct : pct;
}

export default function CompareCharts({ colleges }: { colleges: ComparedCollege[] }) {
  // Radar chart needs one row per metric, one key per college
  const radarData = [
    "Rating",
    "Placement Rate",
    "Avg Package",
    "Affordability",
    "Ranking",
  ].map((metric) => {
    const row: Record<string, string | number> = { metric };
    colleges.forEach((c) => {
      let value = 0;
      if (metric === "Rating") value = normalize(c.rating, 5);
      if (metric === "Placement Rate") value = normalize(c.placementRate, 100);
      if (metric === "Avg Package") value = normalize(c.avgPackage, 3000000);
      if (metric === "Affordability") value = normalize(c.fees, 3000000, true);
      if (metric === "Ranking") value = normalize(c.nirfRank ? 200 - c.nirfRank : 0, 200);
      row[c.name] = Math.round(value);
    });
    return row;
  });

  const packageData = colleges.map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
    "Avg Package (₹L)": c.avgPackage ? Math.round(c.avgPackage / 100000) : 0,
    "Highest Package (₹L)": c.highestPackage ? Math.round(c.highestPackage / 100000) : 0,
  }));

  const feesData = colleges.map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
    "Annual Fees (₹L)": c.fees ? Math.round((c.fees / 100000) * 10) / 10 : 0,
  }));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Overall fit — radar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Overall Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
            {colleges.map((c, i) => (
              <Radar
                key={c.id}
                name={c.name}
                dataKey={c.name}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.18}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Packages — bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Placements (₹ Lakhs)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={packageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Avg Package (₹L)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Highest Package (₹L)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fees — bar, full width */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Annual Fees (₹ Lakhs)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={feesData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="Annual Fees (₹L)" fill="#0f172a" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
