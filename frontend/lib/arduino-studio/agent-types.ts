/**
 * Agent types for ProjectCraft Studio — multi-model AI agent system.
 * Inspired by the Logen agent fleet design: each model section is an
 * independent agent with its own API key, model, and prompt config.
 */

// ─── Provider Types ───────────────────────────────────────────────────────────

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
  temperature?: number;           // 0.0–1.0, default 0.7
  maxTokens?: number;             // Max output tokens, default 8192
  supportsNativeTools?: boolean;  // When false, use text tool_call fallback (Ollama etc.)
  isActive: boolean;              // Whether this is the currently selected model
  addedAt: number;                // Timestamp for ordering
}

// ─── Tool Call (a single agent action) ───────────────────────────────────────

export type ToolCallAction =
  | 'GENERATE_ARDUINO'
  | 'GENERATE_RPI'
  | 'VERIFY_ARDUINO'
  | 'VERIFY_PYTHON'
  | 'DERIVE_WIRING'
  | 'OPTIMIZE_CODE'
  | 'APPLY_CHANGES'
  | 'SEND_MESSAGE'
  | 'WEB_SEARCH'
  | 'FETCH_PROMPTS'
  | 'READ_FILE'
  | 'LIST_FILES'
  | 'WRITE_FILE';

export const TOOL_CALL_LABELS: Record<ToolCallAction, string> = {
  GENERATE_ARDUINO: 'Generate Arduino Project',
  GENERATE_RPI: 'Generate Raspberry Pi Project',
  VERIFY_ARDUINO: 'Verify Arduino Code',
  VERIFY_PYTHON: 'Verify Python Code',
  DERIVE_WIRING: 'Derive Wiring Diagram',
  OPTIMIZE_CODE: 'Optimize Code',
  APPLY_CHANGES: 'Apply Changes',
  SEND_MESSAGE: 'Send Message',
  WEB_SEARCH: 'Web Search',
  FETCH_PROMPTS: 'Fetch Prompts',
  READ_FILE: 'Read File',
  LIST_FILES: 'List Files',
  WRITE_FILE: 'Write File',
};

export const TOOL_CALL_ICONS: Record<ToolCallAction, string> = {
  GENERATE_ARDUINO: '⚡',
  GENERATE_RPI: '🍓',
  VERIFY_ARDUINO: '🔍',
  VERIFY_PYTHON: '🐍',
  DERIVE_WIRING: '🔌',
  OPTIMIZE_CODE: '🚀',
  APPLY_CHANGES: '✏️',
  SEND_MESSAGE: '💬',
  WEB_SEARCH: '🌐',
  FETCH_PROMPTS: '📋',
  READ_FILE: '📄',
  LIST_FILES: '📁',
  WRITE_FILE: '💾',
};

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error';

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface ToolCall {
  id: string;
  action: ToolCallAction;
  userPrompt: string;             // The user's original message
  systemPromptPreview: string;    // First 200 chars of system prompt used
  status: ToolCallStatus;
  startTime: number;              // ms timestamp
  endTime?: number;               // ms timestamp when completed
  durationMs?: number;
  tokenUsage?: TokenUsage;
  provider?: AIProvider;
  model?: string;
  outputPreview?: string;         // First 300 chars of output
  error?: string;
  filesModified?: string[];       // File names that were changed
}

// ─── Agent Session ────────────────────────────────────────────────────────────

export interface AgentSession {
  id: string;
  modelSectionId: string;
  startTime: number;
  toolCalls: ToolCall[];
  totalTokens: number;
  totalCalls: number;
  successfulCalls: number;
}

// ─── Agent Status ─────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'thinking' | 'generating' | 'verifying' | 'error' | 'success';

export interface AgentState {
  status: AgentStatus;
  currentTool?: ToolCallAction;
  currentModel?: string;
  lastError?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    temperature: 0.7,
    maxTokens: 8192,
    supportsNativeTools: provider !== 'custom',
    isActive: false,
    addedAt: Date.now(),
  };
}

export function createToolCall(
  action: ToolCallAction,
  userPrompt: string,
  systemPromptPreview: string
): ToolCall {
  return {
    id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    userPrompt,
    systemPromptPreview,
    status: 'pending',
    startTime: Date.now(),
  };
}

export function finishToolCall(
  tc: ToolCall,
  status: 'success' | 'error',
  opts: {
    tokenUsage?: TokenUsage;
    provider?: AIProvider;
    model?: string;
    outputPreview?: string;
    error?: string;
    filesModified?: string[];
  }
): ToolCall {
  const endTime = Date.now();
  return {
    ...tc,
    status,
    endTime,
    durationMs: endTime - tc.startTime,
    ...opts,
  };
}

export function getToolCallDuration(tc: ToolCall): string {
  const ms = tc.durationMs ?? (tc.endTime ? tc.endTime - tc.startTime : Date.now() - tc.startTime);
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
