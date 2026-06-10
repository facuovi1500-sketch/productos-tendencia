"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "productos_tendencia_token";
export const SESSION_EVENT = "productos-tendencia-session";

function getApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no configurada");
  }
  return API_URL;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  const localToken = window.localStorage.getItem(TOKEN_KEY);
  if (localToken) return localToken;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_KEY}=`))
    ?.split("=")[1] ?? null;
}

function notifySessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=28800; SameSite=Lax`;
  notifySessionChange();
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  notifySessionChange();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Credenciales invalidas");
  }

  const data = (await response.json()) as { accessToken: string };
  setToken(data.accessToken);
  return data;
}

export async function clientApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getClientApiStatus() {
  try {
    if (!API_URL) return "preview";
    const health = await fetch(`${API_URL}/health`, { cache: "no-store" });
    const token = getToken();
    if (!health.ok || !token) {
      return "preview";
    }

    const headers = { Authorization: `Bearer ${token}` };
    const me = await fetch(`${API_URL}/auth/me`, { headers, cache: "no-store" });
    if (me.ok) return "connected";

    const dashboard = await fetch(`${API_URL}/dashboard`, { headers, cache: "no-store" });
    return dashboard.ok ? "connected" : "preview";
  } catch {
    return "preview";
  }
}
