import { LoginForm } from "@/components/login-form"
import { LanguageSwitcher } from "@/components/language-switcher"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function Page() {
  if (await getSession()) redirect("/panel")
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="absolute end-6 top-6"><LanguageSwitcher /></div>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
