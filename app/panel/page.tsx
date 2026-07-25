import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cookies } from "next/headers"
import { dictionaries, isLocale } from "@/lib/i18n"

export default async function DashboardPage() {
  const value = (await cookies()).get("azpag_locale")?.value
  const t = dictionaries[isLocale(value) ? value : "fa"]
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.dashboard}</h1>
        <p className="text-muted-foreground">{t.welcome}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.overview}</CardTitle>
          <CardDescription>{t.workspaceReady}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.selectReviews}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
