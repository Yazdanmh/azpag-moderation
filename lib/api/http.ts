import "server-only"

const DEFAULT_BACKEND_URL = "http://localhost:8000"

export function getBackendUrl() {
  const configured = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL
  const url = new URL(configured)

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("BACKEND_URL must use HTTP or HTTPS.")
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("BACKEND_URL must use HTTPS in production.")
  }

  return url.toString().replace(/\/+$/, "")
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getBackendUrl()}${normalizedPath}`
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    cache: init?.cache ?? "no-store",
    signal: init?.signal ?? AbortSignal.timeout(15_000),
  })
}

export function authenticatedApiFetch(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  return apiFetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })
}
