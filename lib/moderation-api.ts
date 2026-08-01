import "server-only"

import { authenticatedApiFetch } from "@/lib/api"
import type {
  ModerationReview,
  ModerationReviewShownAcknowledgement,
  ModerationMetricsQuery,
  ModerationOperationalMetrics,
  ModerationQualityQuery,
  ModerationQueueMetrics,
  QualityReportResponse,
  ModerationPostHistory,
  ModerationReviewDetail,
  ModerationReviewsQuery,
  ModerationReviewsResponse,
  SubmitHumanEvaluationRequest,
  SubmitHumanEvaluationResponse,
} from "@/lib/moderation-types"
import { ApiResponseError, buildQueryString, parseApiResponse } from "@/lib/moderation-utils"

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

export async function getModerationQualityReport(
  accessToken: string,
  query: ModerationQualityQuery = {},
) {
  const paginatedQuery = { ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 10 }
  return parseApiResponse<QualityReportResponse>(
    await authenticatedApiFetch(
      `/api/moderation/quality/report${buildQueryString(paginatedQuery)}`,
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
