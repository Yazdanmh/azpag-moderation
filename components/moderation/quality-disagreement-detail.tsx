import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { GitBranchIcon } from "lucide-react"
import { PostImageGallery } from "@/components/moderation/post-image-gallery"
import type { EvaluationOutcome, ModerationHistoryPost, ModerationPerson, QualityDisagreementDetail } from "@/lib/moderation/types"
import { moderationDictionaries } from "@/lib/moderation/i18n"
import { localizedModerationDefinition } from "@/lib/moderation/definition-i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation/history-i18n"
import { localizedGeneratedModerationReason } from "@/lib/moderation/reason-i18n"
import type { Locale } from "@/lib/i18n"
import type { ReactNode } from "react"

export const qualityDisagreementCopy = {
  en: { view: "View details", title: "Disagreement details", subtitle: "Full AI and human evaluation context.", loading: "Loading disagreement…", failed: "Unable to load disagreement", postDetails: "Post details", evaluation: "Evaluation comparison", reviewer: "Reviewer", reviewDetails: "Review details", sourceReview: "Source review", qualityReview: "Quality review", status: "Status", finalDecision: "Final decision", assigned: "Assigned", shown: "Shown", evidence: "Evidence", version: "Version", prompt: "Prompt", ruleContext: "Rule context", sequence: "Sequence", decisionType: "Decision", rejection: "Rejected", correction: "Needs changes", fieldValues: "Field values", features: "Features" },
  fa: { view: "مشاهده جزئیات", title: "جزئیات اختلاف", subtitle: "جزئیات کامل ارزیابی هوش مصنوعی و انسان.", loading: "در حال بارگیری اختلاف…", failed: "بارگیری اختلاف ممکن نشد", postDetails: "جزئیات اعلان", evaluation: "مقایسه ارزیابی", reviewer: "بررسی‌کننده", reviewDetails: "جزئیات بررسی", sourceReview: "بررسی منبع", qualityReview: "بررسی کیفیت", status: "وضعیت", finalDecision: "تصمیم نهایی", assigned: "اختصاص", shown: "نمایش", evidence: "شواهد", version: "نسخه", prompt: "پرامپت", ruleContext: "زمینه قانون", sequence: "ترتیب", decisionType: "تصمیم", rejection: "رد شده", correction: "نیاز به تغییر", fieldValues: "مقادیر فیلد", features: "ویژگی‌ها" },
  ps: { view: "تفصیلات وګورئ", title: "د اختلاف تفصیلات", subtitle: "د مصنوعي ځیرکتیا او انسان د ارزونې بشپړ معلومات.", loading: "اختلاف پورته کېږي…", failed: "اختلاف پورته نه شو", postDetails: "د اعلان تفصیلات", evaluation: "د ارزونې پرتله", reviewer: "بیاکتونکی", reviewDetails: "د بیاکتنې تفصیلات", sourceReview: "سرچینې بیاکتنه", qualityReview: "د کیفیت بیاکتنه", status: "حالت", finalDecision: "وروستۍ پرېکړه", assigned: "سپارل شوی", shown: "ښودل شوی", evidence: "شواهد", version: "نسخه", prompt: "پرامپټ", ruleContext: "د قانون زمینه", sequence: "ترتیب", decisionType: "پرېکړه", rejection: "رد شوی", correction: "بدلون ته اړتیا لري", fieldValues: "د برخو ارزښتونه", features: "ځانګړنې" },
} as const

