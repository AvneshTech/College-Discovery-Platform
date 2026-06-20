"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, setAccessToken, bootstrapSession } from "./apiClient";

type User = { id: number; name: string; email: string; role: "STUDENT" | "ADMIN" };

type AuthContextType = {
  user: User | null;
  loading: boolean; // true while we check for an existing session on first load
  login: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) setUser(await res.json());
      else setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Runs once on app load: tries to silently restore a session using the
    // httpOnly refresh cookie (works even after a hard page refresh).
    (async () => {
      const token = await bootstrapSession();
      if (token) await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = (newUser: User, accessToken: string) => {
    setAccessToken(accessToken);
    setUser(newUser);
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage anywhere: const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}