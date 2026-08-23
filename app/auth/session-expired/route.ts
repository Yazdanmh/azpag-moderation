import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  await deleteSession()
  const response = NextResponse.redirect(new URL("/login", request.url))
  response.cookies.delete("azpag_refresh_attempted")
  return response
}
