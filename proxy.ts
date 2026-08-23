import { NextRequest, NextResponse } from "next/server"
import { cookieName, decodeSession, encodeSession, sessionCookieOptions } from "@/lib/auth/session"
import { accessTokenNeedsRefresh, refreshSession, TokenRefreshError } from "@/lib/auth/refresh"

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const isProduction = process.env.NODE_ENV === "production"
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProduction ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${isProduction ? "" : " ws: wss:"}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy)

  const sessionCookieName = cookieName()
  const rawSession = request.cookies.get(sessionCookieName)?.value
  const shouldHandleSession = rawSession &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth/refresh") &&
    !request.nextUrl.pathname.startsWith("/auth/session-expired")

  let refreshedCookie: { value: string; expiresAt: string } | null = null
  if (shouldHandleSession) {
    const session = await decodeSession(rawSession)
    if (session && accessTokenNeedsRefresh(session.accessExpiresAt)) {
      try {
        const refreshed = await refreshSession(session)
        const value = await encodeSession(refreshed)
        request.cookies.set(sessionCookieName, value)
        requestHeaders.set("cookie", request.cookies.toString())
        refreshedCookie = { value, expiresAt: refreshed.refreshExpiresAt }
      } catch (error) {
        if (error instanceof TokenRefreshError && (error.status === 400 || error.status === 401 || error.status === 403)) {
          const loginUrl = new URL("/login", request.url)
          const response = NextResponse.redirect(loginUrl)
          response.cookies.delete(sessionCookieName)
          return response
        }
        // A transient refresh failure does not prove the session is invalid.
        // Preserve the cookie and let the requested page show its normal service error.
      }
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set("Content-Security-Policy", contentSecurityPolicy)
  if (refreshedCookie) {
    response.cookies.set(
      sessionCookieName,
      refreshedCookie.value,
      sessionCookieOptions(refreshedCookie.expiresAt),
    )
  }

  return response
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}
