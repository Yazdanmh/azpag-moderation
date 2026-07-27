import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { BotIcon, BrainCircuitIcon, FileCheck2Icon, ListTodoIcon, UsersIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ResultState } from "@/components/moderation/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isLocale, type Locale } from "@/lib/i18n"
import {
  getModerationOperationalMetrics,
  getModerationQueueMetrics,
  ModerationApiError,
} from "@/lib/moderation-api"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"
import type { DurationDistribution, ModerationDecision, ModerationPerson } from "@/lib/moderation-types"
import { isManagerOnly } from "@/lib/moderation-types"
import { deleteSession, getSession } from "@/lib/session"

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")

  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = moderationHistoryDictionaries[locale]
  const params = await searchParams
  const dateFrom = first(params.dateFrom)
  const dateTo = first(params.dateTo)
  const range = {
    dateFrom: toApiDate(dateFrom, false),
    dateTo: toApiDate(dateTo, true),
  }

  let data
  try {
    const [queue, operations] = await Promise.all([
      getModerationQueueMetrics(session.accessToken),
      getModerationOperationalMetrics(session.accessToken, range),
    ])
    data = { queue, operations }
  } catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) {
      await deleteSession()
      redirect("/login")
    }
    const message = error instanceof ModerationApiError ? error.message : t.loadError
    return (
      <main className="flex flex-1 p-4 md:p-6">
        <ResultState title={t.loadError} description={message} retry retryLabel={t.refresh} fill />
      </main>
    )
  }

  const { queue, operations } = data
  const volumeCards = [
    { label: t.queueCount, value: number(queue.waitingReviews, locale), description: queue.oldestWaitingMs === null ? t.noData : `${t.oldestWait}: ${duration(queue.oldestWaitingMs, locale, t)}`, icon: ListTodoIcon },
    { label: t.completedReviews, value: number(operations.volume.completedReviews, locale), description: t.selectedPeriod, icon: FileCheck2Icon },
    { label: t.aiOnlyReviews, value: percentage(operations.volume.aiOnlyPercentage, locale, t.noData), description: `${number(operations.volume.aiOnlyReviews, locale)} ${t.reviews}`, icon: BrainCircuitIcon },
    { label: t.humanParticipation, value: percentage(operations.volume.humanParticipationPercentage, locale, t.noData), description: `${number(operations.volume.humanParticipationReviews, locale)} ${t.reviews}`, icon: UsersIcon },
  ]
  const decisionMap = new Map(operations.decisions.map((item) => [item.decision, item]))
  const hasOperationalData = queue.waitingReviews > 0 || operations.volume.completedReviews > 0

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div><h1 className="text-2xl font-semibold">{t.operationsDashboard}</h1><p className="text-muted-foreground">{t.operationsDescription}</p></div>

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm"><span>{t.from}</span><Input name="dateFrom" type="date" defaultValue={dateFrom?.slice(0, 10)} /></label>
            <label className="grid gap-2 text-sm"><span>{t.to}</span><Input name="dateTo" type="date" defaultValue={dateTo?.slice(0, 10)} /></label>
            <Button type="submit">{t.apply}</Button>
          </form>
        </CardContent>
      </Card>

      {!hasOperationalData ? (
        <ResultState title={t.noOperationsData} description={t.noOperationsDataDescription} fill />
      ) : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {volumeCards.map(({ label, value, description, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3"><CardDescription>{label}</CardDescription><Icon className="size-5 text-primary" /></div>
              <CardTitle className="text-3xl">{value}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{t.reviewTiming}</CardTitle><CardDescription>{t.reviewTimingDescription}</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>{t.metric}</TableHead><TableHead>{t.sampleSize}</TableHead><TableHead>{t.median}</TableHead><TableHead>{t.p90}</TableHead><TableHead>{t.p95}</TableHead></TableRow></TableHeader>
            <TableBody>
              <TimingRow label={t.totalReviewTime} value={operations.timing.totalReviewTime} locale={locale} t={t} />
              <TimingRow label={t.humanQueueTime} value={operations.timing.humanQueueWaitTime} locale={locale} t={t} />
              <TimingRow label={t.humanActiveTime} value={operations.timing.humanActiveWorkTime} locale={locale} t={t} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.decisionDistribution}</CardTitle><CardDescription>{number(operations.volume.completedReviews, locale)} {t.completedReviews}</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Decision label={t.publishDecision} value={decisionMap.get("PUBLISH")} locale={locale} noData={t.noData} />
          <Decision label={t.rejectDecision} value={decisionMap.get("REJECT")} locale={locale} noData={t.noData} />
          <Decision label={t.needsChanges} value={decisionMap.get("NEEDS_CHANGES")} locale={locale} noData={t.noData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.reviewerPerformance}</CardTitle><CardDescription>{t.reviewerPerformanceDescription}</CardDescription></CardHeader>
        <CardContent>
          {operations.reviewers.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>{t.reviewer}</TableHead><TableHead>{t.completedReviews}</TableHead><TableHead>{t.sampleSize}</TableHead><TableHead>{t.median}</TableHead><TableHead>{t.p90}</TableHead><TableHead>{t.p95}</TableHead></TableRow></TableHeader>
              <TableBody>{operations.reviewers.map((row) => <ReviewerRow key={row.reviewer.id} reviewer={row.reviewer} count={row.reviewCount} timing={row.activeWorkTime} locale={locale} t={t} />)}</TableBody>
            </Table>
          ) : <ResultState title={t.noReviewerMetrics} description={t.reviewerPerformanceDescription} />}
        </CardContent>
      </Card>
      </>}
    </main>
  )
}

