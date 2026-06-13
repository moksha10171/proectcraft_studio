"use client"

import { APP_CONFIG } from "@/lib/config"

interface SoftwareApplicationSchemaProps {
  name: string
  description: string
  url: string
  category?: string
  downloadUrl?: string
  rating?: number | null
  ratingCount?: number | null
  author?: string
  datePublished?: string
  dateModified?: string
  keywords?: string[]
  operatingSystem?: string
  applicationCategory?: string
  softwareVersion?: string
}

export function SoftwareApplicationSchema({
  name,
  description,
  url,
  downloadUrl,
  rating,
  ratingCount,
  datePublished,
  dateModified,
  keywords = [],
  operatingSystem = "Any",
  applicationCategory = "Educational",
  softwareVersion,
}: SoftwareApplicationSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name,
    description,
    url,
    codeRepository: downloadUrl,
    programmingLanguage: keywords.slice(0, 3),
    author: { "@id": `${APP_CONFIG.url}/#organization` },
    publisher: { "@id": `${APP_CONFIG.url}/#organization` },
    applicationCategory,
    operatingSystem,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
    isAccessibleForFree: true,
  }

  if (datePublished) schema.datePublished = datePublished
  if (dateModified) schema.dateModified = dateModified
  if (softwareVersion) schema.softwareVersion = softwareVersion

  if (rating && ratingCount && ratingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      ratingCount,
      bestRating: "5",
      worstRating: "1",
    }
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

interface FAQItem {
  question: string
  answer: string
}

export function FAQPageSchema({ faqs, url = `${APP_CONFIG.url}/faq` }: { faqs: FAQItem[]; url?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
    url,
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function BreadcrumbListSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function ArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  author = "ProjectCraft Contributors",
  keywords = [],
  image,
}: {
  headline: string
  description: string
  url: string
  datePublished?: string
  dateModified?: string
  author?: string
  keywords?: string[]
  image?: string
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    description,
    url,
    author: { "@type": "Organization", name: author, url: APP_CONFIG.url },
    publisher: { "@id": `${APP_CONFIG.url}/#organization` },
    isAccessibleForFree: true,
    keywords: keywords.join(", "),
  }
  if (datePublished) schema.datePublished = datePublished
  if (dateModified) schema.dateModified = dateModified
  if (image) schema.image = image
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function ProjectListSchema({
  projects,
  name = "Featured Coding Projects",
  description = "Popular free coding projects and tutorials",
}: {
  projects: Array<{
    id: string | number
    title: string
    description: string
    shortDescription?: string
    slug: string
    viewCount: number
    downloadCount: number
    technologies?: string[]
  }>
  name?: string
  description?: string
}) {
  if (!projects?.length) return null

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareSourceCode",
        "@id": `${APP_CONFIG.url}/projects/${project.slug}`,
        name: project.title,
        description: project.shortDescription || project.description,
        url: `${APP_CONFIG.url}/projects/${project.slug}`,
        programmingLanguage: project.technologies?.slice(0, 3) || [],
        isAccessibleForFree: true,
        publisher: { "@id": `${APP_CONFIG.url}/#organization` },
      },
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export function CollectionPageSchema({
  name,
  description,
  url = APP_CONFIG.url,
  image = `${APP_CONFIG.url}/og-image.png`,
}: {
  name: string
  description: string
  url?: string
  image?: string
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}/#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": `${APP_CONFIG.url}/#website` },
    about: { "@type": "Thing", name: "Software Development Education" },
    primaryImageOfPage: { "@type": "ImageObject", url: image },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
