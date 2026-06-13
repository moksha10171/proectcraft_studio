/**
 * Tool Executor — unified dispatch layer (mirrors Logen's run_tool/2)
 */

import type { ProjectFile, WiringManifest, DeviceMode } from '@/lib/arduino-studio/types';
import type { ToolName } from '@/lib/arduino-studio/tool-registry';
import { resolveToolForDevice } from '@/lib/agent/device-tools';

export interface ModelConfig {
  provider: 'gemini' | 'groq' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptOverride?: string;
  supportsNativeTools?: boolean;
}

export interface ToolExecutionContext {
  files: ProjectFile[];
  deviceMode: DeviceMode;
  modelConfig?: ModelConfig;
  currentCode?: string;
  /** Pending file changes from last generate/optimize — committed by APPLY_CHANGES */
  pendingFiles?: ProjectFile[];
  pendingWiring?: WiringManifest;
  /** Mutate files in Studio (READ/WRITE/LIST tools) */
  readFile?: (name: string) => string | null;
  writeFile?: (name: string, content: string) => void;
  listFiles?: () => string[];
  /** Fetch prompt templates by name */
  fetchPrompts?: (names: string[]) => string;
}

export interface ToolExecutionResult {
  text: string;
  files?: ProjectFile[];
  wiring?: WiringManifest;
  /** When true, Studio should apply files/wiring immediately (GENERATE_*, OPTIMIZE_*) */
  autoApply?: boolean;
  pendingFiles?: ProjectFile[];
  pendingWiring?: WiringManifest;
}

export const TOOL_RESULT_MAX_CHARS = 10_000;

type GenerateAction =
  | 'GENERATE_ARDUINO'
  | 'GENERATE_RPI'
  | 'VERIFY_ARDUINO'
  | 'VERIFY_PYTHON'
  | 'DERIVE_WIRING'
  | 'OPTIMIZE_CODE';

async function callGenerate(
  action: GenerateAction,
  ctx: ToolExecutionContext,
  prompt?: string
): Promise<Record<string, unknown>> {
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      prompt,
      files: ctx.files,
      modelConfig: ctx.modelConfig,
      deviceMode: ctx.deviceMode,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(err.message || err.error || `Generate API failed: ${resp.status}`);
  }
  const json = await resp.json() as { data?: Record<string, unknown> };
  return json.data ?? {};
}

