/**
 * Prompts Registry — lazy-loaded domain prompts (Logen Prompts.Registry port)
 */

import {
  ARDUINO_GENERATION_PROMPT,
  RPI_GENERATION_PROMPT,
  VERIFY_ARDUINO_PROMPT,
  VERIFY_PYTHON_PROMPT,
  DERIVE_WIRING_PROMPT,
  OPTIMIZE_CODE_PROMPT,
  buildFileContext,
} from '@/lib/arduino-studio/prompt-templates';
import type { ProjectFile } from '@/lib/arduino-studio/types';

export interface PromptDefinition {
  name: string;
  purpose: string;
  tags: string[];
  /** Render template with bindings */
  render: (bindings: Record<string, string>) => string;
}

const PLACEHOLDER_CTX = '--- No project files loaded ---';

export const PROMPT_REGISTRY: PromptDefinition[] = [
  {
    name: 'prompt__arduino_generation',
    purpose: 'Full instructions for generating Arduino C++ projects with wiring manifest',
    tags: ['codegen', 'arduino'],
    render: ({ fileContext = PLACEHOLDER_CTX, userPrompt = '' }) =>
      ARDUINO_GENERATION_PROMPT(fileContext, userPrompt),
  },
  {
    name: 'prompt__rpi_generation',
    purpose: 'Full instructions for generating Raspberry Pi Python GPIO projects',
    tags: ['codegen', 'rpi'],
    render: ({ fileContext = PLACEHOLDER_CTX, userPrompt = '' }) =>
      RPI_GENERATION_PROMPT(fileContext, userPrompt),
  },
  {
    name: 'prompt__verify_arduino',
    purpose: 'Arduino code verification checklist and analysis rules',
    tags: ['verify', 'arduino'],
    render: ({ fileContext = PLACEHOLDER_CTX }) => VERIFY_ARDUINO_PROMPT(fileContext),
  },
  {
    name: 'prompt__verify_python',
    purpose: 'Python/GPIO code verification for Raspberry Pi',
    tags: ['verify', 'rpi'],
    render: ({ fileContext = PLACEHOLDER_CTX }) => VERIFY_PYTHON_PROMPT(fileContext),
  },
  {
    name: 'prompt__derive_wiring',
    purpose: 'Hardware wiring derivation from Arduino source code',
    tags: ['wiring'],
    render: ({ fileContext = PLACEHOLDER_CTX }) => DERIVE_WIRING_PROMPT(fileContext),
  },
  {
    name: 'prompt__optimize_code',
    purpose: 'Code optimization guidelines for embedded projects',
    tags: ['codegen'],
    render: ({ fileContext = PLACEHOLDER_CTX }) => OPTIMIZE_CODE_PROMPT(fileContext),
  },
];

const PROMPT_MAP = new Map(PROMPT_REGISTRY.map(p => [p.name, p]));

export function getPrompt(name: string): PromptDefinition | undefined {
  return PROMPT_MAP.get(name);
}

export function fetchPromptsByName(
  names: string[],
  files: ProjectFile[] = [],
  userPrompt = ''
): string {
  const fileContext = files.length ? buildFileContext(files) : PLACEHOLDER_CTX;
  const parts: string[] = [];

  for (const name of names) {
    const def = PROMPT_MAP.get(name);
    if (!def) {
      parts.push(`## ${name}\n(Prompt not found)`);
      continue;
    }
    parts.push(`## ${name}\n${def.purpose}\n\n${def.render({ fileContext, userPrompt })}`);
  }

  return parts.join('\n\n---\n\n');
}

/** Index for system prompt — names and purposes only (Logen build_system_message pattern) */
export function buildPromptIndex(): string {
  return PROMPT_REGISTRY.map(p => `- **${p.name}**: ${p.purpose}`).join('\n');
}
