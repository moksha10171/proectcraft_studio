/**
 * Bookmark-related type definitions for ProjectCraft
 */

export type BookmarkType = 'project' | 'resource'

/**
 * Bookmark object structure
 */
export interface Bookmark {
    id: string
    title: string
    url: string
    created_at: string
    updated_at: string
}

/**
 * API response for bookmark operations
 */
export interface BookmarkResponse {
    success: boolean
    message: string
    data: {
        bookmark_id?: string
        project?: Bookmark
        resource?: Bookmark
        user_id?: string
        total_bookmarks?: number
        projects?: Bookmark[]
        resources?: Bookmark[]
        last_updated?: string
        pagination?: {
            page: number
            limit: number
            total_pages: number
            has_next: boolean
            has_prev: boolean
        }
    } | null
}

/**
 * Request payload for adding a bookmark
 */
export interface AddBookmarkRequest {
    title: string
    url: string
}

/**
 * Request payload for removing a bookmark
 */
export interface RemoveBookmarkRequest {
    bookmark_id: string
}

/**
 * Bookmark statistics
 */
export interface BookmarkStats {
    user_id: string
    total_bookmarks: number
    projects: {
        total: number
    }
    resources: {
        total: number
    }
    last_updated: string
}
