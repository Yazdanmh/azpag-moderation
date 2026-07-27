import { Badge } from "@/components/ui/badge"

export function StatusBadge({ value, label, className }: { value: string | null | undefined; label?: string; className?: string }) {
  if (!value) return <Badge variant="outline" className={className}>—</Badge>
  const variant = value === "DECIDED" || value === "PUBLISH" || value === "NO_VIOLATION"
    ? "secondary" : value === "FAILED" || value === "REJECT" || value === "VIOLATION"
      ? "destructive" : "outline"
  return <Badge variant={variant} className={className}>{label ?? value.replaceAll("_", " ")}</Badge>
}

export function personName(person: { first_name?: string | null; last_name?: string | null; company_name?: string | null; email?: string | null } | null | undefined) {
  return person?.company_name || [person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.email || "—"
}

export function safeJson(value: unknown) {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string") return value
  try { return JSON.stringify(value, null, 2) } catch { return "—" }
}
