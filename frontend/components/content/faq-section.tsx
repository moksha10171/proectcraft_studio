"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, HelpCircle } from "lucide-react"
import type { FAQItem } from "@/components/seo/faq-schema"

export interface FAQSectionProps {
    /**
     * Array of FAQ items
     */
    faqs: FAQItem[]
    /**
     * Optional title override
     */
    title?: string
    /**
     * Show category grouping if categories are present
     */
    showCategories?: boolean
    /**
     * Default to all expanded or collapsed
     */
    defaultExpanded?: boolean
}

interface FAQItemComponentProps {
    faq: FAQItem
    isExpanded: boolean
    onToggle: () => void
}

function FAQItemComponent({ faq, isExpanded, onToggle }: FAQItemComponentProps) {
    return (
        <div className="border-b border-border last:border-0">
            <button
                onClick={onToggle}
                className="w-full flex items-start justify-between gap-4 py-4 text-left transition-colors hover:text-primary touch-manipulation no-tap-highlight"
                aria-expanded={isExpanded}
            >
                <div className="flex items-start gap-3 flex-1">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-medium text-base">{faq.question}</span>
                </div>
                <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                />
            </button>
            {isExpanded && (
                <div className="pb-4 pl-8 pr-4">
                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
            )}
        </div>
    )
}

/**
 * FAQSection Component for AEO
 * 
 * Interactive FAQ accordion optimized for AI engines and user experience.
 * Works in tandem with FAQSchema component for structured data.
 * 
 * Best practices:
 * - Use conversational question phrasing
 * - Provide direct, complete answers
 * - Keep answers to 2-4 sentences when possible
 * - Order by importance or common user journey
 * - Group by category if many FAQs
 */
export function FAQSection({ faqs, title = "Frequently Asked Questions", showCategories = false, defaultExpanded = false }: FAQSectionProps) {
    const [expandedIndices, setExpandedIndices] = useState<number[]>(
        defaultExpanded ? faqs.map((_, i) => i) : []
    )

    const toggleFAQ = (index: number) => {
        setExpandedIndices((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        )
    }

    // Group by category if enabled and categories exist
    const groupedFAQs = showCategories
        ? faqs.reduce(
            (acc, faq, index) => {
                const category = faq.category || "General"
                if (!acc[category]) {
                    acc[category] = []
                }
                acc[category].push({ faq, index })
                return acc
            },
            {} as Record<string, Array<{ faq: FAQItem; index: number }>>
        )
        : { "": faqs.map((faq, index) => ({ faq, index })) }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {Object.entries(groupedFAQs).map(([category, items]) => (
                    <div key={category} className="space-y-1">
                        {category && showCategories && (
                            <h3 className="text-lg font-semibold mt-6 mb-3 first:mt-0">{category}</h3>
                        )}
                        <div>
                            {items.map(({ faq, index }) => (
                                <FAQItemComponent
                                    key={index}
                                    faq={faq}
                                    isExpanded={expandedIndices.includes(index)}
                                    onToggle={() => toggleFAQ(index)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
