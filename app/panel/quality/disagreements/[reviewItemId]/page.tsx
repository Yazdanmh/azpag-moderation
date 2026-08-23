import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { ArrowLeftIcon } from "lucide-react"
import { QualityDisagreementDetails, qualityDisagreementCopy } from "@/components/moderation/quality-disagreement-detail"
import { buttonVariants } from "@/components/ui/button"
import { getSession } from "@/lib/auth/session"
import { isLocale } from "@/lib/i18n"
import { getModerationQualityDisagreement, ModerationApiError } from "@/lib/moderation/api"
import { hasModerationRole, isManagerOnly } from "@/lib/moderation/types"

export default async function QualityDisagreementPage({ params }: { params: Promise<{ reviewItemId: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")

  const { reviewItemId } = await params
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const copy = qualityDisagreementCopy[locale]

  let detail
  try {
    detail = await getModerationQualityDisagreement(session.accessToken, reviewItemId)
  } catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) {
      redirect(`/auth/refresh?returnTo=${encodeURIComponent(`/panel/quality/disagreements/${reviewItemId}`)}`)
    }
    if (error instanceof ModerationApiError && error.status === 404) notFound()
    throw error
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Link href="/panel/quality" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeftIcon className="rtl:rotate-180" />
          {locale === "en" ? "Back to quality" : locale === "fa" ? "بازگشت به کیفیت" : "کیفیت ته ستنېدل"}
        </Link>
      </div>
      <QualityDisagreementDetails detail={detail} locale={locale} />
    </main>
  )
}
