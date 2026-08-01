import "server-only"
import { authenticatedApiFetch } from "@/lib/api/http"
import { parseApiResponse } from "@/lib/moderation/utils"

export type ProfileImage = {
  id: string
  url?: string | null
  thumbnail?: string | { url?: string | null } | null
  medium?: string | { url?: string | null } | null
}

export type StaffProfile = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  role?: string
  roles?: string[]
  avatar?: ProfileImage | null
  profile?: string | null
}

function unwrapData<T>(body: T | { data: T }) {
  return body && typeof body === "object" && "data" in body
    ? (body as { data: T }).data
    : body as T
}

export async function getMyProfile(accessToken: string) {
  return unwrapData(await parseApiResponse<StaffProfile | { data: StaffProfile }>(
    await authenticatedApiFetch("/api/users/me", accessToken),
  ))
}

export async function updateMyProfile(
  accessToken: string,
  payload: { first_name: string; avatar_id?: string },
) {
  return unwrapData(await parseApiResponse<StaffProfile | { data: StaffProfile }>(
    await authenticatedApiFetch("/api/users/me", accessToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  ))
}

export async function uploadProfileImage(accessToken: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  const response = await parseApiResponse<
    ProfileImage |
    { data: ProfileImage } |
    { file: ProfileImage } |
    { data: { file: ProfileImage } }
  >(
    await authenticatedApiFetch("/api/upload/", accessToken, {
      method: "POST",
      body,
    }),
  )
  const unwrapped = unwrapData(response)
  const uploaded = "file" in unwrapped ? unwrapped.file : unwrapped
  if (!uploaded?.id) throw new Error("The upload response did not include an image ID.")
  return uploaded
}

export function profileImageUrl(profile: StaffProfile) {
  const image = profile.avatar
  const thumbnail = image?.thumbnail
  if (typeof thumbnail === "string") return thumbnail
  if (thumbnail?.url) return thumbnail.url
  const medium = image?.medium
  if (typeof medium === "string") return medium
  return medium?.url || image?.url || profile.profile || ""
}
