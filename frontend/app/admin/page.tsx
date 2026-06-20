"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import AddCollegeForm from "../components/AddCollegeForm";
import EditCollegeForm from "../components/EditCollegeForm";
import { useAuth } from "../lib/AuthProvider";
import { apiFetch } from "../lib/apiClient";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  isActive: boolean;
  createdAt: string;
};

type AdminCollege = {
  id: number;
  name: string;
  city: string;
  state?: string | null;
  rating: number;
  nirfRank?: number | null;
  fees?: number | null;
  isPublished?: boolean;
};

type AdminDiscussion = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  author?: { id: number; name: string } | null;
  _count?: { answers: number };
};

type Tab = "overview" | "users" | "colleges" | "discussions";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [colleges, setColleges] = useState<AdminCollege[]>([]);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [collegeTotal, setCollegeTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminCollege | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Route guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [uRes, cRes, dRes] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/colleges?limit=50&sortBy=rating"),
        apiFetch("/api/discussions"),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (cRes.ok) {
        const data = await cRes.json();
        setColleges(data.colleges || []);
        setCollegeTotal(data.total || (data.colleges?.length ?? 0));
      }
      if (dRes.ok) setDiscussions(await dRes.json());
    } catch {
      setError("Failed to load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") loadAll();
  }, [user, loadAll]);

  // ── User actions ───────────────────────────────────────────────────────
  const changeRole = async (u: AdminUser) => {
    const nextRole = u.role === "ADMIN" ? "STUDENT" : "ADMIN";
    setBusyId(`role-${u.id}`);
    try {
      const res = await apiFetch(`/api/users/${u.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const deactivate = async (u: AdminUser) => {
    if (u.id === user?.id) return;
    if (!confirm(`Deactivate ${u.name}? They will no longer be able to log in.`)) return;
    setBusyId(`deact-${u.id}`);
    try {
      const res = await apiFetch(`/api/users/${u.id}/deactivate`, { method: "PATCH" });
      if (res.ok) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: false } : x)));
      }
    } finally {
      setBusyId(null);
    }
  };

  // ── College actions ────────────────────────────────────────────────────
  const deleteCollege = async (c: AdminCollege) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setBusyId(`col-${c.id}`);
    try {
      const res = await apiFetch(`/api/colleges/${c.id}`, { method: "DELETE" });
      if (res.ok) setColleges((prev) => prev.filter((x) => x.id !== c.id));
    } finally {
      setBusyId(null);
    }
  };

  // ── Discussion actions ─────────────────────────────────────────────────
  const flagDiscussion = async (d: AdminDiscussion) => {
    if (!confirm(`Flag and hide "${d.title}"?`)) return;
    setBusyId(`disc-${d.id}`);
    try {
      const res = await apiFetch(`/api/discussions/${d.id}/flag`, { method: "PATCH" });
      if (res.ok) {
        setDiscussions((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: "FLAGGED" } : x)));
      }
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center" style={{ color: "var(--text-secondary)" }}>
          Checking permissions…
        </div>
      </main>
    );
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const activeCount = users.filter((u) => u.isActive).length;
  const flaggedCount = discussions.filter((d) => d.status === "FLAGGED").length;

  const stats = [
    { label: "Total Users", value: users.length, sub: `${adminCount} admins · ${activeCount} active` },
    { label: "Colleges", value: collegeTotal, sub: "in catalog" },
    { label: "Discussions", value: discussions.length, sub: `${flaggedCount} flagged` },
  ];

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users (${users.length})` },
    { id: "colleges", label: `Colleges (${collegeTotal})` },
    { id: "discussions", label: `Q&A (${discussions.length})` },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as <span className="font-semibold text-slate-700">{user.name}</span>
            </p>
          </div>
          <button onClick={loadAll} className="btn btn-outline btn-sm self-start sm:self-auto">
            ↻ Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-bar mb-6 max-w-xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-item ${tab === t.id ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm mb-6 bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 animate-pulse">Loading admin data…</div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="stat-card">
                    <p className="text-3xl font-bold text-slate-900">{s.value.toLocaleString("en-IN")}</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{s.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── USERS ────────────────────────────────────────────────── */}
            {tab === "users" && (
              <div className="card overflow-hidden">
                <div className="table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold hidden md:table-cell">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400 sm:hidden">{u.email}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${u.role === "ADMIN" ? "badge-purple" : "badge-navy"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => changeRole(u)}
                                disabled={busyId === `role-${u.id}`}
                                className="btn btn-sm btn-outline"
                              >
                                {u.role === "ADMIN" ? "Make Student" : "Make Admin"}
                              </button>
                              <button
                                onClick={() => deactivate(u)}
                                disabled={!u.isActive || u.id === user.id || busyId === `deact-${u.id}`}
                                className="btn btn-sm btn-danger"
                                title={u.id === user.id ? "You can't deactivate yourself" : "Deactivate"}
                              >
                                Deactivate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── COLLEGES ─────────────────────────────────────────────── */}
            {tab === "colleges" && (
              <div className="space-y-4">
                <AddCollegeForm onAdded={loadAll} />
                <div className="card overflow-hidden">
                  <div className="table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="px-4 py-3 font-semibold">College</th>
                          <th className="px-4 py-3 font-semibold hidden sm:table-cell">City</th>
                          <th className="px-4 py-3 font-semibold hidden md:table-cell">Rating</th>
                          <th className="px-4 py-3 font-semibold hidden md:table-cell">NIRF</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3">
                              <Link href={`/college/${c.id}`} className="font-semibold text-slate-900 hover:text-amber-600">
                                {c.name}
                              </Link>
                              <div className="text-xs text-slate-400 sm:hidden">{c.city}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{c.city}</td>
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">★ {c.rating?.toFixed?.(1) ?? c.rating}</td>
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{c.nirfRank ? `#${c.nirfRank}` : "—"}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditing(c)} className="btn btn-sm btn-outline">Edit</button>
                                <button
                                  onClick={() => deleteCollege(c)}
                                  disabled={busyId === `col-${c.id}`}
                                  className="btn btn-sm btn-danger"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {colleges.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No colleges yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {collegeTotal > colleges.length && (
                  <p className="text-xs text-slate-400 text-center">
                    Showing first {colleges.length} of {collegeTotal}. Use search on the home page to find others.
                  </p>
                )}
              </div>
            )}

            {/* ── DISCUSSIONS ──────────────────────────────────────────── */}
            {tab === "discussions" && (
              <div className="card overflow-hidden">
                <div className="table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="px-4 py-3 font-semibold">Title</th>
                        <th className="px-4 py-3 font-semibold hidden sm:table-cell">Author</th>
                        <th className="px-4 py-3 font-semibold hidden md:table-cell">Answers</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discussions.map((d) => (
                        <tr key={d.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">
                            <Link href={`/discussions/${d.id}`} className="font-semibold text-slate-900 hover:text-amber-600">
                              {d.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{d.author?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{d._count?.answers ?? 0}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${d.status === "FLAGGED" ? "badge-red" : "badge-green"}`}>
                              {d.status === "FLAGGED" ? "Flagged" : "Open"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button
                                onClick={() => flagDiscussion(d)}
                                disabled={d.status === "FLAGGED" || busyId === `disc-${d.id}`}
                                className="btn btn-sm btn-danger"
                              >
                                Flag
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {discussions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No discussions yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {editing && (
        <EditCollegeForm
          college={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadAll();
          }}
        />
      )}
    </main>
  );
}
