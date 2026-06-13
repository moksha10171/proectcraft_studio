import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { fetchCategories, fetchProjects, APICategory, APIProject } from "@/lib/projectcraft-api"
import Link from "next/link"
import { ArrowRight, FolderOpen, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { generateBreadcrumbs } from "@/lib/metadata-utils"

export const metadata: Metadata = {
  title: "Project Categories - Browse by Technology",
  description:
    "Explore free coding projects by category: Web Development, Arduino, Raspberry Pi, Machine Learning, Cybersecurity, Mobile Apps, IoT, and more.",
  keywords: [
    "coding projects by category",
    "web development projects",
    "arduino projects",
    "raspberry pi tutorials",
    "machine learning projects",
    "cybersecurity tutorials",
    "mobile development",
    "IoT projects",
    "free programming resources"
  ],
  alternates: {
    canonical: "https://projectcraft.in/categories",
  },
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

export default async function CategoriesPage() {
  // Fetch from external API
  const [categoriesRes, projectsRes] = await Promise.all([
    fetchCategories(),
    fetchProjects({ limit: 50 }), // Get some projects for preview
  ])

  const categories = categoriesRes.success ? categoriesRes.data : []
  const projects = projectsRes.success ? projectsRes.data : []
  const totalProjects = projectsRes.success ? projectsRes.pagination.total : 0

  // Get sample projects for each category
  const getProjectsForCategory = (categorySlug: string) => {
    return projects.filter(p => p.category?.slug === categorySlug).slice(0, 2)
  }

  const breadcrumbs = generateBreadcrumbs('/categories')

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main role="main" aria-label="Project Categories" className="min-h-screen pb-24 md:pb-0">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-7xl">
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">Categories</h1>
              <p className="text-lg text-muted-foreground">Explore projects organized by technology and domain</p>
              {categoriesRes.success && (
                <p className="text-sm text-muted-foreground/60 mt-2">
                  {categoriesRes.total} categories • {totalProjects.toLocaleString()} projects available
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <div className="mx-auto max-w-7xl">
            {categories.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category: APICategory, index: number) => {
                  const categoryProjects = getProjectsForCategory(category.slug)
                  const colors = [
                    "from-primary/10 to-primary/5",
                    "from-accent/10 to-accent/5",
                    "from-pink-500/10 to-pink-500/5",
                    "from-green-500/10 to-green-500/5",
                    "from-blue-500/10 to-blue-500/5",
                    "from-purple-500/10 to-purple-500/5",
                    "from-orange-500/10 to-orange-500/5",
                    "from-cyan-500/10 to-cyan-500/5",
                    "from-teal-500/10 to-teal-500/5",
                    "from-rose-500/10 to-rose-500/5",
                    "from-indigo-500/10 to-indigo-500/5",
                    "from-amber-500/10 to-amber-500/5",
                  ]
                  const colorIndex = index % colors.length

                  return (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                    >
                      <div className={`bg-gradient-to-br ${colors[colorIndex]} p-6`}>
                        <div className="mb-4 text-5xl">{getEmojiIcon(category.icon)}</div>
                        <h3 className="mb-1 text-xl font-bold group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                      </div>

                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium">{category.projectCount} projects</span>
                          <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                        </div>

                        {categoryProjects.length > 0 && (
                          <ul className="space-y-2">
                            {categoryProjects.map((project: APIProject) => (
                              <li key={project.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                                <span className="truncate">{project.title}</span>
                              </li>
                            ))}
                            {category.projectCount > 2 && (
                              <li className="text-xs text-muted-foreground/70">
                                +{category.projectCount - 2} more projects
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
                <p className="text-lg font-medium">Unable to load categories</p>
                <p className="text-muted-foreground mb-6">Please check your connection and try again</p>
                <Button variant="outline" asChild className="rounded-xl">
                  <Link href="/categories" aria-label="Retry loading categories">
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Retry
                  </Link>
                </Button>
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
