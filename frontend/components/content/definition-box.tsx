import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export interface DefinitionBoxProps {
    /**
     * The term being defined
     */
    term: string
    /**
     * The definition
     */
    definition: string
    /**
     * Optional examples
     */
    examples?: string[]
    /**
     * Optional related terms
     */
    relatedTerms?: string[]
}

/**
 * DefinitionBox Component for AEO
 * 
 * Highlighted definition box for technical terms and concepts.
 * Helps AI engines understand context and improve content comprehension.
 * 
 * Best practices:
 * - Define terms clearly without circular definitions
 * - Provide practical examples when possible
 * - Link related terms for context
 * - Use simple, accessible language
 */
export function DefinitionBox({ term, definition, examples, relatedTerms }: DefinitionBoxProps) {
    return (
        <Card className="border-l-4 border-l-primary bg-primary/5 mb-6">
            <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <h3 className="font-bold text-lg text-foreground">{term}</h3>
                        <p className="text-sm md:text-base leading-relaxed text-foreground">{definition}</p>

                        {examples && examples.length > 0 && (
                            <div className="pt-2">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Examples:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {examples.map((example, index) => (
                                        <li key={index}>{example}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {relatedTerms && relatedTerms.length > 0 && (
                            <div className="pt-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Related: {relatedTerms.join(", ")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
