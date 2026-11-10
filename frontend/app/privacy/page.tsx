import { Metadata } from "next"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"

export const metadata: Metadata = generatePageMetadata({
  title: "Privacy Policy",
  description: "How ProjectCraft handles data in self-hosted open-source mode.",
  path: "/privacy",
  keywords: ["privacy policy", "self-hosted", "open source"],
})

export default function PrivacyPage() {
  const breadcrumbs = generateBreadcrumbs('/privacy')

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main role="main" aria-label="Privacy Policy" className="min-h-screen pb-24 md:pb-0">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: November 2026</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <article className="mx-auto max-w-4xl space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-4">Open Source & Self-Hosted</h2>
              <p className="text-muted-foreground leading-relaxed">
                ProjectCraft is open-source software that you run on your own infrastructure.
                This instance does not connect to any proprietary backend service. You are responsible
                for your deployment, configuration, and compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Data We Store Locally</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Bookmarks saved in your browser&apos;s localStorage (never sent to a server)</li>
                <li>Theme preference and UI settings in localStorage</li>
                <li>Studio chat history, input drafts, and codebase saved locally (browser + server SQLite database and attachments)</li>
                <li>Project data from local JSON files in <code>data/projects/</code></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">AI Features</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you use AI features (Studio, Chat), your prompts are sent directly
                from your server to the AI provider you configure (Gemini, Groq, OpenAI, Anthropic or a compatible local server) using your own API keys.
                ProjectCraft does not proxy these requests through any third-party service.
                You are responsible for reviewing each provider&apos;s privacy policy and managing your API usage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">No User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                This open-source version does not include user authentication or account management.
                Chat, source files and attachments are stored on your instance backend; their contents may include personal data you provide. Model Manager keys are kept in browser localStorage and transmitted through your backend for provider requests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use minimal browser storage for theme preferences and bookmarks. No authentication cookies are used.
                See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  )
}
