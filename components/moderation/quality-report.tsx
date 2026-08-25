"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDownIcon, ArrowUpIcon, BadgeCheckIcon, BotIcon, CheckCheckIcon, CircleGaugeIcon, ExternalLinkIcon, FlaskConicalIcon, PercentIcon, Settings2Icon, TestTube2Icon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { useI18n } from "@/components/providers/app-providers"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ApiResult, EvaluationOutcome, QualityDisagreementsSortBy, QualityReportResponse, QualityRulesSortBy, SortOrder } from "@/lib/moderation/types"
import { formatAgreementRate } from "@/lib/moderation/utils"
import { moderationDictionaries } from "@/lib/moderation/i18n"
import { localizedModerationDefinition } from "@/lib/moderation/definition-i18n"
import { localizedGeneratedModerationReason } from "@/lib/moderation/reason-i18n"
import { ModerationLoading, ResultState } from "./shared"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { qualityDisagreementCopy } from "./quality-disagreement-detail"

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

export function QualityReport({
  initial,
  pageSize,
  rulesSortBy,
  rulesSortOrder,
  disagreementsSortBy,
  disagreementsSortOrder,
}: {
  initial: ApiResult<QualityReportResponse>
  pageSize: number
  rulesSortBy: QualityRulesSortBy
  rulesSortOrder: SortOrder
  disagreementsSortBy: QualityDisagreementsSortBy
  disagreementsSortOrder: SortOrder
}) {
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
    { label: t.confidentAiItems, value: sampling.confidentAiItems, icon: BotIcon },
    { label: t.sampledItems, value: sampling.sampledItems, icon: FlaskConicalIcon },
    { label: t.reviewedSamples, value: sampling.reviewedSamples, icon: TestTube2Icon },
    { label: t.sampledPercentage, value: sampling.sampledPercentage === null ? t.noData : formatAgreementRate(sampling.sampledPercentage), icon: PercentIcon },
    { label: t.reviewedSamplePercentage, value: sampling.reviewedSamplePercentage === null ? t.noData : formatAgreementRate(sampling.reviewedSamplePercentage), icon: BadgeCheckIcon },
    { label: t.configuredSampleRate, value: formatAgreementRate(sampling.configuredSampleRate), icon: Settings2Icon },
    { label: t.confidenceThreshold, value: formatAgreementRate(sampling.confidenceThreshold), icon: CircleGaugeIcon },
    { label: t.agreements, value: summary.agreements, icon: ThumbsUpIcon },
    { label: t.disagreements, value: summary.disagreements, icon: ThumbsDownIcon },
    { label: t.agreementRate, value: summary.agreementRate === null ? t.noData : formatAgreementRate(summary.agreementRate), icon: CheckCheckIcon },
  ]
  const pageHref = (page: number) => {
    const params = qualityParams(page)
    return `/panel/quality?${params.toString()}`
  }
  function qualityParams(page: number) {
    return new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      rulesSortBy,
      rulesSortOrder,
      disagreementsSortBy,
      disagreementsSortOrder,
    })
  }
  function changeSort(kind: "rules" | "disagreements", sortBy: string, sortOrder: SortOrder) {
    const params = qualityParams(kind === "disagreements" ? 1 : disagreementPagination.page)
    params.set(`${kind}SortBy`, sortBy)
    params.set(`${kind}SortOrder`, sortOrder)
    startTransition(() => router.push(`/panel/quality?${params.toString()}`))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardDescription>{label}</CardDescription>
                <span className="grid size-10 place-items-center rounded-md bg-[#F5F5F5] text-primary">
                  <Icon className="size-5" />
                </span>
              </div>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{t.metricsDefinition}</CardTitle><CardDescription>{t.metricsDescription}</CardDescription></CardHeader>
        <CardContent>
          {definitions.length ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t.definition}</TableHead>
                <SortableHead label={t.rule} field="ruleId" activeField={rulesSortBy} activeOrder={rulesSortOrder} disabled={pending} onSort={(field, order) => changeSort("rules", field, order)} />
                <SortableHead label={t.field} field="field" activeField={rulesSortBy} activeOrder={rulesSortOrder} disabled={pending} onSort={(field, order) => changeSort("rules", field, order)} />
                <SortableHead label={t.total} field="total" activeField={rulesSortBy} activeOrder={rulesSortOrder} disabled={pending} onSort={(field, order) => changeSort("rules", field, order)} />
                <SortableHead label={t.agreements} field="agreements" activeField={rulesSortBy} activeOrder={rulesSortOrder} disabled={pending} onSort={(field, order) => changeSort("rules", field, order)} />
                <SortableHead label={t.disagreements} field="disagreements" activeField={rulesSortBy} activeOrder={rulesSortOrder} disabled={pending} onSort={(field, order) => changeSort("rules", field, order)} />
                <SortableHead label={t.rate} field="agreementRate" activeField={rulesSortBy} activeOrder={rulesSortOrder} disabled={pending} onSort={(field, order) => changeSort("rules", field, order)} />
              </TableRow></TableHeader>
              <TableBody>{definitions.map((metric) => {
                const localized = localizedModerationDefinition(metric, locale)
                return (
                <TableRow key={metric.definitionId}>
                  <TableCell><div className="font-medium">{localized.definition}</div><div className="mt-1 font-mono text-xs text-muted-foreground">{metric.definitionId}</div></TableCell>
                  <TableCell>{localized.rule}</TableCell><TableCell>{localized.field}</TableCell>
                  <TableCell>{metric.total}</TableCell><TableCell className="text-emerald-700">{metric.agreements}</TableCell>
                  <TableCell className="text-destructive">{metric.disagreements}</TableCell><TableCell>{metric.agreementRate === null ? t.noData : formatAgreementRate(metric.agreementRate)}</TableCell>
                </TableRow>
              )})}</TableBody>
            </Table>
          ) : <ResultState title={t.noMetrics} description={t.metricsDescription} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t.recentDisagreements}</CardTitle><CardDescription>{t.disagreementsDescription}</CardDescription></CardHeader>
        <CardContent>
          {recent.length ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t.post}</TableHead>
                <SortableHead label={t.revision} field="postRevision" activeField={disagreementsSortBy} activeOrder={disagreementsSortOrder} disabled={pending} onSort={(field, order) => changeSort("disagreements", field, order)} />
                <SortableHead label={t.rule} field="ruleId" activeField={disagreementsSortBy} activeOrder={disagreementsSortOrder} disabled={pending} onSort={(field, order) => changeSort("disagreements", field, order)} />
                <SortableHead label={t.field} field="field" activeField={disagreementsSortBy} activeOrder={disagreementsSortOrder} disabled={pending} onSort={(field, order) => changeSort("disagreements", field, order)} />
                <TableHead>{t.ai}</TableHead><TableHead>{t.confidence}</TableHead><TableHead>{t.model}</TableHead><TableHead>{t.human}</TableHead><TableHead>{t.humanReason}</TableHead>
                <SortableHead label={t.completed} field="completedAt" activeField={disagreementsSortBy} activeOrder={disagreementsSortOrder} disabled={pending} onSort={(field, order) => changeSort("disagreements", field, order)} />
                <TableHead><span className="sr-only">Details</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>{recent.map((row) => {
                const localized = localizedModerationDefinition(row, locale)
                return (
                <TableRow key={row.reviewItemId} className="bg-destructive/[0.025]">
                  <TableCell>{row.postId}</TableCell>
                  <TableCell>{row.postRevision}</TableCell>
                  <TableCell><div>{localized.rule}</div><div className="font-mono text-xs text-muted-foreground">{row.ruleId}</div></TableCell>
                  <TableCell>{localized.field}</TableCell>
                  <TableCell><OutcomeBadge value={row.ai?.outcome ?? null} owner={t.ai} noData={t.noData} labels={outcomeLabels} /></TableCell>
                  <TableCell>{row.ai ? row.ai.confidence.toLocaleString(locale) : t.noData}</TableCell>
                  <TableCell><div>{row.ai?.model ?? t.noData}</div><div className="text-xs text-muted-foreground">{row.ai?.promptVersion ?? t.noPromptVersion}</div>{row.ai && (row.ai.reason || row.ai.reasonTranslations) && <div className="mt-1 max-w-72 whitespace-normal text-xs text-muted-foreground">{localizedQualityReason(row.ai.reason, row.ai.reasonTranslations, locale) || t.noData}</div>}</TableCell>
                  <TableCell><OutcomeBadge value={row.human?.outcome ?? null} owner={t.human} noData={t.noData} labels={outcomeLabels} /></TableCell>
                  <TableCell className="max-w-72 whitespace-normal">{row.human ? localizedQualityReason(row.human.reason, row.human.reasonTranslations, locale) || t.noData : t.noData}</TableCell>
                  <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleString(locale) : t.noData}</TableCell>
                  <TableCell><Link href={`/panel/quality/disagreements/${encodeURIComponent(row.reviewItemId)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>{qualityDisagreementCopy[locale].view}<ExternalLinkIcon /></Link></TableCell>
                </TableRow>
              )})}</TableBody>
            </Table>
          ) : <ResultState title={t.noDisagreements} description={t.disagreementsDescription} />}
          <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{disagreementPagination.total.toLocaleString(locale)} {t.disagreements} · {t.page} {disagreementPagination.page.toLocaleString(locale)} {t.of} {Math.max(1, disagreementPagination.totalPages).toLocaleString(locale)}</p><div className="flex gap-2"><Link href={disagreementPagination.hasPreviousPage ? pageHref(disagreementPagination.page - 1) : "#"} aria-disabled={!disagreementPagination.hasPreviousPage} className={cn(buttonVariants({ variant: "outline" }), !disagreementPagination.hasPreviousPage && "pointer-events-none opacity-50")}>{t.previous}</Link><Link href={disagreementPagination.hasNextPage ? pageHref(disagreementPagination.page + 1) : "#"} aria-disabled={!disagreementPagination.hasNextPage} className={cn(buttonVariants({ variant: "outline" }), !disagreementPagination.hasNextPage && "pointer-events-none opacity-50")}>{t.next}</Link></div></div>
        </CardContent>
      </Card>
    </div>
  )
}

function SortableHead({ label, field, activeField, activeOrder, disabled, onSort }: {
  label: string
  field: string
  activeField: string
  activeOrder: SortOrder
  disabled: boolean
  onSort: (field: string, order: SortOrder) => void
}) {
  const active = activeField === field
  return <TableHead><div className="flex items-center gap-1.5 whitespace-nowrap"><span>{label}</span><span className="inline-flex items-center">
    <button type="button" title={`${label} ascending`} aria-label={`${label} ascending`} aria-pressed={active && activeOrder === "asc"} disabled={disabled} onClick={() => onSort(field, "asc")} className={cn("rounded p-0.5 hover:bg-muted disabled:pointer-events-none disabled:opacity-50", active && activeOrder === "asc" && "bg-primary/10 text-primary")}><ArrowUpIcon className="size-3.5" /></button>
    <button type="button" title={`${label} descending`} aria-label={`${label} descending`} aria-pressed={active && activeOrder === "desc"} disabled={disabled} onClick={() => onSort(field, "desc")} className={cn("rounded p-0.5 hover:bg-muted disabled:pointer-events-none disabled:opacity-50", active && activeOrder === "desc" && "bg-primary/10 text-primary")}><ArrowDownIcon className="size-3.5" /></button>
  </span></div></TableHead>
}

function localizedQualityReason(
  reason: string | null | undefined,
  translations: Record<string, string> | null | undefined,
  locale: "en" | "fa" | "ps",
) {
  const translated = translations?.[locale] ||
    (locale === "fa" ? translations?.prs || translations?.dari : undefined)
  return localizedGeneratedModerationReason(translated || reason || "", locale)
}
