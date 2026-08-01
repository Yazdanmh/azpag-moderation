"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, RefreshCwIcon, ShieldAlertIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { acknowledgeReviewShown, loadNextReview, submitEvaluation } from "@/app/panel/moderation-actions"
import { useI18n } from "@/components/providers/app-providers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { moderationDictionaries } from "@/lib/moderation/i18n"
import { localizedModerationDefinition } from "@/lib/moderation/definition-i18n"
import type { ApiResult, HumanReviewOutcome, ModerationPostSnapshot, ModerationReview, ModerationReviewField, ModerationReviewItem } from "@/lib/moderation/types"
import { ModerationLoading, ResultState } from "./shared"

function safeText(value: unknown, empty: string) {
  if (value === null || value === undefined || value === "") return empty
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  try { return JSON.stringify(value, null, 2) } catch { return empty }
}

function nestedValue(source: unknown, path: string) {
  if (!source || typeof source !== "object") return undefined
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
    return (value as Record<string, unknown>)[key]
  }, source)
}

function relevantValue(post: ModerationPostSnapshot, field: string) {
  const normalized = field.trim()
  const direct = nestedValue(post, normalized)
  if (direct !== undefined) return direct
  const dynamic = post.fields && typeof post.fields === "object"
    ? nestedValue(post.fields, normalized.replace(/^fields\./, ""))
    : undefined
  if (dynamic !== undefined) return dynamic
  const aliases: Record<string, unknown> = {
    category: post.categories,
    image: post.images,
    location: post.address,
    author: post.author,
  }
  return aliases[normalized.toLowerCase()]
}

function orderedItems(items: ModerationReviewItem[] | undefined) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => a.sequence - b.sequence)
}

function firstReviewItem(review: ModerationReview | null | undefined) {
  return orderedItems(review?.items)[0] ?? null
}

function visibleReviewFields(item: ModerationReviewItem): ModerationReviewField[] {
  const supported = new Set<ModerationReviewField>(["title", "description", "images", "fields", "categories", "price", "user_posts"])
  const scoped = Array.isArray(item.reviewScope?.fields)
    ? item.reviewScope.fields.filter((field): field is ModerationReviewField => supported.has(field))
    : []
  if (item.reviewScope?.includesImages && !scoped.includes("images")) scoped.push("images")
  if (item.reviewScope?.includesDynamicFields && !scoped.includes("fields")) scoped.push("fields")
  if (item.reviewScope?.requiresPreviousPostComparison && !scoped.includes("user_posts")) scoped.push("user_posts")
  if (scoped.length) return scoped
  if (supported.has(item.field as ModerationReviewField)) return [item.field as ModerationReviewField]
  return ["title", "description", "images", "fields"]
}

function fieldLabel(field: ModerationReviewField, locale: "en" | "fa" | "ps") {
  return localizedModerationDefinition({ ruleId: "", field }, locale).field
}

function localizedRuleDescription(
  description: ModerationReviewItem["ruleDescription"],
  locale: "en" | "fa" | "ps",
) {
  if (typeof description === "string") return description
  if (!description || typeof description !== "object") return ""
  return description[locale] || description.en || description.fa || description.ps || ""
}

function confirmationCopy(locale: "en" | "fa" | "ps") {
  return {
    en: { title: "Confirm policy violation", cancel: "Cancel", confirm: "Confirm violation" },
    fa: { title: "تأیید نقض قانون", cancel: "انصراف", confirm: "تأیید نقض" },
    ps: { title: "د سرغړونې تایید", cancel: "لغوه کول", confirm: "سرغړونه تایید کړئ" },
  }[locale]
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-md border border-primary/25 bg-primary/[0.035] p-4">
    <h3 className="mb-3 text-sm font-medium text-primary">{title}</h3>
    {children}
  </section>
}

function localizedApiText(
  translations: unknown,
  locale: "en" | "fa" | "ps",
  fallback: string,
) {
  if (!Array.isArray(translations)) return fallback
  const aliases = locale === "fa" ? ["fa", "prs", "dari"] : [locale]
  for (const language of aliases) {
    const match = translations.find((entry) =>
      entry && typeof entry === "object" &&
      String((entry as Record<string, unknown>).language).toLocaleLowerCase() === language,
    ) as Record<string, unknown> | undefined
    if (typeof match?.value === "string" && match.value.trim()) return match.value
  }
  return fallback
}

