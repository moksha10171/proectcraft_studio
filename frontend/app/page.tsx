import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchProjects, fetchCategories, APICategory } from "@/lib/projectcraft-api"
import { ArrowRight, Sparkles, Cpu, CircuitBoard, Activity, Bot, Hammer, PackageOpen, Play } from "lucide-react"
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
  title: "ProjectCraft Studio — Open-Source Arduino Experiment Workbench",
  description: "Self-hosted, open-source workbench for Arduino learning: build with the real Arduino compiler, run Uno firmware in the browser, inspect signals and share reproducible experiments. AI optional.",
  path: "/",
  keywords: ["open source", "self-hosted", "arduino", "avr emulator", "logic analyzer", "raspberry pi", "embedded learning"],
})

const HOMEPAGE_FAQS = [
  {
    question: "What is ProjectCraft Studio?",
    answer: "A self-hosted workbench for small embedded experiments. You edit code, build it with the real Arduino compiler, run Arduino Uno firmware in an in-browser AVR emulator, inspect pin signals and serial output, and export the experiment so someone else can reproduce it.",
  },
  {
    question: "Do I need an account or an AI key?",
    answer: "No. There is no login and the editor, compiler, emulator and export work without any AI provider. AI is an optional assistant that can explain, debug and propose changes you review before they are applied.",
  },
  {
    question: "Which boards are supported?",
    answer: "Arduino Uno, classic Nano and Mega 2560 compile with Arduino CLI. Only the Uno is emulated (GPIO, timers, ADC and serial). Raspberry Pi Python projects get a syntax check. ESP32 and Pico execution are not implemented.",
  },
  {
    question: "Does a passing run prove my hardware will work?",
    answer: "No. A build proves the code compiles; an emulator run shows how the emulated chip behaves. Neither is a substitute for testing on physical hardware, and the circuit view does not solve analog voltage or current.",
  },
  {
    question: "Where is my data stored?",
    answer: "In a local SQLite database under ./data on the machine running the backend. Browser-entered AI keys live in your browser's localStorage and are sent to your own backend when you use the assistant.",
  },
] as const

const CAPABILITIES = [
  { icon: Hammer, title: "Real builds", desc: "Arduino CLI compiles Uno, Nano and Mega sketches; errors link back to the source line." },
  { icon: Play, title: "Run Uno firmware", desc: "Compiled HEX runs in an AVR8js worker: GPIO, timers, analog input and serial output." },
  { icon: CircuitBoard, title: "Explicit circuit", desc: "Named terminals and nets with a keyboard-accessible inspector and a wiring check against your sketch." },
  { icon: Activity, title: "Signal analysis", desc: "Multi-pin waveforms with frequency, duty cycle and pulse-width measurements, plus VCD export." },
  { icon: Bot, title: "Optional assistant", desc: "Explain, debug and propose changes using real build results and recordings. You apply or reject." },
  { icon: PackageOpen, title: "Portable experiments", desc: "Export source, board, core version, wiring and recordings as one reviewable bundle." },
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
        <section className="relative overflow-hidden border-b border-border" aria-labelledby="hero-heading">
          <div className="absolute inset-0 -z-10">
            <Image src="/hero-bg.png" alt="" aria-hidden="true" fill className="object-cover opacity-15 dark:opacity-25" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          </div>

          <div className="container relative mx-auto px-4 py-20 md:py-28 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-teal-500/30 bg-teal-500/5 text-teal-600 dark:text-teal-400">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Open source · Self-hosted · No account
              </Badge>

              <h1 id="hero-heading" className="mb-6 text-balance text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                Build, run and{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-500">
                  inspect Arduino experiments
                </span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                Write code, compile it with the real Arduino toolchain, run Uno firmware in your browser and
                see exactly what each pin did. AI help is optional and always reviewable.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="h-14 px-8 rounded-full text-base font-semibold shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-500">
                  <Link href="/studio">
                    Open Studio
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-full text-base">
                  <a href="#setup-guide">Run it yourself</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-16 md:py-20" aria-labelledby="studio-heading">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-5xl text-center space-y-4 mb-12">
              <h2 id="studio-heading" className="text-2xl font-bold md:text-3xl">What Studio does today</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Edit → build → run → inspect → export. Each step reports which engine produced the result.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
                  <Icon className="h-6 w-6 text-teal-500" aria-hidden="true" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground">
              Limits: only the Arduino Uno is emulated. The circuit is a logical connection view, not a physical
              layout or analog simulator, and an emulator run is not hardware validation.
            </p>
          </div>
        </section>

        <SetupSection />
        <ModelManagementSection />

        <section className="border-b border-border py-16 md:py-20" aria-labelledby="resources-heading">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12">
            <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 id="resources-heading" className="text-2xl font-bold md:text-3xl">Hardware references</h2>
                <p className="text-muted-foreground mt-1">Board and component guides to read alongside your experiments</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/resources">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </header>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { href: "/resources/arduino", title: "Arduino" },
                { href: "/resources/raspberry-pi", title: "Raspberry Pi" },
                { href: "/resources/esp32", title: "ESP32" },
              ].map(({ href, title }) => (
                <Link key={href} href={href} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                  <Cpu className="h-6 w-6 text-primary mb-3" aria-hidden="true" />
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {categories.length > 0 && totalProjects > 0 && (
          <section className="border-b border-border py-16 md:py-20" aria-labelledby="categories-heading">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12">
              <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 id="categories-heading" className="text-2xl font-bold md:text-3xl">Starter sources</h2>
                  <p className="text-muted-foreground mt-1">Downloadable example sketches and scripts ({totalProjects} in this catalog)</p>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/projects">All projects <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.filter((category: APICategory) => category.projectCount > 0).map((category: APICategory) => (
                  <li key={category.id}>
                    <Link href={`/categories/${category.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{category.name}</div>
                        <div className="text-xs text-muted-foreground">{category.projectCount} {category.projectCount === 1 ? "project" : "projects"}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="border-b border-border py-16 md:py-20">
          <div className="container mx-auto px-6 max-w-3xl">
            <FAQSection title="Common questions" faqs={[...HOMEPAGE_FAQS]} />
          </div>
        </section>

        <section className="bg-teal-500/5 py-16 md:py-20">
          <div className="container mx-auto px-6 text-center space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold md:text-3xl">Try an experiment</h2>
            <p className="text-muted-foreground">
              Open Studio, start from Blink, change the delay, rebuild and compare the signals. It runs on your machine with your own tools.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild className="rounded-xl">
                <Link href="/studio">Open Studio <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl">
                <a href={APP_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">View source</a>
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
