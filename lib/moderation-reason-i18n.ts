import type { Locale } from "@/lib/i18n"

export function localizedGeneratedModerationReason(value: string, locale: Locale) {
  const match = value.trim().match(/^(Human reviewer|AI reviewer|AI|System) selected (VIOLATION|NO_VIOLATION|UNCERTAIN)\.?$/i)
  if (!match) return value

  const actor = match[1].toLocaleLowerCase()
  const outcome = match[2].toLocaleUpperCase() as "VIOLATION" | "NO_VIOLATION" | "UNCERTAIN"
  const actorLabels = actor.startsWith("human")
    ? { en: "The human reviewer", fa: "بررسی‌کننده انسانی", ps: "انساني بیاکتونکي" }
    : actor === "system"
      ? { en: "The automatic system", fa: "سیستم خودکار", ps: "اتومات سیسټم" }
      : { en: "The AI review", fa: "بررسی هوش مصنوعی", ps: "د مصنوعي ځیرکتیا ارزونې" }
  const outcomes = {
    VIOLATION: {
      en: "confirmed a policy violation.",
      fa: "نقض قانون را تأیید کرد.",
      ps: "د تګلارې سرغړونه تایید کړه.",
    },
    NO_VIOLATION: {
      en: "found no policy violation.",
      fa: "هیچ نقض قانونی پیدا نکرد.",
      ps: "د تګلارې سرغړونه یې ونه موندله.",
    },
    UNCERTAIN: {
      en: "could not reach a reliable conclusion.",
      fa: "نتوانست به نتیجه مطمئنی برسد.",
      ps: "باوري پایلې ته ونه رسېده.",
    },
  } as const

  return `${actorLabels[locale]} ${outcomes[outcome][locale]}`
}
