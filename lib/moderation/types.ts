export type ModerationRole = "SUPERADMIN" | "ADMIN" | "MANAGER"
export const MODERATION_ROLES: ModerationRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"]

export type ModerationDecisionType = "REJECTION" | "CORRECTION"
export type HumanReviewOutcome = "VIOLATION" | "NO_VIOLATION"
export type EvaluationOutcome = HumanReviewOutcome | "UNCERTAIN"
export type ModerationReviewField = "title" | "description" | "images" | "fields" | "categories" | "price" | "user_posts"
export type ReviewScopeMode = "FIELD" | "AI_FOCUSED" | "WHOLE_POST"

export interface HumanReviewScope {
  mode: ReviewScopeMode
  fields: ModerationReviewField[]
  includesImages: boolean
  includesDynamicFields: boolean
  requiresPreviousPostComparison: boolean
}

export interface ModerationReviewItem {
  id: string
  ruleId: string
  field: string
  decisionType: ModerationDecisionType
  sequence: number
  ruleName: string
  ruleDescription?: string | Partial<Record<"en" | "fa" | "ps", string>>
  category: string
  reviewScope?: HumanReviewScope
  requiresReason?: boolean
}

export interface ModerationPostSnapshot {
  id: string
  revision: number
  title: string
  description: string | null
  price: { value: number | null; currency: string | null } | null
  fields: Record<string, unknown>
  type: string | null
  productState: string | null
  tags: string[]
  features: Array<{ id: string; key: string }>
  meta: unknown
  source: string | null
  isSold: boolean | null
  isLDFB: boolean | null
  images: Array<{ id?: string; url: string; isMain?: boolean }>
  categories: Array<{
    id: number
    name: string
    translations?: Array<{ language: string; value: string }>
  }>
  contact: {
    phone?: string | null
    whatsapp?: string | null
    facebook?: string | null
    instagram?: string | null
    website?: string | null
  } | null
  address: {
    address: string | null
    region: string | null
    country: string | null
    coordinates: string | null
    province: { id: string; name: string } | null
    district: { id: string; name: string } | null
  } | null
  author: { id: string | null; email: string | null; name: string } | null
  userPosts: Array<{
    id: string
    title: string
    description: string | null
    price: { value: number | null; currency: string | null } | null
    fields: Record<string, unknown>
    images?: Array<{ id?: string; url: string; isMain?: boolean }>
  }>
}

export interface ModerationReview {
  id: string
  leaseExpiresAt: string | null
  post: ModerationPostSnapshot
  items: ModerationReviewItem[]
}

export interface ModerationReviewShownAcknowledgement {
  acknowledged: true
  shownAt: string
  expiresAt: string
}

export interface SubmitHumanEvaluationRequest {
  outcome: HumanReviewOutcome
  reason: string
}

export type SubmitHumanEvaluationResponse =
  | { completed: true }
  | { completed: false; item: ModerationReviewItem }

export interface QualitySummary {
  total: number
  agreements: number
  disagreements: number
  agreementRate: number | null
}

export interface QualityDefinitionMetric extends QualitySummary {
  definitionId: string
  ruleId: string
  field: string
}

export interface QualityDisagreement {
  reviewItemId: string
  reviewId: string
  postId: string
  postRevision: number
  definitionId: string
  ruleId: string
  field: string
  completedAt: string | null
  ai: {
    outcome: EvaluationOutcome
    confidence: number
    model: string | null
    promptVersion: string | null
    reason?: string | null
    reasonTranslations?: Record<string, string> | null
  } | null
  human: {
    outcome: EvaluationOutcome
    reason: string
    reasonTranslations?: Record<string, string> | null
    evaluatorId: string | null
  } | null
}

