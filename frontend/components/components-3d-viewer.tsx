"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, ChevronLeft, ChevronRight, Zap } from "lucide-react"

interface Components3DViewerProps {
  componentName: string
  componentSlug: string
  images?: {
    url: string
    angle: string
    alt: string
  }[]
  compact?: boolean
}

export function Components3DViewer({ 
  componentName, 
  componentSlug, 
  images = [],
  compact = false
}: Components3DViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const hasImages = images.length > 0

  if (!hasImages) {
    return null
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <section className={compact ? "" : "border-b border-border bg-gradient-to-br from-amber-500/5 to-transparent"}>
      <div className={compact ? "" : "container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12"}>
        {!compact && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Component Visualization</h2>
              <p className="text-sm text-muted-foreground">
                High-resolution images and schematic symbols
              </p>
            </div>
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <div className="aspect-video w-full flex items-center justify-center p-8">
              <img
                src={images[currentImageIndex].url}
                alt={images[currentImageIndex].alt}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg touch-action-manipulation active:scale-95"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg touch-action-manipulation active:scale-95"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-500/90 text-white backdrop-blur-sm">
                {images[currentImageIndex].angle}
              </Badge>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="backdrop-blur-sm">
                {currentImageIndex + 1} / {images.length}
              </Badge>
            </div>
          </div>

          {images.length > 1 && (
            <div className="p-4 bg-muted/30 border-t border-border">
              <div className="flex gap-2 overflow-x-auto scrollbar-thin">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all touch-action-manipulation ${
                      index === currentImageIndex
                        ? "border-amber-500 ring-2 ring-amber-500/20"
                        : "border-border hover:border-amber-500/50"
                    }`}
                    aria-label={`View ${image.angle}`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {index === currentImageIndex && (
                      <div className="absolute inset-0 bg-amber-500/10" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          High-resolution images showing component details and schematic symbols
        </p>

        {!compact && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="p-4 bg-amber-500/5 border-amber-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-sm">Visual Learning</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Understand component structure, polarity, and pin configuration
              </p>
            </Card>

            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-sm">Multiple Angles</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                View components from different perspectives and see schematic symbols
              </p>
            </Card>

            <Card className="p-4 bg-purple-500/5 border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-sm">Circuit Design</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Learn proper component usage and circuit integration techniques
              </p>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
