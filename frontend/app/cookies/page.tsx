import { Metadata } from "next"
import { generatePageMetadata, generateBreadcrumbs } from "@/lib/metadata-utils"
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"

export const metadata: Metadata = generatePageMetadata({
  title: "Cookie Policy - How We Use Cookies",
  description: "Learn how ProjectCraft uses cookies for authentication, preferences, and to improve your experience.",
  path: "/cookies",
  keywords: ["cookies", "cookie policy", "privacy", "ProjectCraft settings"],
})

export default function CookiesPage() {
  const breadcrumbs = generateBreadcrumbs('/cookies')

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />

      <main role="main" aria-label="Cookie Policy" className="min-h-screen pb-24 md:pb-0">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">Cookie Policy</h1>
              <p className="text-muted-foreground">Last updated: January 2026</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-10">
          <article className="mx-auto max-w-4xl">
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They help the
                website remember your preferences and improve your browsing experience.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">ProjectCraft uses cookies for:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Essential cookies:</strong> Required for the website to function properly (e.g., theme
                  preferences)
                </li>
                <li>
                  <strong>Authentication cookies:</strong> session_token, user_data, user_email - Used to keep you logged in and maintain your session (expires after inactivity or logout)
                </li>
                <li>
                  <strong>Analytics cookies:</strong> Help us understand how visitors use our site
                </li>
                <li>
                  <strong>Preference cookies:</strong> Remember your settings and choices
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies through your browser settings. Most browsers allow you to refuse
                cookies or delete existing cookies. Please note that disabling cookies may affect some functionality of
                our website.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services that set their own cookies for analytics and functionality purposes.
                These third parties have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us at contact@projectcraft.in.
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
