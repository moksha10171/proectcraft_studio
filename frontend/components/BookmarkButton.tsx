"use client"

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectCraftBookmarks } from '@/hooks/useProjectCraftBookmarks'
import type { BookmarkType } from '@/types/bookmark'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  type: BookmarkType
  itemId: string
  title: string
  url: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function BookmarkButton({
  type,
  title,
  url,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = false,
}: BookmarkButtonProps) {
  const { bookmarks, isLoading, addBookmark, removeBookmark, refreshBookmarks } =
    useProjectCraftBookmarks(type)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)

  useEffect(() => {
    const bookmark = bookmarks.find((b) => b.url === url)
    setBookmarked(!!bookmark)
    setBookmarkId(bookmark?.id || null)
  }, [bookmarks, url])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsProcessing(true)

    try {
      if (bookmarked && bookmarkId) {
        const success = await removeBookmark(type, bookmarkId)
        if (success) {
          setBookmarked(false)
          setBookmarkId(null)
        }
      } else {
        const success = await addBookmark(type, title, url)
        if (success) await refreshBookmarks(type)
      }
    } catch (error) {
      console.error('Bookmark operation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const isButtonLoading = isLoading || isProcessing

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isButtonLoading}
      className={cn('transition-all', bookmarked && 'text-amber-600 dark:text-amber-400', className)}
      aria-label={bookmarked ? `Remove ${title} from bookmarks` : `Add ${title} to bookmarks`}
      title={bookmarked ? 'Remove from bookmarks' : 'Save to bookmarks (stored locally)'}
    >
      {isButtonLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : bookmarked ? (
        <BookmarkCheck className="h-4 w-4" fill="currentColor" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-2">{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>}
    </Button>
  )
}