export interface QualityDisagreementDetail {
  disagreement: {
    reviewItemId: string
    definitionId: string
    ruleId: string
    field: string
    decisionType: ModerationDecisionType
    sequence: number
    qualityAgreement: false
    completedAt: string | null
  }
  post: ModerationHistoryPost & {
    author?: ModerationPerson
    images: NonNullable<ModerationHistoryPost["images"]>
    categories: NonNullable<ModerationHistoryPost["categories"]>
    fieldValues: NonNullable<ModerationHistoryPost["fieldValues"]>
    features: NonNullable<ModerationHistoryPost["features"]>
  }
  ai: {
    evaluationId: string
    outcome: EvaluationOutcome
    confidence: number
    reason: string | null
    reasonTranslations: Record<string, string> | null
    evidence: unknown
    model: string | null
    modelVersion: string | null
    promptVersion: string | null
    createdAt: string
  } | null
  human: {
    evaluationId: string
    outcome: EvaluationOutcome
    reason: string | null
    evaluatorId: string | null
    createdAt: string
    reviewer: {
      id: string
      firstName: string | null
      lastName: string | null
      avatar: unknown
    } | null
  } | null
  sourceReview: {
    id: string
    status: string
    finalDecision: string | null
    postRevision: number
  } | null
  qualityReview: {
    id: string
    status: string
    assignedAt: string | null
    shownAt: string | null
    completedAt: string | null
  }
}

