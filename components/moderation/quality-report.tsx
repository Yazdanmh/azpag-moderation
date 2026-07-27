"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/components/providers"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ApiResult, EvaluationOutcome, QualityReportResponse } from "@/lib/moderation-types"
import { formatAgreementRate } from "@/lib/moderation-utils"
import { moderationDictionaries } from "@/lib/moderation-i18n"
import { ModerationLoading, ResultState } from "./shared"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function OutcomeBadge({ value, owner, noData, labels }: { value: EvaluationOutcome | null; owner: string; noData: string; labels: Record<EvaluationOutcome, string> }) {
  if (!value) return <span className="text-muted-foreground">{noData}</span>
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{owner}</span>
      <Badge variant={value === "VIOLATION" ? "destructive" : value === "NO_VIOLATION" ? "secondary" : "outline"}>
        {labels[value]}
      </Badge>
    </div>
  )
}

export function QualityReport({ initial, dateFrom, dateTo, pageSize }: { initial: ApiResult<QualityReportResponse>; dateFrom?: string; dateTo?: string; pageSize: number }) {
  const { locale } = useI18n()
  const t = moderationDictionaries[locale]
  const router = useRouter()
  const result = initial
  const [pending, startTransition] = React.useTransition()

  function retry() {
    startTransition(() => router.refresh())
  }

  if (pending && !result.ok) return <ModerationLoading />
  if (!result.ok) return <ResultState title={t.unableQuality} description={result.status === 401 ? t.sessionExpired : result.status === 403 ? t.forbidden : result.status === 429 ? t.rateLimited : result.status >= 500 ? t.serviceError : result.message} retry={retry} retryLabel={t.retry} fill />

  const { sampling, summary, byDefinition, disagreements, disagreementPagination } = result.data
  const outcomeLabels = {
    VIOLATION: t.violation,
    NO_VIOLATION: t.noViolation,
    UNCERTAIN: t.uncertain,
  }
  const definitions = Array.isArray(byDefinition) ? byDefinition : []
  const recent = Array.isArray(disagreements) ? disagreements : []
  const hasQualityData = sampling.confidentAiItems > 0 || sampling.sampledItems > 0 || summary.total > 0 || definitions.length > 0 || recent.length > 0
  if (!hasQualityData) {
    return <ResultState title={t.noQualityData} description={t.noQualityDataDescription} retry={retry} retryLabel={t.retry} fill />
  }
  const metrics = [
    [t.confidentAiItems, sampling.confidentAiItems],
    [t.sampledItems, sampling.sampledItems],
    [t.reviewedSamples, sampling.reviewedSamples],
    [t.sampledPercentage, sampling.sampledPercentage === null ? t.noData : formatAgreementRate(sampling.sampledPercentage)],
    [t.reviewedSamplePercentage, sampling.reviewedSamplePercentage === null ? t.noData : formatAgreementRate(sampling.reviewedSamplePercentage)],
    [t.configuredSampleRate, formatAgreementRate(sampling.configuredSampleRate)],
    [t.confidenceThreshold, formatAgreementRate(sampling.confidenceThreshold)],
    [t.agreements, summary.agreements],
    [t.disagreements, summary.disagreements],
    [t.agreementRate, summary.agreementRate === null ? t.noData : formatAgreementRate(summary.agreementRate)],
  ]
  const pageHref = (page: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    return `/panel/quality?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value], index) => (
          <Card key={String(label)} className={index === 7 ? "border-emerald-500/30" : index === 8 ? "border-destructive/30" : ""}>
            <CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{t.metricsDefinition}</CardTitle><CardDescription>{t.metricsDescription}</CardDescription></CardHeader>
        <CardContent>
          {definitions.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>{t.definition}</TableHead><TableHead>{t.rule}</TableHead><TableHead>{t.field}</TableHead><TableHead>{t.total}</TableHead><TableHead>{t.agreements}</TableHead><TableHead>{t.disagreements}</TableHead><TableHead>{t.rate}</TableHead></TableRow></TableHeader>
              <TableBody>{definitions.map((metric) => (
                <TableRow key={metric.definitionId}>
                  <TableCell className="font-mono text-xs">{metric.definitionId}</TableCell>
                  <TableCell>{metric.ruleId}</TableCell><TableCell>{metric.field}</TableCell>
                  <TableCell>{metric.total}</TableCell><TableCell className="text-emerald-700">{metric.agreements}</TableCell>
                  <TableCell className="text-destructive">{metric.disagreements}</TableCell><TableCell>{metric.agreementRate === null ? t.noData : formatAgreementRate(metric.agreementRate)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : <ResultState title={t.noMetrics} description={t.metricsDescription} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t.recentDisagreements}</CardTitle><CardDescription>{t.disagreementsDescription}</CardDescription></CardHeader>
        <CardContent>
          {recent.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>{t.post}</TableHead><TableHead>{t.definition} / {t.field}</TableHead><TableHead>{t.ai}</TableHead><TableHead>{t.confidence}</TableHead><TableHead>{t.model}</TableHead><TableHead>{t.human}</TableHead><TableHead>{t.humanReason}</TableHead><TableHead>{t.completed}</TableHead></TableRow></TableHeader>
              <TableBody>{recent.map((row) => (
                <TableRow key={row.reviewItemId} className="bg-destructive/[0.025]">
                  <TableCell><div>{row.postId}</div><div className="text-xs text-muted-foreground">{t.revision} {row.postRevision}</div></TableCell>
                  <TableCell><div>{row.definitionId}</div><div className="text-xs text-muted-foreground">{row.ruleId} · {row.field}</div></TableCell>
                  <TableCell><OutcomeBadge value={row.ai?.outcome ?? null} owner={t.ai} noData={t.noData} labels={outcomeLabels} /></TableCell>
                  <TableCell>{row.ai ? row.ai.confidence.toLocaleString(locale) : t.noData}</TableCell>
                  <TableCell><div>{row.ai?.model ?? t.noData}</div><div className="text-xs text-muted-foreground">{row.ai?.promptVersion ?? t.noPromptVersion}</div>{row.ai?.reason && <div className="mt-1 max-w-72 whitespace-normal text-xs text-muted-foreground">{translatedReason(row.ai.reasonTranslations, locale) || row.ai.reason}</div>}</TableCell>
                  <TableCell><OutcomeBadge value={row.human?.outcome ?? null} owner={t.human} noData={t.noData} labels={outcomeLabels} /></TableCell>
                  <TableCell className="max-w-72 whitespace-normal">{row.human?.reason ?? t.noData}</TableCell>
                  <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleString(locale) : t.noData}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : <ResultState title={t.noDisagreements} description={t.disagreementsDescription} />}
          <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{disagreementPagination.total.toLocaleString(locale)} {t.disagreements} · {t.page} {disagreementPagination.page.toLocaleString(locale)} {t.of} {Math.max(1, disagreementPagination.totalPages).toLocaleString(locale)}</p><div className="flex gap-2"><Link href={disagreementPagination.hasPreviousPage ? pageHref(disagreementPagination.page - 1) : "#"} aria-disabled={!disagreementPagination.hasPreviousPage} className={cn(buttonVariants({ variant: "outline" }), !disagreementPagination.hasPreviousPage && "pointer-events-none opacity-50")}>{t.previous}</Link><Link href={disagreementPagination.hasNextPage ? pageHref(disagreementPagination.page + 1) : "#"} aria-disabled={!disagreementPagination.hasNextPage} className={cn(buttonVariants({ variant: "outline" }), !disagreementPagination.hasNextPage && "pointer-events-none opacity-50")}>{t.next}</Link></div></div>
        </CardContent>
      </Card>
    </div>
  )
}

function translatedReason(translations: Record<string, string> | null | undefined, locale: string) {
  if (!translations) return ""
  return translations[locale] || translations[locale === "fa" ? "prs" : locale] || ""
}
