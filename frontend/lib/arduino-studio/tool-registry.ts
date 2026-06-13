/**
 * Tool Registry — ProjectCraft Studio
 *
 * Maps Logen's tool pattern to ProjectCraft agent tools.
 * Each tool has a name, purpose, input schema, and execution tag.
 */

import type { DeviceMode } from '@/lib/arduino-studio/types';
import { defaultGenerateTool, defaultVerifyTool } from '@/lib/agent/device-tools';

export type ToolName =
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

export type ToolTag = 'codegen' | 'verify' | 'wiring' | 'research' | 'ui_comms' | 'files';

export interface ToolDefinition {
  name: ToolName;
  purpose: string;
  input_schema: Record<string, { type: string; description: string; required?: boolean }>;
  tags: ToolTag[];
  emoji: string;             // Shown in tool call chips
  label: string;             // Human-readable label
  estimatedMs?: number;      // For progress UX
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'GENERATE_ARDUINO',
    label: 'Generating Arduino Project',
    emoji: '⚡',
    purpose:
      'Generates a complete Arduino C++ project including sketch code, component list, and wiring manifest. Call this when the user wants to create or modify an Arduino project.',
    input_schema: {
      prompt: { type: 'string', description: 'Natural language description of the Arduino project', required: true },
    },
    tags: ['codegen'],
    estimatedMs: 8000,
  },
  {
    name: 'GENERATE_RPI',
    label: 'Generating Raspberry Pi Project',
    emoji: '🍓',
    purpose:
      'Generates a complete Raspberry Pi Python project with GPIO control code and wiring manifest. Call this when the user wants to create or modify a Raspberry Pi project.',
    input_schema: {
      prompt: { type: 'string', description: 'Natural language description of the RPi project', required: true },
    },
    tags: ['codegen'],
    estimatedMs: 8000,
  },
  {
    name: 'VERIFY_ARDUINO',
    label: 'Verifying Arduino Code',
    emoji: '🔍',
    purpose:
      'Analyzes Arduino C++ code for syntax errors, logic issues, pin conflicts, and best practice violations. Run this before the user deploys to hardware.',
    input_schema: {},
    tags: ['verify'],
    estimatedMs: 3000,
  },
  {
    name: 'VERIFY_PYTHON',
    label: 'Verifying Python Code',
    emoji: '🔍',
    purpose:
      'Analyzes Python/GPIO code for syntax errors, security issues, resource leaks, and best practice violations.',
    input_schema: {},
    tags: ['verify'],
    estimatedMs: 3000,
  },
  {
    name: 'DERIVE_WIRING',
    label: 'Deriving Hardware Wiring',
    emoji: '🔌',
    purpose:
      'Analyzes the current project code and derives the complete hardware wiring configuration. Detects components, pins, and connections.',
    input_schema: {},
    tags: ['wiring'],
    estimatedMs: 4000,
  },
  {
    name: 'OPTIMIZE_CODE',
    label: 'Optimizing Code',
    emoji: '🚀',
    purpose:
      'Reviews current code and suggests concrete improvements: performance, memory usage, readability, and best practices.',
    input_schema: {},
    tags: ['codegen'],
    estimatedMs: 6000,
  },
  {
    name: 'APPLY_CHANGES',
    label: 'Applying Code Changes',
    emoji: '✏️',
    purpose:
      'Applies the pending code changes to the project files. Use after generating or modifying code.',
    input_schema: {},
    tags: ['files'],
    estimatedMs: 500,
  },
  {
    name: 'SEND_MESSAGE',
    label: 'Sending Message',
    emoji: '💬',
    purpose:
      'Displays a plain text or markdown message to the user in the chat. Use to give status updates, ask questions, or provide context.',
    input_schema: {
      content: { type: 'string', description: 'Markdown message to display', required: true },
    },
    tags: ['ui_comms'],
    estimatedMs: 100,
  },
  {
    name: 'WEB_SEARCH',
    label: 'Searching the Web',
    emoji: '🌐',
    purpose:
      'Searches the web for technical information about components, libraries, or hardware specifications. Returns a synthesized summary with sources.',
    input_schema: {
      query: { type: 'string', description: 'Search query', required: true },
      context: { type: 'string', description: 'Additional context to focus the search' },
    },
    tags: ['research'],
    estimatedMs: 6000,
  },
  {
    name: 'FETCH_PROMPTS',
    label: 'Fetching Prompts',
    emoji: '📋',
    purpose:
      'Fetches domain prompt templates by name from the Prompts Registry. Use before complex codegen, verify, or wiring tasks.',
    input_schema: {
      prompt_names: { type: 'array', description: 'Array of prompt names (e.g. prompt__arduino_generation)', required: true },
    },
    tags: ['codegen'],
    estimatedMs: 100,
  },
  {
    name: 'READ_FILE',
    label: 'Reading File',
    emoji: '📄',
    purpose: 'Reads the content of a project file by name.',
    input_schema: {
      path: { type: 'string', description: 'File name/path in the project', required: true },
    },
    tags: ['files'],
    estimatedMs: 100,
  },
  {
    name: 'LIST_FILES',
    label: 'Listing Files',
    emoji: '📁',
    purpose: 'Lists all files in the current project.',
    input_schema: {},
    tags: ['files'],
    estimatedMs: 100,
  },
  {
    name: 'WRITE_FILE',
    label: 'Writing File',
    emoji: '💾',
    purpose: 'Writes or overwrites a project file with new content.',
    input_schema: {
      path: { type: 'string', description: 'File name/path', required: true },
      content: { type: 'string', description: 'Full file content', required: true },
    },
    tags: ['files'],
    estimatedMs: 200,
  },
];

