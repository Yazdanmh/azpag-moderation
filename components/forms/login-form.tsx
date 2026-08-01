"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { login, type LoginState } from "@/app/actions"
import { useI18n } from "@/components/providers/app-providers"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { passwordRecoveryDictionaries } from "@/lib/auth/password-recovery-i18n"

function SubmitButton({ idle, pending: pendingText }: { idle: string; pending: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircleIcon className="animate-spin" />}
      {pending ? pendingText : idle}
    </Button>
  )
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { locale, dictionary: t } = useI18n()
  const recovery = passwordRecoveryDictionaries[locale]
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, formAction] = useActionState(login, {} as LoginState)
  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error.title, {
        description: state.error.description,
      })
    }
  }, [state.error])

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="text-center">
          <Image
            src="/logo.png"
            alt="Azpag"
            width={56}
            height={56}
            className="mx-auto mb-5 size-16 object-contain"
            priority
          />
          <CardTitle className="text-2xl">{t.loginTitle}</CardTitle>
          <CardDescription className="mt-2 text-sm">{t.loginDescription}</CardDescription>
      </div>
      <div>
          <form action={formAction}>
            <input type="hidden" name="locale" value={locale} />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">{t.email}</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="password">{t.password}</FieldLabel>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">{recovery.forgotPassword}</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={t.passwordPlaceholder}
                    className="pe-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-0 top-0"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? t.hidePassword : t.showPassword
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>
              </Field>
              <Field>
                <SubmitButton idle={t.signIn} pending={t.signingIn} />
              </Field>
            </FieldGroup>
          </form>
      </div>
    </div>
  )
}