function snapshotFieldDisplay(
  key: string,
  raw: unknown,
  locale: "en" | "fa" | "ps",
  empty: string,
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { label: key.replaceAll("_", " "), value: safeText(raw, empty), order: Number.MAX_SAFE_INTEGER }
  }
  const field = raw as Record<string, unknown>
  const label = localizedApiText(field.translations, locale, key.replaceAll("_", " "))
  const selectedOption = Array.isArray(field.options)
    ? field.options.find((option) => option && typeof option === "object" && (
        (option as Record<string, unknown>).selected === true ||
        String((option as Record<string, unknown>).value) === String(field.value)
      )) as Record<string, unknown> | undefined
    : undefined
  const optionValue = selectedOption
    ? localizedApiText(selectedOption.translations, locale, String(selectedOption.value ?? field.value ?? empty))
    : null
  const baseValue = optionValue ?? safeText(field.value, empty)
  const currency = typeof field.currency === "string" && field.currency.trim() ? field.currency : ""
  return {
    label,
    value: currency && baseValue !== empty ? `${baseValue} ${currency}` : baseValue,
    order: typeof field.order === "number" ? field.order : Number.MAX_SAFE_INTEGER,
  }
}

function localizedCategory(
  category: ModerationPostSnapshot["categories"][number],
  locale: "en" | "fa" | "ps",
) {
  return localizedApiText(category.translations, locale, category.name)
}

function ScopedReviewContent({
  post,
  item,
  locale,
  empty,
}: {
  post: ModerationPostSnapshot
  item: ModerationReviewItem
  locale: "en" | "fa" | "ps"
  empty: string
}) {
  const sections = visibleReviewFields(item)
  return <div className="space-y-4">
    {sections.map((field) => {
      if (field === "images") {
        const images = Array.isArray(post.images) ? post.images : []
        return <ReviewSection key={field} title={fieldLabel(field, locale)}>
          {images.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => <a key={image.id ?? `${image.url}-${index}`} href={image.url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={`${post.title} ${index + 1}`} className="size-full object-cover" />
            </a>)}
          </div> : <p className="text-sm text-muted-foreground">{empty}</p>}
        </ReviewSection>
      }
      if (field === "fields") {
        const entries = post.fields && typeof post.fields === "object"
          ? Object.entries(post.fields)
              .map(([key, value]) => snapshotFieldDisplay(key, value, locale, empty))
              .sort((a, b) => a.order - b.order)
          : []
        return <ReviewSection key={field} title={fieldLabel(field, locale)}>
          {entries.length ? <div className="divide-y border-y">
            {entries.map((entry, index) => <div key={`${entry.label}-${index}`} className="grid grid-cols-2 gap-4 py-3 text-sm">
              <span className="text-muted-foreground">{entry.label}</span>
              <span className="text-end font-medium break-words">{entry.value}</span>
            </div>)}
          </div> : <p className="text-sm text-muted-foreground">{empty}</p>}
        </ReviewSection>
      }
      if (field === "categories") {
        return <ReviewSection key={field} title={fieldLabel(field, locale)}>
          {post.categories?.length ? <div className="flex flex-wrap gap-2">{post.categories.map((category) => <Badge key={category.id} variant="secondary">{localizedCategory(category, locale)}</Badge>)}</div> : <p className="text-sm text-muted-foreground">{empty}</p>}
        </ReviewSection>
      }
      if (field === "price") {
        const price = post.price?.value
        return <ReviewSection key={field} title={fieldLabel(field, locale)}>
          <p className="font-medium">{price === null || price === undefined ? empty : `${price.toLocaleString(locale)} ${post.price?.currency ?? ""}`}</p>
        </ReviewSection>
      }
      if (field === "user_posts") {
        const posts = Array.isArray(post.userPosts) ? post.userPosts : []
        return <ReviewSection key={field} title={fieldLabel(field, locale)}>
          {posts.length ? <div className="grid gap-3 sm:grid-cols-2">
            {posts.map((previousPost) => <div key={previousPost.id} className="rounded-md border bg-background p-3">
              <p className="font-medium">{previousPost.title}</p>
              {previousPost.description && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{previousPost.description}</p>}
              {previousPost.price?.value !== null && previousPost.price?.value !== undefined && <p className="mt-2 text-sm font-medium">{previousPost.price.value.toLocaleString(locale)} {previousPost.price.currency ?? ""}</p>}
            </div>)}
          </div> : <p className="text-sm text-muted-foreground">{empty}</p>}
        </ReviewSection>
      }
      return <ReviewSection key={field} title={fieldLabel(field, locale)}>
        <p className="break-words whitespace-pre-wrap">{safeText(relevantValue(post, field), empty)}</p>
      </ReviewSection>
    })}
  </div>
}

