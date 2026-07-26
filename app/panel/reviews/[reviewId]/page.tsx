import { notFound, redirect } from "next/navigation"
import { ReviewDetail } from "@/components/moderation/review-detail"
import { getModerationReview, ModerationApiError } from "@/lib/moderation-api"
import { hasModerationRole, isManagerOnly } from "@/lib/moderation-types"
import { deleteSession, getSession } from "@/lib/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"

export default async function ReviewDetailPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")
  const { reviewId } = await params
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = moderationHistoryDictionaries[locale]
  let review
  try { review = await getModerationReview(session.accessToken, reviewId) }
  catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) { await deleteSession(); redirect("/login") }
    if (error instanceof ModerationApiError && error.status === 404) notFound()
    throw error
  }
  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6"><div><h1 className="text-2xl font-semibold">{t.detail}</h1><p className="break-all text-muted-foreground">{review.id}</p></div><ReviewDetail review={review} locale={locale} /></main>
}
