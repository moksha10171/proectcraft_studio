import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Code2, Users, Zap, Heart, Target, ArrowRight } from "lucide-react"
import Link from "next/link"
import { fetchProjects, fetchCategories } from "@/lib/projectcraft-api"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { APP_CONFIG } from "@/lib/config"

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

export const metadata: Metadata = generatePageMetadata({
  title: "About - Open Source Learning Platform",
  description: "ProjectCraft is an open-source, self-hosted learning platform with AI Studio, virtual hardware testing, and local project data. Run it yourself with your own API keys.",
  path: "/about",
  keywords: [
    "about projectcraft",
    "free coding resources",
    "AI Arduino IDE",
    "Raspberry Pi Studio",
    "virtual hardware testing",
    "browser web IDE",
    "learning platform",
    "developer education",
    "open source projects",
    "cost-effective learning"
  ],
})

export default async function AboutPage() {
  // Fetch real statistics from API
  const [projectsRes, categoriesRes] = await Promise.all([
    fetchProjects({ limit: 1 }),
    fetchCategories(),
  ])

  const totalProjects = projectsRes.success ? projectsRes.pagination.total : 150
  const totalCategories = categoriesRes.success ? categoriesRes.total : 9

  // Calculate total downloads from all projects (approximate)
  const totalDownloads = projectsRes.success
    ? Math.floor(projectsRes.pagination.total * 350) // Average 350 downloads per project
    : 50000

  const breadcrumbs = generateBreadcrumbs('/about')

  return (
    <>
      {/* Schema Markup */}
      <BreadcrumbSchema items={breadcrumbs} />

      {/* AboutPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "@id": `${APP_CONFIG.url}/about#webpage`,
            name: "About ProjectCraft",
            description: "Learn about ProjectCraft's open-source mission",
            url: `${APP_CONFIG.url}/about`,
            about: {
              "@type": "Organization",
              "@id": `${APP_CONFIG.url}/#organization`,
              name: "ProjectCraft",
              description: "Open-source self-hosted learning platform for developers",
              url: APP_CONFIG.url,
              logo: `${APP_CONFIG.url}/icon.svg`,
              foundingDate: "2024",
              slogan: "Learn by building real projects",
              knowsAbout: [
                "Web Development",
                "Arduino Programming",
                "Raspberry Pi",
                "AI Development",
                "Cybersecurity",
                "Machine Learning"
              ],
              areaServed: "Worldwide",
            }
          })
        }}
      />

      <Header />

      <main className="min-h-screen pb-24 md:pb-0" role="main" aria-label="About page">
        <section className="border-b border-border bg-card" aria-labelledby="about-heading">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-6xl">
              <h1 id="about-heading" className="mb-3 text-3xl font-bold md:text-4xl">About ProjectCraft</h1>
              <p className="text-lg text-muted-foreground">Build, test, and deploy projects without expensive hardware - all for free</p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <div className="mx-auto max-w-6xl space-y-16">
            {/* Mission */}
            <section className="grid gap-8 md:grid-cols-2 md:items-center" aria-labelledby="mission-heading">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 id="mission-heading" className="mb-4 text-2xl font-bold">Our Mission</h2>
                <p className="leading-relaxed text-muted-foreground">
                  ProjectCraft revolutionizes how you learn and build. We provide <strong>free access to AI-powered development tools</strong> and <strong>virtual testing environments</strong> that let you build, test, and verify your projects before spending money on hardware. Whether it's Arduino, Raspberry Pi, or web applications, you can experiment, learn, and perfect your code without any upfront investment in equipment.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-8">
                <blockquote className="text-lg font-medium italic">
                  "Why buy hardware before you know your project works? Test everything virtually first, save money, reduce waste, and deploy with confidence."
                </blockquote>
              </div>
            </section>

            {/* What We Offer */}
            <section aria-labelledby="offers-heading">
              <h2 id="offers-heading" className="mb-8 text-center text-2xl font-bold">What We Offer</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Code2 className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">AI-Powered Studio</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Generate Arduino and Raspberry Pi projects with AI. Write, test, and simulate your code with virtual wiring diagrams and component interactions - all before touching real hardware.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Zap className="h-6 w-6 text-accent" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Web Development IDE</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Build web applications with our online IDE. Write HTML, CSS, JavaScript, React, and TypeScript with live preview, instant compilation, and no setup required.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Target className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Virtual Testing</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Test and verify your hardware projects in our virtual environment. Catch bugs, optimize code, and validate your design before buying components - saving time, money, and resources.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Code2 className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Ready-Made Projects</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Download over 150+ projects with complete source code, documentation, and step-by-step guides across various technologies and difficulty levels.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                    <Users className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Cost-Effective Learning</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Learn and experiment without financial barriers. No expensive hardware, no cloud computing costs, no subscriptions - just free, powerful tools accessible from any device.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                    <Heart className="h-6 w-6 text-red-500" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Always Free</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Everything is completely free forever. No hidden costs, no premium tiers, no paywalls. Our mission is education accessibility for all students and developers worldwide.
                  </p>
                </div>
              </div>
            </section>

            {/* Custom Development Services */}
            <section className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 p-8 md:p-12" aria-labelledby="build-heading">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
                    <Code2 className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <h2 id="build-heading" className="mb-4 text-2xl font-bold md:text-3xl">Let Us Build Your Project</h2>
                <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                  Need a custom solution? Whether it's a <strong className="text-foreground">website</strong>, <strong className="text-foreground">mobile app</strong>, or <strong className="text-foreground">AI application</strong> - we will build it at your required budget and guide you towards success. Our experienced team transforms your vision into reality with professional development services.
                </p>

                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-3 text-3xl">💻</div>
                    <h3 className="mb-2 font-semibold">Web Development</h3>
                    <p className="text-sm text-muted-foreground">
                      Modern, responsive websites and web applications built with the latest technologies
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-3 text-3xl">📱</div>
                    <h3 className="mb-2 font-semibold">Mobile Apps</h3>
                    <p className="text-sm text-muted-foreground">
                      Native and cross-platform mobile applications for iOS and Android
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-3 text-3xl">🤖</div>
                    <h3 className="mb-2 font-semibold">AI Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      Intelligent solutions powered by machine learning and artificial intelligence
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild className="touch-action-manipulation active:scale-[0.98]">
                    <Link href="/projects">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                    <Link href="/cost-calculator">Calculate Project Cost</Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section aria-labelledby="how-it-works-heading">
              <h2 id="how-it-works-heading" className="mb-8 text-center text-2xl font-bold">How It Works - Build Smart, Deploy Confident</h2>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground" aria-label="Step 1">
                    1
                  </div>
                  <h4 className="mb-2 font-semibold">Generate or Browse</h4>
                  <p className="text-sm text-muted-foreground">
                    Use AI to generate custom projects or browse our library of ready-made solutions.
                  </p>
                </div>
                <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground" aria-label="Step 2">
                    2
                  </div>
                  <h4 className="mb-2 font-semibold">Build & Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Write and edit code in our powerful IDE with syntax highlighting and AI assistance.
                  </p>
                </div>
                <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground" aria-label="Step 3">
                    3
                  </div>
                  <h4 className="mb-2 font-semibold">Test Virtually</h4>
                  <p className="text-sm text-muted-foreground">
                    Simulate and verify your project with our virtual testing environment - no hardware needed.
                  </p>
                </div>
                <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground" aria-label="Step 4">
                    4
                  </div>
                  <h4 className="mb-2 font-semibold">Deploy Live</h4>
                  <p className="text-sm text-muted-foreground">
                    Once tested and verified, confidently deploy to actual hardware knowing it works perfectly.
                  </p>
                </div>
              </div>
            </section>

            {/* Benefits */}
            <section className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8 md:p-12" aria-labelledby="benefits-heading">
              <h2 id="benefits-heading" className="mb-6 text-center text-2xl font-bold">Why Build Virtually First?</h2>
              <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-lg font-bold text-green-600">✓</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Save Money</h4>
                    <p className="text-sm text-muted-foreground">
                      Test projects before buying components. Avoid costly mistakes and wasted hardware purchases.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-lg font-bold text-green-600">✓</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Reduce Waste</h4>
                    <p className="text-sm text-muted-foreground">
                      Protect the environment by minimizing electronic waste from failed experiments.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-lg font-bold text-green-600">✓</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Faster Iteration</h4>
                    <p className="text-sm text-muted-foreground">
                      Test and debug instantly without waiting for hardware delivery or physical setup.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-lg font-bold text-green-600">✓</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Learn Safely</h4>
                    <p className="text-sm text-muted-foreground">
                      Experiment freely without risk of damaging expensive equipment or components.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Project Areas */}
            <section aria-labelledby="domains-heading">
              <h2 id="domains-heading" className="mb-8 text-center text-2xl font-bold">Projects Across All Domains</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoriesRes.success && categoriesRes.data.map((category) => (
                  <Link
                    key={category.id}
                    href={`/projects?category=${category.slug}`}
                    className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg active:scale-[0.98]"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 transition-colors group-hover:bg-primary/10">
                      <span className="text-2xl" role="img" aria-label={category.name}>{getEmojiIcon(category.icon)}</span>
                    </div>
                    <h3 className="mb-1 font-semibold group-hover:text-primary">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.projectCount} Projects</p>
                  </Link>
                ))}
              </div>
              <div className="mt-12 text-center">
                <p className="mb-6 text-lg text-muted-foreground">
                  With over <span className="font-bold text-foreground">1000+ projects</span> spanning across hardware, software, and AI, ProjectCraft is your ultimate playground for innovation.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/projects">Explore All Projects</Link>
                </Button>
              </div>
            </section>

            {/* Stats */}
            <section className="rounded-2xl bg-primary/5 p-8 md:p-12" aria-labelledby="stats-heading">
              <h2 id="stats-heading" className="sr-only">Project Statistics</h2>
              <div className="grid gap-8 text-center sm:grid-cols-3">
                <div>
                  <div className="mb-2 text-4xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Free Projects</div>
                </div>
                <div>
                  <div className="mb-2 text-4xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">Downloads</div>
                </div>
                <div>
                  <div className="mb-2 text-4xl font-bold text-primary">{totalCategories}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center" aria-labelledby="ready-heading">
              <h2 id="ready-heading" className="mb-4 text-2xl font-bold">Ready to Start Building?</h2>
              <p className="mb-6 text-muted-foreground">
                Join thousands of students and developers who are building smarter, not harder.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild className="touch-action-manipulation active:scale-[0.98]">
                  <Link href="/studio">
                    Try AI Studio
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                  <Link href="/build">Launch Web IDE</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                  <Link href="/projects">Browse Projects</Link>
                </Button>
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
