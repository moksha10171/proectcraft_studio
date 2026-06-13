"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, AlertTriangle, Loader2, Key, Server, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_CONFIG } from "@/lib/config"

interface HealthResponse {
  status: string
  mode?: string
  auth?: string
  backend?: string
  checks: {
    server?: { status: string }
    environment: {
      status?: string
      hasGeminiKey: boolean
      hasGroqKey: boolean
      hasAiProvider?: boolean
    }
    agent?: {
      status: string
      name: string
      endpoint: string
    }
    data?: {
      status: string
      projectCount?: number
    }
  }
  setup?: {
    envFile: string
    exampleFile: string
    docs: string
  }
}

export function SetupStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [backendReachable, setBackendReachable] = useState(false)

  useEffect(() => {
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw new Error("health check failed")
        return r.json()
      })
      .then((data) => {
        setHealth(data)
        setBackendReachable(true)
      })
      .catch(() => {
        setHealth(null)
        setBackendReachable(false)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking environment…
      </div>
    )
  }

  const envFile = health?.setup?.envFile ?? "frontend/.env.local"
  const exampleFile = health?.setup?.exampleFile ?? ".env.local.example"
  const hasGemini = health?.checks?.environment?.hasGeminiKey
  const hasGroq = health?.checks?.environment?.hasGroqKey
  const aiReady = hasGemini || hasGroq
  const agentName = health?.checks?.agent?.name ?? "projectcraft__workspace_agent"

  return (
    <div
      className={`rounded-2xl border p-5 md:p-6 ${
        !backendReachable
          ? "border-red-500/30 bg-red-500/5"
          : aiReady
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {!backendReachable ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : aiReady ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <h3 className="font-semibold">
              {!backendReachable
                ? "Python backend not reachable"
                : aiReady
                  ? "AI provider configured"
                  : "AI keys not configured (BYOK still works)"}
            </h3>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-4 w-4 shrink-0" />
              <span>
                Local-first — no auth · backend{" "}
                {backendReachable ? (
                  <span className="text-emerald-600 dark:text-emerald-400">connected</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">offline (run pnpm dev)</span>
                )}
              </span>
            </div>
            {backendReachable && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bot className="h-4 w-4 shrink-0" />
                <span>
                  Agent <code className="rounded bg-muted px-1 py-0.5 text-xs">{agentName}</code> via{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/agent</code>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={hasGemini ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                GEMINI_API_KEY {hasGemini ? "✓" : `— add to ${envFile}`}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-6 text-sm">
              <span className={hasGroq ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                GROQ_API_KEY {hasGroq ? "✓ (fallback)" : "— optional fallback"}
              </span>
            </div>
          </div>

          {!backendReachable && (
            <p className="text-sm text-muted-foreground max-w-lg">
              Start both services with <code className="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm dev</code>{" "}
              (Next.js :3000 + Python :8000). See{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">docs/SETUP.md</code> in the repo.
            </p>
          )}

          {backendReachable && !aiReady && (
            <p className="text-sm text-muted-foreground max-w-lg">
              Copy <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{exampleFile}</code> to{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{envFile}</code> and add your keys,
              or paste them in Studio → Models (browser-only BYOK). You are responsible for API usage and costs.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button size="sm" variant="outline" asChild className="rounded-xl">
            <Link href={APP_CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
          </Button>
          {!aiReady && backendReachable && (
            <Button size="sm" asChild className="rounded-xl">
              <Link href="/studio">Configure in Studio</Link>
            </Button>
          )}
          {!backendReachable && (
            <Button size="sm" asChild className="rounded-xl">
              <a href="#setup-guide">Setup steps</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
