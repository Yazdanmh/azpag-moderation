"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { isLocale } from "@/lib/i18n"
import { profileDictionaries } from "@/lib/profile-i18n"
import { getMyProfile, profileImageUrl, updateMyProfile, uploadProfileImage } from "@/lib/profile-api"
import { createSession, deleteSession, getSession } from "@/lib/session"
import { ApiResponseError } from "@/lib/moderation-utils"

export type ProfileFormState = {
  error?: { title: string; description: string }
  success?: { title: string; description: string }
}

const profileSchema = z.object({
  first_name: z.string().trim().min(2).max(60),
})

export async function updateProfile(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await getSession()
  if (!session) redirect("/login")
  const localeValue = formData.get("locale")
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = profileDictionaries[locale]
  const parsed = profileSchema.safeParse({
    first_name: formData.get("first_name"),
  })
  if (!parsed.success) return { error: { title: t.updateError, description: t.invalidName } }

  const image = formData.get("image")
  if (image instanceof File && image.size > 0) {
    if (image.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png"].includes(image.type)) {
      return { error: { title: t.updateError, description: t.invalidImage } }
    }
  }

  try {
    const uploaded = image instanceof File && image.size > 0
      ? await uploadProfileImage(session.accessToken, image)
      : null
    await updateMyProfile(session.accessToken, {
      ...parsed.data,
      ...(uploaded?.id ? { avatar_id: uploaded.id } : {}),
    })
    const profile = await getMyProfile(session.accessToken)
    const roles = Array.isArray(profile.roles)
      ? profile.roles
      : profile.role
        ? [profile.role]
        : session.roles
    await createSession({
      email: profile.email || session.email,
      name: profile.first_name?.trim() || session.name,
      image: profileImageUrl(profile) || session.image,
      roles,
    }, session.accessToken)
    revalidatePath("/panel/profile")
    return { success: { title: t.updateSuccess, description: t.updateSuccessDescription } }
  } catch (error) {
    if (error instanceof ApiResponseError && error.status === 401) {
      await deleteSession()
      redirect("/login")
    }
    return { error: { title: t.updateError, description: t.updateFailed } }
  }
}
