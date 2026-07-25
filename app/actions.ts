"use server";

import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dictionaries, isLocale } from "@/lib/i18n";

export type LoginState = {
  error?: {
    title: string;
    description: string;
  };
};

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
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
  };
  user?: ApiUser;
};

type ApiUser = {
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
  const user = response.user ?? response.data?.user ?? response.data ?? {};
  const firstName = user.first_name ?? ("firstName" in user ? user.firstName : undefined);
  const lastName = user.last_name ?? ("lastName" in user ? user.lastName : undefined);
  const combinedName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName =
    user.name ??
    ("full_name" in user ? user.full_name : undefined) ??
    ("fullName" in user ? user.fullName : undefined) ??
    combinedName;

  return {
    email: user.email ?? fallbackEmail,
    name: displayName || fallbackEmail,
    image:
      user.avatar ??
      ("avatar_url" in user ? user.avatar_url : undefined) ??
      user.image ??
      ("image_url" in user ? user.image_url : undefined) ??
      user.profile_image ??
      ("profileImage" in user ? user.profileImage : undefined) ??
      ("photo" in user ? user.photo : undefined) ??
      "",
  };
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

  const authApiUrl =
    process.env.AUTH_API_URL ?? "http://localhost:8000/api/auth/login";

  let response: Response;

  try {
    response = await fetch(authApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return loginError(t.loginErrorTitle, t.serviceUnavailable);
  }

  const body = (await response.json().catch(() => ({}))) as LoginResponse;

  if (!response.ok) {
    return loginError(t.loginErrorTitle, getLoginError(response.status, t));
  }

  const accessToken = getAccessToken(body);
  if (!accessToken) {
    return loginError(t.loginErrorTitle, t.missingToken);
  }

  const profile = getUserProfile(body, parsed.data.email.toLowerCase());
  await createSession(profile, accessToken);
  redirect("/panel");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
