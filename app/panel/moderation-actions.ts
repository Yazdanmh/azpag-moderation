"use server"

import {
  acknowledgeModerationReviewShown,
  getModerationQualityReport,
  getNextModerationReview,
  ModerationApiError,
  submitModerationEvaluation,
} from "@/lib/moderation-api"
import {
  hasModerationRole,
  type ApiResult,
  type HumanReviewOutcome,
  type ModerationReview,
  type ModerationReviewShownAcknowledgement,
  type QualityReportResponse,
  type SubmitHumanEvaluationResponse,
} from "@/lib/moderation-types"
import { deleteSession, getSession } from "@/lib/session"
import { z } from "zod"

async function authorizedSession() {
  const session = await getSession()
  if (!session) return { authorized: false as const, error: { ok: false, status: 401, message: "Please sign in again." } as const }
  if (!hasModerationRole(session.roles)) {
    return { authorized: false as const, error: { ok: false, status: 403, message: "You do not have permission to access moderation." } as const }
  }
  return { authorized: true as const, session }
}

async function run<T>(operation: (token: string) => Promise<T>): Promise<ApiResult<T>> {
  const auth = await authorizedSession()
  if (!auth.authorized) return auth.error
  try {
    return { ok: true, data: await operation(auth.session.accessToken) }
  } catch (error) {
    if (error instanceof ModerationApiError) {
      if (error.status === 401) await deleteSession()
      return { ok: false, status: error.status, message: error.message }
    }
    return { ok: false, status: 500, message: "The moderation service is unavailable. Please try again." }
  }
}

export async function loadNextReview(): Promise<ApiResult<ModerationReview | null>> {
  return run(getNextModerationReview)
}

const reviewIdSchema = z.string().min(1).max(200)

export async function acknowledgeReviewShown(
  reviewId: string,
): Promise<ApiResult<ModerationReviewShownAcknowledgement>> {
  const parsed = reviewIdSchema.safeParse(reviewId)
  if (!parsed.success) {
    return { ok: false, status: 400, message: "The review ID is invalid." }
  }
  return run((token) => acknowledgeModerationReviewShown(token, parsed.data))
}

const submissionSchema = z.object({
  reviewId: z.string().min(1).max(200),
  itemId: z.string().min(1).max(200),
  outcome: z.enum(["VIOLATION", "NO_VIOLATION"]),
  reason: z.string().trim().min(1).max(1000),
}).strict()

export async function submitEvaluation(input: {
  reviewId: string
  itemId: string
  outcome: HumanReviewOutcome
  reason: string
}): Promise<ApiResult<SubmitHumanEvaluationResponse>> {
  const parsed = submissionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, status: 400, message: "Provide a reason of 1–1,000 characters." }
  return run((token) =>
    submitModerationEvaluation(token, parsed.data.reviewId, parsed.data.itemId, {
      outcome: parsed.data.outcome,
      reason: parsed.data.reason,
    }),
  )
}

export async function loadQualityReport(): Promise<ApiResult<QualityReportResponse>> {
  return run(getModerationQualityReport)
}
