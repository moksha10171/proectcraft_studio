import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchProject, fetchProjects, APIProject } from "@/lib/projectcraft-api"
import {
  ChevronLeft, Download, Eye, Star, ArrowRight, Clock,
  CheckCircle, ExternalLink, Zap
} from "lucide-react"
import { SoftwareApplicationSchema, BreadcrumbListSchema } from "@/components/seo/json-ld"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { generateBreadcrumbs } from "@/lib/metadata-utils"
import { DownloadButton } from "./DownloadButton"
import { ProjectActions } from "./ProjectActions"

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
  if (d === 'beginner') return 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
  if (d === 'intermediate') return 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10'
  if (d === 'advanced') return 'border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10'
  return 'border-gray-500/50 text-gray-600 dark:text-gray-400'
}

// Related Project Card
function RelatedProjectCard({ project }: { project: APIProject }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
    >
      <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
        {project.title}
      </h4>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
        {project.shortDescription || project.description}
      </p>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <Badge variant="outline" className={`text-[10px] ${getDifficultyColor(project.difficulty)}`}>
          {project.difficulty}
        </Badge>
        <span className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          {project.downloadCount}
        </span>
      </div>
    </Link>
  )
}

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const projectRes = await fetchProject(id)

  if (!projectRes || !projectRes.success) {
    return {
      title: "Project Not Found | ProjectCraft",
      description: "The requested project could not be found."
    }
  }

  const project = projectRes.data

  const enhancedDescription = `${project.shortDescription || project.description} Download complete source code, documentation, and learn how to build this project. Test similar projects virtually in our AI Studio before building with real hardware.`

  return {
    title: `${project.title} | ProjectCraft`,
    description: enhancedDescription,
    keywords: [...(project.tags || []), ...(project.technologies || []), 'virtual testing', 'AI Studio', 'free download'],
    openGraph: {
      title: project.title,
      description: enhancedDescription,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: enhancedDescription,
    },
    alternates: {
      canonical: `https://projectcraft.in/projects/${id}`,
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params

  // Fetch project data from external API
  const projectRes = await fetchProject(id)

  if (!projectRes || !projectRes.success) {
    notFound()
  }

  const project = projectRes.data
  const downloadUrl = `/api/projects/download?slug=${project.slug}`

  // Fetch related projects from same category
  const relatedRes = await fetchProjects({
    category: project.category?.slug,
    limit: 4
  })
  const relatedProjects = relatedRes.success
    ? relatedRes.data.filter(p => p.slug !== project.slug).slice(0, 3)
    : []

  // Build breadcrumb data for structured data
  const breadcrumbs = generateBreadcrumbs(`/projects/${id}`, { [id]: project.title })

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      {/* Structured Data for SEO */}
      <BreadcrumbListSchema items={breadcrumbs} />
      <SoftwareApplicationSchema
        name={project.title}
        description={project.shortDescription || project.description}
        url={`https://projectcraft.in/projects/${project.slug}`}
        downloadUrl={downloadUrl}
        rating={project.rating}
        ratingCount={project.ratingCount}
        keywords={[...(project.technologies || []), ...(project.tags || [])]}
        applicationCategory={project.category?.name || "Educational"}
      />

      <Header />

      <main role="main" aria-label={`Project detail: ${project.title}`} className="min-h-screen pb-24 md:pb-0">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
            <div className="mx-auto max-w-6xl">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/projects" className="hover:text-foreground transition-colors">
                      Projects
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  {project.category && (
                    <>
                      <li>
                        <Link
                          href={`/categories/${project.category.slug}`}
                          className="hover:text-foreground transition-colors"
                        >
                          {project.category.name}
                        </Link>
                      </li>
                      <li aria-hidden="true">/</li>
                    </>
                  )}
                  <li aria-current="page" className="text-foreground truncate">{project.title}</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-16">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {project.featured === 1 && (
                      <Badge className="bg-amber-500 text-white">
                        <Star className="h-3 w-3 mr-1" fill="currentColor" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className={getDifficultyColor(project.difficulty)}>
                      {project.difficulty}
                    </Badge>
                    {project.projectType && (
                      <Badge variant="secondary">{project.projectType}</Badge>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{project.title}</h1>

                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {project.description}
                  </p>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{project.viewCount.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>{project.downloadCount.toLocaleString()} downloads</span>
                    </div>
                    {project.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                        <span>{project.rating.toFixed(1)} ({project.ratingCount} ratings)</span>
                      </div>
                    )}
                    {project.estimated_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{project.estimated_time}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <ProjectActions
                    projectSlug={project.slug}
                    projectTitle={project.title}
                    projectUrl={`https://projectcraft.in/projects/${project.slug}`}
                    downloadUrl={downloadUrl}
                    categorySlug={project.category?.slug}
                    categoryName={project.category?.name}
                  />
                </div>

                {/* Sidebar Info */}
                <div className="lg:w-80 space-y-4">
                  {/* Project Stats Card */}
                  {project.stats && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="font-semibold mb-4">
                        Project Info
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Files</span>
                          <span className="font-medium">{project.stats.totalFiles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Size</span>
                          <span className="font-medium">{(project.stats.totalSize / 1024).toFixed(1)} KB</span>
                        </div>
                        {project.stats.totalConcepts !== undefined && project.stats.totalConcepts > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Concepts</span>
                            <span className="font-medium">{project.stats.totalConcepts}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="font-semibold mb-4">
                        Technologies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="rounded-full">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Users */}
                  {project.targetUsers && project.targetUsers.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="font-semibold mb-4">
                        Target Audience
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {project.targetUsers.map((user) => (
                          <Badge key={user} variant="outline" className="rounded-full">
                            {user}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Prerequisites */}
                {project.prerequisites && project.prerequisites.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-xl font-bold mb-4">
                      Prerequisites
                    </h2>
                    <ul className="space-y-2">
                      {project.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Learning Opportunities */}
                {project.learningOpportunities && project.learningOpportunities.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-xl font-bold mb-4">
                      What You'll Learn
                    </h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {project.learningOpportunities.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Learning Content */}
                {project.learningContent && project.learningContent.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-xl font-bold mb-4">Learning Content</h2>
                    <div className="space-y-4">
                      {project.learningContent.map((content, index) => (
                        <div key={content.id} className="border-l-2 border-primary/30 pl-4">
                          <h3 className="font-semibold">{index + 1}. {content.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {content.content.slice(0, 200)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-3">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar - Related Projects */}
              <div className="space-y-4">
                {relatedProjects.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold">Related Projects</h2>
                    <div className="space-y-3">
                      {relatedProjects.map((project) => (
                        <RelatedProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </>
                )}

                {/* Download CTA */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <Download className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download the complete project with source code and documentation.
                  </p>
                  <DownloadButton
                    downloadUrl={downloadUrl}
                    variant="default"
                    size="default"
                    className="w-full rounded-xl touch-action-manipulation active:scale-[0.98]"
                  >
                    Download Now
                  </DownloadButton>
                </div>

                {/* Virtual Testing CTA */}
                {(project.category?.slug === 'arduino-projects' || project.category?.slug === 'iot-projects' || project.category?.slug === 'raspberry-pi' || project.technologies?.some(tech => ['Arduino', 'ESP32', 'Raspberry Pi', 'IoT'].includes(tech))) && (
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold mb-2">Test Before You Buy</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use our AI Studio to simulate and test hardware projects virtually before purchasing components.
                    </p>
                    <Button variant="outline" asChild className="w-full rounded-xl touch-action-manipulation active:scale-[0.98] bg-transparent">
                      <Link href="/studio">
                        Try AI Studio
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Helpful Resources Section */}
            <section className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-2">
                Helpful Resources
              </h2>
              <p className="text-muted-foreground mb-6">
                Learn more about the technologies used in this project
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Hardware Resources - Conditional based on project technologies */}
                {project.technologies?.some(tech => ['Arduino', 'ATmega', 'AVR'].some(t => tech.includes(t))) && (
                  <Link
                    href="/resources/arduino"
                    className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                  >
                    <div className="mb-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Arduino Resources</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Boards, sensors, and components for Arduino projects
                    </p>
                  </Link>
                )}

                {project.technologies?.some(tech => ['ESP32', 'ESP8266', 'WiFi', 'Bluetooth'].some(t => tech.includes(t))) && (
                  <Link
                    href="/resources/esp32"
                    className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                  >
                    <div className="mb-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">ESP32 Resources</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      WiFi/Bluetooth microcontrollers and IoT guides
                    </p>
                  </Link>
                )}

                {project.technologies?.some(tech => ['Raspberry Pi', 'Python', 'GPIO'].some(t => tech.includes(t))) && (
                  <Link
                    href="/resources/raspberry-pi"
                    className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                  >
                    <div className="mb-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Raspberry Pi Resources</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Single-board computers and HATs for advanced projects
                    </p>
                  </Link>
                )}

                {/* Web Development Resources - For web-based projects */}
                {(project.technologies?.some(tech => ['React', 'Next.js', 'Node.js', 'JavaScript', 'TypeScript', 'HTML', 'CSS'].some(t => tech.includes(t))) ||
                  project.category?.slug === 'web-development') && (
                    <Link
                      href="/resources/web-development"
                      className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                    >
                      <div className="mb-2">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Web Development</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        React, Next.js, Node.js frameworks and tools
                      </p>
                    </Link>
                  )}

                {/* AI Development - Always useful */}
                <Link
                  href="/resources/ai-development"
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="mb-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">AI Coding Tools</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    GitHub Copilot, ChatGPT, Claude for faster development
                  </p>
                </Link>

                {/* Hosting - Always useful for deployment */}
                <Link
                  href="/resources/hosting-deployment"
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="mb-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">Hosting & Deployment</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Deploy with Vercel, Netlify, Railway, and more
                  </p>
                </Link>

                {/* Browse All Resources */}
                <Link
                  href="/resources"
                  className="group rounded-xl border border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/50 hover:shadow-md touch-action-manipulation active:scale-[0.98]"
                >
                  <div className="mb-2">
                    <h3 className="font-semibold text-primary">Browse All Resources</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View all {project.technologies?.length || 0}+ resources and guides
                  </p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  )
}
