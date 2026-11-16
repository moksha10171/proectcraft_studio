/** AI provider settings the user configures in the assistant drawer (stored in localStorage). */

export type AIProvider = 'gemini' | 'groq' | 'openai' | 'anthropic' | 'custom';

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom: 'Custom / Local',
};

export const PROVIDER_DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash-lite',
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  custom: 'local-model',
};

export const PROVIDER_BASE_URLS: Record<AIProvider, string> = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  custom: 'http://localhost:11434/v1',
};

// ─── Model Section (a single AI agent config) ────────────────────────────────

export interface ModelSection {
  id: string;
  name: string;                   // Display name e.g. "My Gemini Flash"
  provider: AIProvider;
  apiKey: string;                 // User-supplied key (stored in localStorage only)
  model: string;                  // Model identifier
  baseUrl?: string;               // Custom provider URL override
  systemPromptOverride?: string;  // Optional custom system prompt
  temperature?: number;           // 0.0–1.0, default 0.2
  maxTokens?: number;             // Max output tokens, default 8192
  supportsNativeTools?: boolean;  // When false, use text tool_call fallback (Ollama etc.)
  isActive: boolean;              // Whether this is the currently selected model
  addedAt: number;                // Timestamp for ordering
}

export function createModelSection(
  provider: AIProvider = 'gemini',
  name?: string
): ModelSection {
  return {
    id: `model_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || `${PROVIDER_LABELS[provider]} Agent`,
    provider,
    apiKey: '',
    model: PROVIDER_DEFAULT_MODELS[provider],
    baseUrl: PROVIDER_BASE_URLS[provider],
    temperature: 0.2, // Exact edits and tool arguments favour low randomness.
    maxTokens: 8192,
    supportsNativeTools: provider !== 'custom',
    isActive: false,
    addedAt: Date.now(),
  };
}
