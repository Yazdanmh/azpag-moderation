import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModerationReviewDetail } from "@/lib/moderation-types"
import { StatusBadge, personName, safeJson } from "./review-badges"
import type { Locale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"
import { localizedModerationDefinition } from "@/lib/moderation-definition-i18n"

export function ReviewDetail({ review, showPost = true, locale }: { review: ModerationReviewDetail; showPost?: boolean; locale: Locale }) {
  const t = moderationHistoryDictionaries[locale]
  const copy = detailCopy[locale]
  const dateFields = [[t.queued, "queuedAt"], [t.aiStarted, "aiStartedAt"], [t.aiCompleted, "aiCompletedAt"], [t.humanQueued, "humanQueuedAt"], [t.humanShown, "humanShownAt"], [t.humanCompleted, "humanCompletedAt"], [t.decided, "decidedAt"], [t.dispatched, "decisionDispatchedAt"], [t.notified, "notificationSentAt"], [t.cancelled, "cancelledAt"]] as const
  const items = Array.isArray(review.items) ? review.items : []
  const reviewer = review.assignment?.reviewer
  const reviewerLabel = reviewer ? personName(reviewer) : t.reviewedByAi
  const reviewerEmail = reviewer?.email
  const durationRows = [
    [copy.totalDuration, review.aiStartedAt ?? review.queuedAt, review.decidedAt ?? review.cancelledAt],
    [copy.aiDuration, review.aiStartedAt, review.aiCompletedAt],
    [copy.queueWait, review.humanQueuedAt, review.humanShownAt ?? review.assignment?.firstShownAt],
    [copy.humanDuration, review.humanShownAt ?? review.assignment?.firstShownAt, review.humanCompletedAt ?? review.assignment?.completedAt],
  ] as const
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card><CardHeader><CardDescription>{t.status}</CardDescription><CardTitle><StatusBadge value={review.status} label={localizedValue(review.status, t)} /></CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>{t.decision}</CardDescription><CardTitle><StatusBadge value={review.finalDecision} label={localizedValue(review.finalDecision, t)} /></CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>{t.type}</CardDescription><CardTitle>{localizedValue(review.type, t)}</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>{t.currentRevision}</CardDescription><CardTitle>{review.postRevision.toLocaleString(locale)}</CardTitle></CardHeader></Card>
    </div>
    {showPost && review.post && <Card><CardHeader><CardTitle><Link className="hover:text-primary" href={`/panel/posts/${review.postId}`}>{review.post.title}</Link></CardTitle><CardDescription>{review.postId} · {review.post.status}</CardDescription></CardHeader><CardContent><p className="whitespace-pre-wrap">{review.post.description || t.noDescription}</p></CardContent></Card>}
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>{copy.outcomeSummary}</CardTitle><CardDescription>{copy.outcomeDescription}</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label={copy.reviewedBy} value={reviewerEmail ? `${reviewerLabel}\n${reviewerEmail}` : reviewerLabel} />
            <Detail label={copy.finishedOn} value={formatDate(review.decidedAt ?? review.assignment?.completedAt, locale)} />
          </div>
          <DecisionReasons value={review.decisionReasons} locale={locale} emptyLabel={copy.noDecisionReasons} />
          {review.failureReason && <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3"><Detail label={t.failureReason} value={review.failureReason} /></div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{copy.timeSummary}</CardTitle><CardDescription>{copy.timeDescription}</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {durationRows.map(([label, start, end]) => {
              const duration = formatDuration(start, end, locale, t)
              return duration ? <div key={label} className="rounded-md bg-muted/50 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{duration}</div></div> : null
            })}
          </div>
          <div className="divide-y">
            {dateFields.map(([label, key]) => review[key] ? <TimelineRow key={key} label={label} value={review[key]} locale={locale} /> : null)}
          </div>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>{copy.policyChecks}</CardTitle>
        <CardDescription>{items.length.toLocaleString(locale)} {copy.policyChecksDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length ? items.map((item, index) => {
          const definition = localizedModerationDefinition({ ruleId: item.ruleId, field: item.field }, locale)
          return <Card key={item.id} className="border">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardDescription>{copy.checkNumber.replace("{number}", (index + 1).toLocaleString(locale))}</CardDescription>
                  <CardTitle className="mt-1 text-base">{definition.rule}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.checkedArea}: {definition.field}</p>
                </div>
                <StatusBadge value={item.finalOutcome ?? item.status} label={localizedItemResult(item.finalOutcome, item.status, copy)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md bg-muted/50 p-4">
                <div className="text-xs text-muted-foreground">{copy.conclusion}</div>
                <p className="mt-1 font-medium">{item.finalReason || localizedItemExplanation(item.finalOutcome, copy)}</p>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-medium">{copy.reviewHistory}</h4>
                {item.evaluations?.length ? <div className="space-y-3">
                  {item.evaluations.map((evaluation) => <div key={evaluation.id} className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{localizedActor(evaluation.evaluator, copy)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{evaluation.reason || localizedItemExplanation(evaluation.outcome, copy)}</p>
                    </div>
                    <div className="shrink-0 text-start sm:text-end">
                      <StatusBadge value={evaluation.outcome} label={localizedItemResult(evaluation.outcome, null, copy)} />
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(evaluation.createdAt, locale)}</p>
                    </div>
                  </div>)}
                </div> : <p className="text-sm text-muted-foreground">{copy.noReviewHistory}</p>}
              </div>
              {item.isQualitySample && <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">{copy.qualityCheck}</p>
                <p className="mt-1 text-muted-foreground">{item.qualityAgreement === true ? copy.qualityAgreed : item.qualityAgreement === false ? copy.qualityDisagreed : copy.qualityPending}</p>
              </div>}
              <details className="group text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{copy.technicalDetails}</summary>
                <div className="mt-4 space-y-4">
                  <JsonBlock title={t.itemEvidence} value={item.evidence} />
                  {item.evaluations?.map((evaluation) => <div key={`${evaluation.id}-raw`} className="grid gap-4 lg:grid-cols-2"><JsonBlock title={`${localizedActor(evaluation.evaluator, copy)} — ${t.evidence}`} value={evaluation.evidence} /><JsonBlock title={`${localizedActor(evaluation.evaluator, copy)} — ${t.rawResponse}`} value={evaluation.rawResponse} /></div>)}
                </div>
              </details>
            </CardContent>
          </Card>
        }) : <p className="text-muted-foreground">{t.noItems}</p>}
      </CardContent>
    </Card>
    <Card><CardHeader><CardTitle>{t.snapshot}</CardTitle><CardDescription>{t.snapshotDescription}</CardDescription></CardHeader><CardContent><pre className="max-h-[36rem] overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">{safeJson(review.postSnapshot)}</pre></CardContent></Card>
  </div>
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return <div className="min-w-0"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 break-words whitespace-pre-wrap">{safeJson(value)}</div></div>
}
function JsonBlock({ title, value }: { title: string; value: unknown }) {
  if (value === null || value === undefined) return null
  return <div><h4 className="mb-2 text-sm font-medium">{title}</h4><pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">{safeJson(value)}</pre></div>
}
function localizedValue(value: string | null | undefined, t: typeof moderationHistoryDictionaries.en) {
  if (!value) return t.noData
  const labels: Record<string, string> = {
    QUEUED: t.queuedStatus, AI_REVIEWING: t.aiReviewing, HUMAN_REVIEW_QUEUED: t.humanReviewQueued,
    HUMAN_REVIEWING: t.humanReviewing, DECIDED: t.decidedStatus, CANCELLED: t.cancelledStatus,
    FAILED: t.failedStatus, STANDARD: t.standard, QUALITY_SAMPLE: t.qualitySampleType,
    PUBLISH: t.publishDecision, REJECT: t.rejectDecision, NEEDS_CHANGES: t.needsChanges,
  }
  return labels[value] ?? value.replaceAll("_", " ").toLocaleLowerCase()
}

