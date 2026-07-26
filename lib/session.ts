import "server-only"

import { EncryptJWT, jwtDecrypt } from "jose"
import { cookies } from "next/headers"

const DEVELOPMENT_COOKIE_NAME = "azpag_session"
const PRODUCTION_COOKIE_NAME = "__Host-azpag_session"
const SESSION_DURATION = 60 * 60 * 8

function cookieName() {
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_COOKIE_NAME
    : DEVELOPMENT_COOKIE_NAME
}

async function encryptionKey() {
  const value = process.env.SESSION_SECRET

  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.")
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  )
  return new Uint8Array(digest)
}

export type Session = {
  email: string
  name: string
  image: string
  accessToken: string
  roles: string[]
}

export async function createSession(
  profile: { email: string; name: string; image: string; roles: string[] },
  accessToken: string,
) {
  const token = await new EncryptJWT({ ...profile, accessToken })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .encrypt(await encryptionKey())

  const cookieStore = await cookies()
  cookieStore.set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION,
    path: "/",
  })
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(cookieName())?.value
  if (!token) return null

  try {
    const { payload } = await jwtDecrypt(token, await encryptionKey(), {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    })

    return typeof payload.email === "string" &&
      typeof payload.accessToken === "string"
      ? {
          email: payload.email,
          name: typeof payload.name === "string" ? payload.name : payload.email,
          image: typeof payload.image === "string" ? payload.image : "",
          accessToken: payload.accessToken,
          roles: Array.isArray(payload.roles)
            ? payload.roles.filter((role): role is string => typeof role === "string")
            : [],
        }
      : null
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(DEVELOPMENT_COOKIE_NAME)
  cookieStore.delete(PRODUCTION_COOKIE_NAME)
}
