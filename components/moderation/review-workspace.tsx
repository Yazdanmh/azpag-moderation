"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { loadNextReview, submitEvaluation } from "@/app/panel/moderation-actions"
import { useI18n } from "@/components/providers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { moderationDictionaries } from "@/lib/moderation-i18n"
import type { ApiResult, HumanReviewOutcome, ModerationPostSnapshot, ModerationReview } from "@/lib/moderation-types"
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

function isImageField(field: string) {
  return /image|photo|picture|gallery|thumbnail/i.test(field)
}

export function ReviewWorkspace({ initial }: { initial: ApiResult<ModerationReview | null> }) {
  const router = useRouter()
  const { locale } = useI18n()
  const t = moderationDictionaries[locale]
  const [result, setResult] = React.useState(initial)
  const [currentItem, setCurrentItem] = React.useState(
    initial.ok && initial.data ? initial.data.items?.[0] ?? null : null,
  )
  const [outcome, setOutcome] = React.useState<HumanReviewOutcome | null>(null)
  const [reason, setReason] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const messageFor = React.useCallback((status: number, message: string) => {
    if (status === 401) return t.sessionExpired
    if (status === 403) return t.forbidden
    if (status === 429) return t.rateLimited
    if (status >= 500) return t.serviceError
    return message
  }, [t])

  const refresh = React.useCallback(() => {
    startTransition(async () => {
      const next = await loadNextReview()
      if (!next.ok && next.status === 401) return router.replace("/login")
      setResult(next)
      setCurrentItem(next.ok && next.data ? next.data.items?.[0] ?? null : null)
      setOutcome(null)
      setReason("")
    })
  }, [router])

  function submit() {
    if (!result.ok || !result.data || !currentItem || !outcome) return
    if (currentItem.requiresReason && !reason.trim()) return
    if (outcome === "VIOLATION" && !window.confirm(t.confirmViolation)) return
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
        setCurrentItem(response.data.item)
        setOutcome(null)
        setReason("")
        toast.success(t.evaluationSaved, { description: t.continueNext })
      }
    })
  }

  if (pending && (!result.ok || !result.data)) return <ModerationLoading />
  if (!result.ok) return <ResultState title={t.unableReviews} description={messageFor(result.status, result.message)} retry={refresh} retryLabel={t.retry} />
  if (!result.data) return <ResultState title={t.noReviews} description={t.noReviewsDescription} retry={refresh} retryLabel={t.retry} fill />

  const { post } = result.data
  const items = Array.isArray(result.data.items) ? result.data.items : []
  const images = Array.isArray(post.images) ? post.images : []
  const itemIndex = Math.max(0, items.findIndex((item) => item.id === currentItem?.id))
  const relevant = currentItem ? relevantValue(post, currentItem.field) : undefined
  const displayedImages = currentItem && isImageField(currentItem.field) ? images : images.slice(0, 1)

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
          {displayedImages.length > 0 && (
            <div className={displayedImages.length > 1 ? "grid grid-cols-2 gap-3 sm:grid-cols-3" : "max-w-xl"}>
              {displayedImages.map((image, index) => (
                <a key={image.id ?? `${image.url}-${index}`} href={image.url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={`${post.title} ${index + 1}`} className="size-full object-cover" />
                </a>
              ))}
            </div>
          )}
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">{t.relevantContent}</div>
            <div className="rounded-md border border-primary/25 bg-primary/[0.035] p-4">
              <div className="mb-2 text-xs font-medium text-primary">{currentItem?.field}</div>
              {isImageField(currentItem?.field ?? "") ? (
                <p className="text-sm text-muted-foreground">{t.reviewImagesAbove}</p>
              ) : (
                <p className="break-words whitespace-pre-wrap">{safeText(relevant, t.noRelevantValue)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-5">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline">{itemIndex + 1} {t.of} {items.length}</Badge>
            <span className="text-xs text-muted-foreground">{t.reviewProgress}</span>
          </div>
          <CardTitle className="mt-3">{t.reviewQuestion}</CardTitle>
          <CardDescription>{currentItem?.ruleName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentItem ? (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${items.length ? ((itemIndex + 1) / items.length) * 100 : 0}%` }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant={outcome === "VIOLATION" ? "default" : "outline"} onClick={() => setOutcome("VIOLATION")}><CheckIcon />{t.yes}</Button>
                <Button variant={outcome === "NO_VIOLATION" ? "default" : "outline"} onClick={() => setOutcome("NO_VIOLATION")}><XIcon />{t.no}</Button>
              </div>
              {currentItem.requiresReason && (
                <div className="space-y-2">
                  <Label htmlFor="reason">{t.reason}</Label>
                  <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 1000))} placeholder={t.reasonPlaceholder} className="min-h-28 w-full resize-y rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" disabled={pending} required />
                  <div className="text-end text-xs text-muted-foreground">{reason.length}/1000</div>
                </div>
              )}
              <Button className="w-full" onClick={submit} disabled={pending || !outcome || Boolean(currentItem.requiresReason && !reason.trim())}>{pending ? t.submitting : t.submit}</Button>
            </>
          ) : <p className="text-muted-foreground">{t.noActionableItems}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
