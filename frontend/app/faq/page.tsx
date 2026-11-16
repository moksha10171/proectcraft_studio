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
  title: "FAQ — Self-Hosted Open Source",
  description: "Answers about running ProjectCraft Studio locally, supported boards, what the emulator does and does not model, and optional AI configuration.",
  path: "/faq",
  keywords: ["projectcraft faq", "self-hosted", "arduino emulator", "open source setup"],
})

const faqs = [
  {
    question: "Is ProjectCraft open source?",
    answer: "Yes. It is MIT-licensed software you run yourself. Bundled third-party tools (AVR8js, Arduino CLI and the AVR core, Monaco) keep their own licenses, listed in the README.",
  },
  {
    question: "Do I need an account?",
    answer: "No. There is no login. Projects are stored in a local SQLite database and bookmarks/UI preferences in your browser. Because there is no built-in authentication, put a VPN or authenticating reverse proxy in front of any shared deployment.",
  },
  {
    question: "What is ProjectCraft Studio?",
    answer: "A workbench for small embedded experiments: a code editor, the real Arduino compiler, an in-browser Arduino Uno emulator, a circuit connection editor, signal and serial views, run comparison, and portable experiment bundles.",
  },
  {
    question: "Which boards are supported?",
    answer: "Uno, classic Nano and Mega 2560 compile through Arduino CLI. Only the Uno is emulated (AVR8js: GPIO, timers, ADC and serial). Raspberry Pi Python projects get a syntax check without executing the script. ESP32 and Pico execution, flashing and physical serial capture are not implemented.",
  },
  {
    question: "How accurate is the emulator?",
    answer: "It runs your actual compiled firmware on an emulated ATmega328P, so GPIO timing, serial text and button input reflect the program. It does not model analog electrical behaviour, other chips or external devices beyond the supported parts, and it is not hardware validation.",
  },
  {
    question: "Can I use Studio without AI?",
    answer: "Yes. Editing, building, running, signal inspection and export need no AI key. The assistant is optional.",
  },
  {
    question: "How do I enable AI features?",
    answer: "Open Studio → Assistant → Configure AI providers and add Gemini, Groq, OpenAI, Anthropic or a compatible local server, or set GEMINI_API_KEY / GROQ_API_KEY in frontend/.env.local and restart the backend.",
  },
  {
    question: "Who pays for AI usage?",
    answer: "You do. Hosted providers bill your account. Browser-entered keys are stored in your browser and sent to your own backend, which calls the provider. Your code and prompts go to the provider you choose.",
  },
  {
    question: "How do I add example projects to the catalog?",
    answer: "Edit data/projects/projects.json and data/projects/categories.json and add the source under examples/. See CONTRIBUTING.md for the checklist.",
  },
  {
    question: "How do I verify my setup?",
    answer: "Open /api/health (for example curl http://localhost:3000/api/health). It reports the backend status, whether Arduino CLI is available and whether a server AI key is configured.",
  },
  {
    question: "Can I contribute?",
    answer: "Yes. Open an issue or pull request on GitHub. New boards and components should include exact pin definitions, an honest capability description and real test fixtures.",
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
              <p className="text-muted-foreground">Running, using and extending ProjectCraft Studio</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border px-4">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center space-y-4">
              <p className="text-muted-foreground">Still have questions?</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/#setup-guide">Setup guide</Link>
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
