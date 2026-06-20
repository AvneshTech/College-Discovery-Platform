// app/utils/api.ts
// Single source of truth for the API base + fetch helper. Re-exported from
// lib/apiClient so legacy imports (`../utils/api`) and the new client never
// drift out of sync.
export { API_BASE, apiFetch } from "../lib/apiClient";
