"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Box, RotateCw, ZoomIn } from "lucide-react"

interface Arduino3DViewerProps {
  componentName: string
  componentSlug: string
  sketchfabId?: string
  compact?: boolean
}

// Mapping of Arduino components to their Sketchfab 3D model IDs
const SKETCHFAB_MODELS: Record<string, string> = {
  // Arduino Boards
  "arduino-uno": "943bae9bb86842408fc718b6e4c92ddb",
  "arduino-uno-r3": "837b21560cbb4468b03861f0db6ab4a6", // SMD version
  "arduino-nano": "a1f51d99f74a4311af5db9f4b7ebdd3c",
  "arduino-nano-every": "6753fa6843c84931a5fc8c734cc4c819",
  "arduino-micro": "0fa81cb46f6f4abd8a109296ec5a71cd",
  "arduino-leonardo": "8a466903cbdb4677853c1b3adbd4a351",
  "arduino-mega": "ee7a0fb70fba4e22bd0a5a6aaff1c497",
  "arduino-mega-2560": "ee7a0fb70fba4e22bd0a5a6aaff1c497",
}

export function Arduino3DViewer({
  componentName,
  componentSlug,
  sketchfabId,
  compact = false
}: Arduino3DViewerProps) {
  // Get Sketchfab model ID from slug or prop
  const modelId = sketchfabId || SKETCHFAB_MODELS[componentSlug]

  // If no 3D model, don't render
  if (!modelId) {
    return null
  }

  return (
    <section className={compact ? "" : "border-b border-border bg-gradient-to-br from-teal-500/5 to-transparent"}>
      <div className={compact ? "" : "container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12"}>
        {!compact && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
              <Box className="h-5 w-5 text-teal-600 dark:text-teal-400" />
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
                src={`https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_theme=dark&ui_hint=0&ui_infos=0`}
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
              />
            </div>

            {/* Info Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-teal-500/90 text-white backdrop-blur-sm">
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
            href={`https://sketchfab.com/3d-models/${modelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:underline"
          >
            Sketchfab
          </a>
        </p>

        {/* Benefits - Hide in compact mode */}
        {!compact && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="p-4 bg-teal-500/5 border-teal-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Box className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="font-semibold text-sm">Better Understanding</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Visualize component layout and pin positions before purchasing
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
                Rotate and zoom to explore every detail of the component
              </p>
            </Card>

            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-sm">Identify Components</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare with your physical components for accurate identification
              </p>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
