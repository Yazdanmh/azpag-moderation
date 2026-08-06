"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n"

const labels: Record<Locale, { copy: string; copied: string }> = {
  en: { copy: "Copy JSON", copied: "Copied" },
  fa: { copy: "کپی JSON", copied: "کپی شد" },
  ps: { copy: "JSON کاپي کړئ", copied: "کاپي شو" },
}

export function CopyJsonButton({ value, locale }: { value: string; locale: Locale }) {
  const [copied, setCopied] = useState(false)
  const label = copied ? labels[locale].copied : labels[locale].copy

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="absolute right-2 top-2 z-10 bg-white/95 shadow-sm hover:bg-slate-50"
      onClick={copy}
      aria-label={label}
      title={label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
