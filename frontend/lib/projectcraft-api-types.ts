export interface APICategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  projectCount: number
}

export interface APIProject {
  id: number
  title: string
  slug: string
  description: string
  shortDescription: string
  language?: string
  difficulty: string
  ease_of_use?: string
  estimated_time?: string
  projectType?: string
  topicSlug?: string
  featured: number
  rating: number | null
  ratingCount: number
  viewCount: number
  downloadCount: number
  created_at?: string
  updated_at?: string
  category?: {
    id?: number
    name: string
    slug: string
    icon: string
  }
  technologies?: string[]
  tags?: string[]
  targetUsers?: string[]
  learningOpportunities?: string[]
  prerequisites?: string[]
  stats?: {
    totalFiles: number
    totalSize: number
    totalConcepts?: number
    totalQuizzes?: number
  }
  learningContent?: {
    id: number
    title: string
    content: string
    content_type: string
    order_index: number
  }[]
}

export interface ProjectListResponse {
  success: boolean
  data: APIProject[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ProjectDetailResponse {
  success: boolean
  data: APIProject
}

export interface CategoriesResponse {
  success: boolean
  data: APICategory[]
  total: number
}

export interface RatingResponse {
  success: boolean
  message: string
  action: 'created' | 'updated'
  data: {
    rating: number
    rating_count: number
    user_rating: number
    feedback_provided: boolean
    positive_ratings: number
  }
}
