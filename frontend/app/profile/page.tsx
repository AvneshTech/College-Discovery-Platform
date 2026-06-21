"use client";

// app/profile/page.tsx — Phase 2 (full rebuild).
// Uses GET/PUT /api/users/profile (not /api/auth/me) so it can show & edit
// avatar, bio, preferredBranches, preferredCities, budgetMaxFees. Avatar upload
// uses the shared ImageUploader → POST /api/uploads/avatar.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import SmartImage from "../components/SmartImage";
import ImageUploader from "../components/ImageUploader";
import { ProfileSkeleton } from "../components/Skeleton";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../lib/AuthProvider";
import { useToast } from "../components/Toast";
import { Pencil, Save, X, Wallet, MapPin, GraduationCap } from "lucide-react";

type Profile = {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  bio?: string | null;
  preferredBranches?: string[];
  preferredCities?: string[];
  budgetMaxFees?: number | null;
  createdAt?: string;
  lastLoginAt?: string | null;
};

function TagInput({
  label,
  icon,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft("");
  };
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {icon} {label}
      </label>
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-300 p-2 dark:border-slate-700">
        {values.map((v) => (
          <span key={v} className="badge badge-navy">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
              className="ml-1 opacity-60 hover:opacity-100"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={values.length === 0 ? placeholder : "Add…"}
          className="min-w-[100px] flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200"
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable copies
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");

  const hydrate = (p: Profile) => {
    setProfile(p);
    setName(p.name ?? "");
    setBio(p.bio ?? "");
    setBranches(p.preferredBranches ?? []);
    setCities(p.preferredCities ?? []);
    setBudget(p.budgetMaxFees ? String(p.budgetMaxFees) : "");
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await apiFetch("/api/users/profile");
        if (res.ok) hydrate(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const save = async () => {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    if (bio.length > 500) {
      toast.error("Bio must be under 500 characters.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        bio: bio.trim() || undefined,
        preferredBranches: branches,
        preferredCities: cities,
      };
      const b = parseInt(budget, 10);
      if (Number.isFinite(b) && b > 0) payload.budgetMaxFees = b;

      const res = await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.errors?.[0]?.message || data.message || "Failed to save profile.");
        return;
      }
      hydrate({ ...(profile as Profile), ...data });
      setEditing(false);
      toast.success("Profile updated!");
      refreshUser(); // keep the navbar name in sync
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <section className="mx-auto mt-10 max-w-2xl px-6 pb-16">
        {authLoading || loading ? (
          <ProfileSkeleton />
        ) : profile ? (
          <div className="card overflow-hidden">
            {/* Header band */}
            <div className="hero-navy px-6 py-8">
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white/20 bg-amber-500">
                  <SmartImage
                    src={profile.avatarUrl}
                    alt={`${profile.name} avatar`}
                    fit="cover"
                    wrapperClassName="h-full w-full"
                    fallback={
                      <span className="text-3xl font-bold text-slate-900">{initials}</span>
                    }
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <p className="text-sm text-white/60">{profile.email}</p>
                  <span className="badge badge-amber mt-2">{profile.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              {!editing ? (
                <>
                  {/* Read-only view */}
                  <Field label="Bio">
                    {profile.bio ? (
                      <p className="text-slate-700 dark:text-slate-200">{profile.bio}</p>
                    ) : (
                      <p className="italic text-slate-400">No bio yet.</p>
                    )}
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Preferred Cities" icon={<MapPin size={13} />}>
                      <TagList items={profile.preferredCities} />
                    </Field>
                    <Field label="Preferred Branches" icon={<GraduationCap size={13} />}>
                      <TagList items={profile.preferredBranches} />
                    </Field>
                  </div>

                  <Field label="Max Budget (annual fees)" icon={<Wallet size={13} />}>
                    {profile.budgetMaxFees ? (
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        ₹{profile.budgetMaxFees.toLocaleString("en-IN")}
                      </p>
                    ) : (
                      <p className="italic text-slate-400">Not set</p>
                    )}
                  </Field>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => setEditing(true)} className="btn btn-primary">
                      <Pencil size={15} /> Edit Profile
                    </button>
                    <button onClick={() => router.push("/saved")} className="btn btn-outline">
                      🔖 Saved Colleges
                    </button>
                    {profile.role === "ADMIN" && (
                      <button onClick={() => router.push("/admin")} className="btn btn-outline">
                        🛠 Admin Panel
                      </button>
                    )}
                    <button onClick={logout} className="btn btn-danger ml-auto">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit mode */}
                  <ImageUploader
                    label="Avatar"
                    endpoint="/api/uploads/avatar"
                    currentUrl={profile.avatarUrl}
                    fit="cover"
                    heightClass="h-32"
                    onUploaded={(data) => {
                      if (data.url) {
                        setProfile((p) => (p ? { ...p, avatarUrl: data.url } : p));
                        toast.success("Avatar updated!");
                        refreshUser();
                      }
                    }}
                  />

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Name
                    </label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Bio <span className="font-normal text-slate-400">({bio.length}/500)</span>
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      maxLength={500}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us a bit about yourself…"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TagInput
                      label="Preferred Cities"
                      icon={<MapPin size={13} />}
                      values={cities}
                      onChange={setCities}
                      placeholder="e.g. Mumbai"
                    />
                    <TagInput
                      label="Preferred Branches"
                      icon={<GraduationCap size={13} />}
                      values={branches}
                      onChange={setBranches}
                      placeholder="e.g. CSE"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      <Wallet size={13} /> Max Budget (annual fees, ₹)
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 500000"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={save} disabled={saving} className="btn btn-primary">
                      <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        hydrate(profile);
                        setEditing(false);
                      }}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

function TagList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="italic text-slate-400">None set</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="badge badge-teal">
          {i}
        </span>
      ))}
    </div>
  );
}
