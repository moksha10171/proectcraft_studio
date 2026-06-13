import Link from "next/link"
import { Github, Heart, Key, BookOpen } from "lucide-react"
import { ReportIssueDialog } from "@/components/report-issue-dialog"
import { Logo } from "@/components/logo"
import { BetaBadge } from "@/components/beta-badge"
import { APP_CONFIG } from "@/lib/config"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" aria-label="ProjectCraft - Home">
              <Logo />
            </Link>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Open-source learning hub you self-host. Projects, AI Studio, and virtual testing — powered by your own API keys.
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Bring your own keys
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set <code className="rounded bg-muted px-1">GEMINI_API_KEY</code> or{" "}
                <code className="rounded bg-muted px-1">GROQ_API_KEY</code> in{" "}
                <code className="rounded bg-muted px-1">frontend/.env.local</code>, or use Studio → Models.
              </p>
            </div>
            <Link
              href={APP_CONFIG.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-smooth hover:bg-primary hover:text-primary-foreground"
              aria-label="View source on GitHub"
            >
              <Github className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Learn</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/studio" className="text-muted-foreground transition-colors hover:text-primary inline-flex items-center gap-1.5">
                  Studio <BetaBadge size="sm" />
                </Link>
              </li>
              <li><Link href="/projects" className="text-muted-foreground transition-colors hover:text-primary">Projects</Link></li>
              <li><Link href="/resources" className="text-muted-foreground transition-colors hover:text-primary">Resources</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Self-Host
            </h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/#setup-guide" className="text-muted-foreground transition-colors hover:text-primary">Setup Guide</a></li>
              <li><Link href="/api/health" className="text-muted-foreground transition-colors hover:text-primary">Health Check</Link></li>
              <li><Link href="/faq" className="text-muted-foreground transition-colors hover:text-primary">FAQ</Link></li>
              <li>
                <Link href={APP_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary">
                  GitHub Issues
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">Privacy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">Terms</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground transition-colors hover:text-primary">Cookies</Link></li>
              <li>
                <ReportIssueDialog
                  trigger={
                    <button className="text-muted-foreground transition-colors hover:text-primary text-left">
                      Report Issue
                    </button>
                  }
                />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {APP_CONFIG.name}. Open source — MIT license.
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 text-rose-500" aria-label="love" /> for learners everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
