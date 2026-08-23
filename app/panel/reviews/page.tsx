import Link from "next/link"
import { redirect } from "next/navigation"
import { BotIcon, Clock3Icon, ImageIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReviewToolbar } from "@/components/moderation/review-toolbar"
import { ResultState } from "@/components/moderation/shared"
import { StatusBadge, personName } from "@/components/moderation/review-badges"
import { getModerationReviews, ModerationApiError } from "@/lib/moderation/api"
import { hasModerationRole, isManagerOnly, type ModerationDecision, type ModerationPerson, type ModerationPostStatus, type ModerationReviewListItem, type ModerationReviewsQuery, type ModerationReviewStatus, type ModerationReviewType } from "@/lib/moderation/types"
import { getSession } from "@/lib/auth/session"
import { cookies } from "next/headers"
import { isLocale, type Locale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation/history-i18n"
import { cn } from "@/lib/utils"
import { paginationTotal, paginationTotalPages } from "@/lib/moderation/utils"

/* eslint-disable @next/next/no-img-element -- backend image hosts are dynamic */

const statuses: ModerationReviewStatus[] = ["QUEUED", "AI_REVIEWING", "HUMAN_REVIEW_QUEUED", "HUMAN_REVIEWING", "DECIDED", "CANCELLED", "FAILED"]
const types: ModerationReviewType[] = ["STANDARD", "QUALITY_SAMPLE"]
const decisions: ModerationDecision[] = ["PUBLISH", "REJECT", "NEEDS_CHANGES"]
const postStatuses: ModerationPostStatus[] = ["PUBLISHED", "PENDING", "DRAFT", "ARCHIVED", "REJECTED", "NEEDS_CHANGES"]
const sorts = ["newest", "oldest", "queuedAt:desc", "queuedAt:asc", "decidedAt:desc", "decidedAt:asc"] as const
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function ReviewsListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")
  const params = await searchParams
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = moderationHistoryDictionaries[locale]
  const optionLabels: Record<string, string> = {
    QUEUED: t.queuedStatus,
    AI_REVIEWING: t.aiReviewing,
    HUMAN_REVIEW_QUEUED: t.humanReviewQueued,
    HUMAN_REVIEWING: t.humanReviewing,
    DECIDED: t.decidedStatus,
    CANCELLED: t.cancelledStatus,
    FAILED: t.failedStatus,
    STANDARD: t.standard,
    QUALITY_SAMPLE: t.qualitySampleType,
    PUBLISH: t.publishDecision,
    REJECT: t.rejectDecision,
    NEEDS_CHANGES: t.needsChanges,
    PUBLISHED: t.publishedStatus,
    PENDING: t.pendingStatus,
    DRAFT: t.draftStatus,
    ARCHIVED: t.archivedStatus,
    REJECTED: t.rejectedStatus,
    newest: t.descending,
    oldest: t.ascending,
    "queuedAt:desc": t.queuedNewest,
    "queuedAt:asc": t.queuedOldest,
    "decidedAt:desc": t.decidedNewest,
    "decidedAt:asc": t.decidedOldest,
  }
  const page = Math.max(1, Number(first(params.page)) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(first(params.pageSize)) || 10))
  const query: ModerationReviewsQuery = {
    page, pageSize, query: first(params.query),
    status: first(params.status) as ModerationReviewStatus | undefined,
    type: first(params.type) as ModerationReviewType | undefined,
    decision: first(params.decision) as ModerationDecision | undefined,
    postStatus: first(params.postStatus) as ModerationPostStatus | undefined,
    reviewerId: first(params.reviewerId), dateFrom: first(params.dateFrom),
    dateTo: first(params.dateTo),
    sort: sorts.includes(first(params.sort) as (typeof sorts)[number])
      ? first(params.sort) as (typeof sorts)[number]
      : "newest",
  }
  let response
  try {
    response = await getModerationReviews(session.accessToken, query)
  } catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) {
      redirect("/auth/refresh?returnTo=%2Fpanel%2Freviews")
    }
    const message = error instanceof ModerationApiError ? error.message : t.loadError
    return (
      <main className="flex h-[calc(100svh-var(--header-height))] w-full min-w-0 max-w-full flex-1 overflow-hidden p-4 md:p-6">
        <ResultState title={t.loadError} description={message} retry retryLabel={t.refresh} fill />
      </main>
    )
  }
  const rows = Array.isArray(response.data) ? response.data : []
  const pagination = response.pagination
  const total = paginationTotal(pagination)
  const totalPages = paginationTotalPages(pagination)
  const pageHref = (target: number) => {
    const next = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") next.set(key, String(value)) })
    next.set("page", String(target))
    return `/panel/reviews?${next.toString()}`
  }
  const localizedValue = (value: string | null | undefined) =>
    value ? optionLabels[value] ?? value.replaceAll("_", " ") : undefined
  return (
    <main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-4 overflow-x-hidden p-4 md:p-6">
      <div className="flex min-w-0 shrink-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h1 className="text-2xl font-semibold">{t.archive}</h1><p className="break-words text-muted-foreground">{t.archiveDescription}</p></div><Link href="/panel/reviews/next" className={buttonVariants()}>{t.workspace}</Link></div>
      <div className="w-full min-w-0 shrink-0"><ReviewToolbar
        query={query.query}
        pageSize={pageSize}
        reviewerId={query.reviewerId}
        dateFrom={query.dateFrom}
        dateTo={query.dateTo}
        optionLabels={optionLabels}
        labels={t}
        filters={[
          { name: "status", value: query.status, label: t.allStatuses, values: statuses },
          { name: "type", value: query.type, label: t.allTypes, values: types },
          { name: "decision", value: query.decision, label: t.allDecisions, values: decisions },
          { name: "postStatus", value: query.postStatus, label: t.allPostStatuses, values: postStatuses },
          { name: "sort", value: query.sort, label: t.newest, values: sorts },
        ]}
      /></div>
      {!rows.length ? (
        <ResultState title={t.noMatches} description={t.filtersDescription} actionHref="/panel/reviews" retryLabel={t.clear} fill />
      ) : <div className="flex min-w-0 flex-col gap-4">
      <Card className="min-w-0 max-w-full overflow-hidden"><CardContent className="min-w-0 overflow-hidden">{rows.length ? <Table><TableHeader className="sticky top-0 z-10 bg-card"><TableRow><TableHead>{t.post}</TableHead><TableHead>{t.review}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.decision}</TableHead><TableHead>{t.reviewer}</TableHead><TableHead>{t.summary}</TableHead><TableHead>{t.queued}</TableHead></TableRow></TableHeader><TableBody>{rows.map((review) => <TableRow key={review.id}>
        <TableCell className="min-w-80 whitespace-normal"><PostSummary review={review} locale={locale} labels={t} /></TableCell>
        <TableCell><Link className="text-primary hover:underline" href={`/panel/reviews/${review.id}`}>{localizedValue(review.type)}</Link></TableCell><TableCell><StatusBadge value={review.status} label={localizedValue(review.status)} /></TableCell><TableCell><StatusBadge value={review.finalDecision} label={localizedValue(review.finalDecision)} /></TableCell>
        <TableCell className="whitespace-normal"><Reviewer reviewer={review.assignment?.reviewer} aiLabel={t.reviewedByAi} /></TableCell><TableCell className="min-w-56 whitespace-normal"><ItemSummary summary={review.itemSummary} locale={locale} labels={t} /></TableCell><TableCell className="min-w-44 whitespace-normal"><QueuedAt value={review.queuedAt} locale={locale} /></TableCell>
      </TableRow>)}</TableBody></Table> : <div className="py-12 text-center text-muted-foreground">{t.noMatches}</div>}</CardContent></Card>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="min-w-0 text-sm text-muted-foreground">{total} {t.reviews} · {t.page} {pagination?.page ?? page} {t.of} {Math.max(1, totalPages)}</p><div className="flex gap-2"><Link aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={page > 1 ? pageHref(page - 1) : "#"} className={cn(buttonVariants({ variant: "outline" }), page <= 1 && "pointer-events-none opacity-50")}>{t.previous}</Link><Link aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined} href={page < totalPages ? pageHref(page + 1) : "#"} className={cn(buttonVariants({ variant: "outline" }), page >= totalPages && "pointer-events-none opacity-50")}>{t.next}</Link></div></div>
      </div>}
    </main>
  )
}

