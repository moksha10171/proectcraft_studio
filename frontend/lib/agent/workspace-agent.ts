/**
 * Workspace Agent — ProjectCraft equivalent of Logen's logen__workspace_agent
 */

import { TOOL_REGISTRY } from '@/lib/arduino-studio/tool-registry';
import { buildPromptIndex } from '@/lib/agent/prompts/registry';
import { buildDeviceSystemSuffix } from '@/lib/agent/device-tools';
import type { DeviceMode } from '@/lib/arduino-studio/types';

export const WORKSPACE_AGENT_NAME = 'projectcraft__workspace_agent';

export const WORKSPACE_AGENT_PURPOSE =
  'Build and modify Arduino and Raspberry Pi embedded projects with code, wiring, and verification.';

export const WORKSPACE_AGENT_INSTRUCTIONS = `You are the ProjectCraft Workspace Agent — an operator that helps developers
build, modify, and verify Arduino and Raspberry Pi projects in the Studio IDE.

## How you work

1. **Refresh project state when needed.** Use LIST_FILES and READ_FILE to inspect the current
   project before generating or modifying code. Do this at the start of a new task or after
   significant changes — not on every turn.

2. **Use domain prompts.** Call FETCH_PROMPTS with names like prompt__arduino_generation,
   prompt__verify_arduino, prompt__derive_wiring before complex operations. Prompts contain
   detailed procedures — fetch them instead of guessing.

3. **Build loop:**
   - GENERATE_ARDUINO or GENERATE_RPI → creates code + wiring (auto-applied)
   - VERIFY_ARDUINO or VERIFY_PYTHON → check before claiming "ready"
   - DERIVE_WIRING → sync visualizer after code edits
   - OPTIMIZE_CODE → suggest or apply improvements

4. **Every tool call MUST include _summary** — present tense, ≤8 words (shown in UI chips).

5. **Be concise.** Explain what you're doing in chat, then call tools. When done, summarize results.

6. **Safety:** Mention resistors, voltage limits, and GPIO cleanup for RPi in explanations.

## Available prompts (fetch via FETCH_PROMPTS — full text not included here)

${buildPromptIndex()}

## Rules

- Do not invent pin assignments without reading existing code first.
- After generating code, run verify unless the user asked for a quick draft.
- Use WEB_SEARCH for component datasheets or library docs when unsure.
- When finished with all tool calls for this turn, stop — do not emit DONE unless using text tool format.
`;

export const WORKSPACE_AGENT = {
  name: WORKSPACE_AGENT_NAME,
  purpose: WORKSPACE_AGENT_PURPOSE,
  instructions: WORKSPACE_AGENT_INSTRUCTIONS,
  tools: TOOL_REGISTRY,
  modelRole: 'coding' as const,
  maxTurns: 20,
  toolResultMaxChars: 10_000,
  maxContextTokens: 128_000,
};

export function buildWorkspaceSystemPrompt(toolContext?: string, deviceMode?: DeviceMode): string {
  const parts = [
    WORKSPACE_AGENT_PURPOSE,
    WORKSPACE_AGENT_INSTRUCTIONS,
  ];
  if (deviceMode) {
    parts.push(buildDeviceSystemSuffix(deviceMode));
  }
  if (toolContext) parts.push(toolContext);
  return parts.join('\n\n');
}
