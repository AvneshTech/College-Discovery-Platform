// app/lib/uploadClient.ts
// ---------------------------------------------------------------------------
// Multipart upload helper for the Cloudinary-backed uploads module.
//
// Why this exists (and why it can't just use `apiFetch`):
//   • `apiFetch` hard-codes `Content-Type: application/json`. File uploads MUST
//     send `multipart/form-data` with a browser-generated boundary, so we use a
//     raw XHR/fetch and let the browser set the Content-Type itself.
//   • The brief's ImageUploader needs an *upload progress* bar, which only
//     XMLHttpRequest exposes (`upload.onprogress`) — fetch() can't report it.
//
// It reuses the SAME in-memory access token as the rest of the app
// (lib/apiClient) and performs a single silent refresh-and-retry on a 401, so
// it stays consistent with the auth architecture the audit said to preserve.

import { API_BASE, getAccessToken, bootstrapSession } from "./apiClient";

export type UploadProgress = (percent: number) => void;

type UploadOk<T> = { ok: true; data: T };
type UploadErr = { ok: false; status: number; message: string };
export type UploadResult<T> = UploadOk<T> | UploadErr;

function rawUpload<T>(
  path: string,
  method: "POST",
  formData: FormData,
  token: string | null,
  onProgress?: UploadProgress
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}${path}`);
    xhr.withCredentials = true; // send the httpOnly refresh cookie too
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // Intentionally NOT setting Content-Type — the browser adds the multipart
    // boundary automatically.

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = null;
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

/** Upload a file via multipart/form-data with progress + one silent auth retry. */
export async function uploadFile<T = { url: string; publicId: string }>(
  path: string,
  file: File,
  extraFields: Record<string, string> = {},
  onProgress?: UploadProgress
): Promise<UploadResult<T>> {
  const build = () => {
    const fd = new FormData();
    fd.append("image", file);
    Object.entries(extraFields).forEach(([k, v]) => fd.append(k, v));
    return fd;
  };

  try {
    let token = getAccessToken();
    let res = await rawUpload<T>(path, "POST", build(), token, onProgress);

    // Access token expired/absent → refresh once, then retry.
    if (res.status === 401) {
      token = await bootstrapSession();
      if (token) res = await rawUpload<T>(path, "POST", build(), token, onProgress);
    }

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, data: res.body as T };
    }
    const message =
      (res.body as { message?: string })?.message || `Upload failed (${res.status})`;
    return { ok: false, status: res.status, message };
  } catch (e) {
    return { ok: false, status: 0, message: (e as Error).message || "Upload failed" };
  }
}
