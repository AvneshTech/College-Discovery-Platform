// app/utils/auth.ts
// Compatibility shim. The app moved to an in-memory access token + httpOnly
// refresh cookie (see lib/apiClient.ts + lib/AuthProvider.tsx). These helpers
// keep older pages working while pointing them at the SAME token source —
// no more localStorage (which was never being written after the auth refactor,
// silently breaking every authenticated action on the legacy pages).
import { getAccessToken, setAccessToken, apiFetch } from "../lib/apiClient";

export function getToken(): string | null {
  return getAccessToken();
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
    if (typeof window !== "undefined") window.location.href = "/";
  }
}

// Synchronous headers for legacy raw-fetch call sites. Prefer `apiFetch`
// (lib/apiClient) for new code — it auto-refreshes expired access tokens.
export function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}
