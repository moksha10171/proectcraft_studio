/**
 * Resource type definitions for resource pages
 */

export interface ResourceItem {
  id?: string // Optional - slug is used as identifier in some resources
  name: string
  slug: string
  shortDesc: string
  fullDescription?: string
  category: string
  icon?: string
  website?: string
  github?: string
  documentation?: string
  license?: string
  pricing?: string
  specifications?: Record<string, string | number | boolean | undefined>
  features?: Record<string, string>
  useCases?: string[]
  bestPractices?: string[]
  codeSnippet?: {
    language: string
    title?: string
    code: string
    description?: string
  }
  alternatives?: string[] // Array of alternative framework slugs/names
  tutorials?: Array<{
    title: string
    url: string
    description?: string
  }>
  tags?: string[]
  difficulty?: string
  rating?: number
}

export interface ResourceData {
  overview?: {
    title: string
    description: string
    totalComponents: number
    categories: string[]
  }
  resources: ResourceItem[]
}
