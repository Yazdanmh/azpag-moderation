import Link from "next/link"
import { redirect } from "next/navigation"
import { BotIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReviewToolbar } from "@/components/moderation/review-toolbar"
import { StatusBadge, personName } from "@/components/moderation/review-badges"
import { getModerationReviews, ModerationApiError } from "@/lib/moderation-api"
import { hasModerationRole, isManagerOnly, type ModerationDecision, type ModerationPerson, type ModerationPostStatus, type ModerationReviewListItem, type ModerationReviewsQuery, type ModerationReviewStatus, type ModerationReviewType } from "@/lib/moderation-types"
import { deleteSession, getSession } from "@/lib/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"
import { cn } from "@/lib/utils"
import { paginationTotal, paginationTotalPages } from "@/lib/moderation-utils"

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
  const pageSize = Math.min(100, Math.max(1, Number(first(params.pageSize)) || 20))
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
      await deleteSession()
      redirect("/login")
    }
    const message = error instanceof ModerationApiError ? error.message : t.loadError
    return <main className="p-4 md:p-6"><Card><CardHeader><CardTitle>{t.loadError}</CardTitle></CardHeader><CardContent>{message}</CardContent></Card></main>
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
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">{t.archive}</h1><p className="text-muted-foreground">{t.archiveDescription}</p></div><Link href="/panel/reviews/next" className={buttonVariants()}>{t.workspace}</Link></div>
      <ReviewToolbar
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
      />
      <Card><CardContent>{rows.length ? <Table><TableHeader><TableRow><TableHead>{t.post}</TableHead><TableHead>{t.review}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.decision}</TableHead><TableHead>{t.reviewer}</TableHead><TableHead>{t.summary}</TableHead><TableHead>{t.queued}</TableHead></TableRow></TableHeader><TableBody>{rows.map((review) => <TableRow key={review.id}>
        <TableCell className="min-w-72 whitespace-normal"><div className="flex items-start gap-3">{review.post.images?.[0]?.url && <div className="size-14 shrink-0 overflow-hidden rounded-md border bg-muted"><img src={postImageUrl(review.post.images[0])} alt="" className="size-full object-cover" /></div>}<div><Link className="font-medium hover:text-primary" href={`/panel/posts/${review.post.id}`}>{review.post.title}</Link><div className="mt-1 flex flex-wrap gap-1"><StatusBadge value={review.post.status} /></div><div className="mt-1 text-xs text-muted-foreground">{personName(review.post.author)}<br />{review.post.id} · {t.revision} {review.postRevision}</div></div></div></TableCell>
        <TableCell><Link className="text-primary hover:underline" href={`/panel/reviews/${review.id}`}>{review.type.replaceAll("_", " ")}</Link></TableCell><TableCell><StatusBadge value={review.status} /></TableCell><TableCell><StatusBadge value={review.finalDecision} /></TableCell>
        <TableCell className="whitespace-normal"><Reviewer reviewer={review.assignment?.reviewer} aiLabel={t.reviewedByAi} /></TableCell><TableCell className="min-w-64 whitespace-normal text-xs">{t.total} {review.itemSummary?.total ?? 0} · {t.violations} {review.itemSummary?.violations ?? 0} · {t.uncertain} {review.itemSummary?.uncertain ?? 0} · {t.human} {review.itemSummary?.humanReviewed ?? 0}<br />{t.quality} ✓ {review.itemSummary?.qualityAgreements ?? 0} / ✕ {review.itemSummary?.qualityDisagreements ?? 0}</TableCell><TableCell>{new Date(review.queuedAt).toLocaleString(locale)}</TableCell>
      </TableRow>)}</TableBody></Table> : <div className="py-12 text-center text-muted-foreground">{t.noMatches}</div>}</CardContent></Card>
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{total} {t.reviews} · {t.page} {pagination?.page ?? page} {t.of} {Math.max(1, totalPages)}</p><div className="flex gap-2"><Link aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={page > 1 ? pageHref(page - 1) : "#"} className={cn(buttonVariants({ variant: "outline" }), page <= 1 && "pointer-events-none opacity-50")}>{t.previous}</Link><Link aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined} href={page < totalPages ? pageHref(page + 1) : "#"} className={cn(buttonVariants({ variant: "outline" }), page >= totalPages && "pointer-events-none opacity-50")}>{t.next}</Link></div></div>
    </main>
  )
}

function postImageUrl(image: ModerationReviewListItem["post"]["images"][number]) {
  if (typeof image.thumbnail === "string") return image.thumbnail
  return image.thumbnail?.url || image.url
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
