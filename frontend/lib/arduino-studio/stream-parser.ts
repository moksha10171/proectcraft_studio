/**
 * Stream Parser — ProjectCraft Studio
 *
 * Parses SSE streams from the /api/agent endpoint.
 * Handles Gemini, OpenAI-compatible, and Anthropic streaming formats.
 *
 * Each chunk emitted by the parser is one of:
 *   - text_delta: incremental text from the model
 *   - tool_call: a tool the model wants to invoke
 *   - usage: token count info
 *   - thinking: extended reasoning block (for Claude/Gemini Thinking)
 *   - done: stream finished
 *   - error: stream error
 */

export type StreamChunkType =
  | 'text_delta' | 'tool_call' | 'usage' | 'thinking' | 'done' | 'error'
  | 'message_start' | 'tool_call_start' | 'tool_call_end' | 'file_update' | 'wiring_update';

export interface TextDeltaChunk {
  type: 'text_delta';
  text: string;
}

export interface ToolCallChunk {
  type: 'tool_call';
  tool: string;
  args: Record<string, unknown>;
  call_id?: string;
}

export interface UsageChunk {
  type: 'usage';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ThinkingChunk {
  type: 'thinking';
  text: string;
}

export interface DoneChunk {
  type: 'done';
  stop_reason?: string;
}

export interface ErrorChunk {
  type: 'error';
  message: string;
  code?: string;
}

export interface MessageStartChunk {
  type: 'message_start';
  workspace_id?: string;
}

export interface ToolCallStartChunk {
  type: 'tool_call_start';
  id: string;
  tool: string;
  label: string;
  emoji: string;
  args: Record<string, unknown>;
}

export interface ToolCallEndChunk {
  type: 'tool_call_end';
  id: string;
  tool: string;
  status: 'success' | 'error';
  result_preview: string;
  elapsed_ms: number;
  provider?: string;
  model?: string;
  files_modified?: string[];
}

export interface FileUpdateChunk {
  type: 'file_update';
  name: string;
  content: string;
  file_type: string;
}

export interface WiringUpdateChunk {
  type: 'wiring_update';
  manifest: Record<string, unknown>;
}

export type StreamChunk =
  | TextDeltaChunk
  | ToolCallChunk
  | UsageChunk
  | ThinkingChunk
  | DoneChunk
  | ErrorChunk
  | MessageStartChunk
  | ToolCallStartChunk
  | ToolCallEndChunk
  | FileUpdateChunk
  | WiringUpdateChunk;

// ─── Internal: parse a single SSE data line ──────────────────────────────────

function parseSseLine(line: string): StreamChunk | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6).trim();
  if (data === '[DONE]') return { type: 'done' };

  try {
    const json = JSON.parse(data) as Record<string, unknown>;

    // Our own canonical format (from /api/agent)
    if (json.type === 'text_delta') {
      return { type: 'text_delta', text: String(json.text ?? '') };
    }
    if (json.type === 'tool_call') {
      return {
        type: 'tool_call',
        tool: String(json.tool ?? ''),
        args: (json.args as Record<string, unknown>) ?? {},
        call_id: json.call_id ? String(json.call_id) : undefined,
      };
    }
    if (json.type === 'usage') {
      return {
        type: 'usage',
        prompt_tokens: Number(json.prompt_tokens ?? 0),
        completion_tokens: Number(json.completion_tokens ?? 0),
        total_tokens: Number(json.total_tokens ?? 0),
      };
    }
    if (json.type === 'thinking') {
      return { type: 'thinking', text: String(json.text ?? '') };
    }
    if (json.type === 'done') {
      return { type: 'done', stop_reason: json.stop_reason ? String(json.stop_reason) : undefined };
    }
    if (json.type === 'error') {
      return { type: 'error', message: String(json.message ?? 'Unknown error'), code: json.code ? String(json.code) : undefined };
    }
    if (json.type === 'message_start') {
      return { type: 'message_start', workspace_id: json.workspace_id ? String(json.workspace_id) : undefined };
    }
    if (json.type === 'tool_call_start') {
      return { type: 'tool_call_start', id: String(json.id ?? ''), tool: String(json.tool ?? ''), label: String(json.label ?? ''), emoji: String(json.emoji ?? '🔧'), args: (json.args ?? {}) as Record<string, unknown> };
    }
    if (json.type === 'tool_call_end') {
      return { type: 'tool_call_end', id: String(json.id ?? ''), tool: String(json.tool ?? ''), status: (json.status === 'error' ? 'error' : 'success'), result_preview: String(json.result_preview ?? ''), elapsed_ms: Number(json.elapsed_ms ?? 0), provider: json.provider ? String(json.provider) : undefined, model: json.model ? String(json.model) : undefined, files_modified: Array.isArray(json.files_modified) ? json.files_modified as string[] : undefined };
    }
    if (json.type === 'file_update') {
      return { type: 'file_update', name: String(json.name ?? ''), content: String(json.content ?? ''), file_type: String(json.file_type ?? 'code') };
    }
    if (json.type === 'wiring_update') {
      return { type: 'wiring_update', manifest: (json.manifest ?? {}) as Record<string, unknown> };
    }

    // OpenAI-compatible streaming (Groq, OpenAI, OpenRouter)
    if (json.object === 'chat.completion.chunk') {
      const choices = json.choices as Array<{ delta?: { content?: string }; finish_reason?: string }>;
      if (choices?.[0]?.finish_reason) return { type: 'done', stop_reason: choices[0].finish_reason };
      const text = choices?.[0]?.delta?.content;
      if (text) return { type: 'text_delta', text };
      // Usage (some providers send it in the last chunk)
      if (json.usage) {
        const u = json.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        return { type: 'usage', prompt_tokens: u.prompt_tokens ?? 0, completion_tokens: u.completion_tokens ?? 0, total_tokens: u.total_tokens ?? 0 };
      }
    }

    // Gemini streaming format
    if (Array.isArray(json.candidates)) {
      const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      const text = candidates[0]?.content?.parts?.[0]?.text;
      if (candidates[0]?.finishReason) return { type: 'done', stop_reason: candidates[0].finishReason };
      if (text) return { type: 'text_delta', text };
      // Gemini usage
      if (json.usageMetadata) {
        const u = json.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
        return { type: 'usage', prompt_tokens: u.promptTokenCount ?? 0, completion_tokens: u.candidatesTokenCount ?? 0, total_tokens: u.totalTokenCount ?? 0 };
      }
    }

    // Anthropic streaming events
    if (json.type === 'content_block_delta') {
      const delta = json.delta as { type?: string; text?: string; thinking?: string };
      if (delta?.type === 'text_delta' && delta.text) return { type: 'text_delta', text: delta.text };
      if (delta?.type === 'thinking_delta' && delta.thinking) return { type: 'thinking', text: delta.thinking };
    }
    if (json.type === 'message_delta') {
      const usage = (json as { usage?: { output_tokens?: number } }).usage;
      if (json.delta && (json.delta as { stop_reason?: string }).stop_reason) {
        return { type: 'done', stop_reason: (json.delta as { stop_reason: string }).stop_reason };
      }
      if (usage) {
        return { type: 'usage', prompt_tokens: 0, completion_tokens: usage.output_tokens ?? 0, total_tokens: usage.output_tokens ?? 0 };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Main: consume a ReadableStream and yield chunks ─────────────────────────

export async function* parseStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<StreamChunk> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on SSE line endings — each event ends with \n\n
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // Keep incomplete last line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const chunk = parseSseLine(trimmed);
        if (chunk) yield chunk;
      }
    }

    // Handle any remaining buffer content
    if (buffer.trim()) {
      const chunk = parseSseLine(buffer.trim());
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Inline tool call parser (from model text output) ────────────────────────
// Mirrors Logen's ToolCallParser — extracts TOOL_CALL: directives from text

const TOOL_CALL_REGEX = /TOOL_CALL:\s*(\w+)\(([^)]*)\)/g;
const JSON_BLOCK_REGEX = /```tool_call\s*\n([\s\S]*?)\n\s*```/g;
const DONE_MARKER = /^DONE\s*$/m;

export interface ParsedToolCall {
  tool: string;
  args: Record<string, unknown>;
  raw: string;
  call_id?: string;
}

export function parseInlineToolCalls(text: string): ParsedToolCall[] {
  const calls: ParsedToolCall[] = [];

  // Extract JSON blocks
  let match: RegExpExecArray | null;
  JSON_BLOCK_REGEX.lastIndex = 0;
  while ((match = JSON_BLOCK_REGEX.exec(text)) !== null) {
    try {
      const json = JSON.parse(match[1]) as { tool?: string; args?: Record<string, unknown> };
      if (json.tool) {
        calls.push({ tool: json.tool, args: json.args ?? {}, raw: match[0] });
      }
    } catch { /* ignore malformed */ }
  }

  // Extract inline TOOL_CALL: directives
  TOOL_CALL_REGEX.lastIndex = 0;
  while ((match = TOOL_CALL_REGEX.exec(text)) !== null) {
    const toolName = match[1];
    const argsStr = match[2];
    const args = parseInlineArgs(argsStr);
    calls.push({ tool: toolName, args, raw: match[0] });
  }

  return calls;
}

function parseInlineArgs(argsStr: string): Record<string, unknown> {
  if (!argsStr.trim()) return {};
  try {
    return JSON.parse(`{${argsStr}}`);
  } catch {
    // Simple key: "value" parsing
    const result: Record<string, unknown> = {};
    const pairs = argsStr.split(',');
    for (const pair of pairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) continue;
      const key = pair.slice(0, colonIdx).trim().replace(/^["']|["']$/g, '');
      const val = pair.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      result[key] = val;
    }
    return result;
  }
}

export function extractCommentary(text: string): string {
  // Remove tool call blocks and DONE marker
  return text
    .replace(JSON_BLOCK_REGEX, '')
    .replace(TOOL_CALL_REGEX, '')
    .replace(DONE_MARKER, '')
    .trim();
}

export function signalsDone(text: string): boolean {
  return DONE_MARKER.test(text);
}