export interface QualityReportResponse {
  range: {
    dateFrom: string | null
    dateTo: string | null
    field: string
  }
  sampling: {
    confidentAiItems: number
    sampledItems: number
    reviewedSamples: number
    sampledPercentage: number | null
    reviewedSamplePercentage: number | null
    configuredSampleRate: number
    confidenceThreshold: number
  }
  summary: QualitySummary
  byDefinition: QualityDefinitionMetric[]
  disagreements: QualityDisagreement[]
  disagreementPagination: Pagination
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ModerationMetricsQuery {
  dateFrom?: string
  dateTo?: string
}

export interface ModerationQualityQuery extends ModerationMetricsQuery {
  page?: number
  pageSize?: number
}

export interface DurationDistribution {
  count: number
  medianMs: number | null
  p90Ms: number | null
  p95Ms: number | null
}

export interface ModerationQueueMetrics {
  generatedAt: string
  waitingReviews: number
  oldestReviewId: string | null
  oldestPostId: string | null
  oldestQueuedAt: string | null
  oldestWaitingMs: number | null
}

export interface ModerationOperationalMetrics {
  range: {
    dateFrom: string | null
    dateTo: string | null
    field: string
  }
  volume: {
    completedReviews: number
    aiOnlyReviews: number
    aiOnlyPercentage: number | null
    humanParticipationReviews: number
    humanParticipationPercentage: number | null
  }
  timing: {
    totalReviewTime: DurationDistribution
    humanQueueWaitTime: DurationDistribution
    humanActiveWorkTime: DurationDistribution
  }
  decisions: Array<{
    decision: ModerationDecision
    count: number
    percentage: number | null
  }>
  reviewers: Array<{
    reviewer: ModerationPerson
    reviewCount: number
    activeWorkTime: DurationDistribution
  }>
}

export interface ApiError {
  success: false
  statusCode: number
  errorType: string
  message: string | string[]
  path: string
  timestamp: string
}

export type ModerationReviewStatus =
  | "QUEUED" | "AI_REVIEWING" | "HUMAN_REVIEW_QUEUED"
  | "HUMAN_REVIEWING" | "DECIDED" | "CANCELLED" | "FAILED"
export type ModerationReviewType = "STANDARD" | "QUALITY_SAMPLE"
export type ModerationDecision = "PUBLISH" | "REJECT" | "NEEDS_CHANGES"
export type ModerationReviewParticipation = "AI_ONLY" | "HUMAN"
export type ModerationPostAuthorGroup = "USERS" | "SERVICE_TEAM"
export type ModerationPostStatus =
  | "PUBLISHED" | "PENDING" | "DRAFT" | "ARCHIVED" | "REJECTED" | "NEEDS_CHANGES"
export type ReviewItemStatus = "PENDING" | "EVALUATED" | "HUMAN_REVIEW_REQUIRED" | "NOT_EVALUATED"
export type EvaluationActor = "AI" | "HUMAN"

export interface ModerationPerson {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  email: string | null
  profile?: string | null
  provider?: string | null
  avatar?: {
    id: string
    url: string
    thumbnail?: { url: string; size?: number; extension?: string } | string | null
    medium?: { url: string; size?: number; extension?: string } | string | null
    isMain?: boolean
  } | null
}

export interface ModerationAssignment {
  id: string
  reviewId?: string
  reviewerId: string
  activeKey?: string | null
  assignedAt: string
  firstShownAt: string | null
  completedAt: string | null
  expiresAt: string | null
  reviewer: ModerationPerson | null
}

export interface ModerationEvaluation {
  id: string
  reviewItemId: string
  evaluator: EvaluationActor
  evaluatorId: string | null
  outcome: EvaluationOutcome
  confidence: number | null
  reason: string | null
  reasonTranslations?: Record<string, string> | null
  evidence: unknown
  model: string | null
  modelVersion: string | null
  promptVersion: string | null
  rawResponse: unknown
  createdAt: string
}

export interface ModerationReviewDetailItem {
  id: string
  reviewId: string
  definitionId: string
  ruleId: string
  field: string
  decisionType: ModerationDecisionType
  sequence: number
  status: ReviewItemStatus
  finalOutcome: EvaluationOutcome | null
  finalReason: string | null
  reasonTranslations?: Record<string, string> | null
  evidence: unknown
  sourceItemId: string | null
  isQualitySample: boolean
  qualityAgreement: boolean | null
  evaluations: ModerationEvaluation[]
  sourceItem: {
    id: string
    reviewId: string
    definitionId: string
    finalOutcome: EvaluationOutcome | null
    finalReason: string | null
    reasonTranslations?: Record<string, string> | null
    evaluations: ModerationEvaluation[]
  } | null
}

export interface ModerationReviewDetail {
  id: string
  postId: string
  postRevision: number
  postSnapshot: unknown
  snapshotHash: string
  type: ModerationReviewType
  status: ModerationReviewStatus
  finalDecision: ModerationDecision | null
  decisionReasons: ModerationDecisionReason[]
  queuedAt: string
  aiStartedAt: string | null
  aiCompletedAt: string | null
  humanQueuedAt: string | null
  humanShownAt: string | null
  humanCompletedAt: string | null
  decidedAt: string | null
  decisionDispatchedAt: string | null
  notificationSentAt: string | null
  cancelledAt: string | null
  attemptCount: number
  failureReason: string | null
  post?: ModerationHistoryPost
  assignment: ModerationAssignment | null
  items: ModerationReviewDetailItem[]
}

export interface ModerationReviewListItem {
  id: string
  postRevision: number
  type: ModerationReviewType
  status: ModerationReviewStatus
  finalDecision: ModerationDecision | null
  decisionReasons: ModerationDecisionReason[]
  queuedAt: string
  aiStartedAt: string | null
  aiCompletedAt: string | null
  humanQueuedAt: string | null
  humanShownAt: string | null
  humanCompletedAt: string | null
  decidedAt: string | null
  decisionDispatchedAt: string | null
  notificationSentAt: string | null
  cancelledAt: string | null
  attemptCount: number
  failureReason: string | null
  post: ModerationHistoryPost & {
    images: Array<{
      id: string
      url: string
      thumbnail: { url: string; size?: number; extension?: string } | string | null
      medium?: { url: string; size?: number; extension?: string } | string | null
      isMain?: boolean
    }>
    author: ModerationPerson
  }
  assignment: ModerationAssignment | null
  itemSummary: {
    total: number
    violations: number
    noViolations: number
    uncertain: number
    pendingHumanReview: number
    humanReviewed: number
    qualitySampleItems: number
    qualityAgreements: number
    qualityDisagreements: number
    qualityAgreementRate: number | null
  }
}

export interface ModerationDecisionReason {
  reviewItemId?: string
  ruleId: string
  field: string
  affectedFields?: string[]
  affectedImages?: Array<{
    imageId?: string
    imageIndex?: number
  }>
  reason?: string
  reasonTranslations?: Record<string, string> | null
  evidence?: {
    affectedFields?: string[]
    affectedImages?: Array<{
      imageId?: string
      imageIndex?: number
    }>
    excerpt?: string
    [key: string]: unknown
  } | null
}

export interface ModerationReviewsResponse {
  data: ModerationReviewListItem[]
  pagination: Pagination & {
    page_size?: number
    total_count?: number
    total_pages?: number
  }
}

export interface ModerationHistoryPost {
  id: string
  title: string
  description?: string | null
  slug?: string
  status: ModerationPostStatus
  revision: number
  price?: number | null
  currency?: string | null
  type?: string | null
  product_state?: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  deletedAt: string | null
  moderation_reason: ModerationDecisionReason[] | { reasons?: ModerationDecisionReason[] } | null
  address?: {
    id: string
    address: string | null
    region: string | null
    country: string | null
    coordinates: string | null
    province?: { id: string; name: string; translations?: Array<{ language: string; value: string }> } | null
    district?: { id: string; name: string; translations?: Array<{ language: string; value: string }> } | null
  } | null
  contact?: {
    id?: string
    phone?: string | null
    whatsapp?: string | null
    facebook?: string | null
    instagram?: string | null
    website?: string | null
  } | null
  author?: ModerationPerson
  images?: Array<{
    id: string
    url: string
    thumbnail: { url: string; size?: number; extension?: string } | string | null
    medium?: { url: string; size?: number; extension?: string } | string | null
    isMain?: boolean
  }>
  categories?: Array<{
    id: number
    name: string
    slug?: string | null
    translations?: Array<{ language: string; value: string }>
  }>
  fieldValues?: Array<{
    id: string
    value: unknown
    currency?: string | null
    field: {
      id: string
      key: string
      type: string
      order: number
      localizations?: Array<{ language: string; key?: string; value: string }>
      options?: Array<{
        value: string
        localizations?: Array<{ language: string; key?: string; value: string }>
      }>
    }
  }>
  features?: Array<{
    id: string
    feature: {
      id: string
      key: string
      order: number
      localizations?: Array<{ language: string; key?: string; value: string }>
    }
  }>
}

export interface ModerationPostHistory {
  post: ModerationHistoryPost
  reviews: ModerationReviewDetail[]
  summary: {
    totalReviews: number
    standardReviews: number
    qualityReviews: number
    revisions: number[]
  }
}

export interface ModerationReviewsQuery {
  page?: number
  pageSize?: number
  query?: string
  status?: ModerationReviewStatus
  type?: ModerationReviewType
  decision?: ModerationDecision
  postStatus?: ModerationPostStatus
  participation?: ModerationReviewParticipation
  authorGroup?: ModerationPostAuthorGroup
  reviewerId?: string
  dateFrom?: string
  dateTo?: string
  sort?: "newest" | "oldest" | "queuedAt:desc" | "queuedAt:asc" | "decidedAt:desc" | "decidedAt:asc"
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

export function hasModerationRole(roles: string[]) {
  return roles.some((role) =>
    MODERATION_ROLES.includes(role.toUpperCase() as ModerationRole),
  )
}

export function isManagerOnly(roles: string[]) {
  const normalized = roles.map((role) => role.toUpperCase())
  return normalized.includes("MANAGER") &&
    !normalized.includes("ADMIN") &&
    !normalized.includes("SUPERADMIN")
}
