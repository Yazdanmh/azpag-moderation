import { redirect } from "next/navigation"
import { QualityReport } from "@/components/moderation/quality-report"
import { getModerationQualityReport, ModerationApiError } from "@/lib/moderation-api"
import { hasModerationRole, isManagerOnly, type ApiResult, type QualityReportResponse } from "@/lib/moderation-types"
import { getSession } from "@/lib/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationDictionaries } from "@/lib/moderation-i18n"
import { DateRangeDialog } from "@/components/moderation/date-range-dialog"

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.qualityTitle}</h1>
          <p className="text-muted-foreground">{t.qualitySubtitle}</p>
        </div>
        <DateRangeDialog
          dateFrom={dateFrom}
          dateTo={dateTo}
          clearHref="/panel/quality"
          hiddenFields={{ pageSize }}
          labels={{
            trigger: t.dateRange,
            title: t.dateRange,
            description: t.dateRangeDescription,
            from: t.dateFrom,
            to: t.dateTo,
            apply: t.applyRange,
            clear: t.clearRange,
          }}
        />
      </div>
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
