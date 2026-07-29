import type { Locale } from "@/lib/i18n"

type LocalizedLabel = Record<Locale, string>

const ruleLabels: Record<string, LocalizedLabel> = {
  country_forbidden_goods: { en: "Forbidden goods", fa: "کالاهای ممنوعه", ps: "منع شوي توکي" },
  country_political_content: { en: "Political or religious content", fa: "محتوای سیاسی یا مذهبی", ps: "سیاسي یا مذهبي منځپانګه" },
  country_immoral_content: { en: "Immoral or dangerous content", fa: "محتوای غیراخلاقی یا خطرناک", ps: "غیراخلاقي یا خطرناکه منځپانګه" },
  country_noncommercial_use: { en: "Non-commercial use", fa: "استفاده غیرتجاری", ps: "غیر سوداګریزه کارونه" },
  product_duplicate_post: { en: "Duplicate post", fa: "آگهی تکراری", ps: "تکراري اعلان" },
  product_unrelated_content: { en: "Unrelated content", fa: "محتوای نامرتبط", ps: "نامرتبطه منځپانګه" },
  product_unspecified_subject: { en: "Unspecified product or service", fa: "کالا یا خدمت نامشخص", ps: "نامعلوم توکی یا خدمت" },
  product_incorrect_category: { en: "Incorrect category", fa: "دسته‌بندی نادرست", ps: "ناسمه کټګوري" },
  product_contact_in_content: { en: "Contact information in content", fa: "اطلاعات تماس در محتوا", ps: "په منځپانګه کې د اړیکې معلومات" },
  product_external_link: { en: "External link", fa: "لینک خارجی", ps: "بهرنۍ اړیکه" },
  product_invalid_price: { en: "Invalid or test price", fa: "قیمت نامعتبر یا آزمایشی", ps: "ناسمه یا ازمایښتي بیه" },
}

const fieldLabels: Record<string, LocalizedLabel> = {
  fields: { en: "Post details", fa: "جزئیات آگهی", ps: "د اعلان جزئیات" },
  title: { en: "Title", fa: "عنوان", ps: "سرلیک" },
  description: { en: "Description", fa: "توضیحات", ps: "تشریح" },
  images: { en: "Images", fa: "تصاویر", ps: "انځورونه" },
  user_posts: { en: "User posts", fa: "آگهی‌های کاربر", ps: "د کارن اعلانونه" },
  categories: { en: "Categories", fa: "دسته‌بندی‌ها", ps: "کټګورۍ" },
  price: { en: "Price", fa: "قیمت", ps: "بیه" },
}

function fallback(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function localizedModerationDefinition(
  definition: { ruleId: string; field: string },
  locale: Locale,
) {
  const ruleKey = definition.ruleId.trim().toLocaleLowerCase()
  const fieldKey = definition.field.trim().toLocaleLowerCase()
  const rule = ruleLabels[ruleKey]?.[locale] ?? fallback(definition.ruleId)
  const field = fieldLabels[fieldKey]?.[locale] ?? fallback(definition.field)
  return { definition: `${rule} — ${field}`, rule, field }
}
