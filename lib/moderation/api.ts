import "server-only"

import { authenticatedApiFetch } from "@/lib/api/http"
import type {
  ModerationReview,
  ModerationReviewShownAcknowledgement,
  ModerationMetricsQuery,
  ModerationOperationalMetrics,
  ModerationQualityQuery,
  ModerationQueueMetrics,
  QualityRulesResponse,
  QualityDisagreementsResponse,
  QualityRulesSortBy,
  QualityDisagreementsSortBy,
  SortOrder,
  QualityDisagreementDetail,
  ModerationPostHistory,
  ModerationReviewDetail,
  ModerationReviewsQuery,
  ModerationReviewsResponse,
  SubmitHumanEvaluationRequest,
  SubmitHumanEvaluationResponse,
} from "@/lib/moderation/types"
import { ApiResponseError, buildQueryString, parseApiResponse } from "@/lib/moderation/utils"

export { ApiResponseError as ModerationApiError }

export async function getNextModerationReview(accessToken: string) {
  return parseApiResponse<ModerationReview | null>(
    await authenticatedApiFetch("/api/moderation/reviews/next", accessToken),
  )
}

export async function acknowledgeModerationReviewShown(
  accessToken: string,
  reviewId: string,
) {
  return parseApiResponse<ModerationReviewShownAcknowledgement>(
    await authenticatedApiFetch(
      `/api/moderation/reviews/${encodeURIComponent(reviewId)}/shown`,
      accessToken,
      { method: "POST" },
    ),
  )
}

export async function submitModerationEvaluation(
  accessToken: string,
  reviewId: string,
  itemId: string,
  payload: SubmitHumanEvaluationRequest,
) {
  return parseApiResponse<SubmitHumanEvaluationResponse>(
    await authenticatedApiFetch(
      `/api/moderation/reviews/${encodeURIComponent(reviewId)}/items/${encodeURIComponent(itemId)}`,
      accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: payload.outcome, reason: payload.reason }),
      },
    ),
  )
}

export async function getModerationQualityRules(
  accessToken: string,
  query: { sortBy?: QualityRulesSortBy; sortOrder?: SortOrder } = {},
) {
  const response = await parseApiResponse<unknown>(
    await authenticatedApiFetch(
      `/api/moderation/quality/rules${buildQueryString(query)}`,
      accessToken,
    ),
  )
  return normalizeQualityRules(response)
}

export async function getModerationQualityDisagreements(
  accessToken: string,
  query: Pick<ModerationQualityQuery, "page" | "pageSize"> & {
    sortBy?: QualityDisagreementsSortBy
    sortOrder?: SortOrder
  } = {},
) {
  const paginatedQuery = {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  }
  const response = await parseApiResponse<unknown>(
    await authenticatedApiFetch(
      `/api/moderation/quality/disagreements${buildQueryString(paginatedQuery)}`,
      accessToken,
    ),
  )
  return normalizeQualityDisagreements(response, paginatedQuery.page, paginatedQuery.pageSize)
}

export async function getModerationQualityDisagreement(
  accessToken: string,
  reviewItemId: string,
) {
  return parseApiResponse<QualityDisagreementDetail>(
    await authenticatedApiFetch(
      `/api/moderation/quality/disagreements/${encodeURIComponent(reviewItemId)}`,
      accessToken,
    ),
  )
}

export async function getModerationQueueMetrics(accessToken: string) {
  return parseApiResponse<ModerationQueueMetrics>(
    await authenticatedApiFetch("/api/moderation/metrics/queue", accessToken),
  )
}

export async function getModerationOperationalMetrics(
  accessToken: string,
  query: ModerationMetricsQuery = {},
) {
  return parseApiResponse<ModerationOperationalMetrics>(
    await authenticatedApiFetch(
      `/api/moderation/metrics/operations${buildQueryString({ ...query })}`,
      accessToken,
    ),
  )
}

export async function getModerationReviews(
  accessToken: string,
  query: ModerationReviewsQuery = {},
) {
  const paginatedQuery = { ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 10 }
  return parseApiResponse<ModerationReviewsResponse>(
    await authenticatedApiFetch(`/api/moderation/reviews${buildQueryString(paginatedQuery)}`, accessToken),
  )
}

export async function getModerationReview(accessToken: string, reviewId: string) {
  return parseApiResponse<ModerationReviewDetail>(
    await authenticatedApiFetch(
      `/api/moderation/reviews/${encodeURIComponent(reviewId)}`,
      accessToken,
    ),
  )
}

export async function getModerationPostHistory(accessToken: string, postId: string) {
  return parseApiResponse<ModerationPostHistory>(
    await authenticatedApiFetch(
      `/api/moderation/posts/${encodeURIComponent(postId)}`,
      accessToken,
    ),
  )
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeQualityRules(value: unknown): QualityRulesResponse {
  const root = record(value)
  const rules = (Array.isArray(value) ? value : Array.isArray(root.rules) ? root.rules : Array.isArray(root.data) ? root.data : Array.isArray(root.byDefinition) ? root.byDefinition : []) as QualityRulesResponse["rules"]
  const suppliedSummary = record(root.summary)
  const total = numberValue(suppliedSummary.total, rules.reduce((sum, rule) => sum + (rule.total || 0), 0))
  const agreements = numberValue(suppliedSummary.agreements, rules.reduce((sum, rule) => sum + (rule.agreements || 0), 0))
  const disagreements = numberValue(suppliedSummary.disagreements, rules.reduce((sum, rule) => sum + (rule.disagreements || 0), 0))
  const sampling = record(root.sampling)
  return {
    rules,
    summary: {
      total,
      agreements,
      disagreements,
      agreementRate: typeof suppliedSummary.agreementRate === "number" ? suppliedSummary.agreementRate : total ? agreements / total : null,
    },
    sampling: {
      confidentAiItems: numberValue(sampling.confidentAiItems),
      sampledItems: numberValue(sampling.sampledItems),
      reviewedSamples: numberValue(sampling.reviewedSamples, total),
      sampledPercentage: nullableNumber(sampling.sampledPercentage),
      reviewedSamplePercentage: nullableNumber(sampling.reviewedSamplePercentage),
      configuredSampleRate: numberValue(sampling.configuredSampleRate),
      confidenceThreshold: numberValue(sampling.confidenceThreshold),
    },
  }
}

function normalizeQualityDisagreements(value: unknown, page: number, pageSize: number): QualityDisagreementsResponse {
  const root = record(value)
  const data = (Array.isArray(value) ? value : Array.isArray(root.data) ? root.data : Array.isArray(root.disagreements) ? root.disagreements : []) as QualityDisagreementsResponse["data"]
  const supplied = record(root.pagination ?? root.disagreementPagination)
  const total = numberValue(supplied.total ?? supplied.total_count, data.length)
  const currentPage = numberValue(supplied.page, page)
  const totalPages = numberValue(supplied.totalPages ?? supplied.total_pages, Math.ceil(total / pageSize))
  return {
    data,
    pagination: {
      page: currentPage,
      pageSize: numberValue(supplied.pageSize ?? supplied.page_size, pageSize),
      total,
      totalPages,
      hasNextPage: typeof supplied.hasNextPage === "boolean" ? supplied.hasNextPage : currentPage < totalPages,
      hasPreviousPage: typeof supplied.hasPreviousPage === "boolean" ? supplied.hasPreviousPage : currentPage > 1,
    },
  }
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}
