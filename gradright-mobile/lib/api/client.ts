/**
 * HTTP client for the GradRight FastAPI backend.
 * Set EXPO_PUBLIC_API_URL in .env (see .env.example).
 */

const DEFAULT_DEV_API = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  return url && url.length > 0 ? url.replace(/\/$/, "") : DEFAULT_DEV_API;
}

export type ApiErrorBody = { detail?: string; error?: string };

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiBaseUrl()}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T, B extends object>(
  path: string,
  body: B,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}
