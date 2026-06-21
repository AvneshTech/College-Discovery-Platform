"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import AddCollegeForm from "../components/AddCollegeForm";
import EditCollegeForm from "../components/EditCollegeForm";
import Tabs from "../components/Tabs";
import ErrorState from "../components/ErrorState";
import { AdminTableSkeleton } from "../components/Skeleton";
import { useAuth } from "../lib/AuthProvider";
import { apiFetch } from "../lib/apiClient";
import { useToast } from "../components/Toast";
import type { ChartCollege } from "../components/AdminCharts";

const AdminCharts = dynamic(() => import("../components/AdminCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-64 rounded-2xl" />
      ))}
    </div>
  ),
});

type AdminUser = { id: number; name: string; email: string; role: "STUDENT" | "ADMIN"; isActive: boolean; createdAt: string };
type AdminCollege = { id: number; name: string; city: string; state?: string | null; rating: number; nirfRank?: number | null; fees?: number | null; isPublished?: boolean };
type AdminDiscussion = { id: number; title: string; status: string; createdAt: string; author?: { id: number; name: string } | null; _count?: { answers: number } };
type Inquiry = { id: number; name: string; email: string; subject: string; message: string; isResolved: boolean; createdAt: string };
type Dashboard = {
  totalUsers: number; totalColleges: number; totalReviews: number; totalDiscussions: number;
  totalAnswers: number; totalSaves: number; totalViews: number; totalContactInquiries: number; unresolvedInquiries: number;
};

