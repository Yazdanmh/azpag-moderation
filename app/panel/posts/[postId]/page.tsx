import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewDetail } from "@/components/moderation/review-detail"
import { StatusBadge, personName, safeJson } from "@/components/moderation/review-badges"
import { getModerationPostHistory, ModerationApiError } from "@/lib/moderation-api"
import { hasModerationRole, isManagerOnly } from "@/lib/moderation-types"
import { deleteSession, getSession } from "@/lib/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"
import type { ModerationHistoryPost } from "@/lib/moderation-types"

/* eslint-disable @next/next/no-img-element -- backend image hosts are dynamic */

export default async function PostHistoryPage({ params }: { params: Promise<{ postId: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")
  const { postId } = await params
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = moderationHistoryDictionaries[locale]
  let history
  try { history = await getModerationPostHistory(session.accessToken, postId) }
  catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) { await deleteSession(); redirect("/login") }
    if (error instanceof ModerationApiError && error.status === 404) notFound()
    throw error
  }
  const post = history.post
  const reviews = Array.isArray(history.reviews) ? history.reviews : []
  const images = Array.isArray(post.images) ? post.images : []
  const categories = Array.isArray(post.categories) ? post.categories : []
  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
    <div><h1 className="text-2xl font-semibold">{post.title}</h1><p className="text-muted-foreground">{t.history}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary label={t.totalReviews} value={history.summary?.totalReviews ?? reviews.length} /><Summary label={t.standardReviews} value={history.summary?.standardReviews ?? 0} /><Summary label={t.qualityReviews} value={history.summary?.qualityReviews ?? 0} /><Summary label={t.revisionsLabel} value={history.summary?.revisions?.join(", ") || post.revision} /></div>
    <Card><CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>{t.postInformation}</CardTitle><CardDescription>{post.id}</CardDescription></div><StatusBadge value={post.status} /></div></CardHeader><CardContent className="space-y-6">
      {images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map((image, index) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="aspect-video overflow-hidden rounded-md border bg-muted"><img src={historyImageUrl(image)} alt={`${post.title} ${index + 1}`} className="size-full object-cover" /></a>)}</div>}
      <p className="whitespace-pre-wrap">{post.description || t.noDescription}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label={t.currentRevision} value={post.revision} /><Info label={t.author} value={personName(post.author)} /><Info label={t.priceLabel} value={post.price == null ? "—" : `${post.price} ${post.currency ?? ""}`} /><Info label={t.type} value={post.type} /><Info label={t.categoriesLabel} value={categories.map((category) => category.name).join(", ")} /><Info label={t.created} value={new Date(post.created_at).toLocaleString(locale)} /><Info label={t.updated} value={new Date(post.updated_at).toLocaleString(locale)} /><Info label={t.published} value={post.published_at ? new Date(post.published_at).toLocaleString(locale) : "—"} /><Info label={t.moderationReason} value={post.moderation_reason || "—"} /></div>
    </CardContent></Card>
    <div className="space-y-8">{reviews.length ? reviews.map((review) => <section key={review.id} className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"><div><h2 className="text-xl font-semibold">{t.revision} {review.postRevision} · {review.type.replaceAll("_", " ")}</h2><p className="text-sm text-muted-foreground">{review.id}</p></div><Link href={`/panel/reviews/${review.id}`} className={buttonVariants({ variant: "outline" })}>{t.openReview}</Link></div><ReviewDetail review={review} showPost={false} locale={locale} /></section>) : <Card><CardContent className="py-12 text-center text-muted-foreground">{t.noHistory}</CardContent></Card>}</div>
  </main>
}
function Info({ label, value }: { label: string; value: unknown }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 break-words whitespace-pre-wrap">{safeJson(value)}</div></div>
}
function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>
}
function historyImageUrl(image: NonNullable<ModerationHistoryPost["images"]>[number]) {
  if (typeof image.medium === "string") return image.medium
  if (image.medium?.url) return image.medium.url
  if (typeof image.thumbnail === "string") return image.thumbnail
  return image.thumbnail?.url || image.url
}