function postImageUrl(image: ModerationReviewListItem["post"]["images"][number]) {
  if (typeof image.thumbnail === "string") return image.thumbnail
  return image.thumbnail?.url || image.url
}

function PostSummary({ review, locale, labels }: { review: ModerationReviewListItem; locale: Locale; labels: typeof moderationHistoryDictionaries.en }) {
  const image = review.post.images?.[0]
  const author = review.post.author
  const authorName = personName(author)
  const authorImage = author ? reviewerAvatarUrl(author) : ""
  const initials = authorName === "—" ? "?" : authorName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()

  return (
    <div className="flex items-start gap-3">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
        {image ? <img src={postImageUrl(image)} alt={review.post.title} className="size-full object-cover" /> : <ImageIcon className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link className="font-medium hover:text-primary" href={`/panel/posts/${review.post.id}`}>{review.post.title}</Link>
        <div className="mt-1.5 flex items-center gap-2">
          <Avatar className="size-7">
            {authorImage && <AvatarImage src={authorImage} alt={authorName} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-xs">
            <div className="font-medium text-foreground">{authorName}</div>
            {author?.email && <div className="break-all text-muted-foreground">{author.email}</div>}
          </div>
        </div>
        <div className="mt-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{labels.revision} {review.postRevision.toLocaleString(locale)}</span>
        </div>
      </div>
    </div>
  )
}

function ItemSummary({ summary, locale, labels }: { summary: ModerationReviewListItem["itemSummary"]; locale: Locale; labels: typeof moderationHistoryDictionaries.en }) {
  const qualityAgreements = summary?.qualityAgreements ?? 0
  const qualityDisagreements = summary?.qualityDisagreements ?? 0
  const hasQuality = qualityAgreements > 0 || qualityDisagreements > 0

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="text-muted-foreground">{labels.total} <strong className="text-foreground">{(summary?.total ?? 0).toLocaleString(locale)}</strong></span>
        <span className="text-muted-foreground">{labels.violations} <strong className="text-destructive">{(summary?.violations ?? 0).toLocaleString(locale)}</strong></span>
        <span className="text-muted-foreground">{labels.uncertain} <strong className="text-foreground">{(summary?.uncertain ?? 0).toLocaleString(locale)}</strong></span>
        <span className="text-muted-foreground">{labels.human} <strong className="text-foreground">{(summary?.humanReviewed ?? 0).toLocaleString(locale)}</strong></span>
      </div>
      {hasQuality && <div className="text-muted-foreground">{labels.quality}: <span className="text-emerald-700">✓ {qualityAgreements.toLocaleString(locale)}</span> · <span className="text-destructive">✕ {qualityDisagreements.toLocaleString(locale)}</span></div>}
    </div>
  )
}

function QueuedAt({ value, locale }: { value: string; locale: Locale }) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return <span className="text-muted-foreground">—</span>

  return (
    <time dateTime={value} className="flex items-start gap-2">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-[#F5F5F5] text-primary">
        <Clock3Icon className="size-3.5" />
      </span>
      <span>
        <span className="block text-sm font-medium">{relativeDate(date, locale)}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </span>
    </time>
  )
}

function relativeDate(date: Date, locale: Locale) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absoluteSeconds = Math.abs(seconds)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (absoluteSeconds < 60) return formatter.format(seconds, "second")
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return formatter.format(days, "day")
  const months = Math.round(days / 30)
  if (Math.abs(months) < 12) return formatter.format(months, "month")
  return formatter.format(Math.round(months / 12), "year")
}

