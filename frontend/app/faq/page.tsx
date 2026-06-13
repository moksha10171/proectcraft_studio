import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FAQPageSchema } from "@/components/seo/json-ld-schemas"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { APP_CONFIG } from "@/lib/config"

export const metadata: Metadata = generatePageMetadata({
  title: "FAQ - Self-Hosted Open Source",
  description: "Answers about running ProjectCraft locally, configuring API keys, Studio, and adding your own projects.",
  path: "/faq",
  keywords: ["projectcraft faq", "self-hosted", "open source setup", "arduino studio"],
})

const faqs = [
  {
    question: "Is ProjectCraft open source?",
    answer:
      "Yes. ProjectCraft is open-source software you clone and run on your own machine or server. No private APIs, no vendor lock-in, no required accounts.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. This version has no authentication. Bookmarks and UI preferences are stored in your browser's localStorage.",
  },
  {
    question: "How do I enable AI features?",
    answer:
      "Copy .env.local.example to frontend/.env.local and add GEMINI_API_KEY and/or GROQ_API_KEY. Or open Studio → Models and paste keys in the browser (localStorage only).",
  },
  {
    question: "Who pays for AI usage?",
    answer:
      "You do. You bring your own API keys and are responsible for monitoring usage, rate limits, and costs. ProjectCraft does not proxy through any third-party service.",
  },
  {
    question: "What is ProjectCraft Studio?",
    answer:
      "Studio is a browser-based IDE for Arduino and Raspberry Pi. It includes AI code generation, wiring visualization, and virtual simulation. It requires configured API keys to use AI features.",
  },
  {
    question: "How do I add projects?",
    answer:
      "Edit data/projects/projects.json with your project entries. Categories are in data/projects/categories.json. See lib/projectcraft-api-types.ts for the schema.",
  },
  {
    question: "Can I use Studio without AI?",
    answer:
      "Yes. You can write code, explore files, and use local syntax verification without API keys. AI generation and chat require configured keys.",
  },
  {
    question: "What devices does Studio support?",
    answer:
      "Arduino (Uno, ESP32) and Raspberry Pi modes. Switch between C++ and Python GPIO programming in the Studio toolbar.",
  },
  {
    question: "How do I verify my setup?",
    answer:
      "Visit /api/health or run: curl http://localhost:3000/api/health — it shows whether your API keys are detected and how many local projects are loaded.",
  },
  {
    question: "Can I contribute?",
    answer:
      "Yes! Open a pull request or issue on GitHub. You can also add projects to your local JSON files and share them with the community.",
  },
]

export default function FAQPage() {
  const breadcrumbs = generateBreadcrumbs("/faq")

  return (
    <>
      <FAQPageSchema faqs={faqs} url={`${APP_CONFIG.url}/faq`} />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main className="min-h-screen pb-24 md:pb-0">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-10 md:py-12">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">Frequently Asked Questions</h1>
              <p className="text-muted-foreground">
                Everything you need to know about self-hosting ProjectCraft
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border px-4">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center space-y-4">
              <p className="text-muted-foreground">Still have questions?</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline" className="rounded-xl">
                  <a href="/#setup-guide">Setup Guide</a>
                </Button>
                <Button asChild className="rounded-xl">
                  <Link href="/studio">Open Studio</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  )
}