function truncate(text: string, max = TOOL_RESULT_MAX_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[... truncated ${text.length - max} chars ...]`;
}

function normalizeProjectFiles(
  raw: Array<{ name?: string; content?: string; type?: string }> | undefined
): ProjectFile[] {
  if (!raw?.length) return [];
  return raw.map(f => ({
    name: f.name || 'sketch.ino',
    content: f.content || '',
    type: (f.type === 'config' || f.type === 'doc' ? f.type : 'code') as ProjectFile['type'],
  }));
}

function formatWiringSummary(wiring: WiringManifest): string {
  const components = (wiring.components || [])
    .map(c => `• ${c.label || c.type} → Pin ${c.pin}`)
    .join('\n');
  return `Wiring for ${wiring.board || 'board'}:\n${components}`;
}

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const resolved = resolveToolForDevice(toolName, ctx.deviceMode);
  try {
    switch (resolved as ToolName) {
      case 'GENERATE_ARDUINO':
      case 'GENERATE_RPI': {
        const prompt = String(args.prompt || 'Generate a project');
        const action = resolved === 'GENERATE_RPI' ? 'GENERATE_RPI' : 'GENERATE_ARDUINO';
        const data = await callGenerate(action, ctx, prompt);
        const files = normalizeProjectFiles(data.files as Array<{ name?: string; content?: string; type?: string }>);
        const wiring = data.wiring as WiringManifest | undefined;
        const explanation = String(data.explanation || 'Code generated.');
        return {
          text: truncate(`Generation complete.\n\n${explanation}${wiring ? `\n\n${formatWiringSummary(wiring)}` : ''}`),
          files: files.length ? files : undefined,
          wiring,
          autoApply: true,
          pendingFiles: files.length ? files : undefined,
          pendingWiring: wiring,
        };
      }

      case 'VERIFY_ARDUINO': {
        const data = await callGenerate('VERIFY_ARDUINO', ctx);
        const valid = Boolean(data.valid);
        const errors = (data.errors as string[]) || [];
        return {
          text: valid
            ? '✅ Code verification passed — no errors found.'
            : `❌ Verification failed:\n${errors.map(e => `• ${e}`).join('\n')}`,
        };
      }

      case 'VERIFY_PYTHON': {
        const data = await callGenerate('VERIFY_PYTHON', ctx);
        const valid = Boolean(data.valid);
        const errors = (data.errors as string[]) || [];
        return {
          text: valid
            ? '✅ Code verification passed — no errors found.'
            : `❌ Verification failed:\n${errors.map(e => `• ${e}`).join('\n')}`,
        };
      }

      case 'DERIVE_WIRING': {
        const data = await callGenerate('DERIVE_WIRING', ctx);
        const wiring = data as unknown as WiringManifest;
        return {
          text: truncate(formatWiringSummary(wiring)),
          wiring,
          autoApply: true,
          pendingWiring: wiring,
        };
      }

      case 'OPTIMIZE_CODE': {
        const data = await callGenerate('OPTIMIZE_CODE', ctx);
        const suggestions = (data.suggestions as string[]) || [];
        const files = normalizeProjectFiles(data.files as Array<{ name?: string; content?: string; type?: string }>);
        const explanation = String(data.explanation || '');
        const text = suggestions.length
          ? `Optimization suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}${explanation ? `\n\n${explanation}` : ''}`
          : explanation || 'Optimization complete.';
        return {
          text: truncate(text),
          files: files.length ? files : undefined,
          autoApply: files.length > 0,
          pendingFiles: files.length ? files : undefined,
        };
      }

      case 'WEB_SEARCH': {
        const query = String(args.query || '');
        const context = String(args.context || '');
        const resp = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({})) as { message?: string };
          return { text: err.message || `Web search unavailable (${resp.status}).` };
        }
        const data = await resp.json() as { summary?: string; sources?: Array<{ title: string; url: string }> };
        const sources = (data.sources || []).slice(0, 3).map(s => `• ${s.title}: ${s.url}`).join('\n');
        return { text: truncate(`${data.summary || 'Search complete.'}${sources ? `\n\nSources:\n${sources}` : ''}`) };
      }

      case 'SEND_MESSAGE':
        return { text: String(args.content || '') };

      case 'APPLY_CHANGES': {
        const pending = ctx.pendingFiles || [];
        const wiring = ctx.pendingWiring;
        if (!pending.length && !wiring) {
          return { text: 'No pending changes to apply.' };
        }
        return {
          text: `Applied ${pending.length} file(s)${wiring ? ' and updated wiring' : ''}.`,
          files: pending.length ? pending : undefined,
          wiring,
          autoApply: true,
        };
      }

      case 'FETCH_PROMPTS': {
        const names = (args.prompt_names as string[]) || (args.names as string[]) || [];
        if (!ctx.fetchPrompts) {
          return { text: `Prompts: ${names.join(', ')} (fetch not available)` };
        }
        return { text: truncate(ctx.fetchPrompts(names)) };
      }

      case 'READ_FILE': {
        const name = String(args.path || args.name || '');
        const content = ctx.readFile?.(name);
        if (content == null) return { text: `ERROR: File not found: ${name}` };
        return { text: truncate(`--- ${name} ---\n${content}`) };
      }

      case 'LIST_FILES': {
        const names = ctx.listFiles?.() ?? ctx.files.map(f => f.name);
        return { text: names.length ? names.map(n => `• ${n}`).join('\n') : 'No files in project.' };
      }

      case 'WRITE_FILE': {
        const name = String(args.path || args.name || '');
        const content = String(args.content || '');
        ctx.writeFile?.(name, content);
        return { text: `Wrote ${name} (${content.length} chars).` };
      }

      default:
        return { text: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { text: `ERROR: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** Tools that must run serially (blocking UI) */
export const INTERACTIVE_TOOLS = new Set<string>(['SEND_MESSAGE']);

/** Tools whose results should auto-apply to Studio */
export const AUTO_APPLY_TOOLS = new Set<string>([
  'GENERATE_ARDUINO',
  'GENERATE_RPI',
  'DERIVE_WIRING',
  'OPTIMIZE_CODE',
  'APPLY_CHANGES',
]);
