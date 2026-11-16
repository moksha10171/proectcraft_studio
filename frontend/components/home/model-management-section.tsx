import { Bot, Key, ShieldCheck, Server } from "lucide-react"

const PROVIDERS = ["Gemini", "Groq", "OpenAI", "Anthropic", "Ollama / LM Studio / compatible servers"] as const

const POINTS = [
  { icon: ShieldCheck, title: "Review before apply", desc: "The assistant stages a proposal. Nothing is written until you apply it, and Undo restores the previous revision." },
  { icon: Bot, title: "Grounded in tool results", desc: "Debug mode uses real compiler output, your wiring and saved recordings instead of guessing." },
  { icon: Key, title: "Your keys, your backend", desc: "Browser-entered keys are kept in localStorage and sent to your own backend when you use the assistant. Never commit them." },
  { icon: Server, title: "Local models possible", desc: "Point a custom provider at a local OpenAI-compatible server. You supply the model files and compute." },
] as const

export function ModelManagementSection() {
  return (
    <section className="border-b border-border" aria-labelledby="models-heading">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 id="models-heading" className="text-2xl font-bold md:text-3xl">An assistant you control</h2>
            <p className="text-muted-foreground">
              Optional AI for explaining code, debugging build and wiring problems, and proposing changes. Hosted
              providers can charge for usage; model output can be wrong, so verify it with a build and a run.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">Supported: {PROVIDERS.join(" · ")}</p>
        </div>
      </div>
    </section>
  )
}
