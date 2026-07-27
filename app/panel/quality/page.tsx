import { redirect } from "next/navigation"
import { QualityReport } from "@/components/moderation/quality-report"
import { getModerationQualityReport, ModerationApiError } from "@/lib/moderation-api"
import { hasModerationRole, isManagerOnly, type ApiResult, type QualityReportResponse } from "@/lib/moderation-types"
import { getSession } from "@/lib/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationDictionaries } from "@/lib/moderation-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const t = moderationDictionaries[isLocale(localeValue) ? localeValue : "fa"]
  const params = await searchParams
  const dateFrom = first(params.dateFrom)
  const dateTo = first(params.dateTo)
  const page = Math.max(1, Number(first(params.page)) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(first(params.pageSize)) || 20))
  const query = {
    dateFrom: toApiDate(dateFrom, false),
    dateTo: toApiDate(dateTo, true),
    page,
    pageSize,
  }

  let initial: ApiResult<QualityReportResponse>
  try {
    initial = { ok: true, data: await getModerationQualityReport(session.accessToken, query) }
  } catch (error) {
    initial = error instanceof ModerationApiError
      ? { ok: false, status: error.status, message: error.message }
      : { ok: false, status: 500, message: "The moderation service is unavailable." }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.qualityTitle}</h1>
        <p className="text-muted-foreground">{t.qualitySubtitle}</p>
      </div>
      <Card><CardContent><form className="flex flex-wrap items-end gap-3"><label className="grid gap-2 text-sm"><span>{t.dateFrom}</span><Input name="dateFrom" type="date" defaultValue={dateFrom?.slice(0, 10)} /></label><label className="grid gap-2 text-sm"><span>{t.dateTo}</span><Input name="dateTo" type="date" defaultValue={dateTo?.slice(0, 10)} /></label><input type="hidden" name="pageSize" value={pageSize} /><Button type="submit">{t.applyRange}</Button></form></CardContent></Card>
      <QualityReport initial={initial} dateFrom={dateFrom} dateTo={dateTo} pageSize={pageSize} />
    </main>
  )
}

function toApiDate(value: string | undefined, endOfDay: boolean) {
  if (!value) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : value
}
