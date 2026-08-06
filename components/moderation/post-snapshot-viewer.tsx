"use client"

import type { ReactNode } from "react"
import { EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/lib/i18n"
import type { ModerationPostSnapshot } from "@/lib/moderation/types"

const copy = {
  en: { rendered: "Rendered", json: "JSON", userPosts: "User posts", noPosts: "No previous posts", details: "View details", description: "Description", price: "Price", fields: "Post fields", revision: "Revision", images: "Images" },
  fa: { rendered: "نمایش", json: "JSON", userPosts: "اعلان‌های کاربر", noPosts: "اعلان قبلی وجود ندارد", details: "مشاهده جزئیات", description: "توضیحات", price: "قیمت", fields: "مشخصات اعلان", revision: "نسخه", images: "تصاویر" },
  ps: { rendered: "ښودنه", json: "JSON", userPosts: "د کارن اعلانونه", noPosts: "پخواني اعلانونه نشته", details: "جزئیات وګورئ", description: "تشریح", price: "بیه", fields: "د اعلان جزئیات", revision: "نسخه", images: "انځورونه" },
} satisfies Record<Locale, Record<string, string>>

export function PostSnapshotViewer({ snapshot, locale, json }: { snapshot: unknown; locale: Locale; json: ReactNode }) {
  const post = asSnapshot(snapshot)
  const t = copy[locale]

  return <Tabs defaultValue="rendered" className="gap-4">
    <TabsList>
      <TabsTrigger value="rendered">{t.rendered}</TabsTrigger>
      <TabsTrigger value="json">{t.json}</TabsTrigger>
    </TabsList>
    <TabsContent value="rendered">
      {post ? <div className="space-y-5">
        <section>
          <h3 className="mb-3 font-semibold">{t.userPosts}</h3>
          {post.userPosts.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {post.userPosts.map((userPost) => <Card key={userPost.id} className="gap-3 overflow-hidden py-0 pb-4">
              {userPost.images?.[0]?.url && <div className="aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={userPost.images[0].url} alt={userPost.title} className="size-full object-cover" />
              </div>}
              <CardHeader className="px-4"><CardTitle className="line-clamp-2 text-base">{userPost.title}</CardTitle>{userPost.description && <CardDescription className="line-clamp-3">{userPost.description}</CardDescription>}</CardHeader>
              <CardContent className="mt-auto px-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{formatPrice(userPost.price, locale) || "—"}</span>
                  <UserPostDialog post={userPost} locale={locale} />
                </div>
              </CardContent>
            </Card>)}
          </div> : <p className="text-sm text-muted-foreground">{t.noPosts}</p>}
        </section>
      </div> : json}
    </TabsContent>
    <TabsContent value="json">{json}</TabsContent>
  </Tabs>
}

function UserPostDialog({ post, locale }: { post: ModerationPostSnapshot["userPosts"][number]; locale: Locale }) {
  const t = copy[locale]
  const fields = Object.entries(post.fields ?? {})
    .map(([key, value]) => renderedField(key, value, locale))
    .sort((a, b) => a.order - b.order)
  return <Dialog>
    <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}><EyeIcon />{t.details}</DialogTrigger>
    <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>{post.title}</DialogTitle><DialogDescription>{post.id}</DialogDescription></DialogHeader>
      <div className="space-y-5">
        {post.images?.length ? <div><div className="mb-2 text-sm font-medium">{t.images}</div><ImageGallery images={post.images} title={post.title} className="grid-cols-2 sm:grid-cols-3" /></div> : null}
        <Detail label={t.description} value={post.description || "—"} />
        <Detail label={t.price} value={formatPrice(post.price, locale) || "—"} />
        <div>
          <div className="mb-2 text-sm font-medium">{t.fields}</div>
          {fields.length ? <div className="divide-y rounded-md border px-4">
            {fields.map((field, index) => <div key={`${field.label}-${index}`} className="grid grid-cols-2 gap-4 py-3 text-sm">
              <span className="text-muted-foreground">{field.label}</span>
              <span className="text-end font-medium break-words">{field.value}</span>
            </div>)}
          </div> : <p className="text-sm text-muted-foreground">—</p>}
        </div>
      </div>
    </DialogContent>
  </Dialog>
}

function ImageGallery({ images, title, className }: { images: Array<{ id?: string; url: string }>; title: string; className: string }) {
  return <div className={`grid gap-3 ${className}`}>
    {images.map((image, index) => <a key={image.id ?? `${image.url}-${index}`} href={image.url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden rounded-md border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={`${title} ${index + 1}`} className="size-full object-cover transition-transform hover:scale-105" />
    </a>)}
  </div>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><div className="text-sm font-medium">{label}</div><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{value}</p></div>
}

function asSnapshot(value: unknown): ModerationPostSnapshot | null {
  if (!value || typeof value !== "object") return null
  const post = value as Partial<ModerationPostSnapshot>
  if (typeof post.title !== "string") return null
  return {
    ...post,
    revision: typeof post.revision === "number" ? post.revision : 0,
    images: Array.isArray(post.images) ? post.images : [],
    userPosts: Array.isArray(post.userPosts) ? post.userPosts : [],
  } as ModerationPostSnapshot
}

function formatPrice(price: ModerationPostSnapshot["price"], locale: Locale) {
  return price?.value === null || price?.value === undefined ? "" : `${price.value.toLocaleString(locale)} ${price.currency ?? ""}`.trim()
}

function renderedField(key: string, raw: unknown, locale: Locale) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { label: key.replaceAll("_", " "), value: displayValue(raw), order: Number.MAX_SAFE_INTEGER }
  }
  const field = raw as Record<string, unknown>
  const label = localizedText(field.translations, locale, key.replaceAll("_", " "))
  const selected = Array.isArray(field.options)
    ? field.options.find((option) => option && typeof option === "object" && (
        (option as Record<string, unknown>).selected === true ||
        String((option as Record<string, unknown>).value) === String(field.value)
      )) as Record<string, unknown> | undefined
    : undefined
  const value = selected
    ? localizedText(selected.translations, locale, displayValue(selected.value ?? field.value))
    : displayValue(field.value)
  const currency = typeof field.currency === "string" ? field.currency.trim() : ""
  return { label, value: currency && value !== "—" ? `${value} ${currency}` : value, order: typeof field.order === "number" ? field.order : Number.MAX_SAFE_INTEGER }
}

function localizedText(translations: unknown, locale: Locale, fallback: string) {
  if (!Array.isArray(translations)) return fallback
  const aliases = locale === "fa" ? ["fa", "prs", "dari"] : [locale]
  for (const language of aliases) {
    const match = translations.find((entry) => entry && typeof entry === "object" && String((entry as Record<string, unknown>).language).toLowerCase() === language) as Record<string, unknown> | undefined
    if (typeof match?.value === "string" && match.value.trim()) return match.value
  }
  return fallback
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.map(displayValue).join(", ")
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(displayValue).filter((item) => item !== "—").join(" – ") || "—"
  return String(value)
}
