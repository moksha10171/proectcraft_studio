import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"

export interface AnswerFirstSummaryProps {
    /**
     * The main answer text (100-200 words for optimal AI extraction)
     */
    answer: string
    /**
     * Optional title override (defaults to "Quick Answer")
     */
    title?: string
    /**
     * Optional highlight color variant
     */
    variant?: "default" | "primary" | "success"
    /**
     * Show icon
     */
    showIcon?: boolean
}

/**
 * AnswerFirstSummary Component for AEO
 * 
 * Displays a concise, direct answer at the top of pages to improve
 * citation in AI-powered search engines. This component should contain
 * the most important information users are seeking.
 * 
 * Best practices:
 * - Keep answer between 100-200 words
 * - Lead with the most direct answer possible
 * - Use clear, conversational language
 * - Include key facts and statistics
 * - Avoid jargon without definitions
 */
export function AnswerFirstSummary({
    answer,
    title = "Quick Answer",
    variant = "default",
    showIcon = true,
}: AnswerFirstSummaryProps) {
    const variantStyles = {
        default: "border-border bg-card",
        primary: "border-primary/30 bg-primary/5",
        success: "border-teal-500/30 bg-teal-500/5",
    }

    return (
        <Card className={`${variantStyles[variant]} mb-8`}>
            <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                    {showIcon && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>
                    )}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {title}
                            </Badge>
                        </div>
                        <div className="text-sm md:text-base leading-relaxed text-foreground">
                            {answer}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
