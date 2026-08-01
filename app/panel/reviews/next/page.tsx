import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ReviewWorkspace } from "@/components/moderation/review-workspace"
import { getNextModerationReview, ModerationApiError } from "@/lib/moderation/api"
import { hasModerationRole, type ApiResult, type ModerationReview } from "@/lib/moderation/types"
import { getSession } from "@/lib/auth/session"
import { isLocale } from "@/lib/i18n"
import { moderationDictionaries } from "@/lib/moderation/i18n"

export default async function NextReviewPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  const value = (await cookies()).get("azpag_locale")?.value
  const t = moderationDictionaries[isLocale(value) ? value : "fa"]
  let initial: ApiResult<ModerationReview | null>
  try {
    initial = { ok: true, data: await getNextModerationReview(session.accessToken) }
  } catch (error) {
    initial = error instanceof ModerationApiError
      ? { ok: false, status: error.status, message: error.message }
      : { ok: false, status: 500, message: t.serviceError }
  }
  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6"><div><h1 className="text-2xl font-semibold">{t.reviewsTitle}</h1><p className="text-muted-foreground">{t.reviewsSubtitle}</p></div><ReviewWorkspace initial={initial} /></main>
}
