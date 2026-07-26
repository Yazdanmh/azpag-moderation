import "server-only"

import { authenticatedApiFetch } from "@/lib/api"
import type {
  ModerationReview,
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

export async function getModerationQualityReport(accessToken: string) {
  return parseApiResponse<QualityReportResponse>(
    await authenticatedApiFetch("/api/moderation/quality/report", accessToken),
  )
}

export async function getModerationReviews(
  accessToken: string,
  query: ModerationReviewsQuery = {},
) {
  return parseApiResponse<ModerationReviewsResponse>(
    await authenticatedApiFetch(`/api/moderation/reviews${buildQueryString({ ...query })}`, accessToken),
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