export function ReviewWorkspace({ initial }: { initial: ApiResult<ModerationReview | null> }) {
  const router = useRouter()
  const { locale } = useI18n()
  const t = moderationDictionaries[locale]
  const [result, setResult] = React.useState(initial)
  const [currentItem, setCurrentItem] = React.useState(
    initial.ok ? firstReviewItem(initial.data) : null,
  )
  const [outcome, setOutcome] = React.useState<HumanReviewOutcome | null>(null)
  const [reason, setReason] = React.useState("")
  const [confirmViolationOpen, setConfirmViolationOpen] = React.useState(false)
  const [acknowledgement, setAcknowledgement] = React.useState<
    { status: "idle" | "pending" | "acknowledged" | "failed" | "expired"; expiresAt: string | null }
  >({ status: "idle", expiresAt: initial.ok && initial.data ? initial.data.leaseExpiresAt : null })
  const [pending, startTransition] = React.useTransition()
  const acknowledgedReviewId = React.useRef<string | null>(null)

  const messageFor = React.useCallback((status: number, message: string) => {
    if (status === 401) return t.sessionExpired
    if (status === 403) return t.forbidden
    if (status === 429) return t.rateLimited
    if (status >= 500) return t.serviceError
    return message
  }, [t])

  const refresh = React.useCallback(() => {
    acknowledgedReviewId.current = null
    setAcknowledgement({ status: "idle", expiresAt: null })
    startTransition(async () => {
      const next = await loadNextReview()
      if (!next.ok && next.status === 401) return router.replace("/login")
      setResult(next)
      setCurrentItem(next.ok ? firstReviewItem(next.data) : null)
      setOutcome(null)
      setReason("")
    })
  }, [router])

  const acknowledge = React.useCallback(async (reviewId: string) => {
    setAcknowledgement((current) => ({ status: "pending", expiresAt: current.expiresAt }))
    const response = await acknowledgeReviewShown(reviewId)
    if (!response.ok) {
      if (response.status === 401) {
        router.replace("/login")
        return
      }
      acknowledgedReviewId.current = null
      setAcknowledgement((current) => ({ status: "failed", expiresAt: current.expiresAt }))
      toast.error(t.acknowledgementFailed, {
        description: messageFor(response.status, response.message) || t.acknowledgementFailedDescription,
      })
      return
    }
    setAcknowledgement({ status: "acknowledged", expiresAt: response.data.expiresAt })
  }, [messageFor, router, t])

  React.useEffect(() => {
    const reviewId = result.ok ? result.data?.id : undefined
    if (!reviewId || !currentItem || acknowledgedReviewId.current === reviewId) return
    acknowledgedReviewId.current = reviewId
    void acknowledge(reviewId)
  }, [acknowledge, currentItem, result])

  React.useEffect(() => {
    if (acknowledgement.status !== "acknowledged" || !acknowledgement.expiresAt) return
    const expiresAt = Date.parse(acknowledgement.expiresAt)
    if (!Number.isFinite(expiresAt)) return
    const markExpired = () => {
      if (Date.now() >= expiresAt) {
        acknowledgedReviewId.current = null
        setAcknowledgement({ status: "expired", expiresAt: acknowledgement.expiresAt })
      }
    }
    markExpired()
    const timer = window.setInterval(markExpired, 1000)
    return () => window.clearInterval(timer)
  }, [acknowledgement])

  function submit() {
    if (!result.ok || !result.data || !currentItem || !outcome) return
    if (acknowledgement.status !== "acknowledged") return
    if (currentItem.requiresReason && !reason.trim()) return
    if (outcome === "VIOLATION") {
      setConfirmViolationOpen(true)
      return
    }
    submitCurrentEvaluation()
  }

  function submitCurrentEvaluation() {
    if (!result.ok || !result.data || !currentItem || !outcome) return
    if (acknowledgement.status !== "acknowledged") return
    if (currentItem.requiresReason && !reason.trim()) return
    setConfirmViolationOpen(false)
    startTransition(async () => {
      const response = await submitEvaluation({
        reviewId: result.data!.id,
        itemId: currentItem.id,
        outcome,
        reason: reason.trim() || `Human reviewer selected ${outcome}.`,
      })
      if (!response.ok) {
        if (response.status === 401) return router.replace("/login")
        toast.error(t.evaluationFailed, { description: messageFor(response.status, response.message) })
        if (response.status === 404 || response.status === 409) refresh()
        return
      }
      if (response.data.completed) {
        toast.success(t.reviewCompleted, { description: t.loadingNext })
        refresh()
      } else {
        // Re-acknowledge after the next item is painted so the client receives
        // the lease expiry that was extended by the successful submission.
        acknowledgedReviewId.current = null
        setAcknowledgement({ status: "idle", expiresAt: null })
        setCurrentItem(response.data.item)
        setOutcome(null)
        setReason("")
        toast.success(t.evaluationSaved, { description: t.continueNext })
      }
    })
  }

  if (pending && (!result.ok || !result.data)) return <ModerationLoading />
  if (!result.ok) return <ResultState title={t.unableReviews} description={messageFor(result.status, result.message)} retry={refresh} retryLabel={t.retry} fill />
  if (!result.data) return <ResultState title={t.noReviews} description={t.noReviewsDescription} retry={refresh} retryLabel={t.retry} fill />

  const { post } = result.data
  const items = orderedItems(result.data.items)
  const itemIndex = Math.max(0, items.findIndex((item) => item.id === currentItem?.id))
  const canSubmit = acknowledgement.status === "acknowledged"
  const currentDefinition = currentItem
    ? localizedModerationDefinition({ ruleId: currentItem.ruleId, field: currentItem.field }, locale)
    : null
  const ruleDescription = localizedRuleDescription(currentItem?.ruleDescription, locale)
  const confirmCopy = confirmationCopy(locale)

  return (
    <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <CardDescription>{t.reviewContextDescription}</CardDescription>
            </div>
            <Button variant="outline" onClick={refresh} disabled={pending}><RefreshCwIcon />{t.refresh}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentItem
            ? <ScopedReviewContent post={post} item={currentItem} locale={locale} empty={t.noRelevantValue} />
            : <p className="text-sm text-muted-foreground">{t.noActionableItems}</p>}
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-5">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline">{itemIndex + 1} {t.of} {items.length}</Badge>
            <span className="text-xs text-muted-foreground">{t.reviewProgress}</span>
          </div>
          <CardTitle className="mt-3">{t.reviewQuestion}</CardTitle>
          <CardDescription>
            {currentDefinition?.rule ?? currentItem?.ruleName}
            {ruleDescription && <span className="mt-1 block">{ruleDescription}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentItem ? (
            <>
              {acknowledgement.status === "failed" && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">{t.acknowledgementFailed}</p>
                  <p className="mt-1 text-muted-foreground">{t.acknowledgementFailedDescription}</p>
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => acknowledge(result.data!.id)}>
                    <RefreshCwIcon />{t.retry}
                  </Button>
                </div>
              )}
              {acknowledgement.status === "expired" && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">{t.leaseExpired}</p>
                  <Button className="mt-3" size="sm" variant="outline" onClick={refresh}>
                    <RefreshCwIcon />{t.refresh}
                  </Button>
                </div>
              )}
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${items.length ? ((itemIndex + 1) / items.length) * 100 : 0}%` }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <Button disabled={!canSubmit || pending} variant={outcome === "VIOLATION" ? "default" : "outline"} onClick={() => setOutcome("VIOLATION")}><CheckIcon />{t.yes}</Button>
                <Button disabled={!canSubmit || pending} variant={outcome === "NO_VIOLATION" ? "default" : "outline"} onClick={() => setOutcome("NO_VIOLATION")}><XIcon />{t.no}</Button>
              </div>
              {currentItem.requiresReason && (
                <div className="space-y-2">
                  <Label htmlFor="reason">{t.reason}</Label>
                  <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 1000))} placeholder={t.reasonPlaceholder} className="min-h-28 w-full resize-y rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" disabled={pending} required />
                  <div className="text-end text-xs text-muted-foreground">{reason.length}/1000</div>
                </div>
              )}
              <Button className="w-full" onClick={submit} disabled={!canSubmit || pending || !outcome || Boolean(currentItem.requiresReason && !reason.trim())}>
                {acknowledgement.status === "pending" || acknowledgement.status === "idle" ? t.acknowledgingReview : pending ? t.submitting : t.submit}
              </Button>
            </>
          ) : <p className="text-muted-foreground">{t.noActionableItems}</p>}
        </CardContent>
      </Card>
      <Dialog open={confirmViolationOpen} onOpenChange={(open) => !pending && setConfirmViolationOpen(open)}>
        <DialogContent className="max-w-md" showCloseButton={!pending}>
          <DialogHeader className="pe-0 text-center sm:items-center">
            <span className="mx-auto mb-2 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlertIcon className="size-7" />
            </span>
            <DialogTitle>{confirmCopy.title}</DialogTitle>
            <DialogDescription className="text-center leading-6">{t.confirmViolation}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="outline" onClick={() => setConfirmViolationOpen(false)} disabled={pending}>{confirmCopy.cancel}</Button>
            <Button type="button" variant="destructive" onClick={submitCurrentEvaluation} disabled={pending}>
              {pending ? t.submitting : confirmCopy.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
