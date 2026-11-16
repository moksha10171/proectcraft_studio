import { Github, FolderOpen, Cpu, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { APP_CONFIG } from "@/lib/config"
import { ENV_SETUP_STEPS } from "@/lib/env"
import { SetupStatus } from "@/components/setup-status"

export function SetupSection() {
  return (
    <section id="setup-guide" className="border-b border-border bg-muted/30" aria-labelledby="setup-heading">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <header className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Github className="h-3.5 w-3.5" />
              Open source & self-hosted
            </div>
            <h2 id="setup-heading" className="text-2xl font-bold md:text-3xl lg:text-4xl">
              Run it on your machine
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Clone the repository and run the backend and frontend locally, or use Docker Compose.
              No accounts and no hosted service are required for building and running Uno firmware.
            </p>
          </header>

          <SetupStatus />

          <div className="grid gap-4 sm:grid-cols-2">
            {ENV_SETUP_STEPS.map(({ step, title, command }) => (
              <div key={step} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {step}
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-[#0d1117] p-4 text-xs text-teal-300 font-mono">
                  <code>{command}</code>
                </pre>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: FolderOpen, title: "Local data", desc: "Projects, revisions and recordings live in a SQLite file under ./data." },
              { icon: Cpu, title: "Real toolchain", desc: "Builds use Arduino CLI with the pinned arduino:avr core; the Docker image bundles both." },
              { icon: Key, title: "AI is optional", desc: "Configure a provider under Studio → Assistant, or set a server key in frontend/.env.local." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-xl gap-2">
              <Link href={APP_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
