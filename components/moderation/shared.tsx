"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ModerationLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export function ResultState({
  title,
  description,
  retry,
  retryLabel = "Retry",
  actionHref,
  fill = false,
}: {
  title: string
  description: string
  retry?: (() => void) | true
  retryLabel?: string
  actionHref?: string
  fill?: boolean
}) {
  const router = useRouter()
  const retryAction = retry === true ? () => router.refresh() : retry

  return (
    <Card className={fill ? "min-h-[calc(100vh-var(--header-height)-9rem)] w-full" : "w-full"}>
      <CardContent className={`flex flex-1 items-center justify-center p-6 ${fill ? "" : "min-h-64"}`}>
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="relative mb-5 grid size-16 place-items-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/70 motion-reduce:animate-none"
              style={{ animationDuration: "3s" }}
            />
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <AlertCircleIcon className="size-7" />
            </span>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
          {(retryAction || actionHref) && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {retryAction && (
                <Button onClick={retryAction}>
                  <RefreshCwIcon />
                  {retryLabel}
                </Button>
              )}
              {actionHref && !retryAction && <Link href={actionHref} className={buttonVariants()}>{retryLabel}</Link>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
