import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModerationReviewDetail } from "@/lib/moderation-types"
import { StatusBadge, personName, safeJson } from "./review-badges"
import type { Locale } from "@/lib/i18n"
import { moderationHistoryDictionaries } from "@/lib/moderation-history-i18n"

export function ReviewDetail({ review, showPost = true, locale }: { review: ModerationReviewDetail; showPost?: boolean; locale: Locale }) {
  const t = moderationHistoryDictionaries[locale]
  const dateFields = [[t.queued, "queuedAt"], [t.aiStarted, "aiStartedAt"], [t.aiCompleted, "aiCompletedAt"], [t.humanQueued, "humanQueuedAt"], [t.humanShown, "humanShownAt"], [t.humanCompleted, "humanCompletedAt"], [t.decided, "decidedAt"], [t.dispatched, "decisionDispatchedAt"], [t.notified, "notificationSentAt"], [t.cancelled, "cancelledAt"]] as const
  const items = Array.isArray(review.items) ? review.items : []
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card><CardHeader><CardDescription>{t.status}</CardDescription><CardTitle><StatusBadge value={review.status} /></CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>{t.decision}</CardDescription><CardTitle><StatusBadge value={review.finalDecision} /></CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>{t.type}</CardDescription><CardTitle>{review.type?.replaceAll("_", " ")}</CardTitle></CardHeader></Card>
      <Card><CardHeader><CardDescription>{t.revision}</CardDescription><CardTitle>{review.postRevision}</CardTitle></CardHeader></Card>
    </div>
    {showPost && review.post && <Card><CardHeader><CardTitle><Link className="hover:text-primary" href={`/panel/posts/${review.postId}`}>{review.post.title}</Link></CardTitle><CardDescription>{review.postId} · {review.post.status}</CardDescription></CardHeader><CardContent><p className="whitespace-pre-wrap">{review.post.description || t.noDescription}</p></CardContent></Card>}
    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>{t.decisionAssignment}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Detail label={t.decisionReasons} value={review.decisionReasons} /><Detail label={t.failureReason} value={review.failureReason} /><Detail label={t.attempts} value={review.attemptCount} /><Detail label={t.reviewer} value={personName(review.assignment?.reviewer)} /><Detail label={t.reviewerId} value={review.assignment?.reviewerId} /><Detail label={t.assigned} value={formatDate(review.assignment?.assignedAt, locale)} /><Detail label={t.firstShown} value={formatDate(review.assignment?.firstShownAt, locale)} /><Detail label={t.assignmentCompleted} value={formatDate(review.assignment?.completedAt, locale)} /></CardContent></Card>
      <Card><CardHeader><CardTitle>{t.timeline}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">{dateFields.map(([label, key]) => <Detail key={key} label={label} value={formatDate(review[key], locale)} />)}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>{t.items}</CardTitle><CardDescription>{items.length} {t.definitions}</CardDescription></CardHeader><CardContent className="space-y-5">{items.length ? items.map((item) => <Card key={item.id} className="border">
      <CardHeader><div className="flex flex-wrap justify-between gap-3"><div><CardTitle>{item.ruleId}</CardTitle><CardDescription>{item.definitionId} · {t.field}: {item.field} · {t.sequence} {item.sequence}</CardDescription></div><div className="flex gap-2"><StatusBadge value={item.status} /><StatusBadge value={item.finalOutcome} /></div></div></CardHeader>
      <CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Detail label={t.decisionType} value={item.decisionType} /><Detail label={t.finalReason} value={item.finalReason} /><Detail label={t.qualitySample} value={item.isQualitySample} /><Detail label={t.qualityAgreement} value={item.qualityAgreement} /></div><JsonBlock title={t.itemEvidence} value={item.evidence} />
        <div><h4 className="mb-3 font-medium">{t.evaluations}</h4>{item.evaluations?.length ? <Table><TableHeader><TableRow><TableHead>{t.actor}</TableHead><TableHead>{t.outcome}</TableHead><TableHead>{t.confidence}</TableHead><TableHead>{t.model}</TableHead><TableHead>{t.reason}</TableHead><TableHead>{t.created}</TableHead></TableRow></TableHeader><TableBody>{item.evaluations.map((evaluation) => <TableRow key={evaluation.id}><TableCell><StatusBadge value={evaluation.evaluator} /></TableCell><TableCell><StatusBadge value={evaluation.outcome} /></TableCell><TableCell>{evaluation.confidence ?? "—"}</TableCell><TableCell>{evaluation.model ?? "—"}<div className="text-xs text-muted-foreground">{evaluation.modelVersion ?? ""} {evaluation.promptVersion ?? ""}</div></TableCell><TableCell className="max-w-80 whitespace-normal">{evaluation.reason ?? "—"}</TableCell><TableCell>{formatDate(evaluation.createdAt, locale)}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-muted-foreground">{t.noEvaluations}</p>}</div>
        {item.evaluations?.map((evaluation) => <div key={`${evaluation.id}-raw`} className="grid gap-4 lg:grid-cols-2"><JsonBlock title={`${evaluation.evaluator} ${t.evidence}`} value={evaluation.evidence} /><JsonBlock title={`${evaluation.evaluator} ${t.rawResponse}`} value={evaluation.rawResponse} /></div>)}
        {item.sourceItem && <Card className="bg-muted/30"><CardHeader><CardTitle>{t.sourceItem}</CardTitle><CardDescription><Link className="text-primary" href={`/panel/reviews/${item.sourceItem.reviewId}`}>{item.sourceItem.reviewId}</Link> · {item.sourceItem.definitionId}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Detail label={t.outcome} value={item.sourceItem.finalOutcome} /><Detail label={t.reason} value={item.sourceItem.finalReason} /></div><JsonBlock title={t.evaluations} value={item.sourceItem.evaluations} /></CardContent></Card>}
      </CardContent>
    </Card>) : <p className="text-muted-foreground">{t.noItems}</p>}</CardContent></Card>
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
function formatDate(value: string | null | undefined, locale: Locale) {
  return value ? new Date(value).toLocaleString(locale) : "—"
}
