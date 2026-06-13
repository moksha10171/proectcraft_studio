/**
 * useAgentEngine — Thin SSE consumer (backend-owned agent loop)
 *
 * The full multi-turn loop, tool dispatch, and context management now run
 * in the Python backend. This hook sends one user message to /api/agent
 * and drives UI state purely from the SSE event stream.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { parseStream } from '@/lib/arduino-studio/stream-parser';
import type { DeviceMode, ProjectFile, WiringManifest } from '@/lib/arduino-studio/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'thinking' | 'streaming' | 'calling_tool' | 'done' | 'error';

export interface ToolCallEntry {
  id: string;
  tool: string;
  label: string;
  emoji: string;
  args: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  result?: string;
  elapsedMs?: number;
  provider?: string;
  model?: string;
  filesModified?: string[];
  startedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'stream' | 'thinking' | 'error' | 'tool_call';
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  tokenCount?: number;
  toolCalls?: ToolCallEntry[];
  modelName?: string;
  modelRole?: string;
  timestamp: number;
}

export interface QueuedMessage {
  id: string;
  text: string;
  disposition?: 'steer' | 'defer';
}

export interface ContextUsage {
  usedTokens: number;
  maxTokens: number;
  percent: number;
}

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

export interface ToolResultPayload {
  tool: string;
  files?: ProjectFile[];
  wiring?: WiringManifest;
}

export interface AgentEngineOptions {
  workspaceId?: string;
  getContext: () => { files: ProjectFile[]; deviceMode: DeviceMode };
  modelConfig?: ModelConfig;
  onToolResult?: (payload: ToolResultPayload) => void;
  welcomeMessage?: string;
  initialMessages?: ChatMessage[];
  initialToolCalls?: ToolCallEntry[];
  onPersist?: (data: { messages: ChatMessage[]; toolCalls: ToolCallEntry[] }) => void;
  onClearPersist?: () => void | Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 0;
function nextId(): string {
  return `${Date.now()}-${++_idCounter}`;
}

const WELCOME_DEFAULT = (mode: DeviceMode) =>
  `👋 **Welcome to ProjectCraft AI!**\n\nBuild ${mode === 'arduino' ? 'Arduino' : 'Raspberry Pi'} projects with the agent.\n\nConfigure a model in the **Models** tab or set \`GEMINI_API_KEY\` in \`.env.local\`.`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgentEngine(_systemPrompt?: string, options?: AgentEngineOptions) {
  const hydrated = !!(options?.initialMessages && options.initialMessages.length > 0);

  const [messages, setMessages] = useState<ChatMessage[]>(options?.initialMessages ?? []);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [allToolCalls, setAllToolCalls] = useState<ToolCallEntry[]>(options?.initialToolCalls ?? []);
  const [contextUsage, setContextUsage] = useState<ContextUsage>({ usedTokens: 0, maxTokens: 128_000, percent: 0 });

  const abortRef = useRef<AbortController | null>(null);
  const welcomeShownRef = useRef(hydrated);
  const persistRef = useRef(options?.onPersist);
  persistRef.current = options?.onPersist;

  const getContext = options?.getContext;
  const modelConfig = options?.modelConfig;
  const onToolResult = options?.onToolResult;
  const workspaceId = options?.workspaceId ?? 'default';

  // Show welcome message on first render
  useEffect(() => {
    if (welcomeShownRef.current || messages.length > 0) return;
    welcomeShownRef.current = true;
    const mode = getContext?.().deviceMode ?? 'arduino';
    const welcome = options?.welcomeMessage ?? WELCOME_DEFAULT(mode);
    setMessages([{ id: nextId(), role: 'assistant', type: 'text', content: welcome, timestamp: Date.now() }]);
  }, [getContext, options?.welcomeMessage, messages.length]);

  // Hydrate from initial data
  const didHydrateRef = useRef(hydrated);
  useEffect(() => {
    if (didHydrateRef.current || !options?.initialMessages?.length) return;
    didHydrateRef.current = true;
    welcomeShownRef.current = true;
    setMessages(options.initialMessages);
    if (options.initialToolCalls?.length) setAllToolCalls(options.initialToolCalls);
  }, [options?.initialMessages, options?.initialToolCalls]);

  // Persist on change
  useEffect(() => {
    if (!persistRef.current || messages.length === 0) return;
    persistRef.current({ messages, toolCalls: allToolCalls });
  }, [messages, allToolCalls]);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateLastMessage = useCallback((updater: (msg: ChatMessage) => ChatMessage) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      return [...prev.slice(0, -1), updater(prev[prev.length - 1])];
    });
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setStatus('done');
    setMessages(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.isStreaming) return [...prev.slice(0, -1), { ...last, isStreaming: false, content: last.content + ' [stopped]' }];
      return prev;
    });
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    appendMessage({ id: nextId(), role: 'user', type: 'text', content: userText, timestamp: Date.now() });

    abortRef.current = new AbortController();
    setStatus('thinking');

    const ctx = getContext?.();
    const deviceMode = ctx?.deviceMode ?? 'arduino';

    try {
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          message: userText,
          modelConfig,
          mode: deviceMode,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error(`Agent API error: ${resp.status}`);
      if (!resp.body) throw new Error('No response body');

      setStatus('streaming');

      // Optimistically add streaming assistant message
      const assistantMsgId = nextId();
      appendMessage({
        id: assistantMsgId,
        role: 'assistant',
        type: 'stream',
        content: '',
        isStreaming: true,
        toolCalls: [],
        timestamp: Date.now(),
      });

      let streamingContent = '';
      let thinkingContent = '';

      for await (const chunk of parseStream(resp.body)) {
        if (abortRef.current?.signal.aborted) break;

        if (chunk.type === 'text_delta') {
          streamingContent += chunk.text;
          updateLastMessage(m => ({ ...m, content: streamingContent, thinking: thinkingContent || undefined }));

        } else if (chunk.type === 'thinking') {
          thinkingContent += chunk.text;
          updateLastMessage(m => ({ ...m, thinking: thinkingContent }));

        } else if (chunk.type === 'tool_call_start') {
          setStatus('calling_tool');
          const tcEntry: ToolCallEntry = {
            id: chunk.id,
            tool: chunk.tool,
            label: chunk.label,
            emoji: chunk.emoji,
            args: chunk.args,
            status: 'running',
            startedAt: Date.now(),
          };
          setAllToolCalls(prev => [...prev, tcEntry]);
          updateLastMessage(m => ({ ...m, toolCalls: [...(m.toolCalls ?? []), tcEntry] }));
          setStatus('calling_tool');

        } else if (chunk.type === 'tool_call_end') {
          const update = (tc: ToolCallEntry): ToolCallEntry =>
            tc.id === chunk.id
              ? { ...tc, status: chunk.status, result: chunk.result_preview, elapsedMs: chunk.elapsed_ms, provider: chunk.provider, model: chunk.model, filesModified: chunk.files_modified }
              : tc;
          setAllToolCalls(prev => prev.map(update));
          updateLastMessage(m => ({ ...m, toolCalls: (m.toolCalls ?? []).map(update) }));
          setStatus('streaming');

        } else if (chunk.type === 'file_update') {
          onToolResult?.({
            tool: 'file_update',
            files: [{ name: chunk.name, content: chunk.content, type: chunk.file_type as 'code' | 'config' | 'doc' }],
          });

        } else if (chunk.type === 'wiring_update') {
          onToolResult?.({ tool: 'wiring_update', wiring: chunk.manifest as unknown as WiringManifest });

        } else if (chunk.type === 'usage') {
          const total = chunk.prompt_tokens + chunk.completion_tokens;
          setContextUsage({
            usedTokens: total,
            maxTokens: 128_000,
            percent: Math.min(100, Math.round((total / 128_000) * 100)),
          });

        } else if (chunk.type === 'error') {
          throw new Error(chunk.message);

        } else if (chunk.type === 'done') {
          break;
        }
      }

      updateLastMessage(m => ({ ...m, isStreaming: false }));
      setStatus('done');

    } catch (err) {
      if (abortRef.current?.signal.aborted) {
        setStatus('done');
        return;
      }
      appendMessage({
        id: nextId(),
        role: 'assistant',
        type: 'error',
        content: `⚠️ ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now(),
      });
      setStatus('error');
    }
  }, [workspaceId, modelConfig, getContext, onToolResult, appendMessage, updateLastMessage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setAllToolCalls([]);
    setContextUsage({ usedTokens: 0, maxTokens: 128_000, percent: 0 });
    setStatus('idle');
    welcomeShownRef.current = false;
    void options?.onClearPersist?.();
  }, [options?.onClearPersist]);

  return {
    messages,
    status,
    contextUsage,
    allToolCalls,
    isThinking: status === 'thinking' || status === 'calling_tool' || status === 'streaming',
    sendMessage,
    stopGeneration,
    clearHistory,
    // Legacy no-ops (kept for call-site compatibility during migration)
    queuedMessages: [] as QueuedMessage[],
    steerMode: 'steer' as const,
    setSteerMode: (_: unknown) => {},
    queueMessage: (_: string) => '',
    cancelQueuedMessage: (_: string) => {},
    activeToolCall: null as ToolCallEntry | null,
  };
}
