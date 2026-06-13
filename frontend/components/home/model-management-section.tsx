import Link from "next/link"
import {
  ArrowRight, Bot, Check, Eye, Key, Pencil, Server, Settings2, Trash2, Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const PROVIDERS = [
  { id: "gemini", label: "Gemini", model: "gemini-2.5-flash-lite", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "groq", label: "Groq", model: "llama-3.3-70b-versatile", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "custom", label: "Ollama", model: "qwen2.5-coder:7b", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
] as const

const FEATURES = [
  { icon: Key, title: "Browser-only storage", desc: "API keys saved in localStorage — never uploaded to a server" },
  { icon: Pencil, title: "Edit anytime", desc: "Change provider, model, temperature, and max tokens per card" },
  { icon: Settings2, title: "Multiple models", desc: "Add Gemini, Groq, OpenAI, Anthropic, or a local Ollama endpoint" },
  { icon: Wifi, title: "Test connection", desc: "Verify each model before chatting in Studio" },
] as const

export function ModelManagementSection() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-violet-500/5 to-background" aria-labelledby="models-heading">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
        <div className="mx-auto max-w-6xl space-y-12">
          <header className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="rounded-full border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400">
              BYOK · Model Manager
            </Badge>
            <h2 id="models-heading" className="text-2xl font-bold md:text-3xl lg:text-4xl">
              Your models, your keys
            </h2>
            <p className="text-muted-foreground">
              Configure AI providers in Studio → Models. Each model is an independent agent with its own API key,
              or set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GEMINI_API_KEY</code> in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">frontend/.env.local</code> for server defaults.
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            {/* Preview cards — mirrors Studio ModelManager */}
            <div className="rounded-2xl border border-border bg-[#0d1117] p-4 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Server className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Models</p>
                  <p className="text-[10px] text-gray-500">2 configured · Gemini Flash active</p>
                </div>
              </div>

              {PROVIDERS.slice(0, 2).map((p, i) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-3 ${
                    i === 0 ? "border-teal-500/40 bg-teal-500/5" : "border-white/10 bg-[#161b22]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        i === 0 ? "border-teal-500 bg-teal-500" : "border-gray-600"
                      }`}
                    >
                      {i === 0 && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">
                        {i === 0 ? "Gemini Flash" : "Local Ollama"}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{p.model}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${p.color}`}>
                      {p.label}
                    </span>
                    <div className="flex gap-0.5">
                      <span className="p-1 rounded text-gray-500" title="Configure">
                        <Settings2 className="h-3 w-3" />
                      </span>
                      <span className="p-1 rounded text-gray-600" title="Remove">
                        <Trash2 className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  {i === 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-3 w-3 text-gray-500 shrink-0" />
                        <div className="flex-1 rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-[10px] font-mono text-gray-500 flex items-center justify-between">
                          <span>••••••••••••••••</span>
                          <Eye className="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Connected</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="rounded-xl border border-dashed border-teal-500/30 py-2 text-center text-[11px] font-semibold text-teal-500">
                + Add Model
              </div>
              <p className="text-[10px] text-gray-600 text-center">
                Keys stored only in your browser localStorage
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <Icon className="h-5 w-5 text-violet-500" />
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Supported providers</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROVIDERS.map(p => (
                    <span key={p.id} className={`text-xs px-2 py-1 rounded-full border ${p.color}`}>
                      {p.label}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-1 rounded-full border bg-purple-500/10 text-purple-600 border-purple-500/20">
                    Anthropic
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch active model anytime. Custom providers work with Ollama at{" "}
                  <code className="rounded bg-muted px-1 text-xs">localhost:11434/v1</code>.
                </p>
              </div>

              <Button asChild size="lg" className="rounded-xl w-full sm:w-auto">
                <Link href="/studio">
                  Open Model Manager in Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
