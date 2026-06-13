import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchProjects, fetchCategories, APICategory } from "@/lib/projectcraft-api"
import { ArrowRight, Sparkles, Cpu, Microchip, Wifi, Package, Bot, Code } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { FAQSection } from "@/components/content/faq-section"
import { FAQSchema } from "@/components/seo/faq-schema"
import { SetupSection } from "@/components/home/setup-section"
import { ModelManagementSection } from "@/components/home/model-management-section"
import { APP_CONFIG } from "@/lib/config"

export const metadata: Metadata = generatePageMetadata({
  title: "ProjectCraft — Local AI Studio for Embedded Projects",
  description: "Self-hosted open-source Studio for Arduino and Raspberry Pi. BYOK model manager, wiring simulation, and local project catalog — no accounts.",
  path: "/",
  keywords: ["open source", "self-hosted", "arduino studio", "raspberry pi", "BYOK", "local AI"],
})

const iconToEmoji: Record<string, string> = {
  "fas fa-globe": "🌐",
  "fas fa-mobile-alt": "📱",
  "fas fa-microchip": "🔧",
  "fas fa-terminal": "💾",
}

function getEmojiIcon(icon: string): string {
  return iconToEmoji[icon] || "📁"
}

const HOMEPAGE_FAQS = [
  {
    question: "What is ProjectCraft Studio?",
    answer: "A browser-based IDE for Arduino and Raspberry Pi with AI code generation, wiring visualization, and virtual simulation. It runs locally — you bring your own API keys.",
  },
  {
    question: "Do I need an account?",
    answer: "No. This is local-first with no authentication. Model keys and workspace state stay on your machine (browser localStorage + data/studio/).",
  },
  {
    question: "How do I configure AI models?",
    answer: "Either add GEMINI_API_KEY or GROQ_API_KEY to frontend/.env.local, or open Studio → Models and paste keys there. Each model card supports edit, test connection, and set active.",
  },
  {
    question: "Where are API keys stored?",
    answer: "BYOK keys from the Model Manager are stored only in your browser localStorage. Server env keys in frontend/.env.local are read by the Python backend for /api/agent when BYOK is not set.",
  },
  {
    question: "How do I add projects?",
    answer: "Edit data/projects/projects.json and data/projects/categories.json. No database required.",
  },
] as const

export default async function HomePage() {
  const [projectsRes, categoriesRes] = await Promise.all([
    fetchProjects({ limit: 1 }),
    fetchCategories(),
  ])

  const totalProjects = projectsRes.success ? projectsRes.pagination.total : 0
  const categories = categoriesRes.success ? categoriesRes.data : []
  const breadcrumbs = [{ name: "Home", url: APP_CONFIG.url }]

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <FAQSchema faqs={[...HOMEPAGE_FAQS]} pageTitle="ProjectCraft" />
      <Header />

      <main id="main-content" className="min-h-screen pb-20 md:pb-0" role="main">
        {/* Hero — Studio first */}
        <section className="relative overflow-hidden border-b border-border" aria-labelledby="hero-heading">
          <div className="absolute inset-0 -z-10">
            <Image src="/hero-bg.png" alt="" aria-hidden="true" fill className="object-cover opacity-15 dark:opacity-25" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          </div>

          <div className="container relative mx-auto px-4 py-20 md:py-28 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-teal-500/30 bg-teal-500/5 text-teal-600 dark:text-teal-400">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Local-first · No auth · BYOK
              </Badge>

              <h1 id="hero-heading" className="mb-6 text-balance text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                AI Studio for{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-500">
                  Arduino & Raspberry Pi
                </span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                Generate code, derive wiring, and simulate circuits — self-hosted on your machine with your own API keys.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="h-14 px-8 rounded-full text-base font-semibold shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-500">
                  <Link href="/studio">
                    Launch Studio
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-full text-base">
                  <a href="#setup-guide">Setup & API Keys</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <SetupSection />
        <ModelManagementSection />

        {/* Studio features */}
        <section className="border-b border-border py-16 md:py-20" aria-labelledby="studio-heading">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-5xl text-center space-y-4 mb-12">
              <h2 id="studio-heading" className="text-2xl font-bold md:text-3xl">What Studio does</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Multi-turn agent with tool calls: generate → verify → derive wiring → apply changes.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              {[
                { icon: Bot, title: "AI Agent", desc: "Chat-driven code generation with slash commands" },
                { icon: Cpu, title: "Wiring", desc: "Auto-derived breadboard manifests from code" },
                { icon: Code, title: "Verify", desc: "Arduino C++ and Python GPIO checks" },
                { icon: Wifi, title: "Simulate", desc: "Interactive circuit preview in the browser" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-5 text-center space-y-2">
                  <Icon className="h-6 w-6 text-teal-500 mx-auto" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-card" aria-label="Platform statistics">
          <div className="container mx-auto px-6 py-10">
            <div className="grid gap-6 grid-cols-3 max-w-3xl mx-auto text-center">
              <div>
                <div className="text-3xl font-bold">{totalProjects || "—"}</div>
                <div className="text-sm text-muted-foreground">Local Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-600">BYOK</div>
                <div className="text-sm text-muted-foreground">Your Keys</div>
              </div>
            </div>
          </div>
        </section>

        {/* Hardware resources — compact */}
        <section className="border-b border-border py-16 md:py-20" aria-labelledby="resources-heading">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 id="resources-heading" className="text-2xl font-bold md:text-3xl">Hardware resources</h2>
                <p className="text-muted-foreground mt-1">Component guides for embedded projects</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/resources">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </header>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { href: "/resources/arduino", title: "Arduino", icon: Cpu, count: "50+ components" },
                { href: "/resources/raspberry-pi", title: "Raspberry Pi", icon: Microchip, count: "GPIO & HATs" },
                { href: "/resources/esp32", title: "ESP32", icon: Wifi, count: "IoT boards" },
              ].map(({ href, title, icon: Icon, count }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
                >
                  <Icon className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Package className="h-3.5 w-3.5" /> {count}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="border-b border-border py-16 md:py-20" aria-labelledby="categories-heading">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12">
              <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 id="categories-heading" className="text-2xl font-bold md:text-3xl">Project categories</h2>
                  <p className="text-muted-foreground mt-1">Browse local project templates</p>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/projects">All projects <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.slice(0, 8).map((category: APICategory) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                    >
                      <span className="text-2xl" aria-hidden="true">{getEmojiIcon(category.icon)}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{category.name}</div>
                        <div className="text-xs text-muted-foreground">{category.projectCount} projects</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="border-b border-border py-16 md:py-20">
          <div className="container mx-auto px-6 max-w-3xl">
            <FAQSection title="Common questions" faqs={[...HOMEPAGE_FAQS]} />
          </div>
        </section>

        {/* CTA */}
        <section className="bg-teal-500/5 py-16 md:py-20">
          <div className="container mx-auto px-6 text-center space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold md:text-3xl">Ready to build?</h2>
            <p className="text-muted-foreground">
              Clone, configure your keys, and open Studio. You own the stack, the data, and the costs.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="rounded-xl">
                <Link href="/studio">Open Studio <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl">
                <a href="#setup-guide">Setup guide</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  )
}
