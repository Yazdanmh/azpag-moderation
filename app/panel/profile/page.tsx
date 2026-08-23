import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { KeyRoundIcon, MailIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProfileEditForm } from "@/components/forms/profile-edit-form"
import { ResultState } from "@/components/moderation/shared"
import { getSession } from "@/lib/auth/session"
import { isLocale } from "@/lib/i18n"
import { profileDictionaries } from "@/lib/profile/i18n"
import { getMyProfile, profileImageUrl } from "@/lib/profile/api"
import { ApiResponseError } from "@/lib/moderation/utils"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")
  const localeValue = (await cookies()).get("azpag_locale")?.value
  const locale = isLocale(localeValue) ? localeValue : "fa"
  const t = profileDictionaries[locale]
  let profile
  try {
    profile = await getMyProfile(session.accessToken)
  } catch (error) {
    if (error instanceof ApiResponseError && error.status === 401) {
      redirect("/auth/refresh?returnTo=%2Fpanel%2Fprofile")
    }
    return <main className="flex flex-1 p-4 md:p-6"><ResultState title={t.loadError} description={error instanceof Error ? error.message : t.loadError} retry fill /></main>
  }
  const firstName = profile.first_name?.trim() || ""
  const name = firstName || session.name
  const email = profile.email || session.email
  const image = profileImageUrl(profile) || session.image
  const roles = profile.roles ?? (profile.role ? [profile.role] : session.roles)
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U"
  const roleLabels: Record<string, string> = { MANAGER: t.manager, ADMIN: t.admin, SUPERADMIN: t.superadmin }

  return <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
    <div><h1 className="text-2xl font-semibold">{t.profile}</h1><p className="text-muted-foreground">{t.profileDescription}</p></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t.accountInformation}</CardTitle>
            <Dialog>
              <DialogTrigger render={<Button type="button" variant="outline" />}>{t.editProfile}</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.editProfile}</DialogTitle>
                  <DialogDescription>{t.profileDescription}</DialogDescription>
                </DialogHeader>
                <ProfileEditForm fullName={name} image={image} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-20">
              {image && <AvatarImage src={image} alt={name} />}
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-lg font-semibold">{name}</p>
                <p className="break-all text-sm text-muted-foreground">{email}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t.noProfileImage}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ShieldCheckIcon className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t.roles}</span>
                <div className="flex flex-wrap gap-2">{roles.map((role) => <Badge key={role} variant="secondary" className="h-7 rounded-md px-2.5 font-normal">{roleLabels[role] ?? role}</Badge>)}</div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info icon={UserRoundIcon} label={t.name} value={name} />
            <Info icon={MailIcon} label={t.email} value={email} />
          </div>
        </CardContent>
      </Card>
      <Card className="self-start">
        <CardHeader><CardTitle>{t.security}</CardTitle><CardDescription>{t.securityDescription}</CardDescription></CardHeader>
        <CardContent>
          <Link href={`/forgot-password?email=${encodeURIComponent(session.email)}`} className={buttonVariants({ className: "w-full" })}>
            <KeyRoundIcon />
            {t.changePassword}
          </Link>
        </CardContent>
      </Card>
    </div>
  </main>
}

function Info({ icon: Icon, label, value }: { icon: typeof UserRoundIcon; label: string; value: string }) {
  return <div className="rounded-md border p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" />{label}</div><div className="mt-2 break-words font-medium">{value}</div></div>
}
