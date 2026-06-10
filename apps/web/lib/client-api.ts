"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "productos_tendencia_token";

function getApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no configurada");
  }
  return API_URL;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=28800; SameSite=Lax`;
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
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
    const health = await fetch(`${API_URL}/health`);
    if (!health.ok || !getToken()) {
      return "preview";
    }

    await clientApi("/dashboard");
    return "connected";
  } catch {
    return "preview";
  }
}