type Tab = "overview" | "users" | "colleges" | "discussions" | "contact";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [colleges, setColleges] = useState<AdminCollege[]>([]);
  const [discussions, setDiscussions] = useState<AdminDiscussion[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [collegeTotal, setCollegeTotal] = useState(0);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [mostViewed, setMostViewed] = useState<ChartCollege[]>([]);
  const [mostSaved, setMostSaved] = useState<ChartCollege[]>([]);
  const [mostCompared, setMostCompared] = useState<ChartCollege[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminCollege | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Route guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "ADMIN") router.replace("/");
  }, [user, authLoading, router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [uRes, cRes, dRes, dashRes, mvRes, msRes, mcRes, contactRes] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/colleges?limit=50&sortBy=rating"),
        apiFetch("/api/discussions?limit=50"),
        apiFetch("/api/analytics/dashboard"),
        apiFetch("/api/colleges/most-viewed?limit=8"),
        apiFetch("/api/analytics/most-saved?limit=8"),
        apiFetch("/api/analytics/most-compared?limit=8"),
        apiFetch("/api/contact?limit=50"),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (cRes.ok) {
        const data = await cRes.json();
        setColleges(data.colleges || []);
        setCollegeTotal(data.total || (data.colleges?.length ?? 0));
      }
      // FIX (§1): discussions endpoint returns { discussions, total, ... }.
      if (dRes.ok) {
        const data = await dRes.json();
        setDiscussions(data.discussions ?? []);
      }
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (mvRes.ok) setMostViewed(await mvRes.json());
      if (msRes.ok) setMostSaved(await msRes.json());
      if (mcRes.ok) setMostCompared(await mcRes.json());
      if (contactRes.ok) {
        const data = await contactRes.json();
        setInquiries(data.inquiries ?? []);
      }
    } catch {
      setError("Failed to load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") loadAll();
  }, [user, loadAll]);

  // User actions
  const changeRole = async (u: AdminUser) => {
    const nextRole = u.role === "ADMIN" ? "STUDENT" : "ADMIN";
    setBusyId(`role-${u.id}`);
    try {
      const res = await apiFetch(`/api/users/${u.id}/role`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
      if (res.ok) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
        toast.success(`${u.name} is now ${nextRole}`);
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
        toast.success(`${u.name} deactivated`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const deleteCollege = async (c: AdminCollege) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setBusyId(`col-${c.id}`);
    try {
      const res = await apiFetch(`/api/colleges/${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setColleges((prev) => prev.filter((x) => x.id !== c.id));
        toast.success("College deleted");
      }
    } finally {
      setBusyId(null);
    }
  };

  const flagDiscussion = async (d: AdminDiscussion) => {
    if (!confirm(`Flag and hide "${d.title}"?`)) return;
    setBusyId(`disc-${d.id}`);
    try {
      const res = await apiFetch(`/api/discussions/${d.id}/flag`, { method: "PATCH" });
      if (res.ok) {
        setDiscussions((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: "FLAGGED" } : x)));
        toast.success("Discussion flagged");
      }
    } finally {
      setBusyId(null);
    }
  };

  const resolveInquiry = async (inq: Inquiry) => {
    setBusyId(`inq-${inq.id}`);
    try {
      const res = await apiFetch(`/api/contact/${inq.id}/resolve`, { method: "PATCH" });
      if (res.ok) {
        setInquiries((prev) => prev.map((x) => (x.id === inq.id ? { ...x, isResolved: true } : x)));
        toast.success("Marked as resolved");
      }
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500 sm:px-6">Checking permissions…</div>
      </main>
    );
  }

  const unresolvedCount = inquiries.filter((i) => !i.isResolved).length;

  const STATS = dashboard
    ? [
        { label: "Total Users", value: dashboard.totalUsers },
        { label: "Colleges", value: dashboard.totalColleges },
        { label: "Reviews", value: dashboard.totalReviews },
        { label: "Discussions", value: dashboard.totalDiscussions },
        { label: "Answers", value: dashboard.totalAnswers },
        { label: "Total Saves", value: dashboard.totalSaves },
        { label: "Total Views", value: dashboard.totalViews },
        { label: "Contact Inquiries", value: dashboard.totalContactInquiries, sub: `${dashboard.unresolvedInquiries} unresolved` },
      ]
    : [];

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users (${users.length})` },
    { id: "colleges", label: `Colleges (${collegeTotal})` },
    { id: "discussions", label: `Q&A (${discussions.length})` },
    { id: "contact", label: `Inquiries${unresolvedCount ? ` (${unresolvedCount})` : ""}` },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Admin Panel</h1>
            <p className="mt-1 text-sm text-slate-500">
              Signed in as <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span>
            </p>
          </div>
          <button onClick={loadAll} className="btn btn-outline btn-sm self-start sm:self-auto">↻ Refresh</button>
        </div>

        <div className="mb-6 max-w-2xl overflow-x-auto">
          <Tabs tabs={TABS} active={tab} onChange={setTab} variant="pill" ariaLabel="Admin sections" />
        </div>

        {error && <ErrorState title="Couldn't load admin data" message={error} onRetry={loadAll} className="mb-6" />}

        {loading ? (
          <AdminTableSkeleton rows={6} />
        ) : (
          <div id={`tabpanel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {/* OVERVIEW — analytics dashboard + charts */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {STATS.map((s) => (
                    <div key={s.label} className="stat-card">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                        {s.value.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{s.label}</p>
                      {s.sub && <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                <AdminCharts mostViewed={mostViewed} mostSaved={mostSaved} mostCompared={mostCompared} />
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div className="card overflow-hidden">
                <div className="table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="hidden px-4 py-3 font-semibold sm:table-cell">Email</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="hidden px-4 py-3 font-semibold md:table-cell">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                            <div className="text-xs text-slate-400 sm:hidden">{u.email}</div>
                          </td>
                          <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3"><span className={`badge ${u.role === "ADMIN" ? "badge-purple" : "badge-navy"}`}>{u.role}</span></td>
                          <td className="hidden px-4 py-3 md:table-cell"><span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>{u.isActive ? "Active" : "Deactivated"}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => changeRole(u)} disabled={busyId === `role-${u.id}`} className="btn btn-sm btn-outline">{u.role === "ADMIN" ? "Make Student" : "Make Admin"}</button>
                              <button onClick={() => deactivate(u)} disabled={!u.isActive || u.id === user.id || busyId === `deact-${u.id}`} className="btn btn-sm btn-danger" title={u.id === user.id ? "You can't deactivate yourself" : "Deactivate"}>Deactivate</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No users found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COLLEGES */}
            {tab === "colleges" && (
              <div className="space-y-4">
                <AddCollegeForm onAdded={loadAll} />
                <div className="card overflow-hidden">
                  <div className="table-wrapper" style={{ overflowX: "auto" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                          <th className="px-4 py-3 font-semibold">College</th>
                          <th className="hidden px-4 py-3 font-semibold sm:table-cell">City</th>
                          <th className="hidden px-4 py-3 font-semibold md:table-cell">Rating</th>
                          <th className="hidden px-4 py-3 font-semibold md:table-cell">NIRF</th>
                          <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                            <td className="px-4 py-3">
                              <Link href={`/college/${c.id}`} className="font-semibold text-slate-900 hover:text-amber-600 dark:text-slate-100">{c.name}</Link>
                              <div className="text-xs text-slate-400 sm:hidden">{c.city}</div>
                            </td>
                            <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 sm:table-cell">{c.city}</td>
                            <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 md:table-cell">★ {c.rating?.toFixed?.(1) ?? c.rating}</td>
                            <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 md:table-cell">{c.nirfRank ? `#${c.nirfRank}` : "—"}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditing(c)} className="btn btn-sm btn-outline">Edit</button>
                                <button onClick={() => deleteCollege(c)} disabled={busyId === `col-${c.id}`} className="btn btn-sm btn-danger">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {colleges.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No colleges yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                {collegeTotal > colleges.length && (
                  <p className="text-center text-xs text-slate-400">Showing first {colleges.length} of {collegeTotal}. Use search on the home page to find others.</p>
                )}
              </div>
            )}

            {/* DISCUSSIONS */}
            {tab === "discussions" && (
              <div className="card overflow-hidden">
                <div className="table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                        <th className="px-4 py-3 font-semibold">Title</th>
                        <th className="hidden px-4 py-3 font-semibold sm:table-cell">Author</th>
                        <th className="hidden px-4 py-3 font-semibold md:table-cell">Answers</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discussions.map((d) => (
                        <tr key={d.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                          <td className="px-4 py-3"><Link href={`/discussions/${d.id}`} className="font-semibold text-slate-900 hover:text-amber-600 dark:text-slate-100">{d.title}</Link></td>
                          <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 sm:table-cell">{d.author?.name ?? "—"}</td>
                          <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-300 md:table-cell">{d._count?.answers ?? 0}</td>
                          <td className="px-4 py-3"><span className={`badge ${d.status === "FLAGGED" ? "badge-red" : "badge-green"}`}>{d.status === "FLAGGED" ? "Flagged" : "Open"}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button onClick={() => flagDiscussion(d)} disabled={d.status === "FLAGGED" || busyId === `disc-${d.id}`} className="btn btn-sm btn-danger">Flag</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {discussions.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No discussions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CONTACT INQUIRIES */}
            {tab === "contact" && (
              <div className="space-y-3">
                {inquiries.length === 0 ? (
                  <div className="card p-10 text-center text-slate-400">No contact inquiries yet.</div>
                ) : (
                  inquiries.map((inq) => (
                    <div key={inq.id} className={`card p-5 ${inq.isResolved ? "opacity-70" : ""}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{inq.subject}</h3>
                            <span className={`badge ${inq.isResolved ? "badge-green" : "badge-amber"}`}>{inq.isResolved ? "Resolved" : "Open"}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {inq.name} ·{" "}
                            <a href={`mailto:${inq.email}`} className="text-amber-600 hover:underline">{inq.email}</a> ·{" "}
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{inq.message}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <a href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`} className="btn btn-sm btn-outline">Reply</a>
                          {!inq.isResolved && (
                            <button onClick={() => resolveInquiry(inq)} disabled={busyId === `inq-${inq.id}`} className="btn btn-sm btn-primary">Resolve</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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
