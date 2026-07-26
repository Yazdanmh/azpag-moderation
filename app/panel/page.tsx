import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Clock3Icon, FileCheck2Icon, ListTodoIcon, SendIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { isLocale } from "@/lib/i18n"
import { getModerationReviews, ModerationApiError } from "@/lib/moderation-api"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"
import { getSession } from "@/lib/session"
import { isManagerOnly } from "@/lib/moderation-types"
import { paginationTotal } from "@/lib/moderation-utils"

const countQuery = { page: 1, pageSize: 1 } as const
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
  const range = { dateFrom, dateTo }

  let responses: Awaited<ReturnType<typeof getModerationReviews>>[] | null = null
  let errorMessage = ""
  try {
    responses = await Promise.all([
      getModerationReviews(session.accessToken, { ...countQuery, status: "QUEUED" }),
      getModerationReviews(session.accessToken, { ...countQuery, status: "QUEUED", sort: "oldest" }),
      getModerationReviews(session.accessToken, { ...countQuery, ...range, status: "DECIDED" }),
      getModerationReviews(session.accessToken, { ...countQuery, ...range, status: "DECIDED", decision: "PUBLISH" }),
      getModerationReviews(session.accessToken, { ...countQuery, ...range, status: "DECIDED", decision: "REJECT" }),
      getModerationReviews(session.accessToken, { ...countQuery, ...range, status: "DECIDED", decision: "NEEDS_CHANGES" }),
    ])
  } catch (error) {
    errorMessage = error instanceof ModerationApiError ? error.message : t.loadError
  }
  if (!responses) return <main className="p-4 md:p-6"><Card><CardHeader><CardTitle>{t.loadError}</CardTitle></CardHeader><CardContent>{errorMessage}</CardContent></Card></main>

  const [queue, oldest, completed, published, rejected, changes] = responses
  const completedCount = paginationTotal(completed.pagination)
  const oldestQueuedAt = oldest.data?.[0]?.queuedAt
  const percent = (count: number) => completedCount ? `${((count / completedCount) * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%` : t.noData
  const cards = [
    { label: t.queueCount, value: paginationTotal(queue.pagination).toLocaleString(locale), icon: ListTodoIcon },
    { label: t.oldestWait, value: oldestQueuedAt ? elapsedLabel(oldestQueuedAt, locale, t) : t.noData, icon: Clock3Icon },
    { label: t.completedReviews, value: completedCount.toLocaleString(locale), icon: FileCheck2Icon },
    { label: t.publishRate, value: percent(paginationTotal(published.pagination)), icon: SendIcon },
  ]
  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
    <div><h1 className="text-2xl font-semibold">{t.operationsDashboard}</h1><p className="text-muted-foreground">{t.operationsDescription}</p></div>
    <Card><CardContent><form className="flex flex-wrap items-end gap-3"><label className="grid gap-1 text-sm"><span>{t.from}</span><Input name="dateFrom" type="date" defaultValue={dateFrom?.slice(0, 10)} /></label><label className="grid gap-1 text-sm"><span>{t.to}</span><Input name="dateTo" type="date" defaultValue={dateTo?.slice(0, 10)} /></label><Button type="submit">{t.apply}</Button></form></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader><div className="flex items-center justify-between"><CardDescription>{label}</CardDescription><Icon className="size-5 text-primary" /></div><CardTitle className="text-3xl">{value}</CardTitle></CardHeader></Card>)}</div>
    <Card><CardHeader><CardTitle>{t.decisionDistribution}</CardTitle><CardDescription>{completedCount.toLocaleString(locale)} {t.completedReviews}</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><Decision label={t.publishDecision} count={paginationTotal(published.pagination)} rate={percent(paginationTotal(published.pagination))} /><Decision label={t.rejectDecision} count={paginationTotal(rejected.pagination)} rate={percent(paginationTotal(rejected.pagination))} /><Decision label={t.needsChanges} count={paginationTotal(changes.pagination)} rate={percent(paginationTotal(changes.pagination))} /></CardContent></Card>
  </main>
}

function Decision({ label, count, rate }: { label: string; count: number; rate: string }) {
  return <div className="rounded-md border p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold">{count}</div><div className="text-sm text-primary">{rate}</div></div>
}

function elapsedLabel(value: string, locale: string, t: typeof moderationHistoryDictionaries.en) {
  const milliseconds = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(milliseconds / 60_000)
  if (minutes < 60) return `${minutes.toLocaleString(locale)} ${t.minutes}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours.toLocaleString(locale)} ${t.hours}`
  return `${Math.floor(hours / 24).toLocaleString(locale)} ${t.days}`
}
