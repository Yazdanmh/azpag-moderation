import type { ApiError } from "./types"

export class ApiResponseError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiResponseError"
  }
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | ApiError | null
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? Array.isArray(body.message)
          ? body.message.join(" ")
          : body.message
        : `Request failed (${response.status}).`
    throw new ApiResponseError(response.status, message)
  }
  return body as T
}

export function formatAgreementRate(value: number | null) {
  return value === null
    ? "No data"
    : `${(value * 100).toLocaleString("en", { maximumFractionDigits: 1 })}%`
}

export function buildQueryString(values: Record<string, unknown>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export function paginationTotal(pagination: {
  total?: number
  total_count?: number
} | null | undefined) {
  return pagination?.total ?? pagination?.total_count ?? 0
}

export function paginationTotalPages(pagination: {
  totalPages?: number
  total_pages?: number
} | null | undefined) {
  return pagination?.totalPages ?? pagination?.total_pages ?? 0
}
