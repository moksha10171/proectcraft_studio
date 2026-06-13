import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export interface KeyTakeawaysProps {
    /**
     * List of key takeaway points (3-8 items recommended)
     */
    takeaways: string[]
    /**
     * Optional title override
     */
    title?: string
    /**
     * Show checkmark icons
     */
    showIcons?: boolean
}

/**
 * KeyTakeaways Component for AEO
 * 
 * Displays scannable bullet points highlighting the main value or
 * outcomes of the content. Optimized for AI extraction and user scanning.
 * 
 * Best practices:
 * - Keep to 3-8 items
 * - Make each point concise (1-2 lines max)
 * - Start with action verbs or benefits
 * - Use parallel structure
 * - Highlight quantifiable outcomes when possible
 */
export function KeyTakeaways({ takeaways, title = "Key Takeaways", showIcons = true }: KeyTakeawaysProps) {
    return (
        <Card className="border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent mb-8">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    {showIcons && <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3" role="list">
                    {takeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start gap-3">
                            {showIcons && (
                                <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
                            )}
                            <span className="text-sm md:text-base leading-relaxed text-foreground">{takeaway}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
