import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, getSession, replaceSession } from "@/lib/auth/session"
import { refreshSession, TokenRefreshError } from "@/lib/auth/refresh"

export async function GET(request: Request) {
  const refreshAttemptCookie = "azpag_refresh_attempted"
  const requestUrl = new URL(request.url)
  const requestedReturnTo = requestUrl.searchParams.get("returnTo")
  const returnTo = requestedReturnTo?.startsWith("/panel") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : "/panel"
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL("/login", request.url))
  if ((await cookies()).has(refreshAttemptCookie)) {
    return NextResponse.redirect(new URL("/auth/session-expired", request.url))
  }

  try {
    await replaceSession(await refreshSession(session))
    const response = NextResponse.redirect(new URL(returnTo, request.url))
    response.cookies.set(refreshAttemptCookie, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60,
      path: "/",
    })
    return response
  } catch (error) {
    if (error instanceof TokenRefreshError && [400, 401, 403].includes(error.status)) {
      await deleteSession()
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.json(
      { message: "The session could not be refreshed. Please try again." },
      { status: 503, headers: { "Retry-After": "5" } },
    )
  }
}
