/**
 * Maps useAgentEngine tool entries → AgentPanel ToolCall format
 */

import type { ToolCallEntry } from '@/hooks/useAgentEngine';
import type { ToolCall, AgentState, AgentStatus, AIProvider } from '@/lib/arduino-studio/agent-types';
import { getTool, type ToolName } from '@/lib/arduino-studio/tool-registry';
import type { AgentStatus as EngineStatus } from '@/hooks/useAgentEngine';

const VERIFY_TOOLS = new Set(['VERIFY_ARDUINO', 'VERIFY_PYTHON']);
const GENERATE_TOOLS = new Set(['GENERATE_ARDUINO', 'GENERATE_RPI']);

export function mapEngineStatusToPanel(status: EngineStatus, activeTool?: string): AgentStatus {
  if (status === 'calling_tool' && activeTool && VERIFY_TOOLS.has(activeTool)) return 'verifying';
  if (status === 'streaming' || status === 'calling_tool') return 'generating';
  if (status === 'thinking') return 'thinking';
  if (status === 'error') return 'error';
  if (status === 'done') return 'success';
  return 'idle';
}

export function mapToolCallEntryToPanel(
  entry: ToolCallEntry,
  systemPromptPreview: string,
  provider?: AIProvider,
  model?: string
): ToolCall {
  const toolName = entry.tool as ToolName;
  const isError = entry.status === 'error' || (entry.result?.startsWith('ERROR:') ?? false);

  return {
    id: entry.id,
    action: toolName as ToolCall['action'],
    userPrompt: String(entry.args.prompt || entry.args.query || entry.args.content || entry.label),
    systemPromptPreview: systemPromptPreview.slice(0, 200),
    status: entry.status === 'running' ? 'running' : isError ? 'error' : 'success',
    startTime: entry.startedAt,
    endTime: entry.startedAt + (entry.elapsedMs ?? 0),
    durationMs: entry.elapsedMs,
    provider,
    model,
    outputPreview: entry.result?.slice(0, 300),
    error: isError ? entry.result : undefined,
  };
}

export function buildAgentStateFromEngine(
  status: EngineStatus,
  activeToolCall: ToolCallEntry | null,
  lastError?: string
): AgentState {
  return {
    status: mapEngineStatusToPanel(status, activeToolCall?.tool),
    currentTool: activeToolCall?.tool as ToolCall['action'] | undefined,
    currentModel: undefined,
    lastError,
  };
}

export function isGenerateTool(tool: string): boolean {
  return GENERATE_TOOLS.has(tool);
}