export const TOOL_MAP = new Map<ToolName, ToolDefinition>(
  TOOL_REGISTRY.map(t => [t.name, t])
);

/** Get tool definition by name */
export function getTool(name: ToolName): ToolDefinition | undefined {
  return TOOL_MAP.get(name);
}

/** Get tools by tag */
export function getToolsByTag(tag: ToolTag): ToolDefinition[] {
  return TOOL_REGISTRY.filter(t => t.tags.includes(tag));
}

// ─── Slash Commands ──────────────────────────────────────────────────────────

export interface SlashCommand {
  key: string;         // Typed text after /
  label: string;       // Display label in palette
  desc: string;        // Description in palette
  tool?: ToolName;     // Maps to tool if applicable
  action?: string;     // Special action name
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    key: '/generate',
    label: '/generate',
    desc: 'Generate code for current device mode',
    tool: 'GENERATE_ARDUINO',
  },
  {
    key: '/verify',
    label: '/verify',
    desc: 'Verify current code for errors',
    tool: 'VERIFY_ARDUINO',
  },
  {
    key: '/wiring',
    label: '/wiring',
    desc: 'Re-derive hardware wiring from code',
    tool: 'DERIVE_WIRING',
  },
  {
    key: '/optimize',
    label: '/optimize',
    desc: 'Suggest code improvements',
    tool: 'OPTIMIZE_CODE',
  },
  {
    key: '/web',
    label: '/web',
    desc: 'Search the web for component info',
    tool: 'WEB_SEARCH',
  },
  {
    key: '/model',
    label: '/model',
    desc: 'Open model configuration',
    action: 'OPEN_MODEL_MANAGER',
  },
  {
    key: '/clear',
    label: '/clear',
    desc: 'Clear chat history',
    action: 'CLEAR_HISTORY',
  },
];

/** Device-aware slash commands — /generate and /verify pick the right tool */
export function getSlashCommands(deviceMode: DeviceMode): SlashCommand[] {
  const genTool = defaultGenerateTool(deviceMode);
  const verifyTool = defaultVerifyTool(deviceMode);
  return SLASH_COMMANDS.map(cmd => {
    if (cmd.key === '/generate') return { ...cmd, tool: genTool };
    if (cmd.key === '/verify') return { ...cmd, tool: verifyTool };
    return cmd;
  });
}

/** Returns the system prompt fragment for text-based tool calling (fallback mode) */
export function buildToolContextPrompt(): string {
  return `## Available Tools (text fallback mode)

When native tool calling is unavailable, emit tools on their own line:

\`\`\`tool_call
{"tool": "TOOL_NAME", "args": {"_summary": "Short label", "key": "value"}}
\`\`\`

Every tool call MUST include _summary (present tense, ≤8 words).

When completely done, emit: DONE

### Tool List
${TOOL_REGISTRY.map(t =>
  `**${t.name}** ${t.emoji}
  Purpose: ${t.purpose}
  Args: _summary (required)${Object.keys(t.input_schema).length === 0 ? '' : ', ' + Object.entries(t.input_schema).map(([k, v]) => `${k} (${v.type}${v.required ? ', required' : ''})`).join(', ')}`
).join('\n\n')}
`;
}

export { buildAnthropicToolSpecs as buildToolSpecs } from '@/lib/agent/schema-builder';
export { getToolsForDeviceMode } from '@/lib/agent/device-tools';
