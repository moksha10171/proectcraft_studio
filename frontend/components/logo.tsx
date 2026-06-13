import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
  variant?: "default" | "minimal"
}

/** Local logo from /public — no external hostname required */
const LOGO_SRC = "/icon.svg"

export function Logo({
  className,
  width = 36,
  height = 36,
  showText = true,
  variant = "default",
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 transition-opacity hover:opacity-80 select-none", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-primary/10 flex items-center justify-center",
          variant === "minimal" && "bg-transparent p-0 rounded-none"
        )}
        style={{ width, height }}
      >
        <Image
          src={LOGO_SRC}
          alt="ProjectCraft Logo"
          width={width}
          height={height}
          unoptimized
          className={cn("object-contain", variant === "default" && "p-1.5")}
        />
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight">
          Project<span className="text-primary">Craft</span>
        </span>
      )}
    </div>
  )
}
