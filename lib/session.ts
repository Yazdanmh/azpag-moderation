import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "azpag_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }

  return new TextEncoder().encode(value);
}

export type Session = {
  email: string;
  name: string;
  image: string;
  accessToken: string;
};

export async function createSession(
  profile: { email: string; name: string; image: string },
  accessToken: string,
) {
  const token = await new SignJWT({ ...profile, accessToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.email === "string" && typeof payload.accessToken === "string"
      ? {
          email: payload.email,
          name: typeof payload.name === "string" ? payload.name : payload.email,
          image: typeof payload.image === "string" ? payload.image : "",
          accessToken: payload.accessToken,
        }
      : null;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
