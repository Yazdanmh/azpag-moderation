import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cookies } from "next/headers"
import { dictionaries, isLocale } from "@/lib/i18n"

export default async function ReviewsPage() {
  const value = (await cookies()).get("azpag_locale")?.value
  const t = dictionaries[isLocale(value) ? value : "fa"]
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.reviews}</h1>
        <p className="text-muted-foreground">{t.reviewsDescription}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.contentReviews}</CardTitle>
          <CardDescription>{t.waitingItems}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.noItems}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
