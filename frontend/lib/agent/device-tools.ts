/**
 * Device-mode tool routing — Arduino vs Raspberry Pi
 */

import type { DeviceMode } from '@/lib/arduino-studio/types';
import type { ToolName, ToolDefinition } from '@/lib/arduino-studio/tool-registry';
import { TOOL_REGISTRY } from '@/lib/arduino-studio/tool-registry';

/** Remap device-sensitive tools to the correct action for current Studio mode */
export function resolveToolForDevice(tool: string, deviceMode: DeviceMode): ToolName {
  const t = tool as ToolName;
  if (deviceMode === 'raspberry-pi') {
    if (t === 'GENERATE_ARDUINO') return 'GENERATE_RPI';
    if (t === 'VERIFY_ARDUINO') return 'VERIFY_PYTHON';
  } else {
    if (t === 'GENERATE_RPI') return 'GENERATE_ARDUINO';
    if (t === 'VERIFY_PYTHON') return 'VERIFY_ARDUINO';
  }
  return t;
}

/** Tools exposed to the LLM for the active device mode */
export function getToolsForDeviceMode(deviceMode: DeviceMode): ToolDefinition[] {
  const exclude: Set<ToolName> =
    deviceMode === 'raspberry-pi'
      ? new Set(['GENERATE_ARDUINO', 'VERIFY_ARDUINO'])
      : new Set(['GENERATE_RPI', 'VERIFY_PYTHON']);

  return TOOL_REGISTRY.filter(t => !exclude.has(t.name));
}

export function buildDeviceSystemSuffix(deviceMode: DeviceMode): string {
  if (deviceMode === 'raspberry-pi') {
    return `## Active Studio Mode: Raspberry Pi

You are building **Raspberry Pi Python/GPIO** projects.
- Use **GENERATE_RPI** (not GENERATE_ARDUINO) for new code
- Use **VERIFY_PYTHON** (not VERIFY_ARDUINO) for verification
- Use BCM GPIO numbering in explanations
- Default entry file: \`main.py\``;
  }
  return `## Active Studio Mode: Arduino

You are building **Arduino C++** embedded projects.
- Use **GENERATE_ARDUINO** (not GENERATE_RPI) for new code
- Use **VERIFY_ARDUINO** (not VERIFY_PYTHON) for verification
- Default entry file: \`sketch.ino\``;
}

/** Default generate tool for slash commands */
export function defaultGenerateTool(deviceMode: DeviceMode): ToolName {
  return deviceMode === 'raspberry-pi' ? 'GENERATE_RPI' : 'GENERATE_ARDUINO';
}

export function defaultVerifyTool(deviceMode: DeviceMode): ToolName {
  return deviceMode === 'raspberry-pi' ? 'VERIFY_PYTHON' : 'VERIFY_ARDUINO';
}

/** Build a direct tool_call message the agent loop can execute */
export function buildSlashToolMessage(
  tool: ToolName,
  userPrompt: string,
  summary: string
): string {
  return `\`\`\`tool_call
{"tool": "${tool}", "args": {"_summary": "${summary}", "prompt": ${JSON.stringify(userPrompt)}}}
\`\`\``;
}
