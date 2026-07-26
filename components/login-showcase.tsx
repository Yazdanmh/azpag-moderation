"use client"

import Image from "next/image"
import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react"
import { useI18n } from "@/components/providers"

export function LoginShowcase() {
  const { dictionary: t } = useI18n()

  return (
    <div className="relative flex h-full min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-2xl bg-[#44546A] p-10 text-white xl:p-14">
      <div className="absolute -end-24 -top-24 size-80 rounded-full border border-white/10" />
      <div className="absolute -end-8 -top-8 size-52 rounded-full border border-primary/40" />
      <div className="absolute -bottom-36 -start-28 size-96 rounded-full bg-[#008000]/20" />
      <div className="absolute bottom-20 end-16 size-3 rounded-full bg-primary" />
      <div className="absolute bottom-28 end-28 size-1.5 rounded-full bg-[#008000]" />

      <div className="relative z-10 flex w-full flex-col">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-white">
            <Image src="/logo.png" alt="Azpag" width={36} height={36} className="size-9 object-contain" priority />
          </span>
          <div>
            <p className="text-lg font-semibold">{t.brandName}</p>
            <p className="text-sm text-white/55">{t.loginPanelLabel}</p>
          </div>
        </div>

        <div className="my-auto max-w-xl py-16">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/75">
            <ShieldCheckIcon className="size-4 text-primary" />
            {t.loginShowcaseBadge}
          </span>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {t.loginShowcaseTitle}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
            {t.loginShowcaseDescription}
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {[t.loginFeatureReview, t.loginFeatureQuality].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2Icon className="size-5 shrink-0 text-[#7ED37E]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">{t.loginShowcaseFooter}</p>
      </div>
    </div>
  )
}
