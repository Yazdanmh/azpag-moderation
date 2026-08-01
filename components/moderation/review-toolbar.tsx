"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FilterIcon, RefreshCwIcon, SearchIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type FilterDefinition = {
  name: string
  value?: string
  label: string
  values: readonly string[]
}

type Labels = {
  search: string
  refresh: string
  filters: string
  filtersDescription: string
  reviewerId: string
  from: string
  to: string
  apply: string
  clear: string
  perPage: string
}

export function ReviewToolbar({
  query,
  pageSize,
  filters,
  optionLabels,
  labels,
  reviewerId,
  dateFrom,
  dateTo,
}: {
  query?: string
  pageSize: number
  filters: FilterDefinition[]
  optionLabels: Record<string, string>
  labels: Labels
  reviewerId?: string
  dateFrom?: string
  dateTo?: string
}) {
  const router = useRouter()
  const [refreshing, startTransition] = React.useTransition()
  const activeCount = filters.filter(({ name, value }) => Boolean(value) && !(name === "sort" && value === "newest")).length
    + (reviewerId ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)
  const changePageSize = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(window.location.search)
    params.set("pageSize", value)
    params.set("page", "1")
    startTransition(() => router.push(`/panel/reviews?${params.toString()}`))
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row">
      <form className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="query" defaultValue={query} placeholder={labels.search} className="pe-24 ps-9" />
        <input type="hidden" name="pageSize" value={pageSize} />
        {filters.map(({ name, value }) => value && <input key={name} type="hidden" name={name} value={value} />)}
        {reviewerId && <input type="hidden" name="reviewerId" value={reviewerId} />}
        {dateFrom && <input type="hidden" name="dateFrom" value={dateFrom} />}
        {dateTo && <input type="hidden" name="dateTo" value={dateTo} />}
        <Button type="submit" size="sm" className="absolute end-1 top-1/2 h-9 -translate-y-1/2 px-3">
          {labels.search}
        </Button>
      </form>

      <div className="flex min-w-0 gap-2">
        <Select value={String(pageSize)} onValueChange={changePageSize}>
          <SelectTrigger className="min-w-28" aria-label={labels.perPage} title={labels.perPage}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>{size} {labels.perPage}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          title={labels.refresh}
          aria-label={labels.refresh}
          disabled={refreshing}
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCwIcon className={cn("size-4", refreshing && "animate-spin")} />
        </Button>

        <Dialog>
          <DialogTrigger render={<Button type="button" variant="outline" className="flex-1 sm:flex-none" />}>
            <FilterIcon className="size-4" />
            {labels.filters}
            {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.filters}</DialogTitle>
              <DialogDescription>{labels.filtersDescription}</DialogDescription>
            </DialogHeader>
            <form className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="query" value={query ?? ""} />
              <input type="hidden" name="pageSize" value={pageSize} />
              {filters.map((filter) => (
                <div key={filter.name} className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{filter.label}</label>
                  <Select name={filter.name} defaultValue={filter.value ?? null}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value={null}>{filter.label}</SelectItem>
                      {filter.values.map((item) => (
                        <SelectItem key={item} value={item}>
                          {optionLabels[item] ?? item.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label htmlFor="reviewerId" className="text-sm font-medium">{labels.reviewerId}</label>
                <Input id="reviewerId" name="reviewerId" defaultValue={reviewerId} placeholder={labels.reviewerId} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <div className="flex flex-col gap-2"><label htmlFor="dateFrom" className="text-sm font-medium">{labels.from}</label><Input id="dateFrom" name="dateFrom" type="date" defaultValue={dateFrom?.slice(0, 10)} /></div>
                <div className="flex flex-col gap-2"><label htmlFor="dateTo" className="text-sm font-medium">{labels.to}</label><Input id="dateTo" name="dateTo" type="date" defaultValue={dateTo?.slice(0, 10)} /></div>
              </div>
              <DialogFooter className="mt-2 sm:col-span-2">
                <Link href="/panel/reviews" className={buttonVariants({ variant: "outline" })}>{labels.clear}</Link>
                <Button type="submit">{labels.apply}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