function Reviewer({ reviewer, aiLabel }: { reviewer: ModerationPerson | null | undefined; aiLabel: string }) {
  if (!reviewer) {
    return <div className="flex min-w-44 items-center gap-3"><Avatar><AvatarFallback className="bg-primary/10 text-primary"><BotIcon className="size-4" /></AvatarFallback></Avatar><span className="font-medium">{aiLabel}</span></div>
  }
  const name = personName(reviewer)
  const image = reviewerAvatarUrl(reviewer)
  const initials = name === "—" ? "?" : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  return <div className="flex min-w-44 items-center gap-3"><Avatar>{image && <AvatarImage src={image} alt={name} />}<AvatarFallback>{initials}</AvatarFallback></Avatar><div className="min-w-0"><div className="font-medium">{name}</div>{reviewer.email && <div className="max-w-52 truncate text-xs text-muted-foreground" title={reviewer.email}>{reviewer.email}</div>}</div></div>
}

function reviewerAvatarUrl(reviewer: ModerationPerson) {
  const thumbnail = reviewer.avatar?.thumbnail
  if (typeof thumbnail === "string") return thumbnail
  if (thumbnail?.url) return thumbnail.url
  const medium = reviewer.avatar?.medium
  if (typeof medium === "string") return medium
  return medium?.url || reviewer.avatar?.url || reviewer.profile || ""
}