function TimingRow({ label, value, locale, t }: { label: string; value: DurationDistribution; locale: Locale; t: typeof moderationHistoryDictionaries.en }) {
  return <TableRow><TableCell className="font-medium">{label}</TableCell><TableCell>{number(value.count, locale)}</TableCell><TableCell>{duration(value.medianMs, locale, t)}</TableCell><TableCell>{duration(value.p90Ms, locale, t)}</TableCell><TableCell>{duration(value.p95Ms, locale, t)}</TableCell></TableRow>
}

function Decision({ label, value, locale, noData }: { label: string; value?: { decision: ModerationDecision; count: number; percentage: number | null }; locale: Locale; noData: string }) {
  return <div className="rounded-md border p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold">{number(value?.count ?? 0, locale)}</div><div className="text-sm text-primary">{percentage(value?.percentage ?? null, locale, noData)}</div></div>
}

function ReviewerRow({ reviewer, count, timing, locale, t }: { reviewer: ModerationPerson; count: number; timing: DurationDistribution; locale: Locale; t: typeof moderationHistoryDictionaries.en }) {
  const name = [reviewer.first_name, reviewer.last_name].filter(Boolean).join(" ") || reviewer.company_name || reviewer.email || "—"
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  const image = personImage(reviewer)
  return <TableRow><TableCell><div className="flex min-w-56 items-center gap-3"><Avatar>{image && <AvatarImage src={image} alt={name} />}<AvatarFallback>{initials || <BotIcon className="size-4" />}</AvatarFallback></Avatar><div><div className="font-medium">{name}</div><div className="text-xs text-muted-foreground">{reviewer.email}</div></div></div></TableCell><TableCell>{number(count, locale)}</TableCell><TableCell>{number(timing.count, locale)}</TableCell><TableCell>{duration(timing.medianMs, locale, t)}</TableCell><TableCell>{duration(timing.p90Ms, locale, t)}</TableCell><TableCell>{duration(timing.p95Ms, locale, t)}</TableCell></TableRow>
}

function personImage(person: ModerationPerson) {
  const thumbnail = person.avatar?.thumbnail
  if (typeof thumbnail === "string") return thumbnail
  if (thumbnail?.url) return thumbnail.url
  const medium = person.avatar?.medium
  if (typeof medium === "string") return medium
  return medium?.url || person.avatar?.url || person.profile || ""
}

function number(value: number, locale: Locale) {
  return value.toLocaleString(locale)
}

function percentage(value: number | null, locale: Locale, noData: string) {
  return value === null ? noData : value.toLocaleString(locale, { style: "percent", maximumFractionDigits: 1 })
}

function duration(value: number | null, locale: Locale, t: typeof moderationHistoryDictionaries.en) {
  if (value === null || !Number.isFinite(value)) return t.noData
  const seconds = Math.round(value / 1000)
  if (seconds < 60) return `${number(seconds, locale)} ${t.seconds}`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${number(minutes, locale)} ${t.minutes}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${number(hours, locale)} ${t.hours}`
  return `${number(Math.round(hours / 24), locale)} ${t.days}`
}

function toApiDate(value: string | undefined, endOfDay: boolean) {
  if (!value) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : value
}
