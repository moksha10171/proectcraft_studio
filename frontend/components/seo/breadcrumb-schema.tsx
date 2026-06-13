import type React from "react"

export interface BreadcrumbItem {
    /**
     * Display name for this breadcrumb
     */
    name: string
    /**
     * URL for this breadcrumb item
     */
    url: string
}

export interface BreadcrumbSchemaProps {
    /**
     * Array of breadcrumb items in order from home to current page
     */
    items: BreadcrumbItem[]
}

/**
 * BreadcrumbList Schema Component for Answer Engine Optimization (AEO)
 * 
 * Generates JSON-LD structured data for breadcrumb navigation.
 * Helps AI engines understand site hierarchy and page context.
 * 
 * @see https://schema.org/BreadcrumbList
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    if (!items || items.length === 0) {
        return null
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
    )
}

/**
 * Helper function to generate breadcrumb items from URL path
 * 
 * @example
 * generateBreadcrumbs('/resources/arduino/uno-guide', {
 *   'resources': 'Resources',
 *   'arduino': 'Arduino',
 *   'uno-guide': 'Arduino Uno Guide'
 * })
 */
export function generateBreadcrumbs(
    pathname: string,
    labels: Record<string, string>,
    baseUrl: string = "https://projectcraft.in"
): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            name: "Home",
            url: baseUrl,
        },
    ]

    const pathSegments = pathname.split("/").filter(Boolean)
    let currentPath = ""

    pathSegments.forEach((segment) => {
        currentPath += `/${segment}`
        const label = labels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

        breadcrumbs.push({
            name: label,
            url: `${baseUrl}${currentPath}`,
        })
    })

    return breadcrumbs
}
