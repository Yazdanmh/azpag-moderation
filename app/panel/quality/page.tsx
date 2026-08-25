import { redirect } from "next/navigation"
import { QualityReport } from "@/components/moderation/quality-report"
import { getModerationQualityDisagreements, getModerationQualityRules, getModerationQualitySummary, ModerationApiError } from "@/lib/moderation/api"
import { hasModerationRole, isManagerOnly, type ApiResult, type QualityDisagreementsSortBy, type QualityReportResponse, type QualityRulesSortBy, type SortOrder } from "@/lib/moderation/types"
import { getSession } from "@/lib/auth/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationDictionaries } from "@/lib/moderation/i18n"

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const ruleSorts = new Set<QualityRulesSortBy>(["ruleId", "field", "total", "agreements", "disagreements", "agreementRate"])
const disagreementSorts = new Set<QualityDisagreementsSortBy>(["completedAt", "ruleId", "field", "postRevision"])

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
  const page = Math.max(1, Number(first(params.page)) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(first(params.pageSize)) || 20))
  const rulesSortBy = validSort(first(params.rulesSortBy), ruleSorts, "disagreements")
  const rulesSortOrder = validOrder(first(params.rulesSortOrder), "desc")
  const disagreementsSortBy = validSort(first(params.disagreementsSortBy), disagreementSorts, "completedAt")
  const disagreementsSortOrder = validOrder(first(params.disagreementsSortOrder), "desc")
  let initial: ApiResult<QualityReportResponse>
  try {
    const [summary, rules, disagreements] = await Promise.all([
      getModerationQualitySummary(session.accessToken),
      getModerationQualityRules(session.accessToken, { sortBy: rulesSortBy, sortOrder: rulesSortOrder }),
      getModerationQualityDisagreements(session.accessToken, { page, pageSize, sortBy: disagreementsSortBy, sortOrder: disagreementsSortOrder }),
    ])
    initial = { ok: true, data: {
      range: { dateFrom: null, dateTo: null, field: "sourceReview.decidedAt" },
      sampling: {
        confidentAiItems: summary.confidentAiItems,
        sampledItems: summary.sampledItems,
        reviewedSamples: summary.reviewedSamples,
        sampledPercentage: summary.samplingCoverage,
        reviewedSamplePercentage: summary.reviewedCoverage,
        configuredSampleRate: summary.configuredSamplingRate,
        confidenceThreshold: summary.aiConfidenceThreshold,
      },
      summary: {
        total: summary.reviewedSamples,
        agreements: summary.agreements,
        disagreements: summary.disagreements,
        agreementRate: summary.agreementRate,
      },
      byDefinition: rules.rules,
      disagreements: disagreements.data,
      disagreementPagination: disagreements.pagination,
    } }
  } catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) {
      const returnParams = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      returnParams.set("rulesSortBy", rulesSortBy)
      returnParams.set("rulesSortOrder", rulesSortOrder)
      returnParams.set("disagreementsSortBy", disagreementsSortBy)
      returnParams.set("disagreementsSortOrder", disagreementsSortOrder)
      redirect(`/auth/refresh?returnTo=${encodeURIComponent(`/panel/quality?${returnParams}`)}`)
    }
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
      <QualityReport initial={initial} pageSize={pageSize} rulesSortBy={rulesSortBy} rulesSortOrder={rulesSortOrder} disagreementsSortBy={disagreementsSortBy} disagreementsSortOrder={disagreementsSortOrder} />
    </main>
  )
}

function validSort<T extends string>(value: string | undefined, supported: Set<T>, fallback: T): T {
  return value && supported.has(value as T) ? value as T : fallback
}

function validOrder(value: string | undefined, fallback: SortOrder): SortOrder {
  return value === "asc" || value === "desc" ? value : fallback
}
