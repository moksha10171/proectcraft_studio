// ProjectCraft Local API Client
// All data is served from local JSON files via Next.js API routes

import { fetchWithTimeout, logError } from './fetch-utils'
import type {
  APICategory,
  APIProject,
  CategoriesResponse,
  ProjectDetailResponse,
  ProjectListResponse,
} from './projectcraft-api-types'

export type {
  APICategory,
  APIProject,
  CategoriesResponse,
  ProjectDetailResponse,
  ProjectListResponse,
} from './projectcraft-api-types'

const API_BASE = '/api/projects'
const API_TIMEOUT = 10000

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function fetchProjects(params?: {
  category?: string
  language?: string
  difficulty?: string
  project_type?: string
  featured?: boolean
  search?: string
  limit?: number
  offset?: number
}): Promise<ProjectListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.language) searchParams.set('language', params.language)
  if (params?.difficulty) searchParams.set('difficulty', params.difficulty)
  if (params?.project_type) searchParams.set('project_type', params.project_type)
  if (params?.featured) searchParams.set('featured', '1')
  if (params?.search) searchParams.set('search', params.search)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  const url = `${getBaseUrl()}${API_BASE}/list?${searchParams.toString()}`

  try {
    const response = await fetchWithTimeout(url, { next: { revalidate: 300 } }, API_TIMEOUT)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return await response.json()
  } catch (error) {
    logError('Failed to fetch projects', { error, url })
    return {
      success: false,
      data: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
    }
  }
}

export async function fetchProject(slug: string): Promise<ProjectDetailResponse | null> {
  const url = `${getBaseUrl()}${API_BASE}/get?slug=${encodeURIComponent(slug)}`
  try {
    const response = await fetchWithTimeout(url, { next: { revalidate: 300 } }, API_TIMEOUT)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    logError('Failed to fetch project', { error, slug, url })
    return null
  }
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  const url = `${getBaseUrl()}${API_BASE}/categories`
  try {
    const response = await fetchWithTimeout(url, { next: { revalidate: 3600 } }, API_TIMEOUT)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return await response.json()
  } catch (error) {
    logError('Failed to fetch categories', { error, url })
    return { success: false, data: [], total: 0 }
  }
}

export function getDownloadUrl(slug: string): string {
  return `${API_BASE}/download?slug=${encodeURIComponent(slug)}`
}
