/**
 * Context Compressor — ProjectCraft Studio
 *
 * Mirrors Logen's OptimizationSettings.context_compression:
 * After N turns, stub out old tool_result content to keep context window manageable.
 * Only tool_result messages are compressed; user/assistant text is preserved.
 *
 * This prevents runaway context growth as the agent works through multiple turns.
 */

import { sanitizeToolPairs } from '@/lib/agent/tool-pairs';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool_result' | 'tool_use' | 'system';
  content: string;
  tool?: string;          // Tool name (for tool_use / tool_result)
  tool_call_id?: string;  // Links tool_use to tool_result
  compressed?: boolean;   // Whether this message has been compressed
  token_estimate?: number;
}

// ─── Compression settings (matches Logen OptimizationSettings defaults) ─────

export const COMPRESSION_DEFAULTS = {
  enabled: true,
  /** Keep full content for the last N turns; compress older ones */
  keepTurns: 15,
  /** Tool results beyond this char count get truncated even in recent turns */
  maxToolResultChars: 10_000,
  /** Placeholder text for compressed content */
  compressedPlaceholder: '[Content compressed — earlier in conversation]',
};

/**
 * Estimate token count from string length.
 * ~4 chars per token is a rough estimate that works across all major models.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Compresses a message array by stubbing out old tool_result content.
 * Keeps the last `keepTurns` turns fully intact.
 *
 * A "turn" is a user message + all subsequent assistant/tool messages until
 * the next user message.
 */
export function compressContext(
  messages: AgentMessage[],
  opts = COMPRESSION_DEFAULTS
): AgentMessage[] {
  if (!opts.enabled || messages.length === 0) return messages;

  // Find turn boundaries (indices of user messages)
  const turnBoundaries: number[] = [];
  messages.forEach((m, i) => {
    if (m.role === 'user') turnBoundaries.push(i);
  });

  // If we have fewer turns than keepTurns, nothing to compress
  if (turnBoundaries.length <= opts.keepTurns) {
    // Still truncate oversized tool results in all turns
    return messages.map(m => truncateToolResult(m, opts.maxToolResultChars));
  }

  // Everything before the Nth-from-last turn boundary gets compressed
  const compressBeforeIdx = turnBoundaries[turnBoundaries.length - opts.keepTurns];

  return messages.map((m, i) => {
    if (i < compressBeforeIdx && m.role === 'tool_result' && !m.compressed) {
      return {
        ...m,
        content: opts.compressedPlaceholder,
        compressed: true,
        token_estimate: estimateTokens(opts.compressedPlaceholder),
      };
    }
    // Truncate recent tool results if they're too big
    if (m.role === 'tool_result') {
      return truncateToolResult(m, opts.maxToolResultChars);
    }
    return m;
  });
}

/** Truncate a single tool result message to maxChars */
function truncateToolResult(msg: AgentMessage, maxChars: number): AgentMessage {
  if (msg.role !== 'tool_result') return msg;
  if (msg.content.length <= maxChars) return msg;
  const truncated = msg.content.slice(0, maxChars);
  return {
    ...msg,
    content: `${truncated}\n\n[... truncated ${msg.content.length - maxChars} chars ...]`,
  };
}

/**
 * Calculate total context usage from a message array.
 * Returns token estimate and percentage of context window used.
 */
export function calculateContextUsage(
  messages: AgentMessage[],
  maxContextTokens = 128_000
): { usedTokens: number; maxTokens: number; percent: number } {
  const usedTokens = messages.reduce((sum, m) => {
    return sum + estimateTokens(m.content);
  }, 0);

  const percent = Math.min(100, Math.round((usedTokens / maxContextTokens) * 100));
  return { usedTokens, maxTokens: maxContextTokens, percent };
}

/** Color for context usage indicator (matches Logen's context_color/1) */
export function contextUsageColor(percent: number): string {
  if (percent < 60) return '#22c55e';  // green
  if (percent < 80) return '#f59e0b';  // amber
  return '#ef4444';                     // red
}

/** Label for context usage indicator */
export function contextUsageLabel(percent: number): string {
  if (percent < 60) return 'Healthy';
  if (percent < 80) return 'Moderate';
  if (percent < 95) return 'High';
  return 'Critical';
}

/** Format token count for display */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

/**
 * Build the full messages array for an API call from chat history.
 * Applies tool-pair sanitization, compression, and adds system prompt.
 */
export function buildApiMessages(
  chatMessages: AgentMessage[],
  systemPrompt: string,
  opts = COMPRESSION_DEFAULTS
): AgentMessage[] {
  const sanitized = sanitizeToolPairs(chatMessages);
  const compressed = compressContext(sanitized, opts);
  return [
    { role: 'system', content: systemPrompt },
    ...compressed,
  ];
}
