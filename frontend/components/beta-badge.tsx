import { cn } from "@/lib/utils"

interface BetaBadgeProps {
    className?: string
    size?: "sm" | "md"
}

export function BetaBadge({ className, size = "md" }: BetaBadgeProps) {
    return (
        <span
            className={cn(
                "font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full uppercase tracking-wide border border-teal-500/20",
                size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5",
                className
            )}
        >
            Beta
        </span>
    )
}
