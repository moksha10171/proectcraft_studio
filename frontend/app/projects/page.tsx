"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchProjects, fetchCategories, APIProject, APICategory } from "@/lib/projectcraft-api"
import {
  Filter, LayoutGrid, List, SlidersHorizontal, X, Check, RotateCcw, Loader2, RefreshCw,
  WifiOff, Download, Eye, Star, Clock, ArrowRight, ExternalLink, Bot, Cloud, Cpu, Globe, BookOpen
} from "lucide-react"
import Link from "next/link"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { BookmarkButton } from "@/components/BookmarkButton"
import { generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { useLocalStorage } from "@/hooks/useLocalStorage"

// Category type for internal use
interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  projectCount?: number;
}

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

// Difficulty badge colors
function getDifficultyColor(difficulty: string): string {
  const d = difficulty.toLowerCase()
  if (d === 'beginner') return 'bg-emerald-500'
  if (d === 'intermediate') return 'bg-amber-500'
  if (d === 'advanced') return 'bg-rose-500'
  return 'bg-gray-500'
}

// Project Card Component for API data (memoized for performance)
const APIProjectCard = React.memo(function APIProjectCard({ project }: { project: APIProject }) {
  const downloadUrl = `/api/projects/download?slug=${project.slug}`

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
      {/* Header with gradient */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {project.featured === 1 && (
              <Badge className="bg-amber-500/90 text-white text-[10px] px-2 py-0.5">
                <Star className="h-3 w-3 mr-1" fill="currentColor" />
                Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton
              type="project"
              itemId={project.slug}
              title={project.title}
              url={`https://projectcraft.in/projects/${project.slug}`}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            />
            <Badge
              variant="secondary"
              className={`text-white text-[10px] px-2 py-0.5 ${getDifficultyColor(project.difficulty)}`}
            >
              {project.difficulty}
            </Badge>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.shortDescription || project.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{project.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{project.downloadCount.toLocaleString()}</span>
          </div>
          {project.stats?.totalFiles !== undefined && project.stats.totalFiles > 0 && (
            <div className="flex items-center gap-1">
              <span>{project.stats.totalFiles} files</span>
            </div>
          )}
        </div>

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 4 && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                +{project.technologies.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button asChild size="sm" className="flex-1 rounded-xl h-9 text-xs min-w-0">
            <Link href={`/projects/${project.slug}`}>
              View Project
              <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl h-9 w-9 p-0 shrink-0"
            title={`Download ${project.title}`}
          >
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${project.title}`}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
})

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useLocalStorage("projects-selected-category", "all")
  const [selectedDifficulty, setSelectedDifficulty] = useLocalStorage<string[]>("projects-selected-difficulty", [])
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useLocalStorage<"grid" | "list">("projects-view-mode", "grid")

  // API State
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<APIProject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalProjects, setTotalProjects] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      const [projectsRes, categoriesRes] = await Promise.all([
        fetchProjects({ limit: 100 }),
        fetchCategories(),
      ])

      if (projectsRes.success) {
        setProjects(projectsRes.data)
        setTotalProjects(projectsRes.pagination.total)
      } else {
        setError('Failed to load projects')
      }

      if (categoriesRes.success) {
        const cats: Category[] = [
          { id: "all", name: "All Projects", icon: "📁", description: "Browse all available projects" },
          ...categoriesRes.data.map((cat: APICategory) => ({
            id: cat.slug,
            name: cat.name,
            icon: getEmojiIcon(cat.icon),
            description: cat.description,
            projectCount: cat.projectCount,
          })),
        ]
        setCategories(cats)
      }
    } catch (err) {
      // Error loading data - show user-friendly message
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter projects client-side
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const categoryMatch = selectedCategory === "all" || project.category?.slug === selectedCategory
      const difficultyMatch = selectedDifficulty.length === 0 || selectedDifficulty.includes(project.difficulty)
      return categoryMatch && difficultyMatch
    })
  }, [projects, selectedCategory, selectedDifficulty])

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulty((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty],
    )
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedDifficulty([])
  }

  const activeFilterCount = (selectedCategory !== "all" ? 1 : 0) + selectedDifficulty.length

  // Get project counts for filters
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") return projects.length
    return projects.filter(p => p.category?.slug === categoryId).length
  }

  const getDifficultyCount = (difficulty: string) => {
    return projects.filter(p => p.difficulty === difficulty).length
  }

  const FilterContent = ({ closable = false }: { closable?: boolean }) => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</h3>
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto scrollbar-thin">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id
            const count = category.projectCount ?? getCategoryCount(category.id)
            return (
              <Button
                key={category.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`justify-start h-auto py-3 px-4 rounded-xl transition-all ${isActive ? "bg-primary/10 text-primary hover:bg-primary/15 ring-1 ring-primary/20" : ""
                  }`}
                onClick={() => {
                  setSelectedCategory(category.id)
                  if (closable) setFilterOpen(false)
                }}
              >
                <span className="mr-3 text-lg" aria-hidden="true">
                  {category.icon}
                </span>
                <span className="truncate flex-1 text-left">{category.name}</span>
                <span className={`text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>{count}</span>
                {isActive && <Check className="ml-2 h-4 w-4 text-primary" />}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Difficulty</h3>
        <div className="flex flex-col gap-2">
          {(["Beginner", "Intermediate", "Advanced"] as const).map((difficulty) => {
            const isActive = selectedDifficulty.includes(difficulty)
            const count = getDifficultyCount(difficulty)
            return (
              <Button
                key={difficulty}
                variant={isActive ? "secondary" : "outline"}
                className={`justify-start rounded-xl transition-all h-12 ${isActive
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 ring-1 ring-primary/20"
                  : "bg-transparent"
                  }`}
                onClick={() => toggleDifficulty(difficulty)}
              >
                <span
                  className={`mr-3 h-3 w-3 rounded-full ${getDifficultyColor(difficulty)}`}
                  aria-hidden="true"
                />
                <span className="flex-1 text-left">{difficulty}</span>
                <span className={`text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}>{count}</span>
                {isActive && <Check className="ml-2 h-4 w-4 text-primary" />}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('/projects')} />
      <Header />

      <main id="main-content" className="min-h-screen pb-20 md:pb-0" role="main" aria-label="Browse Projects">
        {/* Page Header */}
        <section className="border-b border-border bg-card" aria-labelledby="projects-title">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-7xl">
              <h1 id="projects-title" className="mb-3 text-3xl font-bold md:text-4xl">All Projects</h1>
              <p className="text-lg text-muted-foreground">
                Browse {totalProjects.toLocaleString()} free projects across {categories.length > 1 ? categories.length - 1 : 0} categories. Download instantly or test hardware projects virtually in our AI Studio.
              </p>
              {/* Error Indicator */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <WifiOff className="h-4 w-4" />
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={loadData} className="h-7 px-2 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Desktop Sidebar Filters */}
              <aside className="hidden lg:block">
                <div className="sticky top-20 space-y-6 rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Filters</h2>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs rounded-lg gap-1.5">
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </Button>
                    )}
                  </div>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <FilterContent />
                  )}
                </div>
              </aside>

              {/* Main Content */}
              <div>
                {/* Toolbar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredProjects.length}</span> of{" "}
                    {projects.length} projects
                  </p>

                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="hidden items-center gap-1 rounded-xl border border-border p-1 sm:flex">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setViewMode("grid")}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setViewMode("list")}
                        aria-label="List view"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>

                    <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden rounded-xl bg-transparent">
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Filters
                          {activeFilterCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground"
                            >
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="max-h-[85vh]">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
                        <DrawerHeader className="border-b border-border pb-4">
                          <div className="flex items-center justify-between">
                            <DrawerTitle className="text-lg">Filter Projects</DrawerTitle>
                            {activeFilterCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-xs h-8 rounded-lg gap-1.5 text-muted-foreground"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Reset all
                              </Button>
                            )}
                          </div>
                        </DrawerHeader>
                        <div className="overflow-y-auto p-4 scrollbar-thin flex-1">
                          <FilterContent closable />
                        </div>
                        <DrawerFooter className="border-t border-border pt-4">
                          <DrawerClose asChild>
                            <Button className="w-full rounded-xl h-12 text-base font-medium">
                              Show {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
                            </Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </div>
                </div>

                {/* Active Filters */}
                {activeFilterCount > 0 && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active:</span>
                    {selectedCategory !== "all" && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer gap-1 pl-3 pr-2 rounded-full transition-smooth hover:bg-destructive/10"
                        onClick={() => setSelectedCategory("all")}
                      >
                        {categories.find((c) => c.id === selectedCategory)?.icon}{" "}
                        {categories.find((c) => c.id === selectedCategory)?.name}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    )}
                    {selectedDifficulty.map((difficulty) => (
                      <Badge
                        key={difficulty}
                        variant="secondary"
                        className="cursor-pointer gap-1 pl-3 pr-2 rounded-full transition-smooth hover:bg-destructive/10"
                        onClick={() => toggleDifficulty(difficulty)}
                      >
                        {difficulty}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                        <div className="h-32 bg-muted" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-full" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="flex gap-2 pt-2">
                            <div className="h-6 bg-muted rounded-full w-16" />
                            <div className="h-6 bg-muted rounded-full w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                    {filteredProjects.map((project) => (
                      <APIProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                    <Filter className="mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
                    <p className="text-lg font-medium">No projects found</p>
                    <p className="mb-6 text-muted-foreground">Try adjusting your filters</p>
                    <Button variant="outline" onClick={clearFilters} className="rounded-xl bg-transparent gap-2 touch-action-manipulation active:scale-[0.98]">
                      <RotateCcw className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="mx-auto max-w-7xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-3">Need Help Building Your Project?</h2>
                <p className="text-lg text-muted-foreground">
                  Explore our comprehensive resources for hardware, software, and AI tools
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Arduino Resources */}
                <Link
                  href="/resources/arduino"
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
                      <Cpu className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Arduino</h3>
                      <p className="text-xs text-muted-foreground">50 components</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Boards, sensors, and components with code examples and wiring guides
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Explore Arduino Resources
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* ESP32 Resources */}
                <Link
                  href="/resources/esp32"
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                      <Cpu className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">ESP32 & ESP8266</h3>
                      <p className="text-xs text-muted-foreground">18 boards & modules</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    WiFi/Bluetooth microcontrollers for IoT projects with complete specs
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Explore ESP32 Resources
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Raspberry Pi Resources */}
                <Link
                  href="/resources/raspberry-pi"
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                      <Cpu className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Raspberry Pi</h3>
                      <p className="text-xs text-muted-foreground">13 boards & HATs</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Single-board computers and accessories for advanced projects
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Explore Raspberry Pi Resources
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* AI Development */}
                <Link
                  href="/resources/ai-development"
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                      <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">AI Coding Tools</h3>
                      <p className="text-xs text-muted-foreground">6 AI assistants</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build 10x faster with GitHub Copilot, ChatGPT, Claude, and Cursor
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Explore AI Tools
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Hosting & Deployment */}
                <Link
                  href="/resources/hosting-deployment"
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                      <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Hosting</h3>
                      <p className="text-xs text-muted-foreground">6 platforms</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deploy with Vercel, Netlify, Railway - free tiers available
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Explore Hosting Options
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Web Development */}
                <Link
                  href="/resources/web-development"
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Web Development</h3>
                      <p className="text-xs text-muted-foreground">6 frameworks</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    React, Next.js, Node.js, TypeScript - modern web tools
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Explore Web Dev Resources
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* Browse All CTA */}
              <div className="mt-8 text-center">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98]"
                >
                  <BookOpen className="h-5 w-5" />
                  Browse All 115+ Resources
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  )
}
