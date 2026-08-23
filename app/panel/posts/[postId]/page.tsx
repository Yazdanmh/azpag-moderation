import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { FileCheck2Icon, FilesIcon, GitBranchIcon, ShieldAlertIcon, TestTube2Icon, type LucideIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { JsonViewer, ReviewDetail } from "@/components/moderation/review-detail"
import { PostImageGallery } from "@/components/moderation/post-image-gallery"
import { StatusBadge, safeJson } from "@/components/moderation/review-badges"
import { getModerationPostHistory, ModerationApiError } from "@/lib/moderation/api"
import { hasModerationRole, isManagerOnly } from "@/lib/moderation/types"
import { getSession } from "@/lib/auth/session"
import { cookies } from "next/headers"
import { isLocale, type Locale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation/history-i18n"
import { localizedModerationDefinition } from "@/lib/moderation/definition-i18n"
import { localizedGeneratedModerationReason } from "@/lib/moderation/reason-i18n"
import type { ModerationDecisionReason, ModerationHistoryPost, ModerationPerson } from "@/lib/moderation/types"

export default async function PostHistoryPage({ params }: { params: Promise<{ postId: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!hasModerationRole(session.roles)) redirect("/panel")
  if (isManagerOnly(session.roles)) redirect("/panel/reviews/next")
  const { postId } = await params
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = moderationHistoryDictionaries[locale]
  const statusLabels: Record<string, string> = {
    PUBLISHED: t.publishedStatus,
    PENDING: t.pendingStatus,
    DRAFT: t.draftStatus,
    ARCHIVED: t.archivedStatus,
    REJECTED: t.rejectedStatus,
    NEEDS_CHANGES: t.needsChanges,
  }
  let history
  try { history = await getModerationPostHistory(session.accessToken, postId) }
  catch (error) {
    if (error instanceof ModerationApiError && error.status === 401) redirect(`/auth/refresh?returnTo=${encodeURIComponent(`/panel/posts/${postId}`)}`)
    if (error instanceof ModerationApiError && error.status === 404) notFound()
    throw error
  }
  const post = history.post
  const reviews = Array.isArray(history.reviews) ? history.reviews : []
  const images = Array.isArray(post.images) ? post.images : []
  const categories = Array.isArray(post.categories) ? post.categories : []
  const fieldValues = Array.isArray(post.fieldValues) ? post.fieldValues : []
  const features = Array.isArray(post.features) ? post.features : []
  const moderationReasons = readModerationReasons(post.moderation_reason)
  const affectedFields = new Set(moderationReasons.flatMap(fieldsForReason))
  const affectedImageIds = moderationReasons.flatMap((reason) =>
    reason.affectedImages
      .map((image) => image.imageId ?? (image.imageIndex !== undefined ? images[image.imageIndex]?.id : undefined))
      .filter((id): id is string => Boolean(id)),
  )
  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
    <div><h1 className="text-2xl font-semibold">{t.postHistoryTitle}</h1><p className="text-muted-foreground">{t.history}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary label={t.totalReviews} value={history.summary?.totalReviews ?? reviews.length} icon={FilesIcon} /><Summary label={t.standardReviews} value={history.summary?.standardReviews ?? 0} icon={FileCheck2Icon} /><Summary label={t.qualityReviews} value={history.summary?.qualityReviews ?? 0} icon={TestTube2Icon} /><Summary label={t.revisionsLabel} value={history.summary?.revisions?.join(", ") || post.revision} icon={GitBranchIcon} /></div>
    <Card><CardHeader><CardTitle>{t.postInformation}</CardTitle><CardDescription>{t.history}</CardDescription></CardHeader><CardContent>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          {images.length > 0 && <PostImageGallery images={images.map((image) => ({ id: image.id, src: historyImageUrl(image), fullSrc: image.url }))} title={post.title} locale={locale} highlightedImageIds={affectedImageIds} moderationLabel={t.moderationReason} labels={{ previous: t.previous, next: t.next, maximize: t.maximize, images: t.imagesLabel, of: t.of }} />}
          <PostIdentityRow post={post} locale={locale} statusLabel={statusLabels[post.status]} revisionLabel={t.currentRevision} />
          <div className="space-y-2">
            <div className={affectedFields.has("title") ? "rounded-md border border-destructive/40 bg-destructive/5 p-3" : ""}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </div>
            <div className={affectedFields.has("description") ? "rounded-md border border-destructive/40 bg-destructive/5 p-3" : ""}>
              <p className="whitespace-pre-wrap text-muted-foreground">{post.description || t.noDescription}</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <LocalizedCategories categories={categories} locale={locale} label={t.categoriesLabel} highlighted={affectedFields.has("categories")} />
          <DynamicFields values={fieldValues} locale={locale} labels={t} highlighted={affectedFields.has("fields")} />
          <PostFeatures features={features} locale={locale} labels={t} />
        </div>
        <div className="space-y-4">
        {post.moderation_reason != null && <ModerationReasons value={post.moderation_reason} locale={locale} label={t.moderationReason} prominent />}
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Info label={t.created} value={new Date(post.created_at).toLocaleString(locale)} />
            <Info label={t.updated} value={new Date(post.updated_at).toLocaleString(locale)} />
            <Info label={t.published} value={post.published_at ? new Date(post.published_at).toLocaleString(locale) : "—"} />
          </div>
        </div>
        </div>
      </div>
    </CardContent></Card>
    <div className="space-y-8">{reviews.length ? reviews.map((review) => <section key={review.id} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <h2 className="text-xl font-semibold">{reviewHistoryTitle(t.reviewVersionTitle, review.type === "STANDARD" ? t.standard : t.qualitySampleType, review.postRevision.toLocaleString(locale))}</h2>
        <Link href={`/panel/reviews/${review.id}`} className={buttonVariants({ variant: "outline" })}>{t.openReview}</Link>
      </div>
      <ReviewDetail review={review} showPost={false} locale={locale} />
    </section>) : <Card><CardContent className="py-12 text-center text-muted-foreground">{t.noHistory}</CardContent></Card>}</div>
  </main>
}
function PostIdentityRow({ post, locale, statusLabel, revisionLabel }: { post: ModerationHistoryPost; locale: Locale; statusLabel?: string; revisionLabel: string }) {
  const author = post.author
  const name = author ? [author.first_name, author.last_name].filter(Boolean).join(" ") || author.company_name || author.email || "—" : "—"
  const image = authorImage(author)
  const initials = name === "—" ? "?" : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  return (
    <div className="space-y-2.5 border-b pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="size-9">
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="max-w-40 truncate text-sm font-medium">{name}</div>
          {author?.email && <div className="max-w-48 truncate text-xs text-muted-foreground" title={author.email}>{author.email}</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="h-7 shrink-0 gap-1.5 rounded-md px-2 text-xs font-normal">
          <GitBranchIcon className="size-3.5 text-primary" />
          {revisionLabel} {post.revision.toLocaleString(locale)}
        </Badge>
        <StatusBadge value={post.status} label={statusLabel} className={`h-7 shrink-0 rounded-md px-2 text-xs font-normal ${postStatusColor(post.status)}`} />
      </div>
    </div>
  )
}
function postStatusColor(status: ModerationHistoryPost["status"]) {
  if (status === "PUBLISHED") return "border-emerald-600/20 bg-emerald-500/10 text-emerald-700"
  if (status === "REJECTED") return "border-destructive/20 bg-destructive/10 text-destructive"
  if (status === "PENDING" || status === "NEEDS_CHANGES") return "border-amber-600/20 bg-amber-500/10 text-amber-700"
  return "border-[#44546A]/20 bg-[#44546A]/10 text-[#44546A] dark:text-slate-200"
}
function reviewHistoryTitle(template: string, type: string, version: string) {
  return template.replace("{type}", type).replace("{version}", version)
}
function authorImage(author: ModerationPerson | undefined) {
  const thumbnail = author?.avatar?.thumbnail
  if (typeof thumbnail === "string") return thumbnail
  if (thumbnail?.url) return thumbnail.url
  const medium = author?.avatar?.medium
  if (typeof medium === "string") return medium
  return medium?.url || author?.avatar?.url || author?.profile || ""
}
function LocalizedCategories({ categories, locale, label, highlighted = false }: { categories: NonNullable<ModerationHistoryPost["categories"]>; locale: string; label: string; highlighted?: boolean }) {
  return (
    <div className={`sm:col-span-2 lg:col-span-1 xl:col-span-2 ${highlighted ? "rounded-md border border-destructive/40 bg-destructive/5 p-3" : ""}`}>
      <div className="mb-2 text-xs text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {categories.length ? categories.map((category) => (
          <Badge key={category.id} variant="secondary">{localizedCategoryName(category, locale)}</Badge>
        )) : <span>—</span>}
      </div>
    </div>
  )
}
function localizedCategoryName(category: NonNullable<ModerationHistoryPost["categories"]>[number], locale: string) {
  const languageAliases = locale === "fa" ? ["fa", "prs"] : [locale]
  for (const language of languageAliases) {
    const translation = category.translations?.find((item) => item.language.toLowerCase() === language)
    if (translation?.value.trim()) return translation.value
  }
  return category.name
}
function DynamicFields({ values, locale, labels, highlighted = false }: { values: NonNullable<ModerationHistoryPost["fieldValues"]>; locale: Locale; labels: typeof moderationHistoryDictionaries.en; highlighted?: boolean }) {
  return (
    <div className={`sm:col-span-2 lg:col-span-1 xl:col-span-2 ${highlighted ? "rounded-md border border-destructive/40 bg-destructive/5 p-3" : ""}`}>
      <div className="mb-2 text-xs text-muted-foreground">{labels.dynamicFieldsLabel}</div>
      {values.length ? (
        <div className="divide-y border-y">
          {values.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 py-3 text-sm">
              <div className="text-muted-foreground">{localizedApiLabel(entry.field.localizations, locale, entry.field.key)}</div>
              <div className="text-end font-medium">{localizedFieldValue(entry, locale, labels)}</div>
            </div>
          ))}
        </div>
      ) : <span className="text-sm text-muted-foreground">{labels.noDynamicFields}</span>}
    </div>
  )
}
function PostFeatures({ features, locale, labels }: { features: NonNullable<ModerationHistoryPost["features"]>; locale: Locale; labels: typeof moderationHistoryDictionaries.en }) {
  return (
    <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
      <div className="mb-2 text-xs text-muted-foreground">{labels.featuresLabel}</div>
      {features.length ? (
        <div className="flex flex-wrap gap-2">
          {features.map(({ id, feature }) => <Badge key={id} variant="outline" className="h-9 px-3 text-sm">{localizedApiLabel(feature.localizations, locale, feature.key)}</Badge>)}
        </div>
      ) : <span className="text-sm text-muted-foreground">{labels.noFeatures}</span>}
    </div>
  )
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
function localizedFieldValue(entry: NonNullable<ModerationHistoryPost["fieldValues"]>[number], locale: Locale, labels: typeof moderationHistoryDictionaries.en) {
  const localizeSingleValue = (value: unknown): string => {
    if (typeof value === "boolean") return value ? labels.yes : labels.no
    const option = entry.field.options?.find((candidate) => String(candidate.value) === String(value))
    if (option) return localizedApiLabel(option.localizations, locale, option.value)
    if (value === null || value === undefined || value === "") return "—"
    if (typeof value === "object") {
      const parts: string[] = Object.values(value).map(localizeSingleValue).filter((part) => part !== "—")
      return parts.length ? parts.join(" – ") : "—"
    }
    return String(value)
  }
  const value = Array.isArray(entry.value)
    ? entry.value.map(localizeSingleValue).join(", ")
    : localizeSingleValue(entry.value)
  return entry.currency && value !== "—" ? `${value} ${entry.currency}` : value
}
function ModerationReasons({ value, locale, label, prominent = false }: { value: unknown; locale: "en" | "fa" | "ps"; label: string; prominent?: boolean }) {
  const reasons = readModerationReasons(value)
  return (
    <div className={prominent ? "rounded-md border border-primary/30 bg-primary/[0.045] p-4 shadow-sm" : "sm:col-span-2 lg:col-span-1 xl:col-span-2"}>
      <div className={prominent ? "mb-4 flex items-center gap-2 border-b border-primary/15 pb-3 text-base font-semibold" : "mb-2 text-xs text-muted-foreground"}>
        {prominent && <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldAlertIcon className="size-5" /></span>}
        {label}
      </div>
      {reasons.length ? (
        <div className="space-y-2">
          {reasons.map((reason, index) => {
            const definition = localizedModerationDefinition(reason, locale)
            const explanation = localizedReason(reason, locale)
            const fields = fieldsForReason(reason)
            return (
              <div key={`${reason.ruleId}:${reason.field}:${index}`} className={prominent ? "rounded-md border border-primary/20 bg-background p-4" : "rounded-md border bg-background p-3"}>
                <div className={prominent ? "text-base font-semibold text-foreground" : "font-medium"}>{definition.definition}</div>
                {explanation && <p className={prominent ? "mt-2 text-sm leading-6 text-foreground/75" : "mt-1.5 text-sm leading-6 text-muted-foreground"}>{explanation}</p>}
                {fields.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
                  {fields.map((field) => <Badge key={field} variant="outline" className="border-destructive/25 bg-destructive/5 font-normal text-destructive">{moderationFieldLabel(field, locale)}</Badge>)}
                </div>}
                {reason.evidence && <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{evidenceLabel(locale)}</summary>
                  <JsonViewer value={reason.evidence} locale={locale} className="mt-2 max-h-64" />
                </details>}
              </div>
            )
          })}
        </div>
      ) : <span>—</span>}
    </div>
  )
}
type ReadableModerationReason = ModerationDecisionReason & {
  affectedFields: string[]
  affectedImages: Array<{ imageId?: string; imageIndex?: number }>
}
function readModerationReasons(value: unknown): ReadableModerationReason[] {
  const candidates = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "reasons" in value && Array.isArray((value as { reasons?: unknown }).reasons)
      ? (value as { reasons: unknown[] }).reasons
      : []
  return candidates.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const record = item as Record<string, unknown>
    if (typeof record.ruleId !== "string" || typeof record.field !== "string") return []
    const translations = record.reasonTranslations && typeof record.reasonTranslations === "object"
      ? Object.fromEntries(Object.entries(record.reasonTranslations).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : null
    const affectedFields = Array.isArray(record.affectedFields)
      ? record.affectedFields.filter((field): field is string => typeof field === "string")
      : []
    const affectedImages = Array.isArray(record.affectedImages)
      ? record.affectedImages.flatMap((image) => {
          if (!image || typeof image !== "object") return []
          const candidate = image as Record<string, unknown>
          const imageId = typeof candidate.imageId === "string" ? candidate.imageId : undefined
          const imageIndex = typeof candidate.imageIndex === "number" ? candidate.imageIndex : undefined
          return imageId || imageIndex !== undefined ? [{ imageId, imageIndex }] : []
        })
      : []
    return [{
      ruleId: record.ruleId,
      field: record.field,
      reviewItemId: typeof record.reviewItemId === "string" ? record.reviewItemId : undefined,
      affectedFields,
      affectedImages,
      reason: typeof record.reason === "string" ? record.reason : undefined,
      reasonTranslations: translations,
      evidence: record.evidence && typeof record.evidence === "object" ? record.evidence as ModerationDecisionReason["evidence"] : null,
    }]
  })
}
function fieldsForReason(reason: ReadableModerationReason) {
  if (reason.affectedFields.length) return reason.affectedFields
  return reason.field !== "post" ? [reason.field] : []
}
function moderationFieldLabel(field: string, locale: Locale) {
  const labels: Record<string, Record<Locale, string>> = {
    post: { en: "Post", fa: "اعلان", ps: "اعلان" },
    title: { en: "Title", fa: "عنوان", ps: "سرلیک" },
    description: { en: "Description", fa: "توضیحات", ps: "تشریح" },
    images: { en: "Images", fa: "تصاویر", ps: "انځورونه" },
    fields: { en: "Post details", fa: "مشخصات اعلان", ps: "د اعلان جزئیات" },
    categories: { en: "Categories", fa: "دسته‌بندی", ps: "کټګورۍ" },
    price: { en: "Price", fa: "قیمت", ps: "بیه" },
    user_posts: { en: "Previous posts", fa: "اعلان‌های قبلی", ps: "پخواني اعلانونه" },
  }
  return labels[field]?.[locale] ?? field.replaceAll("_", " ")
}
function evidenceLabel(locale: Locale) {
  return locale === "fa" ? "مشاهده شواهد فنی" : locale === "ps" ? "تخنیکي شواهد وګورئ" : "View technical evidence"
}
function localizedReason(reason: ReadableModerationReason, locale: string) {
  const translations = reason.reasonTranslations
  const value = translations?.[locale] || (locale === "fa" ? translations?.prs : undefined) || reason.reason || ""
  return localizedGeneratedModerationReason(value, locale as Locale)
}
function Info({ label, value }: { label: string; value: unknown }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 break-words whitespace-pre-wrap">{safeJson(value)}</div></div>
}
function Summary({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: LucideIcon }) {
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>{label}</CardDescription><span className="grid size-10 place-items-center rounded-md bg-[#F5F5F5] text-primary"><Icon className="size-5" /></span></div><CardTitle className="text-3xl">{value}</CardTitle></CardHeader></Card>
}
function historyImageUrl(image: NonNullable<ModerationHistoryPost["images"]>[number]) {
  if (typeof image.medium === "string") return image.medium
  if (image.medium?.url) return image.medium.url
  if (typeof image.thumbnail === "string") return image.thumbnail
  return image.thumbnail?.url || image.url
}
