"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DirectionProvider } from "@/components/ui/direction"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { dictionaries, directionFor, type Locale } from "@/lib/i18n"

const I18nContext = React.createContext({
  locale: "fa" as Locale,
  dictionary: dictionaries.fa as (typeof dictionaries)[Locale],
  setLocale: (() => undefined) as (locale: Locale) => void,
})

export const useI18n = () => React.useContext(I18nContext)

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  const [locale, setLocaleState] = React.useState(initialLocale)
  const router = useRouter()
  const direction = directionFor(locale)

  function setLocale(value: Locale) {
    setLocaleState(value)
    document.cookie = `azpag_locale=${value}; path=/; max-age=31536000; samesite=strict${location.protocol === "https:" ? "; secure" : ""}`
    document.documentElement.lang = value
    document.documentElement.dir = directionFor(value)
    router.refresh()
  }

  return (
    <I18nContext.Provider value={{ locale, dictionary: dictionaries[locale], setLocale }}>
      <DirectionProvider direction={direction}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </DirectionProvider>
    </I18nContext.Provider>
  )
}
