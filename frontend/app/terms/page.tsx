import { Metadata } from "next"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"

export const metadata: Metadata = generatePageMetadata({
  title: "Terms of Service",
  description: "Terms for using the open-source ProjectCraft platform.",
  path: "/terms",
  keywords: ["terms of service", "open source", "MIT license"],
})

export default function TermsPage() {
  const breadcrumbs = generateBreadcrumbs('/terms')

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main role="main" aria-label="Terms of Service" className="min-h-screen pb-24 md:pb-0">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: June 2026</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <article className="mx-auto max-w-4xl space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By using this self-hosted instance of ProjectCraft, you agree to these terms.
                If you do not agree, please do not use the software.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Open Source License</h2>
              <p className="text-muted-foreground leading-relaxed">
                ProjectCraft is provided as open-source software. You may use, modify, and distribute
                it according to the license included in the repository. Project files and resources
                may have their own licenses as specified in their documentation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Your Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Configure and secure your own API keys (Gemini, Groq, etc.)</li>
                <li>Monitor and pay for your own AI API usage and costs</li>
                <li>Review and verify all AI-generated code before use in production or with real hardware</li>
                <li>Ensure your deployment complies with applicable laws and regulations</li>
                <li>Maintain backups of your project data in <code>data/projects/</code></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">AI-Generated Content Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                AI features generate content that may be inaccurate, incomplete, or unsafe.
                <strong className="text-foreground"> It is your responsibility</strong> to review, test, and validate
                all AI output before relying on it. Virtual simulations approximate hardware behavior but
                do not guarantee real-world results. Always follow safety guidelines when working with electronics.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
                IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER
                LIABILITY ARISING FROM THE USE OF THIS SOFTWARE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Educational Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                Projects, tutorials, and resources are provided for educational purposes.
                You may download, modify, and use them for learning and personal projects with proper attribution.
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
