import assert from "node:assert/strict"
import test from "node:test"
import { hasModerationRole, isManagerOnly } from "../lib/moderation-types.ts"
import { ApiResponseError, buildQueryString, formatAgreementRate, paginationTotal, paginationTotalPages, parseApiResponse } from "../lib/moderation-utils.ts"

test("moderation navigation authorization accepts only supported roles", () => {
  assert.equal(hasModerationRole(["MANAGER"]), true)
  assert.equal(hasModerationRole(["admin"]), true)
  assert.equal(hasModerationRole(["SUPERADMIN"]), true)
  assert.equal(hasModerationRole(["MODERATOR"]), false)
  assert.equal(hasModerationRole([]), false)
})

test("manager-only access is restricted while elevated roles are not", () => {
  assert.equal(isManagerOnly(["MANAGER"]), true)
  assert.equal(isManagerOnly(["manager"]), true)
  assert.equal(isManagerOnly(["MANAGER", "ADMIN"]), false)
  assert.equal(isManagerOnly(["SUPERADMIN"]), false)
  assert.equal(isManagerOnly(["ADMIN"]), false)
})

test("agreement rates distinguish null from zero and multiply fractions", () => {
  assert.equal(formatAgreementRate(null), "No data")
  assert.equal(formatAgreementRate(0), "0%")
  assert.equal(formatAgreementRate(0.82), "82%")
  assert.equal(formatAgreementRate(0.825), "82.5%")
})

test("API errors support string-array validation messages", async () => {
  const response = new Response(JSON.stringify({
    success: false,
    statusCode: 400,
    errorType: "ValidationError",
    message: ["Outcome is invalid.", "Reason is required."],
    path: "/api/moderation/reviews/x/items/y",
    timestamp: new Date(0).toISOString(),
  }), { status: 400, headers: { "content-type": "application/json" } })

  await assert.rejects(
    () => parseApiResponse(response),
    (error: unknown) =>
      error instanceof ApiResponseError &&
      error.status === 400 &&
      error.message === "Outcome is invalid. Reason is required.",
  )
})

test("API parser returns successful response data", async () => {
  const payload = { completed: false, item: { id: "item-2" } }
  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
  assert.deepEqual(await parseApiResponse(response), payload)
})

test("review list query includes supported filters and omits empty values", () => {
  assert.equal(
    buildQueryString({
      page: 1,
      pageSize: 20,
      query: "",
      type: "STANDARD",
      status: "DECIDED",
      decision: "PUBLISH",
      reviewerId: undefined,
    }),
    "?page=1&pageSize=20&type=STANDARD&status=DECIDED&decision=PUBLISH",
  )
})

test("review list query preserves a backend-supported sort", () => {
  assert.equal(
    buildQueryString({ page: 1, sort: "decidedAt:desc" }),
    "?page=1&sort=decidedAt%3Adesc",
  )
})

test("pagination helpers support current and legacy response names", () => {
  assert.equal(paginationTotal({ total: 42 }), 42)
  assert.equal(paginationTotal({ total_count: 21 }), 21)
  assert.equal(paginationTotalPages({ totalPages: 5 }), 5)
  assert.equal(paginationTotalPages({ total_pages: 3 }), 3)
})
