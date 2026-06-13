import { Metadata } from 'next'
import { APP_CONFIG } from './config'

interface PageMetadataProps {
    title: string
    description: string
    path: string
    keywords?: string[]
    type?: 'website' | 'article'
    publishedTime?: string
    modifiedTime?: string
}

export function generatePageMetadata({
    title,
    description,
    path,
    keywords = [],
    type = 'website',
    publishedTime,
    modifiedTime,
}: PageMetadataProps): Metadata {
    const baseUrl = APP_CONFIG.url.replace(/\/$/, '')
    const url = `${baseUrl}${path}`
    const ogImage = `${baseUrl}/og-image.png`

    return {
        title,
        description,
        keywords: [...keywords, 'ProjectCraft', 'open source', 'self-hosted', 'developer resources'],
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            siteName: 'ProjectCraft',
            type,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            ...(publishedTime && { publishedTime }),
            ...(modifiedTime && { modifiedTime }),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
            creator: '@projectcraft',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    }
}

export function generateBreadcrumbs(pathname: string, customLabels: Record<string, string> = {}): Array<{ name: string; url: string }> {
    const baseUrl = APP_CONFIG.url.replace(/\/$/, '')
    const breadcrumbs: Array<{ name: string; url: string }> = [
        { name: 'Home', url: baseUrl },
    ]

    if (pathname === '/') return breadcrumbs

    const segments = pathname.split('/').filter(Boolean)
    let currentPath = ''

    const labelMap: Record<string, string> = {
        services: 'Services',
        about: 'About Us',
        contact: 'Contact',
        faq: 'FAQ',
        projects: 'Projects',
        categories: 'Categories',
        studio: 'Studio',
        build: 'Build',
        resources: 'Resources',
        'cost-calculator': 'Cost Calculator',
        search: 'Search',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        cookies: 'Cookie Policy',
        arduino: 'Arduino',
        'raspberry-pi': 'Raspberry Pi',
        esp32: 'ESP32',
        'web-development': 'Web Development',
        'ai-development': 'AI Development',
        components: 'Components',
        'hosting-deployment': 'Hosting & Deployment',
        ...customLabels
    }

    segments.forEach((segment) => {
        currentPath += `/${segment}`
        const label = labelMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

        breadcrumbs.push({
            name: label,
            url: `${baseUrl}${currentPath}`,
        })
    })

    return breadcrumbs
}
