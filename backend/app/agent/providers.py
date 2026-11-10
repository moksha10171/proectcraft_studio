"""Shared provider selection for chat, agent turns and structured generation."""

import os
from urllib.parse import urlsplit

DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash-lite",
    "groq": "llama-3.3-70b-versatile",
}


def resolve_provider(config: dict | None = None) -> tuple[str, str, str, str | None]:
    """Honor an explicit provider, including keyless local servers; else use env."""
    config = config or {}
    provider = config.get("provider")
    key = (config.get("apiKey") or "").strip()
    base_url = (config.get("baseUrl") or "").strip().rstrip("/") or None
    if provider:
        if provider not in {"gemini", "groq", "openai", "anthropic", "custom"}:
            raise ValueError("Unsupported AI provider")
        if provider == "custom":
            parsed = urlsplit(base_url or "")
            if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
                raise ValueError("Custom provider requires an HTTP(S) base URL without credentials")
        else:
            key = key or os.environ.get(f"{provider.upper()}_API_KEY", "").strip()
            if not key:
                raise ValueError(f"{provider.upper()}_API_KEY is not configured")
        model = (config.get("model") or os.environ.get(f"{provider.upper()}_MODEL") or DEFAULT_MODELS.get(provider, "")).strip()
        if not model:
            raise ValueError("Choose a model in Studio → Models")
        return provider, key, model, base_url
    for candidate in ("gemini", "groq"):
        if os.environ.get(f"{candidate.upper()}_API_KEY", "").strip():
            return resolve_provider({"provider": candidate})
    raise ValueError("Configure a model in Studio → Models or set GEMINI_API_KEY / GROQ_API_KEY")
