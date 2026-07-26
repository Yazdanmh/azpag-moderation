import { redirect } from "next/navigation"
import { QualityReport } from "@/components/moderation/quality-report"
import { getModerationQualityReport, ModerationApiError } from "@/lib/moderation-api"
import { hasModerationRole, isManagerOnly, type ApiResult, type QualityReportResponse } from "@/lib/moderation-types"
import { getSession } from "@/lib/session"
import { cookies } from "next/headers"
import { isLocale } from "@/lib/i18n"
import { moderationDictionaries } from "@/lib/moderation-i18n"

export default async function QualityPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const t = moderationDictionaries[isLocale(localeValue) ? localeValue : "fa"]

  let initial: ApiResult<QualityReportResponse>
  try {
    initial = { ok: true, data: await getModerationQualityReport(session.accessToken) }
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
      <QualityReport initial={initial} />
    </main>
  )
}
