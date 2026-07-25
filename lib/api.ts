const DEFAULT_BACKEND_URL = "http://localhost:8000"

export function getBackendUrl() {
  return (process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(/\/+$/, "")
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
