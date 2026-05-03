/**
 * Backend API client (PYTHON_SETUP Step 11 — adapted for Next.js + TypeScript).
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8000).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  token: string | null = null
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export async function apiGet<T = unknown>(
  path: string,
  token: string | null = null
): Promise<T> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return res.json() as Promise<T>;
}

export async function apiPatch<T = unknown>(
  path: string,
  body: unknown,
  token: string | null = null
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}
