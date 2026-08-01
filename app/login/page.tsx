import { LoginForm } from "@/components/forms/login-form"
import { LoginShowcase } from "@/components/auth/login-showcase"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function Page() {
  if (await getSession()) redirect("/panel")
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-2">
      <section className="relative flex min-h-svh items-center justify-center px-6 py-20 lg:col-start-1 lg:row-start-1 lg:px-12">
        <div className="absolute end-6 top-6 lg:end-8 lg:top-8">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
      <section className="hidden p-3 lg:col-start-2 lg:row-start-1 lg:block">
        <LoginShowcase />
      </section>
    </main>
  )
}
