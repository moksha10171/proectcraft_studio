import type React from "react"

export interface FAQItem {
    question: string
    answer: string
    /**
     * Optional category for grouping FAQs
     */
    category?: string
}

export interface FAQSchemaProps {
    faqs: FAQItem[]
    /**
     * Page title for the FAQ context
     */
    pageTitle?: string
}

/**
 * FAQPage Schema Component for Answer Engine Optimization (AEO)
 * 
 * Generates JSON-LD structured data for FAQ pages to improve
 * visibility in AI-powered search engines like ChatGPT, Perplexity,
 * Claude, and Google AI Overviews.
 * 
 * @see https://schema.org/FAQPage
 */
export function FAQSchema({ faqs, pageTitle }: FAQSchemaProps) {
    if (!faqs || faqs.length === 0) {
        return null
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        ...(pageTitle && { name: pageTitle }),
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
    )
}

/**
 * Hook to help generate FAQ data from common question patterns
 */
export function useFAQGenerator() {
    const generateFAQs = (data: Array<{ q: string; a: string; cat?: string }>): FAQItem[] => {
        return data.map((item) => ({
            question: item.q,
            answer: item.a,
            category: item.cat,
        }))
    }

    return { generateFAQs }
}
