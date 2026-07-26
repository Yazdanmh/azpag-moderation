"use server";

import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dictionaries, isLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { decodeJwt } from "jose";

export type LoginState = {
  error?: {
    title: string;
    description: string;
  };
};

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

type LoginResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  message?: string;
  detail?: string;
  data?: {
    access_token?: string;
    accessToken?: string;
    token?: string;
    user?: ApiUser;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    avatar?: string;
    image?: string;
    profile_image?: string;
    role?: string;
    roles?: string[];
  };
  user?: ApiUser;
};

type ApiUser = {
  role?: string;
  roles?: string[];
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  name?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  avatar_url?: string;
  image?: string;
  image_url?: string;
  profile_image?: string;
  profileImage?: string;
  profile?: string | null;
  photo?: string;
};

function getAccessToken(response: LoginResponse) {
  return (
    response.access_token ??
    response.accessToken ??
    response.token ??
    response.data?.access_token ??
    response.data?.accessToken ??
    response.data?.token
  );
}

function getUserProfile(response: LoginResponse, fallbackEmail: string) {
  const accessToken = getAccessToken(response)
  let tokenUser: ApiUser = {}
  try {
    const payload = accessToken ? decodeJwt(accessToken) : {}
    const tokenSubject = (payload as Record<string, unknown>).sub
    if (tokenSubject && typeof tokenSubject === "object" && !Array.isArray(tokenSubject)) {
      tokenUser = tokenSubject as ApiUser
    }
  } catch {
    tokenUser = {}
  }

  const user = response.user ?? response.data?.user ?? response.data ?? {};
  const firstName = user.first_name ?? ("firstName" in user ? user.firstName : undefined) ?? tokenUser.first_name ?? tokenUser.firstName;
  const lastName = user.last_name ?? ("lastName" in user ? user.lastName : undefined) ?? tokenUser.last_name ?? tokenUser.lastName;
  const combinedName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName =
    user.name ??
    ("full_name" in user ? user.full_name : undefined) ??
    ("fullName" in user ? user.fullName : undefined) ??
    (combinedName || tokenUser.name || tokenUser.full_name || tokenUser.fullName);

  const email = (user.email ?? tokenUser.email ?? fallbackEmail).trim().slice(0, 254)
  const name = (displayName || fallbackEmail).trim().slice(0, 160)
  const rawImage =
      user.avatar ??
      ("avatar_url" in user ? user.avatar_url : undefined) ??
      user.image ??
      ("image_url" in user ? user.image_url : undefined) ??
      user.profile_image ??
      ("profileImage" in user ? user.profileImage : undefined) ??
      ("photo" in user ? user.photo : undefined) ??
      ("profile" in user ? user.profile : undefined) ??
      tokenUser.avatar ??
      tokenUser.avatar_url ??
      tokenUser.image ??
      tokenUser.image_url ??
      tokenUser.profile_image ??
      tokenUser.profileImage ??
      tokenUser.photo ??
      tokenUser.profile ??
      ""
  const image = sanitizeImageUrl(rawImage)
  let tokenRoles: string[] = []
  try {
    const payload = accessToken ? decodeJwt(accessToken) : {}
    const raw = payload.roles ?? payload.role ?? tokenUser.roles ?? tokenUser.role
    tokenRoles = Array.isArray(raw)
      ? raw.filter((role): role is string => typeof role === "string")
      : typeof raw === "string"
        ? [raw]
        : []
  } catch {
    tokenRoles = []
  }
  const rawRoles = user.roles ?? (user.role ? [user.role] : tokenRoles)
  const roles = rawRoles.map((role) => role.toUpperCase())

  return { email, name, image, roles };
}

function sanitizeImageUrl(value: unknown) {
  if (typeof value !== "string") return ""
  const trimmed = value.trim().slice(0, 256)
  if (!trimmed) return ""
  if (trimmed.startsWith("/")) return trimmed

  try {
    const url = new URL(trimmed)
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""
  } catch {
    return ""
  }
}

function getLoginError(
  status: number,
  t: (typeof dictionaries)[keyof typeof dictionaries],
) {
  switch (status) {
    case 400:
      return t.badRequest;
    case 401:
      return t.incorrectCredentials;
    case 403:
      return t.accessDenied;
    case 404:
      return t.userNotFound;
    case 422:
      return t.validationFailed;
    case 429:
      return t.tooManyRequests;
    case 500:
      return t.serverError;
    default:
      return status >= 500 ? t.serverError : t.unableToSignIn;
  }
}

function loginError(title: string, description: string): LoginState {
  return { error: { title, description } };
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const localeValue = formData.get("locale");
  const locale = isLocale(localeValue) ? localeValue : "fa";
  const t = dictionaries[locale];
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return loginError(t.loginErrorTitle, t.invalidInput);
  }

  let response: Response;

  try {
    response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return loginError(t.loginErrorTitle, t.serviceUnavailable);
  }

  const body = (await response.json().catch(() => ({}))) as LoginResponse;

  if (!response.ok) {
    return loginError(t.loginErrorTitle, getLoginError(response.status, t));
  }

  const accessToken = getAccessToken(body);
  if (!accessToken || accessToken.length > 2048) {
    return loginError(t.loginErrorTitle, t.missingToken);
  }

  const profile = getUserProfile(body, parsed.data.email.toLowerCase());
  await createSession(profile, accessToken);
  redirect(profile.roles.includes("MANAGER") &&
    !profile.roles.includes("ADMIN") &&
    !profile.roles.includes("SUPERADMIN")
    ? "/panel/reviews/next"
    : "/panel");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
