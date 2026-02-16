const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

const ACCESS_TOKEN_KEY = "auth_access_token";

type LoginPayload = {
  email?: string;
  username?: string;
  password: string;
};

type RegisterPayload = {
  name?: string;
  email: string;
  password: string;
};

type TokenResponse = {
  accessToken?: string;
  access?: string;
  token?: string;
};

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function extractTokens(payload: TokenResponse) {
  const accessToken = payload.accessToken ?? payload.access ?? payload.token ?? null;
  return { accessToken };
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string | null) {
  if (typeof window === "undefined") return;
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function register(payload: RegisterPayload) {
  const response = await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Register failed");
  const data = (await response.json()) as TokenResponse;
  const { accessToken } = extractTokens(data);
  if (accessToken) setTokens(accessToken);
  return data;
}

export async function login(payload: LoginPayload) {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(typeof err.message === "string" ? err.message : "Login failed");
  }

  const data = (await response.json()) as TokenResponse;
  const { accessToken } = extractTokens(data);
  if (!accessToken) throw new Error("Access token missing in login response");
  setTokens(accessToken);
  return data;
}

export async function refreshAccessToken() {
  const response = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as TokenResponse;
  const { accessToken } = extractTokens(data);
  if (!accessToken) return null;
  setTokens(accessToken);
  return accessToken;
}

export async function logout() {
  const accessToken = getAccessToken();
  await fetch(apiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      "Content-Type": "application/json",
    },
  }).catch(() => undefined);
  setTokens(null);
}

export async function authFetch(path: string, init?: RequestInit, retry = true) {
  const accessToken = getAccessToken();
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (response.status !== 401 || !retry) return response;
  const nextToken = await refreshAccessToken();
  if (!nextToken) return response;

  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${nextToken}`,
    },
  });
}

export async function getMe() {
  const response = await authFetch("/api/auth/me", { method: "GET" });
  if (!response.ok) throw new Error("Unauthorized");
  return response.json();
}
