"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowRight, Loader2, Download, Eye, Star } from "lucide-react"
import { fetchProjects, fetchCategories, APIProject, APICategory } from "@/lib/projectcraft-api"

// API Icon to Emoji mapping
const iconToEmoji: Record<string, string> = {
  "fas fa-globe": "🌐",
  "fas fa-mobile-alt": "📱",
  "fas fa-gamepad": "🎮",
  "fas fa-brain": "🤖",
  "fas fa-microchip": "🔧",
  "fas fa-cogs": "⚙️",
  "fas fa-desktop": "💻",
  "fas fa-server": "🖥️",
  "fas fa-link": "🔗",
  "fas fa-shield-alt": "🔒",
  "fas fa-terminal": "💾",
  "fas fa-database": "📊",
}

function getEmojiIcon(icon: string): string {
  return iconToEmoji[icon] || "📁"
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [projects, setProjects] = useState<APIProject[]>([])
  const [categories, setCategories] = useState<APICategory[]>([])
  const [searchResults, setSearchResults] = useState<APIProject[]>([])

  // Load categories once
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCategories().then(res => {
        if (res.success) setCategories(res.data)
      })
    }
  }, [open, categories.length])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setSearchResults([])
    }
  }, [open])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetchProjects({ search: query, limit: 5 })
        if (res.success) {
          setSearchResults(res.data)
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Filter categories based on query
  const matchedCategories = query.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : []

  const handleLinkClick = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0 gap-0 rounded-2xl">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="sr-only">Search Projects</DialogTitle>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, technologies, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-12 pr-12 text-base rounded-xl border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground animate-spin" />
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-4 max-h-[55vh] scrollbar-thin">
          {/* Categories */}
          {matchedCategories.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {matchedCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    onClick={handleLinkClick}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium transition-smooth hover:bg-secondary/80 active:scale-[0.98]"
                  >
                    <span>{getEmojiIcon(category.icon)}</span>
                    {category.name}
                    <Badge variant="secondary" className="ml-1 text-[10px]">{category.projectCount}</Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {searchResults.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Projects</h3>
              <div className="space-y-1">
                {searchResults.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    onClick={handleLinkClick}
                    className="flex items-center gap-4 rounded-xl p-3 transition-smooth hover:bg-muted active:scale-[0.99]"
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {project.featured === 1 && (
                        <Star className="absolute top-1 left-1 h-3 w-3 text-amber-400" fill="currentColor" />
                      )}
                      <span className="text-xl">{getEmojiIcon(project.category?.icon || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{project.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.shortDescription || project.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {project.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {project.downloadCount}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs h-5
                            ${project.difficulty === "Beginner" ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : ""}
                            ${project.difficulty === "Intermediate" ? "border-amber-500/50 text-amber-600 dark:text-amber-400" : ""}
                            ${project.difficulty === "Advanced" ? "border-rose-500/50 text-rose-600 dark:text-rose-400" : ""}
                          `}
                        >
                          {project.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Searching indicator */}
          {isSearching && query.trim() && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50 animate-spin" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          )}

          {/* No results */}
          {query.trim() && !isSearching && searchResults.length === 0 && matchedCategories.length === 0 && (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="font-medium">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">Try searching with different keywords</p>
            </div>
          )}

          {/* Empty state */}
          {!query.trim() && !isSearching && (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="font-medium">Search projects</p>
              <p className="text-sm text-muted-foreground mt-1">Find by name, technology, or tags</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
              <span>Open</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
            <span>Close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
