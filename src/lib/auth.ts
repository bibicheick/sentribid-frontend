// src/lib/auth.ts
const TOKEN_KEY = "token";
const LEGACY_KEY = "sentribid_token";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

export function isAuthed(): boolean {
  return !!getToken();
}
