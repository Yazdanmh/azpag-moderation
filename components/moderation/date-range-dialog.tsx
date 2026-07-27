"use client"

import Link from "next/link"
import { CalendarRangeIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function DateRangeDialog({
  dateFrom,
  dateTo,
  clearHref,
  hiddenFields,
  labels,
}: {
  dateFrom?: string
  dateTo?: string
  clearHref: string
  hiddenFields?: Record<string, string | number>
  labels: {
    trigger: string
    title: string
    description: string
    from: string
    to: string
    apply: string
    clear: string
  }
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <CalendarRangeIcon />
        {labels.trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-5">
          {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="date-range-from" className="text-sm font-medium">{labels.from}</label>
              <Input id="date-range-from" name="dateFrom" type="date" defaultValue={dateFrom?.slice(0, 10)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="date-range-to" className="text-sm font-medium">{labels.to}</label>
              <Input id="date-range-to" name="dateTo" type="date" defaultValue={dateTo?.slice(0, 10)} />
            </div>
          </div>
          <DialogFooter>
            <Link href={clearHref} className={buttonVariants({ variant: "outline" })}>{labels.clear}</Link>
            <Button type="submit">{labels.apply}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