const contactCopy = {
  en: { title: "Contact information", phone: "Phone", whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", website: "Website" },
  fa: { title: "اطلاعات تماس", phone: "شماره تماس", whatsapp: "واتساپ", facebook: "فیسبوک", instagram: "اینستاگرام", website: "وب‌سایت" },
  ps: { title: "د اړیکې معلومات", phone: "تلیفون", whatsapp: "واټساپ", facebook: "فېسبوک", instagram: "انسټاګرام", website: "وېب‌پاڼه" },
} as const

export function QualityDisagreementDetails({ detail, locale }: { detail: QualityDisagreementDetail; locale: "en" | "fa" | "ps" }) {
  const t = moderationDictionaries[locale]
  const copy = qualityDisagreementCopy[locale]
  const { disagreement, ai, human, sourceReview, qualityReview } = detail
  const localizedRule = localizedModerationDefinition(disagreement, locale)
  const localizedDecisionType = disagreement.decisionType === "REJECTION" ? copy.rejection : copy.correction
  const reviewerName = [human?.reviewer?.firstName, human?.reviewer?.lastName].filter(Boolean).join(" ")
  const aiReason = localizedEvaluationReason(ai?.reason, ai?.reasonTranslations, locale)
  const humanReason = localizedEvaluationReason(human?.reason, null, locale)
  const historyLabels = moderationHistoryDictionaries[locale]
  return <div className="space-y-5">
    <PostInformation detail={detail} locale={locale} />
    <section className="rounded-lg border p-4">
      <h3 className="font-semibold">{copy.ruleContext}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ContextCard label={t.rule} value={localizedRule.rule} />
        <ContextCard label={t.field} value={localizedRule.field} />
        <div className={disagreement.decisionType === "REJECTION" ? "rounded-lg border border-destructive/25 bg-destructive/5 p-4" : "rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/20"}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{copy.decisionType}</p>
          <Badge className={disagreement.decisionType === "REJECTION" ? "bg-destructive text-white" : "bg-amber-500 text-white hover:bg-amber-500"}>{localizedDecisionType}</Badge>
        </div>
      </div>
    </section>
    <section><h3 className="mb-3 font-semibold">{copy.evaluation}</h3><div className="grid gap-4 md:grid-cols-2"><EvaluationCard owner={t.ai} outcome={ai?.outcome} reason={aiReason} locale={locale}><Datum label={t.confidence} value={ai ? `${Math.round(ai.confidence * 100)}%` : null} /><Datum label={t.model} value={ai?.model} />{ai?.modelVersion && ai.modelVersion !== ai.model && <Datum label={copy.version} value={ai.modelVersion} />}<Datum label={copy.prompt} value={ai?.promptVersion} /><JsonBlock label={copy.evidence} value={ai?.evidence} /></EvaluationCard><EvaluationCard owner={t.human} outcome={human?.outcome} reason={humanReason} locale={locale}><Datum label={copy.reviewer} value={reviewerName || human?.evaluatorId} /><Datum label={t.completed} value={formatDate(human?.createdAt, locale)} /></EvaluationCard></div></section>
    <Separator />
    <section><h3 className="mb-3 font-semibold">{copy.reviewDetails}</h3><div className="grid gap-4 md:grid-cols-2">{sourceReview && <ReviewCard title={copy.sourceReview} values={[[copy.status, localizedReviewStatus(sourceReview.status, historyLabels)], [copy.finalDecision, localizedReviewDecision(sourceReview.finalDecision, historyLabels)], [t.revision, sourceReview.postRevision.toLocaleString(locale)]]} />}<ReviewCard title={copy.qualityReview} values={[[copy.status, localizedReviewStatus(qualityReview.status, historyLabels)], [copy.assigned, formatDate(qualityReview.assignedAt, locale)], [copy.shown, formatDate(qualityReview.shownAt, locale)], [t.completed, formatDate(qualityReview.completedAt, locale)]]} /></div></section>
  </div>
}

function PostInformation({ detail, locale }: { detail: QualityDisagreementDetail; locale: Locale }) {
  const post = detail.post
  const t = moderationHistoryDictionaries[locale]
  const images = post.images ?? []
  return (
    <Card>
      <CardHeader><CardTitle>{t.postInformation}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            {images.length > 0 && <PostImageGallery images={images.map((image, index) => ({ id: image.id || String(index), src: historyImageUrl(image), fullSrc: image.url }))} title={post.title} locale={locale} labels={{ previous: t.previous, next: t.next, maximize: t.maximize, images: t.imagesLabel, of: t.of }} />}
            <PostIdentity post={post} locale={locale} />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{post.description || t.noDescription}</p>
            </div>
          </div>
          <div className="space-y-6">
            <PostCategories categories={post.categories} locale={locale} label={t.categoriesLabel} />
            <PostFields values={post.fieldValues} locale={locale} labels={t} />
            <PostFeatures features={post.features} locale={locale} labels={t} />
          </div>
          <div className="self-start space-y-4">
            <div className="h-fit rounded-md border bg-muted/20 p-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-3">
                <Datum label={t.created} value={formatDate(post.created_at, locale)} />
                <Datum label={t.updated} value={formatDate(post.updated_at, locale)} />
                <Datum label={t.published} value={formatDate(post.published_at, locale)} />
              </div>
            </div>
            <AddressCard address={post.address} locale={locale} />
            <ContactCard contact={post.contact} locale={locale} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PostIdentity({ post, locale }: { post: ModerationHistoryPost; locale: Locale }) {
  const t = moderationHistoryDictionaries[locale]
  const author = post.author
  const name = author ? [author.first_name, author.last_name].filter(Boolean).join(" ") || author.company_name || author.email || "—" : "—"
  const image = authorImage(author)
  const initials = name === "—" ? "?" : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  return <div className="space-y-2.5 border-b pb-3">
    <div className="flex min-w-0 items-center gap-2"><Avatar className="size-9">{image && <AvatarImage src={image} alt={name} />}<AvatarFallback>{initials}</AvatarFallback></Avatar><div className="min-w-0"><div className="max-w-44 truncate text-sm font-medium">{name}</div>{author?.email && <div className="max-w-52 truncate text-xs text-muted-foreground">{author.email}</div>}</div></div>
    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="h-7 gap-1.5 rounded-md px-2 text-xs font-normal"><GitBranchIcon className="size-3.5 text-primary" />{t.currentRevision} {post.revision.toLocaleString(locale)}</Badge></div>
  </div>
}

function AddressCard({ address, locale }: { address: ModerationHistoryPost["address"]; locale: Locale }) {
  const t = moderationDictionaries[locale]
  const localizedPlace = (place: NonNullable<ModerationHistoryPost["address"]>["province"] | NonNullable<ModerationHistoryPost["address"]>["district"]) => {
    if (!place) return null
    const aliases = locale === "fa" ? ["fa", "prs"] : [locale]
    for (const language of aliases) {
      const translation = place.translations?.find((item) => item.language.toLowerCase() === language)
      if (translation?.value.trim()) return translation.value
    }
    return place.name
  }
  return <div className="h-fit rounded-md border bg-muted/20 p-4">
    <h3 className="mb-4 font-semibold">{t.address}</h3>
    {address ? <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-3">
      <Datum label={t.province} value={localizedPlace(address.province)} />
      <Datum label={t.district} value={localizedPlace(address.district)} />
      <Datum label={t.region} value={address.region} />
    </div> : <p className="text-sm text-muted-foreground">{t.noData}</p>}
  </div>
}

function ContactCard({ contact, locale }: { contact: ModerationHistoryPost["contact"]; locale: Locale }) {
  const t = moderationDictionaries[locale]
  const labels = contactCopy[locale]
  const values = contact ? [
    [labels.phone, contact.phone, true],
    [labels.whatsapp, contact.whatsapp, true],
    [labels.facebook, contact.facebook, false],
    [labels.instagram, contact.instagram, false],
    [labels.website, contact.website, false],
  ] as Array<[string, string | null | undefined, boolean]> : []
  const available = values.filter(([, value]) => value)
  return <div className="h-fit rounded-md border bg-muted/20 p-4">
    <h3 className="mb-4 font-semibold">{labels.title}</h3>
    {available.length ? <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">{available.map(([label, value, isPhoneNumber]) => <Datum key={label} label={label} value={value} dir={isPhoneNumber ? "ltr" : undefined} />)}</div> : <p className="text-sm text-muted-foreground">{t.noData}</p>}
  </div>
}

function PostCategories({ categories, locale, label }: { categories: NonNullable<ModerationHistoryPost["categories"]>; locale: Locale; label: string }) {
  return <div><div className="mb-2 text-xs text-muted-foreground">{label}</div><div className="flex flex-wrap gap-2">{categories.length ? categories.map((category) => <Badge key={category.id} variant="secondary">{localizedCategoryName(category, locale)}</Badge>) : <span>—</span>}</div></div>
}

function PostFields({ values, locale, labels }: { values: NonNullable<ModerationHistoryPost["fieldValues"]>; locale: Locale; labels: typeof moderationHistoryDictionaries.en }) {
  return <div><div className="mb-2 text-xs text-muted-foreground">{labels.dynamicFieldsLabel}</div>{values.length ? <div className="divide-y border-y">{values.map((entry) => <div key={entry.id} className="grid grid-cols-2 gap-3 py-3 text-sm"><div className="text-muted-foreground">{localizedApiLabel(entry.field.localizations, locale, entry.field.key)}</div><div className="text-end font-medium">{localizedFieldValue(entry, locale, labels)}</div></div>)}</div> : <span className="text-sm text-muted-foreground">{labels.noDynamicFields}</span>}</div>
}

function PostFeatures({ features, locale, labels }: { features: NonNullable<ModerationHistoryPost["features"]>; locale: Locale; labels: typeof moderationHistoryDictionaries.en }) {
  return <div><div className="mb-2 text-xs text-muted-foreground">{labels.featuresLabel}</div>{features.length ? <div className="flex flex-wrap gap-2">{features.map(({ id, feature }) => <Badge key={id} variant="outline" className="h-9 px-3 text-sm">{localizedApiLabel(feature.localizations, locale, feature.key)}</Badge>)}</div> : <span className="text-sm text-muted-foreground">{labels.noFeatures}</span>}</div>
}

type ApiLocalization = { language: string; value: string }
function localizedApiLabel(localizations: ApiLocalization[] | undefined, locale: Locale, fallback: string) {
  const aliases = locale === "fa" ? ["fa", "prs"] : [locale]
  for (const language of aliases) {
    const localized = localizations?.find((item) => item.language.toLowerCase() === language)
    if (localized?.value.trim()) return localized.value
  }
  return fallback.replaceAll("_", " ")
}
function localizedCategoryName(category: NonNullable<ModerationHistoryPost["categories"]>[number], locale: Locale) {
  const aliases = locale === "fa" ? ["fa", "prs"] : [locale]
  for (const language of aliases) {
    const translated = category.translations?.find((item) => item.language.toLowerCase() === language)
    if (translated?.value.trim()) return translated.value
  }
  return category.name
}
function localizedFieldValue(entry: NonNullable<ModerationHistoryPost["fieldValues"]>[number], locale: Locale, labels: typeof moderationHistoryDictionaries.en) {
  const localize = (value: unknown): string => {
    if (typeof value === "boolean") return value ? labels.yes : labels.no
    const option = entry.field.options?.find((candidate) => String(candidate.value) === String(value))
    if (option) return localizedApiLabel(option.localizations, locale, option.value)
    if (value === null || value === undefined || value === "") return "—"
    if (typeof value === "object") return Object.values(value).map(localize).filter((part) => part !== "—").join(" – ") || "—"
    return String(value)
  }
  const value = Array.isArray(entry.value) ? entry.value.map(localize).join(", ") : localize(entry.value)
  return entry.currency && value !== "—" ? `${value} ${entry.currency}` : value
}
function historyImageUrl(image: NonNullable<ModerationHistoryPost["images"]>[number]) {
  if (typeof image.medium === "string") return image.medium
  if (image.medium?.url) return image.medium.url
  if (typeof image.thumbnail === "string") return image.thumbnail
  return image.thumbnail?.url || image.url
}
function authorImage(author: ModerationPerson | undefined) {
  const thumbnail = author?.avatar?.thumbnail
  if (typeof thumbnail === "string") return thumbnail
  if (thumbnail?.url) return thumbnail.url
  const medium = author?.avatar?.medium
  if (typeof medium === "string") return medium
  return medium?.url || author?.avatar?.url || author?.profile || ""
}

function EvaluationCard({ owner, outcome, reason, locale, children }: { owner: string; outcome?: EvaluationOutcome; reason?: string | null; locale: "en" | "fa" | "ps"; children: ReactNode }) { const t = moderationDictionaries[locale]; return <div className="rounded-lg border p-4"><div className="flex items-center justify-between"><h4 className="font-semibold">{owner}</h4>{outcome && <Badge variant={outcome === "VIOLATION" ? "destructive" : "secondary"}>{outcome === "VIOLATION" ? t.violation : outcome === "NO_VIOLATION" ? t.noViolation : t.uncertain}</Badge>}</div><p className="my-4 whitespace-pre-wrap text-sm">{reason || t.noData}</p><div className="grid gap-3 text-sm sm:grid-cols-2">{children}</div></div> }
function ContextCard({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-muted/30 p-4"><p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p><p className="font-semibold leading-snug">{value}</p></div> }
function ReviewCard({ title, values }: { title: string; values: Array<[string, unknown]> }) { return <div className="rounded-lg border p-4"><h4 className="mb-3 font-semibold">{title}</h4><div className="grid gap-3 text-sm sm:grid-cols-2">{values.map(([label, value]) => <Datum key={label} label={label} value={value} mono={label === "ID"} />)}</div></div> }
function Datum({ label, value, mono = false, dir }: { label: string; value: unknown; mono?: boolean; dir?: "ltr" | "rtl" }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p dir={dir} className={`${mono ? "break-all font-mono text-xs" : "break-words"} ${dir === "ltr" ? "text-right" : ""}`}>{value === null || value === undefined || value === "" ? "—" : String(value)}</p></div> }
function JsonBlock({ label, value }: { label: string; value: unknown }) { if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return null; return <div className="col-span-full mt-3"><p className="mb-1 text-xs text-muted-foreground">{label}</p><pre className="max-h-44 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre></div> }
function formatDate(value: string | null | undefined, locale: string) { return value ? new Date(value).toLocaleString(locale) : null }
function localizedEvaluationReason(reason: string | null | undefined, translations: Record<string, string> | null | undefined, locale: Locale) {
  const translated = translations?.[locale] || (locale === "fa" ? translations?.prs || translations?.dari : undefined)
  return localizedGeneratedModerationReason(translated || reason || "", locale)
}
function localizedReviewStatus(status: string, labels: typeof moderationHistoryDictionaries.en) {
  const values: Record<string, string> = {
    QUEUED: labels.queuedStatus,
    AI_REVIEWING: labels.aiReviewing,
    HUMAN_REVIEW_QUEUED: labels.humanReviewQueued,
    HUMAN_REVIEWING: labels.humanReviewing,
    DECIDED: labels.decidedStatus,
    CANCELLED: labels.cancelledStatus,
    FAILED: labels.failedStatus,
  }
  return values[status] ?? status.replaceAll("_", " ")
}
function localizedReviewDecision(decision: string | null, labels: typeof moderationHistoryDictionaries.en) {
  if (!decision) return null
  const values: Record<string, string> = {
    PUBLISH: labels.publishDecision,
    REJECT: labels.rejectDecision,
    NEEDS_CHANGES: labels.needsChanges,
  }
  return values[decision] ?? decision.replaceAll("_", " ")
}
