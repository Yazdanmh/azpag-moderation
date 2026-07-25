"use client"

import * as React from "react"
import Image from "next/image"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { login, type LoginState } from "@/app/actions"
import { useI18n } from "@/components/providers"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <Image
            src="/logo.png"
            alt="Azpag"
            width={56}
            height={56}
            className="mx-auto mb-2 size-14 object-contain"
            priority
          />
          <CardTitle>{t.loginTitle}</CardTitle>
          <CardDescription>{t.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent>
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
                <FieldLabel htmlFor="password">{t.password}</FieldLabel>
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
        </CardContent>
      </Card>
    </div>
  )
}
