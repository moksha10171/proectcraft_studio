"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Box, RotateCw, ZoomIn, Cpu } from "lucide-react"

interface RaspberryPi3DViewerProps {
  componentName: string
  componentSlug: string
  sketchfabId?: string
  compact?: boolean
}

export function RaspberryPi3DViewer({
  componentName,
  componentSlug,
  sketchfabId,
  compact = false
}: RaspberryPi3DViewerProps) {
  // If no 3D model, don't render
  if (!sketchfabId) {
    return null
  }

  return (
    <section className={compact ? "" : "border-b border-border bg-gradient-to-br from-pink-500/5 to-transparent"}>
      <div className={compact ? "" : "container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12"}>
        {!compact && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
              <Box className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">3D Visualization</h2>
              <p className="text-sm text-muted-foreground">
                Interactive 3D model for better component understanding
              </p>
            </div>
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
            {/* Sketchfab Embed */}
            <div className="aspect-video w-full">
              <iframe
                title={`3D model of ${componentName}`}
                className="w-full h-full"
                src={`https://sketchfab.com/models/${sketchfabId}/embed?autostart=1&ui_theme=dark&ui_hint=0&ui_infos=0`}
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
              />
            </div>

            {/* Info Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-pink-500/90 text-white backdrop-blur-sm">
                <ZoomIn className="h-3 w-3 mr-1" />
                Interactive 3D
              </Badge>
            </div>
          </div>

          {/* Controls Info */}
          <div className="p-4 bg-muted/30 border-t border-border">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center">
                  🖱️
                </div>
                <span>Click & drag to rotate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center">
                  🔍
                </div>
                <span>Scroll to zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-background border border-border flex items-center justify-center">
                  ⌨️
                </div>
                <span>Right-click & drag to pan</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Attribution */}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          3D model powered by{" "}
          <a
            href={`https://sketchfab.com/3d-models/${sketchfabId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 dark:text-pink-400 hover:underline"
          >
            Sketchfab
          </a>
        </p>

        {/* Benefits - Hide in compact mode */}
        {!compact && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="p-4 bg-pink-500/5 border-pink-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-sm">Explore Hardware</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Understand Raspberry Pi components and ports before purchasing
              </p>
            </Card>

            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <RotateCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm">Interactive Learning</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Rotate and zoom to explore every detail of the board
              </p>
            </Card>

            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-sm">Compare Models</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare different Pi models to choose the right one for your project
              </p>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
