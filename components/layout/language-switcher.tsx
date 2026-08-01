"use client"

import { CheckIcon, Globe2Icon } from "lucide-react"

import { useI18n } from "@/components/providers/app-providers"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Locale } from "@/lib/i18n"

const languages: { value: Locale; label: string }[] = [
  { value: "fa", label: "فارسی" },
  { value: "ps", label: "پښتو" },
  { value: "en", label: "English" },
]

export function LanguageSwitcher() {
  const { locale, dictionary: t, setLocale } = useI18n()
  const currentLanguage =
    languages.find((language) => language.value === locale) ?? languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label={t.language} />
        }
      >
        <Globe2Icon />
        <span>{currentLanguage.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => setLocale(language.value)}
          >
            <span>{language.label}</span>
            {locale === language.value ? (
              <CheckIcon className="ms-auto size-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
