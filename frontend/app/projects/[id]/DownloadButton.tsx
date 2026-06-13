"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"

interface DownloadButtonProps {
  downloadUrl: string
  variant?: "default" | "outline"
  size?: "default" | "lg"
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export function DownloadButton({
  downloadUrl,
  variant = "default",
  size = "lg",
  className = "",
  showIcon = true,
  children,
}: DownloadButtonProps) {
  return (
    <Button size={size} variant={variant} className={className} asChild>
      <Link href={downloadUrl} target="_blank" rel="noopener noreferrer" aria-label="Download project (opens in new tab)">
        {showIcon && <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
        {children || "Download Project"}
        {showIcon && <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />}
      </Link>
    </Button>
  )
}
