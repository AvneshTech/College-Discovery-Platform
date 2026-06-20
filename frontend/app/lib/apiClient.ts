// hooks/useApi.ts / lib/apiClient.ts
//
// Replaces localStorage-based auth. Access token lives only in memory
// (a module-level variable) — immune to XSS token theft. The refresh
// token is an httpOnly cookie the browser sends automatically, so a
// page refresh calls /api/auth/refresh once on load to rehydrate.

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  // Coalesce concurrent refresh calls into one in-flight request
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // sends the httpOnly refresh cookie
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        setAccessToken(data.accessToken);
        return data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const doFetch = (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch(accessToken);

  // Access token expired — refresh once, then retry the original request
  if (res.status === 401 && !options.skipAuth) {
    const body = await res.clone().json().catch(() => null);
    if (body?.code === "TOKEN_EXPIRED" || !accessToken) {
      const newToken = await refreshAccessToken();
      if (newToken) res = await doFetch(newToken);
    }
  }

  return res;
}

// Call once on app boot (e.g. in a top-level AuthProvider effect) to
// silently restore a session from the refresh cookie after a hard reload.
export async function bootstrapSession() {
  const token = await refreshAccessToken();
  return token;
}
