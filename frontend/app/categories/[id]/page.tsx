import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchProjects, fetchCategories, APIProject } from "@/lib/projectcraft-api"
import { ChevronLeft, Download, Eye, Star, ArrowRight, ExternalLink } from "lucide-react"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { generateBreadcrumbs } from "@/lib/metadata-utils"

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

function getDifficultyColor(difficulty: string): string {
  const d = difficulty.toLowerCase()
  if (d === 'beginner') return 'bg-emerald-500'
  if (d === 'intermediate') return 'bg-amber-500'
  if (d === 'advanced') return 'bg-rose-500'
  return 'bg-gray-500'
}

// Project Card for category page
function CategoryProjectCard({ project, categoryIcon }: { project: APIProject, categoryIcon: string }) {
  const downloadUrl = `/api/projects/download?slug=${project.slug}`

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/50 text-2xl shadow-sm backdrop-blur-sm">
            {getEmojiIcon(categoryIcon)}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {project.featured === 1 && (
              <Badge className="bg-amber-500/90 text-white text-[10px] px-2 py-0.5">
                <Star className="h-3 w-3 mr-1" fill="currentColor" />
                Featured
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-white text-[10px] px-2 py-0.5 ${getDifficultyColor(project.difficulty)}`}
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

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{project.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{project.downloadCount.toLocaleString()}</span>
          </div>
        </div>

        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                {tech}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button asChild size="sm" className="flex-1 rounded-xl h-9 text-xs">
            <Link href={`/projects/${project.slug}`}>
              View Project
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl h-9 px-3">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${project.title} (opens in new tab)`}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CategoryPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params
  const categoriesRes = await fetchCategories()
  const category = categoriesRes.data.find((c) => c.slug === id)

  if (!category) {
    return { title: "Category Not Found | ProjectCraft" }
  }

  return {
    title: `${category.name} Projects | ProjectCraft`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params

  // Fetch category info and projects in parallel
  const [categoriesRes, projectsRes] = await Promise.all([
    fetchCategories(),
    fetchProjects({ category: id, limit: 100 }),
  ])

  const category = categoriesRes.data.find((c) => c.slug === id)

  if (!category) {
    notFound()
  }

  const categoryProjects = projectsRes.success ? projectsRes.data : []
  const breadcrumbs = generateBreadcrumbs(`/categories/${id}`, { [id]: category.name })

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main role="main" aria-label={`Project category: ${category.name}`} className="min-h-screen pb-24 md:pb-0">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
            <div className="mx-auto max-w-7xl">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Categories
              </Link>
            </div>
          </div>
        </div>

        <div className="border-b border-border">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-4xl">
                  {getEmojiIcon(category.icon)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold md:text-4xl">{category.name}</h1>
                  <p className="mt-1 text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <div className="mx-auto max-w-7xl">
            <p className="mb-6 text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{categoryProjects.length}</span> {categoryProjects.length >= 100 ? "(first 100)" : ""} of {category.projectCount} projects
            </p>

            {categoryProjects.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categoryProjects.map((project) => (
                  <CategoryProjectCard key={project.id} project={project} categoryIcon={category.icon} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                <p className="text-lg font-medium">No projects in this category yet</p>
                <p className="mt-1 text-muted-foreground">Check back soon for new projects!</p>
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
