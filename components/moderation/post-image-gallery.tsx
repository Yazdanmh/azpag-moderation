"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, Maximize2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type GalleryImage = {
  id: string
  src: string
  fullSrc: string
}

export function PostImageGallery({
  images,
  title,
  labels,
  locale,
  highlightedImageIds = [],
  moderationLabel,
}: {
  images: GalleryImage[]
  title: string
  locale: string
  labels: { previous: string; next: string; maximize: string; images: string; of: string }
  highlightedImageIds?: string[]
  moderationLabel?: string
}) {
  const [index, setIndex] = React.useState(0)
  const multiple = images.length > 1
  const current = images[index]
  const highlighted = new Set(highlightedImageIds)
  const currentIsHighlighted = current ? highlighted.has(current.id) : false

  const previous = React.useCallback(() => {
    setIndex((currentIndex) => (currentIndex - 1 + images.length) % images.length)
  }, [images.length])

  const next = React.useCallback(() => {
    setIndex((currentIndex) => (currentIndex + 1) % images.length)
  }, [images.length])

  if (!current) return null

  const controls = (
    <>
      {multiple && (
        <>
          <Button type="button" variant="secondary" size="icon" className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-sm" onClick={previous} aria-label={labels.previous}>
            <ChevronLeftIcon className="rtl:rotate-180" />
          </Button>
          <Button type="button" variant="secondary" size="icon" className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-sm" onClick={next} aria-label={labels.next}>
            <ChevronRightIcon className="rtl:rotate-180" />
          </Button>
        </>
      )}
    </>
  )

  return (
    <div className="space-y-3">
      <div className={`group relative overflow-hidden rounded-md border bg-muted ${currentIsHighlighted ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- backend image hosts are dynamic */}
        <img src={current.src} alt={`${title} ${index + 1}`} className="aspect-video w-full object-contain" />
        {controls}
        <div className="absolute end-3 top-3 flex items-center gap-2">
          {currentIsHighlighted && moderationLabel && <span className="rounded-md bg-destructive px-2 py-1 text-xs font-medium text-white shadow-sm">{moderationLabel}</span>}
          {multiple && <span className="rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur">{(index + 1).toLocaleString(locale)} {labels.of} {images.length.toLocaleString(locale)}</span>}
          <Dialog>
            <DialogTrigger render={<Button type="button" variant="secondary" size="icon" aria-label={labels.maximize} title={labels.maximize} />}>
              <Maximize2Icon />
            </DialogTrigger>
            <DialogContent className="max-w-[min(96vw,1200px)] p-3">
              <DialogHeader>
                <DialogTitle className="sr-only">{title} — {labels.images}</DialogTitle>
              </DialogHeader>
              <div className="relative grid min-h-[60vh] place-items-center overflow-hidden rounded-md bg-black/95">
                {/* eslint-disable-next-line @next/next/no-img-element -- backend image hosts are dynamic */}
                <img src={current.fullSrc} alt={`${title} ${index + 1}`} className="max-h-[82vh] max-w-full object-contain" />
                {controls}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {multiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`${labels.images} ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              className={`size-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-muted transition-colors aria-current:border-primary ${highlighted.has(image.id) ? "border-destructive ring-2 ring-destructive/20" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- backend image hosts are dynamic */}
              <img src={image.src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
