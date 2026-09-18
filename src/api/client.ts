import axios, { isAxiosError } from "axios";

import { API_BASE_URL } from "./env";

/**
 * Endpoints reachable without a token. A `401` from one of these says nothing
 * about a stored session, so it must not sign anyone out.
 */
export const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

let token: string | null = null;
let locale = "en";
const unauthorizedListeners = new Set<() => void>();

export function setAuthToken(next: string | null): void {
  token = next;
}

export function getAuthToken(): string | null {
  return token;
}

/** Translatable columns come back in this language; read per request. */
export function setApiLocale(next: string): void {
  locale = next;
}

/**
 * Fires when the server rejects the stored token: revoked from the web's token
 * list, or expired. The session store listens and drops the session so the
 * router returns to login instead of leaving every screen on "Unauthenticated."
 *
 * Only `401` counts. A bad password is a `422` and a missing token ability is a
 * `403`; neither means the session is dead.
 */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the documented factory
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  config.headers.set("Accept-Language", locale);
  return config;
});

api.interceptors.response.use(undefined, (error: unknown) => {
  if (__DEV__ && isAxiosError(error)) {
    console.warn(
      `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL ?? ""}${error.config?.url ?? ""} ->`,
      error.message,
      error.code,
    );
  }
  if (isAxiosError(error) && error.response?.status === 401) {
    const path = (error.config?.url ?? "").replace(/\?.*$/, "");
    if (!PUBLIC_PATHS.has(path)) {
      token = null;
      for (const listener of unauthorizedListeners) listener();
    }
  }
  return Promise.reject(error);
});

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export const GENERIC_ERROR_MESSAGE = "Something went wrong.";
export const NETWORK_ERROR_MESSAGE =
  "Cannot reach the server. Check your connection.";

export function errorStatus(error: unknown): number | null {
  return isAxiosError(error) ? (error.response?.status ?? null) : null;
}

export function errorBody(error: unknown): ApiErrorBody | null {
  if (!isAxiosError(error)) return null;
  const data: unknown = error.response?.data;
  return data && typeof data === "object" ? (data as ApiErrorBody) : null;
}

export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/**
 * The first human-readable message out of a Laravel error payload: validation
 * errors first, then the top-level message, then a fallback. The fixed strings
 * are English keys so `t()` can translate them; server text passes through.
 */
export function apiErrorMessage(
  error: unknown,
  fallback = GENERIC_ERROR_MESSAGE,
): string {
  const body = errorBody(error);
  if (body?.errors) {
    for (const messages of Object.values(body.errors)) {
      if (messages?.length) return messages[0];
    }
  }
  if (body?.message) return body.message;
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  return fallback;
}

/** `422` errors keyed by field, first message each, for a form to display inline. */
export function fieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const errors = errorBody(error)?.errors;
  if (errors) {
    for (const [field, messages] of Object.entries(errors)) {
      if (messages?.length) out[field] = messages[0];
    }
  }
  return out;
}