type DetailCopy = (typeof detailCopy)[Locale]

function localizedItemResult(outcome: string | null | undefined, status: string | null | undefined, copy: DetailCopy) {
  if (outcome === "VIOLATION") return copy.problemFound
  if (outcome === "NO_VIOLATION") return copy.noProblemFound
  if (outcome === "UNCERTAIN") return copy.needsHumanCheck
  if (status === "PENDING") return copy.awaitingReview
  return copy.reviewed
}

function localizedItemExplanation(outcome: string | null | undefined, copy: DetailCopy) {
  if (outcome === "VIOLATION") return copy.problemExplanation
  if (outcome === "NO_VIOLATION") return copy.noProblemExplanation
  if (outcome === "UNCERTAIN") return copy.uncertainExplanation
  return copy.noConclusion
}

function localizedActor(actor: string, copy: DetailCopy) {
  if (actor === "HUMAN") return copy.humanReviewer
  if (actor === "AI") return copy.aiReviewer
  if (actor === "SYSTEM") return copy.automaticCheck
  return copy.reviewerLabel
}

function formatDuration(start: string | null | undefined, end: string | null | undefined, locale: Locale, t: typeof moderationHistoryDictionaries.en) {
  if (!start || !end) return null
  const milliseconds = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return null
  const seconds = Math.round(milliseconds / 1000)
  if (seconds < 60) return `${Math.max(1, seconds).toLocaleString(locale)} ${t.seconds}`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes.toLocaleString(locale)} ${t.minutes}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours.toLocaleString(locale)} ${t.hours}`
  return `${Math.round(hours / 24).toLocaleString(locale)} ${t.days}`
}

function TimelineRow({ label, value, locale }: { label: string; value: string; locale: Locale }) {
  return <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <time className="text-sm font-medium" dateTime={value}>{formatDate(value, locale)}</time>
  </div>
}

function DecisionReasons({ value, locale, emptyLabel }: { value: unknown; locale: Locale; emptyLabel: string }) {
  const reasons = Array.isArray(value) ? value : []
  if (!reasons.length) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return <div className="space-y-2">
    {reasons.map((entry, index) => {
      const reason = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {}
      const ruleId = typeof reason.ruleId === "string" ? reason.ruleId : ""
      const field = typeof reason.field === "string" ? reason.field : ""
      const label = ruleId || field ? localizedModerationDefinition({ ruleId, field }, locale).definition : emptyLabel
      const translations = typeof reason.reasonTranslations === "object" && reason.reasonTranslations !== null ? reason.reasonTranslations as Record<string, unknown> : {}
      const translatedReason = translations[locale] ?? (locale === "fa" ? translations.prs : undefined) ?? reason.reason
      return <div key={`${ruleId}-${field}-${index}`} className="rounded-md border p-3">
        <p className="font-medium">{label}</p>
        {typeof translatedReason === "string" && translatedReason && <p className="mt-1 text-sm text-muted-foreground">{translatedReason}</p>}
      </div>
    })}
  </div>
}

const detailCopy = {
  en: {
    outcomeSummary: "Review result", outcomeDescription: "A clear summary of who reviewed the post and why the decision was made.",
    reviewedBy: "Reviewed by", finishedOn: "Review completed", noDecisionReasons: "No policy problems were found.",
    timeSummary: "Review timing", timeDescription: "How long the review took and when each step happened.",
    totalDuration: "Total review time", aiDuration: "AI review time", queueWait: "Wait for a reviewer", humanDuration: "Reviewer work time",
    policyChecks: "Policy checks", policyChecksDescription: "rules checked for this post",
    checkNumber: "Check {number}", checkedArea: "Part of the post checked", conclusion: "What was concluded",
    reviewHistory: "How this was reviewed", noReviewHistory: "No review result was recorded.",
    problemFound: "Problem found", noProblemFound: "No problem found", needsHumanCheck: "Needed human review",
    awaitingReview: "Waiting for review", reviewed: "Reviewed", problemExplanation: "This part of the post did not meet the policy.",
    noProblemExplanation: "This part of the post meets the policy.", uncertainExplanation: "The automatic check could not make a reliable decision.",
    noConclusion: "No final conclusion was recorded.", humanReviewer: "Human reviewer", aiReviewer: "AI review",
    automaticCheck: "Automatic system check", reviewerLabel: "Reviewer", qualityCheck: "Quality check",
    qualityAgreed: "The independent quality check agreed with the original result.",
    qualityDisagreed: "The independent quality check found a different result.", qualityPending: "The quality check is not completed yet.",
    technicalDetails: "Show technical details",
  },
  fa: {
    outcomeSummary: "نتیجه بررسی", outcomeDescription: "خلاصه روشن از بررسی‌کننده آگهی و دلیل تصمیم نهایی.",
    reviewedBy: "بررسی‌شده توسط", finishedOn: "زمان تکمیل بررسی", noDecisionReasons: "هیچ مشکل مربوط به قوانین یافت نشد.",
    timeSummary: "زمان‌بندی بررسی", timeDescription: "مدت بررسی و زمان انجام هر مرحله.",
    totalDuration: "مدت کل بررسی", aiDuration: "مدت بررسی هوش مصنوعی", queueWait: "مدت انتظار برای بررسی‌کننده", humanDuration: "مدت کار بررسی‌کننده",
    policyChecks: "بررسی قوانین", policyChecksDescription: "قانون برای این آگهی بررسی شده است",
    checkNumber: "بررسی {number}", checkedArea: "بخش بررسی‌شده آگهی", conclusion: "نتیجه بررسی",
    reviewHistory: "نحوه انجام بررسی", noReviewHistory: "نتیجه‌ای برای این بررسی ثبت نشده است.",
    problemFound: "مشکل یافت شد", noProblemFound: "مشکلی یافت نشد", needsHumanCheck: "نیازمند بررسی انسانی",
    awaitingReview: "در انتظار بررسی", reviewed: "بررسی‌شده", problemExplanation: "این بخش آگهی با قوانین مطابقت ندارد.",
    noProblemExplanation: "این بخش آگهی با قوانین مطابقت دارد.", uncertainExplanation: "بررسی خودکار نتوانست تصمیم مطمئنی بگیرد.",
    noConclusion: "نتیجه نهایی ثبت نشده است.", humanReviewer: "بررسی‌کننده انسانی", aiReviewer: "بررسی هوش مصنوعی",
    automaticCheck: "بررسی خودکار سیستم", reviewerLabel: "بررسی‌کننده", qualityCheck: "بررسی کیفیت",
    qualityAgreed: "بررسی مستقل کیفیت با نتیجه اصلی موافق بود.",
    qualityDisagreed: "بررسی مستقل کیفیت نتیجه متفاوتی داشت.", qualityPending: "بررسی کیفیت هنوز تکمیل نشده است.",
    technicalDetails: "نمایش جزئیات فنی",
  },
  ps: {
    outcomeSummary: "د بیاکتنې پایله", outcomeDescription: "چا اعلان بیاکتلی او وروستۍ پرېکړه ولې شوې، روښانه لنډیز.",
    reviewedBy: "بیاکتل شوی له خوا", finishedOn: "د بیاکتنې د بشپړېدو وخت", noDecisionReasons: "د تګلارو کومه ستونزه ونه موندل شوه.",
    timeSummary: "د بیاکتنې وخت", timeDescription: "بیاکتنې څومره وخت ونیو او هر پړاو کله ترسره شو.",
    totalDuration: "د بیاکتنې ټول وخت", aiDuration: "د مصنوعي ځیرکتیا وخت", queueWait: "بیاکتونکي ته د انتظار وخت", humanDuration: "د بیاکتونکي د کار وخت",
    policyChecks: "د تګلارو ارزونې", policyChecksDescription: "تګلارې د دې اعلان لپاره ارزول شوې دي",
    checkNumber: "ارزونه {number}", checkedArea: "د اعلان ارزول شوې برخه", conclusion: "د ارزونې پایله",
    reviewHistory: "بیاکتنه څنګه ترسره شوه", noReviewHistory: "د دې ارزونې پایله نه ده ثبت شوې.",
    problemFound: "ستونزه وموندل شوه", noProblemFound: "ستونزه ونه موندل شوه", needsHumanCheck: "انساني بیاکتنې ته اړتیا وه",
    awaitingReview: "بیاکتنې ته په تمه", reviewed: "بیاکتل شوی", problemExplanation: "د اعلان دا برخه له تګلارې سره برابره نه وه.",
    noProblemExplanation: "د اعلان دا برخه له تګلارې سره برابره ده.", uncertainExplanation: "اتومات ارزونې ډاډمنه پرېکړه ونه شوای کړای.",
    noConclusion: "وروستۍ پایله نه ده ثبت شوې.", humanReviewer: "انساني بیاکتونکی", aiReviewer: "د مصنوعي ځیرکتیا بیاکتنه",
    automaticCheck: "د سیسټم اتومات ارزونه", reviewerLabel: "بیاکتونکی", qualityCheck: "د کیفیت ارزونه",
    qualityAgreed: "خپلواکه کیفیتي ارزونه له اصلي پایلې سره موافقه وه.",
    qualityDisagreed: "خپلواکې کیفیتي ارزونې بله پایله وموندله.", qualityPending: "د کیفیت ارزونه لا بشپړه شوې نه ده.",
    technicalDetails: "تخنیکي جزئیات ښکاره کړئ",
  },
} satisfies Record<Locale, Record<string, string>>

function formatDate(value: string | null | undefined, locale: Locale) {
  return value ? new Date(value).toLocaleString(locale) : "—"
}
