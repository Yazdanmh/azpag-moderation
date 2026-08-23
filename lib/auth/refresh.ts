import "server-only"

import { apiFetch } from "@/lib/api/http"
import type { AuthTokens, Session } from "@/lib/auth/session"

export class TokenRefreshError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = "TokenRefreshError"
  }
}

const refreshes = new Map<string, Promise<AuthTokens>>()

export function accessTokenNeedsRefresh(accessExpiresAt: string, bufferMs = 60_000) {
  const expiresAt = Date.parse(accessExpiresAt)
  return !Number.isFinite(expiresAt) || expiresAt - Date.now() <= bufferMs
}

export async function refreshTokensOnce(refreshToken: string): Promise<AuthTokens> {
  const existing = refreshes.get(refreshToken)
  if (existing) return existing

  const pending = performRefresh(refreshToken).finally(() => refreshes.delete(refreshToken))
  refreshes.set(refreshToken, pending)
  return pending
}

export async function refreshSession(session: Session): Promise<Session> {
  return { ...session, ...await refreshTokensOnce(session.refreshToken) }
}

async function performRefresh(refreshToken: string): Promise<AuthTokens> {
  let response: Response
  try {
    response = await apiFetch("/api/auth/refresh-token", {
      method: "POST",
      headers: { Authorization: `Refresh ${refreshToken}` },
    })
  } catch {
    throw new TokenRefreshError(503, "The authentication service is unavailable.")
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const message = typeof body.message === "string" ? body.message : "The session could not be refreshed."
    throw new TokenRefreshError(response.status, message)
  }

  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : body
  const accessToken = data.access_token
  const refreshTokenValue = data.refresh_token
  const accessExpiresAt = data.access_expires_at
  const refreshExpiresAt = data.refresh_expires_at
  if (typeof accessToken !== "string" || typeof refreshTokenValue !== "string" ||
      typeof accessExpiresAt !== "string" || typeof refreshExpiresAt !== "string" ||
      !Number.isFinite(Date.parse(accessExpiresAt)) || !Number.isFinite(Date.parse(refreshExpiresAt))) {
    throw new TokenRefreshError(502, "The authentication service returned an invalid token response.")
  }
  return { accessToken, refreshToken: refreshTokenValue, accessExpiresAt, refreshExpiresAt }
}
