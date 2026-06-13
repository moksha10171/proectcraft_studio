/**
 * Local projects data layer — reads from data/projects/*.json
 * Add your own projects to data/projects/projects.json
 */

import fs from 'fs'
import path from 'path'
import type {
  APICategory,
  APIProject,
  CategoriesResponse,
  ProjectDetailResponse,
  ProjectListResponse,
} from './projectcraft-api-types'

function resolveDataDir(sub: string): string {
  const cwd = process.cwd()
  const candidates = [path.join(cwd, 'data', sub), path.join(cwd, '..', 'data', sub)]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[1]
}

const DATA_DIR = resolveDataDir('projects')

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function getProjects(): APIProject[] {
  return readJsonFile<APIProject[]>('projects.json')
}

function getCategories(): APICategory[] {
  const categories = readJsonFile<Omit<APICategory, 'projectCount'>[]>('categories.json')
  const projects = getProjects()

  return categories.map((cat) => ({
    ...cat,
    projectCount: projects.filter(
      (p) => p.category?.slug === cat.slug || p.topicSlug === cat.slug
    ).length,
  }))
}

function filterProjects(
  projects: APIProject[],
  params?: {
    category?: string
    language?: string
    difficulty?: string
    project_type?: string
    featured?: boolean
    search?: string
    limit?: number
    offset?: number
  }
): APIProject[] {
  let filtered = [...projects]

  if (params?.category) {
    filtered = filtered.filter(
      (p) =>
        p.category?.slug === params.category ||
        p.topicSlug === params.category
    )
  }
  if (params?.language) {
    filtered = filtered.filter(
      (p) => p.language?.toLowerCase() === params.language?.toLowerCase()
    )
  }
  if (params?.difficulty) {
    filtered = filtered.filter(
      (p) => p.difficulty.toLowerCase() === params.difficulty?.toLowerCase()
    )
  }
  if (params?.featured) {
    filtered = filtered.filter((p) => p.featured === 1)
  }
  if (params?.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }

  const offset = params?.offset ?? 0
  const limit = params?.limit ?? 20
  return filtered.slice(offset, offset + limit)
}

export function listProjects(params?: Parameters<typeof filterProjects>[1]): ProjectListResponse {
  const all = getProjects()
  const filtered = filterProjects(all, params)
  const total = params
    ? filterProjects(all, { ...params, limit: undefined, offset: undefined }).length
    : all.length

  return {
    success: true,
    data: filtered,
    pagination: {
      total,
      limit: params?.limit ?? 20,
      offset: params?.offset ?? 0,
      hasMore: (params?.offset ?? 0) + filtered.length < total,
    },
  }
}

export function getProjectBySlug(slug: string): ProjectDetailResponse | null {
  const project = getProjects().find((p) => p.slug === slug)
  if (!project) return null
  return { success: true, data: project }
}

export function listCategories(): CategoriesResponse {
  const categories = getCategories()
  return { success: true, data: categories, total: categories.length }
}

export function getDownloadPath(slug: string): string | null {
  const project = getProjects().find((p) => p.slug === slug)
  if (!project) return null
  return `/api/projects/download?slug=${encodeURIComponent(slug)}`
}
