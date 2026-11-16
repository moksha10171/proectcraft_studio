import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"
import Link from "next/link"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { APP_CONFIG } from "@/lib/config"

export const metadata: Metadata = generatePageMetadata({
  title: "About — Open-Source Arduino Workbench",
  description: "ProjectCraft Studio is an open-source, self-hosted workbench for building, running and sharing small Arduino experiments. Learn what it does, what it does not do, and how to contribute.",
  path: "/about",
  keywords: ["about projectcraft", "open source", "arduino learning", "self-hosted", "avr emulator"],
})

const WORKS = [
  "Editing Arduino C++ and Python sources in a local Monaco editor with revisions and undo.",
  "Building Uno, classic Nano and Mega 2560 sketches with Arduino CLI and a pinned AVR core.",
  "Running compiled Uno firmware in an AVR8js worker: GPIO, timers, analog input and serial output.",
  "Recording pin signals, measuring frequency, duty cycle and pulse widths, and exporting VCD.",
  "Describing connections as named terminals and nets, and checking them against the sketch.",
  "Exporting an experiment (source, board, core, wiring, recordings) and re-importing it elsewhere.",
  "An optional assistant that explains, debugs and proposes changes you review before applying.",
]

const LIMITS = [
  "Only the Arduino Uno is emulated. Nano and Mega compile; Raspberry Pi Python gets a syntax check only.",
  "The circuit is a logical connection view, not a physical layout, PCB tool or analog simulator.",
  "An emulator run is not hardware validation; confirm important results on a real board.",
  "No flashing, physical serial capture, ESP32 or Pico execution yet.",
  "No built-in login: use it locally or behind your own authentication.",
]

export default function AboutPage() {
  const breadcrumbs = generateBreadcrumbs("/about")

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main className="min-h-screen pb-24 md:pb-0" role="main" aria-label="About page">
        <section className="border-b border-border bg-card" aria-labelledby="about-heading">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-4xl">
              <h1 id="about-heading" className="mb-3 text-3xl font-bold md:text-4xl">About ProjectCraft Studio</h1>
              <p className="text-lg text-muted-foreground">
                An open-source workbench for understanding, testing and sharing small embedded experiments.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <div className="mx-auto max-w-4xl space-y-12">
            <section aria-labelledby="purpose-heading" className="space-y-3">
              <h2 id="purpose-heading" className="text-2xl font-bold">Purpose</h2>
              <p className="leading-relaxed text-muted-foreground">
                Students and makers often cannot tell whether a failing project is a code problem, a wiring problem or a
                tooling problem. ProjectCraft keeps the code, board, wiring and recorded results of an experiment together,
                so you can change one thing, rebuild, run it and compare what actually happened. It is self-hosted, free
                to use and does not require an account or an AI service.
              </p>
            </section>

            <section aria-labelledby="works-heading" className="space-y-3">
              <h2 id="works-heading" className="text-2xl font-bold">What works today</h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                {WORKS.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section aria-labelledby="limits-heading" className="space-y-3">
              <h2 id="limits-heading" className="text-2xl font-bold">Limits</h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                {LIMITS.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section aria-labelledby="open-heading" className="space-y-3">
              <h2 id="open-heading" className="text-2xl font-bold">Open source</h2>
              <p className="leading-relaxed text-muted-foreground">
                Licensed under MIT and maintained by B Mokshagna Reddy and contributors. The Uno engine is built on
                AVR8js; compilation uses Arduino CLI. Contributions are welcome, especially tested board adapters, example
                experiments and accessibility improvements. Please include real fixtures and an honest description of what a
                new feature does and does not model.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="rounded-xl">
                  <Link href="/studio">Open Studio <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <a href={APP_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" aria-hidden="true" />
                    View source
                  </a>
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
