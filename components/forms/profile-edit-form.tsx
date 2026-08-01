"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { CameraIcon, LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { updateProfile, type ProfileFormState } from "@/app/panel/profile/actions"
import { useI18n } from "@/components/providers/app-providers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { profileDictionaries } from "@/lib/profile/i18n"

function SaveButton({ idle, pendingText }: { idle: string; pendingText: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>
    {pending && <LoaderCircleIcon className="animate-spin" />}
    {pending ? pendingText : idle}
  </Button>
}

export function ProfileEditForm({
  fullName,
  image,
}: {
  fullName: string
  image: string
}) {
  const { locale } = useI18n()
  const t = profileDictionaries[locale]
  const [preview, setPreview] = React.useState(image)
  const [state, formAction] = useActionState(updateProfile, {} as ProfileFormState)
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U"

  React.useEffect(() => {
    if (state.error) toast.error(state.error.title, { description: state.error.description })
    if (state.success) toast.success(state.success.title, { description: state.success.description })
  }, [state.error, state.success])

  React.useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview)
  }, [preview])

  return <form action={formAction} className="space-y-6">
    <input type="hidden" name="locale" value={locale} />
    <div className="flex justify-center">
      <label htmlFor="profile-image" className="group relative cursor-pointer rounded-full" title={t.profilePhoto}>
        <Avatar className="size-24">
          {preview && <AvatarImage src={preview} alt={fullName} />}
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 end-0 grid size-9 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
          <CameraIcon className="size-4" />
        </span>
        <Input
          id="profile-image"
          name="image"
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            setPreview((current) => {
              if (current.startsWith("blob:")) URL.revokeObjectURL(current)
              return URL.createObjectURL(file)
            })
          }}
        />
        <span className="sr-only">{t.profilePhoto}</span>
      </label>
    </div>
    <p className="text-center text-xs text-muted-foreground">{t.photoHelp}</p>
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="first-name">{t.firstName}</FieldLabel>
        <Input id="first-name" name="first_name" defaultValue={fullName} minLength={2} maxLength={60} required />
      </Field>
    </FieldGroup>
    <SaveButton idle={t.saveChanges} pendingText={t.saving} />
  </form>
}
