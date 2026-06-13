"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Clock, ArrowRight, ArrowLeft, Sparkles, TrendingUp, History, X, Zap, Star, Loader2, Download, Eye } from "lucide-react"
import { generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { fetchProjects, fetchCategories, APIProject, APICategory } from "@/lib/projectcraft-api"
import { safeLocalStorage } from "@/lib/utils-shared"

// API Icon to Emoji mapping - Comprehensive coverage for better accessibility
const iconToEmoji: Record<string, string> = {
  // Web Development
  "fas fa-globe": "🌐",
  "fas fa-code": "💻",
  "fas fa-laptop-code": "👨‍💻",
  "fas fa-html5": "🌐",
  "fas fa-css3": "🎨",
  "fas fa-js": "📜",
  "fas fa-react": "⚛️",
  "fas fa-node": "🟢",
  "fas fa-php": "🐘",
  "fas fa-wordpress": "📝",

  // Mobile Development
  "fas fa-mobile-alt": "📱",
  "fas fa-mobile": "📲",
  "fas fa-tablet": "📱",
  "fas fa-android": "🤖",
  "fas fa-apple": "🍎",

  // Gaming
  "fas fa-gamepad": "🎮",
  "fas fa-dice": "🎲",
  "fas fa-chess": "♟️",
  "fas fa-puzzle-piece": "🧩",
  "fas fa-trophy": "🏆",

  // AI / Machine Learning
  "fas fa-brain": "🧠",
  "fas fa-robot": "🤖",
  "fas fa-magic": "✨",
  "fas fa-chart-line": "📈",
  "fas fa-project-diagram": "🔀",

  // IoT / Embedded / Hardware
  "fas fa-microchip": "🔧",
  "fas fa-memory": "💾",
  "fas fa-plug": "🔌",
  "fas fa-wifi": "📶",
  "fas fa-bluetooth": "📡",
  "fas fa-raspberry-pi": "🍓",
  "fas fa-usb": "🔌",
  "fas fa-temperature-high": "🌡️",
  "fas fa-lightbulb": "💡",
  "fas fa-solar-panel": "☀️",
  "fas fa-car": "🚗",
  "fas fa-drone": "🚁",

  // System / DevOps
  "fas fa-cogs": "⚙️",
  "fas fa-cog": "⚙️",
  "fas fa-tools": "🛠️",
  "fas fa-wrench": "🔧",
  "fas fa-hammer": "🔨",

  // Desktop / Applications
  "fas fa-desktop": "🖥️",
  "fas fa-window-maximize": "🪟",
  "fas fa-terminal": "💻",
  "fas fa-keyboard": "⌨️",

  // Server / Cloud / Infrastructure
  "fas fa-server": "🖥️",
  "fas fa-cloud": "☁️",
  "fas fa-cloud-upload": "⬆️",
  "fas fa-cloud-download": "⬇️",
  "fas fa-network-wired": "🌐",
  "fas fa-sitemap": "🗺️",
  "fas fa-docker": "🐳",

  // Database / Data
  "fas fa-database": "🗄️",
  "fas fa-table": "📊",
  "fas fa-chart-bar": "📊",
  "fas fa-chart-pie": "🥧",
  "fas fa-file-excel": "📗",

  // Security / Cybersecurity
  "fas fa-shield-alt": "🛡️",
  "fas fa-shield": "🛡️",
  "fas fa-lock": "🔒",
  "fas fa-unlock": "🔓",
  "fas fa-key": "🔑",
  "fas fa-user-secret": "🕵️",
  "fas fa-fingerprint": "👆",
  "fas fa-bug": "🐛",
  "fas fa-virus": "🦠",

  // Media / Design
  "fas fa-camera": "📷",
  "fas fa-video": "🎥",
  "fas fa-film": "🎬",
  "fas fa-music": "🎵",
  "fas fa-image": "🖼️",
  "fas fa-palette": "🎨",
  "fas fa-paint-brush": "🖌️",
  "fas fa-pen": "✏️",
  "fas fa-vector-square": "📐",

  // Communication
  "fas fa-comments": "💬",
  "fas fa-envelope": "📧",
  "fas fa-phone": "📞",
  "fas fa-video-camera": "📹",
  "fas fa-bell": "🔔",
  "fas fa-paper-plane": "✈️",

  // E-commerce / Business
  "fas fa-shopping-cart": "🛒",
  "fas fa-store": "🏪",
  "fas fa-credit-card": "💳",
  "fas fa-money-bill": "💵",
  "fas fa-chart-area": "📈",
  "fas fa-briefcase": "💼",

  // Education / Learning
  "fas fa-graduation-cap": "🎓",
  "fas fa-book": "📚",
  "fas fa-bookmark": "🔖",
  "fas fa-chalkboard": "📋",
  "fas fa-calculator": "🧮",

  // Health / Medical  
  "fas fa-heartbeat": "❤️",
  "fas fa-medkit": "🩺",
  "fas fa-pills": "💊",
  "fas fa-stethoscope": "🩺",

  // Location / Maps
  "fas fa-map": "🗺️",
  "fas fa-map-marker": "📍",
  "fas fa-compass": "🧭",
  "fas fa-location-arrow": "📍",

  // Files / Documents
  "fas fa-file": "📄",
  "fas fa-file-alt": "📝",
  "fas fa-file-code": "📄",
  "fas fa-file-pdf": "📕",
  "fas fa-folder": "📁",
  "fas fa-folder-open": "📂",
  "fas fa-archive": "🗃️",

  // Misc / General
  "fas fa-link": "🔗",
  "fas fa-external-link": "🔗",
  "fas fa-qrcode": "📱",
  "fas fa-barcode": "📊",
  "fas fa-print": "🖨️",
  "fas fa-home": "🏠",
  "fas fa-user": "👤",
  "fas fa-users": "👥",
  "fas fa-star": "⭐",
  "fas fa-heart": "❤️",
  "fas fa-clock": "⏰",
  "fas fa-calendar": "📅",
  "fas fa-search": "🔍",
  "fas fa-filter": "🔍",
  "fas fa-sync": "🔄",
  "fas fa-refresh": "🔄",
  "fas fa-download": "⬇️",
  "fas fa-upload": "⬆️",
  "fas fa-share": "📤",
  "fas fa-rss": "📡",
  "fas fa-bolt": "⚡",
  "fas fa-fire": "🔥",
  "fas fa-rocket": "🚀",
  "fas fa-flask": "🧪",
  "fas fa-atom": "⚛️",
  "fas fa-dna": "🧬",
  "fas fa-cube": "📦",
  "fas fa-cubes": "📦",
  "fas fa-box": "📦",
  "fas fa-gift": "🎁",
  "fas fa-gem": "💎",
  "fas fa-crown": "👑",
  "fas fa-flag": "🚩",
  "fas fa-globe-americas": "🌎",
  "fas fa-globe-europe": "🌍",
  "fas fa-globe-asia": "🌏",
}

function getEmojiIcon(icon: string): string {
  return iconToEmoji[icon] || "📁"
}

export default function SearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // API State
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [projects, setProjects] = useState<APIProject[]>([])
  const [categories, setCategories] = useState<APICategory[]>([])
  const [searchResults, setSearchResults] = useState<APIProject[]>([])

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [projectsRes, categoriesRes] = await Promise.all([
          fetchProjects({ featured: true, limit: 6 }),
          fetchCategories(),
        ])

        if (projectsRes.success) setProjects(projectsRes.data)
        if (categoriesRes.success) setCategories(categoriesRes.data)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    // Load recent searches from localStorage with safe handling
    const searches = safeLocalStorage.getJSON<string[]>("recentSearches", [])
    setRecentSearches(searches)
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetchProjects({ search: query, limit: 20 })
        if (res.success) {
          setSearchResults(res.data)
        }
      } catch (err) {
        // Search failed - silently handle, user sees no results
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Save search to recent
  const saveSearch = (term: string) => {
    if (!term.trim()) return
    // Save to recent searches with safe localStorage
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    safeLocalStorage.setJSON("recentSearches", updated)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    safeLocalStorage.removeItem("recentSearches")
  }

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  // Filter categories based on query
  const matchedCategories = useMemo(() => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    return categories.filter((c) => c.name.toLowerCase().includes(lowerQuery))
  }, [query, categories])

  // Quick categories for suggestions
  const quickCategories = categories.slice(0, 6)

  // Popular search suggestions
  const popularSearches = ["Python", "React", "Machine Learning", "Arduino", "Web Development", "IoT"]

  const breadcrumbs = generateBreadcrumbs('/search')

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main role="main" aria-label="Search Projects and Resources" className="min-h-screen pb-24 md:pb-0">
        {/* Search Header */}
        <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="shrink-0 rounded-xl h-10 w-10 md:hidden"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search projects, technologies, or tags..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      saveSearch(query.trim())
                    }
                  }}
                  className="h-12 pl-12 pr-12 text-base rounded-xl border-border bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground animate-spin" />
                )}
                {query && !isSearching && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-destructive/10"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6">
          <div className="mx-auto max-w-6xl">
            {/* Search Results */}
            {query.trim() ? (
              <div className="space-y-8">
                {/* Results summary */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isSearching ? (
                      "Searching..."
                    ) : (
                      <>
                        Found{" "}
                        <span className="font-semibold text-foreground">
                          {searchResults.length + matchedCategories.length}
                        </span>{" "}
                        results for "{query}"
                      </>
                    )}
                  </p>
                  {(searchResults.length > 0 || matchedCategories.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveSearch(query)}
                      className="text-xs h-11 min-h-[44px] rounded-lg touch-action-manipulation active:scale-95"
                    >
                      Save search
                    </Button>
                  )}
                </div>

                {/* Categories Results */}
                {matchedCategories.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Categories ({matchedCategories.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchedCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/categories/${category.slug}`}
                          onClick={() => saveSearch(query)}
                          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-md active:scale-[0.98]"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/50 text-2xl shadow-sm">
                            {getEmojiIcon(category.icon)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {category.projectCount} projects
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Project Results */}
                {searchResults.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Projects ({searchResults.length})
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {searchResults.map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.slug}`}
                          onClick={() => saveSearch(query)}
                          className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                        >
                          <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 text-2xl shadow-sm backdrop-blur-sm">
                                {getEmojiIcon(project.category?.icon || "fas fa-code")}
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                {project.featured === 1 && (
                                  <Badge className="bg-amber-500/90 text-white text-[10px] px-2 py-0.5">
                                    <Star className="h-3 w-3 mr-1" fill="currentColor" />
                                    Featured
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-2 py-0.5 border-primary/20 bg-background/50 backdrop-blur-sm
                                    ${project.difficulty === "Beginner" ? "text-emerald-600 dark:text-emerald-400" : ""}
                                    ${project.difficulty === "Intermediate" ? "text-amber-600 dark:text-amber-400" : ""}
                                    ${project.difficulty === "Advanced" ? "text-rose-600 dark:text-rose-400" : ""}
                                  `}
                                >
                                  {project.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <h3 className="mt-2 text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                              {project.title}
                            </h3>
                          </div>

                          <div className="p-4 space-y-4">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.shortDescription || project.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5" />
                                  {project.viewCount.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3.5 w-3.5" />
                                  {project.downloadCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View
                                <ArrowRight className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* No Results */}
                {!isSearching && searchResults.length === 0 && matchedCategories.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold">No results found</h3>
                    <p className="text-muted-foreground mt-1 mb-6">Try searching with different keywords</p>

                    {/* Suggestions when no results */}
                    <div className="max-w-md mx-auto">
                      <p className="text-sm text-muted-foreground mb-3">Try searching for:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {popularSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => setQuery(term)}
                            className="inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-sm font-medium transition-all hover:bg-secondary/80 active:scale-95"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State - Show suggestions */
              <div className="space-y-8">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Recent Searches
                          </h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRecentSearches}
                            className="text-xs h-11 min-h-[44px] rounded-lg text-muted-foreground hover:text-foreground touch-action-manipulation active:scale-95"
                          >
                            Clear all
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term, index) => (
                            <div
                              key={index}
                              className="group inline-flex items-center gap-1.5 rounded-full bg-secondary pl-4 pr-2 py-2 text-sm font-medium transition-all hover:bg-secondary/80"
                            >
                              <button onClick={() => setQuery(term)} className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                {term}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeRecentSearch(term)
                                }}
                                className="ml-1 p-1 rounded-full opacity-50 hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                                aria-label={`Remove ${term} from recent searches`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Popular Searches */}
                    <section>
                      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Popular Searches
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => setQuery(term)}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:bg-card/80 active:scale-95"
                          >
                            <Search className="h-3.5 w-3.5 text-muted-foreground" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Quick Categories */}
                    {quickCategories.length > 0 && (
                      <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Browse Categories
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {quickCategories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/categories/${category.slug}`}
                              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-md active:scale-[0.98]"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/50 text-2xl shadow-sm">
                                {getEmojiIcon(category.icon)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate">{category.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {category.projectCount} projects
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Featured Projects */}
                    {projects.length > 0 && (
                      <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Featured Projects
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                          {projects.slice(0, 4).map((project) => (
                            <Link
                              key={project.id}
                              href={`/projects/${project.slug}`}
                              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                            >
                              <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 text-xl shadow-sm backdrop-blur-sm">
                                    {getEmojiIcon(project.category?.icon || "fas fa-code")}
                                  </div>
                                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                </div>
                                <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                  {project.title}
                                </h3>
                              </div>
                              <div className="p-4">
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {project.shortDescription || project.description}
                                </p>
                                <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Explore Project</span>
                                  <ArrowRight className="h-3 w-3 text-primary" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  )
}
