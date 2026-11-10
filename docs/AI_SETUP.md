# AI setup

ProjectCraft uses one Python provider implementation for agent chat and structured
generation. The Next.js UI proxies `/api/agent` and `/api/generate` to it.

## Hosted providers

In Studio → Models, add a provider, enter its API key and a model ID available to
your account, test the connection, then activate the card. Supported protocols:

- Gemini: `generateContent` and `streamGenerateContent`.
- Groq and OpenAI: streaming chat completions and structured generation.
- Anthropic: Messages API with streaming and native tools.
- Custom: an OpenAI-compatible `/chat/completions` endpoint.

Model availability, pricing and free-tier limits are controlled by each provider.
There is no ProjectCraft subscription or shared inference service. API calls may
cost money; there are no free-usage guarantees.

Server configuration can use `GEMINI_API_KEY` or `GROQ_API_KEY`. The backend chooses
Gemini when both exist, otherwise the configured one. `GEMINI_MODEL` and
`GROQ_MODEL` override defaults. An explicitly selected provider never silently
switches to an unrelated environment key. Structured generation can use Groq as a
fallback when using the automatic environment configuration.

## Ollama

Install [Ollama](https://docs.ollama.com/), download a code-capable model and start
the server. In Studio → Models choose **Custom**:

- Base URL: `http://localhost:11434/v1` for a native backend on the same machine.
- Model: the exact ID shown by `ollama list`.
- API key: leave empty for a local Ollama server.
- Native tools: enable only if your selected model supports them. With native
  tools disabled, the agent accepts fenced `tool_call` JSON from the model.

Ollama documents this protocol in its
[OpenAI compatibility guide](https://docs.ollama.com/api/openai-compatibility).
For LM Studio, use its local server's URL including `/v1` and the loaded model ID.

**Docker:** `localhost` inside the backend container means that container, not
its host. Use a reachable host address or a service on the same Docker network.
On Docker Desktop, `http://host.docker.internal:11434/v1` is commonly available.
Linux can add `extra_hosts: ["host.docker.internal:host-gateway"]` to the backend
service. Configure the model server to listen on that interface and restrict it
to trusted clients. Do not expose an unauthenticated model server to the internet.

## Keys and data

Model Manager stores keys in this browser's localStorage and sends them to the
backend for requests. Environment keys are read server-side. No keys are written
to the workspace database or included in exports. Clear model cards to remove
browser keys. Treat access to your running instance as access to your local
workspace and any server-configured provider credits.

## Diagnosing failures

- Missing credentials: configure Models or the backend env file, then restart.
- Model not found: use the provider's exact model ID.
- Connection refused: check the URL from the backend's network, not just the browser.
- Native tool error: disable native tools for incompatible local models.
- Invalid JSON: use a model supporting structured output; inspect your model
  server logs. No generated circuit or file is fabricated to hide a provider failure.

AI code review does not compile a sketch. Use **Compile / Check** for real Arduino
CLI or Python parser diagnostics, then test on the intended hardware separately.
