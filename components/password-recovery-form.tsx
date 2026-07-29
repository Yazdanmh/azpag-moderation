"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"
import {
  forgotStaffPassword,
  resetStaffPassword,
  type PasswordRecoveryState,
} from "@/app/actions"
import { useI18n } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { passwordRecoveryDictionaries } from "@/lib/password-recovery-i18n"

function SubmitButton({ idle, pendingText }: { idle: string; pendingText: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>
    {pending && <LoaderCircleIcon className="animate-spin" />}
    {pending ? pendingText : idle}
  </Button>
}

function FormHeading({ title, description }: { title: string; description: string }) {
  return <div className="text-center">
    <Image src="/logo.png" alt="Azpag" width={56} height={56} className="mx-auto mb-5 size-16 object-contain" priority />
    <CardTitle className="text-2xl">{title}</CardTitle>
    <CardDescription className="mt-2 text-sm">{description}</CardDescription>
  </div>
}

function BackLink({ label, href }: { label: string; href: string }) {
  return <Button variant="ghost" nativeButton={false} render={<Link href={href} />} className="w-full">
    <ArrowLeftIcon className="rtl:rotate-180" />
    {label}
  </Button>
}

export function ForgotPasswordForm({ initialEmail, isAuthenticated = false }: { initialEmail?: string; isAuthenticated?: boolean }) {
  const { locale, dictionary } = useI18n()
  const t = passwordRecoveryDictionaries[locale]
  const [state, formAction] = useActionState(forgotStaffPassword, {} as PasswordRecoveryState)

  React.useEffect(() => {
    if (state.error) toast.error(state.error.title, { description: state.error.description })
  }, [state.error])

  return <div className="flex flex-col gap-8">
    <FormHeading title={t.forgotTitle} description={t.forgotDescription} />
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="recovery-email">{dictionary.email}</FieldLabel>
          <Input id="recovery-email" name="email" type="email" autoComplete="email" defaultValue={initialEmail} placeholder={dictionary.emailPlaceholder} required autoFocus />
        </Field>
        <Field><SubmitButton idle={t.sendCode} pendingText={t.sendingCode} /></Field>
      </FieldGroup>
    </form>
    <BackLink href={isAuthenticated ? "/panel/profile" : "/login"} label={isAuthenticated ? t.backToProfile : t.backToLogin} />
  </div>
}

export function ResetPasswordForm({ initialEmail, isAuthenticated = false }: { initialEmail?: string; isAuthenticated?: boolean }) {
  const router = useRouter()
  const { locale, dictionary } = useI18n()
  const t = passwordRecoveryDictionaries[locale]
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, formAction] = useActionState(resetStaffPassword, {} as PasswordRecoveryState)

  React.useEffect(() => {
    if (state.error) toast.error(state.error.title, { description: state.error.description })
    if (state.success) {
      toast.success(state.success.title, { description: state.success.description })
      router.replace("/login")
    }
  }, [router, state.error, state.success])

  return <div className="flex flex-col gap-8">
    <FormHeading title={t.resetTitle} description={t.resetDescription} />
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="reset-email">{dictionary.email}</FieldLabel>
          <Input id="reset-email" name="email" type="email" autoComplete="email" defaultValue={initialEmail} placeholder={dictionary.emailPlaceholder} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="reset-code">{t.code}</FieldLabel>
          <Input id="reset-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder={t.codePlaceholder} required autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">{t.newPassword}</FieldLabel>
          <div className="relative">
            <Input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={60} placeholder={t.newPasswordPlaceholder} className="pe-12" required />
            <Button type="button" variant="ghost" size="icon" className="absolute end-0 top-0" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? dictionary.hidePassword : dictionary.showPassword} aria-pressed={showPassword}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          <FieldDescription>{t.passwordRequirements}</FieldDescription>
        </Field>
        <Field><SubmitButton idle={t.resetPassword} pendingText={t.resettingPassword} /></Field>
      </FieldGroup>
    </form>
    <BackLink href={isAuthenticated ? "/panel/profile" : "/login"} label={isAuthenticated ? t.backToProfile : t.backToLogin} />
  </div>
}
