"use client"

import { APP_CONFIG } from "@/lib/config"

interface OrganizationSchemaProps {
  name?: string
  url?: string
  logo?: string
  description?: string
  sameAs?: string[]
}

export function OrganizationSchema({
  name = APP_CONFIG.name,
  url = APP_CONFIG.url,
  logo = `${APP_CONFIG.url}/icon.svg`,
  description = "Open-source learning hub for developers with coding projects, AI tools, and virtual hardware testing.",
  sameAs = [APP_CONFIG.githubUrl],
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name,
    url,
    logo: { "@type": "ImageObject", url: logo, caption: name },
    image: logo,
    description,
    sameAs,
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}

interface WebSiteSchemaProps {
  name?: string
  url?: string
  description?: string
}

export function WebSiteSchema({
  name = APP_CONFIG.name,
  url = APP_CONFIG.url,
  description = "Open-source learning hub for developers.",
}: WebSiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
    publisher: { "@id": `${url}/#organization` },
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}

// Re-export remaining schema components from original file
export {
  SoftwareApplicationSchema,
  FAQPageSchema,
  BreadcrumbListSchema,
  ArticleSchema,
  ProjectListSchema,
  CollectionPageSchema,
} from "@/components/seo/json-ld-schemas"
