"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE } from "../utils/api";
import { authHeaders, isLoggedIn, logout } from "../utils/auth";

type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) setUser(data);
        else logout();
      } catch { logout(); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="max-w-lg mx-auto mt-16 px-6">
        {loading ? (
          <div className="text-center py-20 text-slate-600 animate-pulse">Loading profile...</div>
        ) : user ? (
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-500 text-sm mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Name</p>
                <p className="text-slate-900 font-semibold">{user.name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email</p>
                <p className="text-slate-900 font-semibold">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => router.push("/saved")}
                className="bg-blue-50 text-blue-600 py-3 rounded-xl text-sm font-semibold hover:bg-blue-100 transition"
              >
                🔖 Saved Colleges
              </button>
              <button
                onClick={() => router.push("/discussions")}
                className="bg-green-50 text-green-600 py-3 rounded-xl text-sm font-semibold hover:bg-green-100 transition"
              >
                💬 Discussions
              </button>
            </div>

            <button
              onClick={logout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl transition font-semibold"
            >
              Logout
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
