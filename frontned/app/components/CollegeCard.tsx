"use client";

import Link from "next/link";

type CollegeCardProps = {
  id: number;
  name: string;
  city: string;
  rating: string | number;
  fees?: string | null;
  onCompare?: (id: number) => void;
  compareSelected?: boolean;
};

export default function CollegeCard({
  id,
  name,
  city,
  rating,
  fees,
  onCompare,
  compareSelected,
}: CollegeCardProps) {
  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex flex-col gap-3 ${
        compareSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <Link href={`/college/${id}`}>
        <h3 className="text-xl font-bold text-slate-900 hover:text-blue-600 transition">
          {name}
        </h3>
        <p className="text-slate-600 text-sm">📍 {city}</p>
        <p className="text-slate-700 mt-1">⭐ {rating}</p>
        {fees && <p className="text-slate-600 text-sm">💰 {fees}</p>}
      </Link>
      {onCompare && (
        <button
          onClick={() => onCompare(id)}
          className={`mt-2 text-sm px-3 py-1.5 rounded-lg transition ${
            compareSelected
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-slate-700 hover:bg-gray-200"
          }`}
        >
          {compareSelected ? "✓ Selected" : "+ Compare"}
        </button>
      )}
    </div>
  );
}
