'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Bookmark, BookmarkType } from '@/types/bookmark'

const STORAGE_KEY = 'projectcraft_bookmarks'

function loadAll(): Record<BookmarkType, Bookmark[]> {
  if (typeof window === 'undefined') return { project: [], resource: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { project: [], resource: [] }
    return JSON.parse(raw)
  } catch {
    return { project: [], resource: [] }
  }
}

function saveAll(data: Record<BookmarkType, Bookmark[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useProjectCraftBookmarks(type: BookmarkType) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshBookmarks = useCallback(async (_type?: BookmarkType) => {
    const all = loadAll()
    setBookmarks(all[type] || [])
    setIsLoading(false)
  }, [type])

  useEffect(() => {
    refreshBookmarks()
  }, [refreshBookmarks])

  const addBookmark = useCallback(
    async (bookmarkType: BookmarkType, title: string, url: string): Promise<boolean> => {
      const all = loadAll()
      const list = all[bookmarkType] || []
      if (list.some((b) => b.url === url)) return true

      const bookmark: Bookmark = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      all[bookmarkType] = [...list, bookmark]
      saveAll(all)
      if (bookmarkType === type) setBookmarks(all[bookmarkType])
      return true
    },
    [type]
  )

  const removeBookmark = useCallback(
    async (bookmarkType: BookmarkType, bookmarkId: string): Promise<boolean> => {
      const all = loadAll()
      all[bookmarkType] = (all[bookmarkType] || []).filter((b) => b.id !== bookmarkId)
      saveAll(all)
      if (bookmarkType === type) setBookmarks(all[bookmarkType])
      return true
    },
    [type]
  )

  return { bookmarks, isLoading, addBookmark, removeBookmark, refreshBookmarks }
}
