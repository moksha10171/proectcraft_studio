"use client";

/**
 * Client-side studio workspace persistence.
 * Saves to localStorage immediately and syncs to server data/studio/ via API.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrowserPersistenceAdapter,
  WorkspaceStore,
  DEFAULT_WORKSPACE_ID,
  type StudioChatSnapshot,
  type StudioCodebaseSnapshot,
} from '@/lib/persistence';
import type { ChatMessage, ToolCallEntry } from '@/hooks/useAgentEngine';
import type { AgentMessage } from '@/lib/arduino-studio/context-compressor';
import type { ProjectFile, WiringManifest, DeviceMode, RaspberryPiWiringManifest } from '@/lib/arduino-studio/types';

const SAVE_DEBOUNCE_MS = 600;

export interface StudioPersistenceState {
  isLoaded: boolean;
  draftInput: string;
  setDraftInput: (value: string) => void;
  /** Hydrate chat from persistence into the agent engine */
  initialChat: {
    messages: ChatMessage[];
    agentHistory: AgentMessage[];
    toolCalls: ToolCallEntry[];
  } | null;
  /** Hydrate codebase from persistence */
  initialCodebase: {
    deviceMode: DeviceMode;
    activeFileName: string | null;
    files: ProjectFile[];
    wiring: WiringManifest | RaspberryPiWiringManifest;
  } | null;
  saveChat: (data: {
    messages: ChatMessage[];
    agentHistory: AgentMessage[];
    toolCalls: ToolCallEntry[];
  }) => void;
  saveCodebase: (data: {
    deviceMode: DeviceMode;
    activeFileName: string | null;
    files: ProjectFile[];
    wiring: WiringManifest | RaspberryPiWiringManifest;
  }) => void;
  clearChatPersistence: () => Promise<void>;
}

async function syncToServer(
  workspaceId: string,
  section: 'chat' | 'input' | 'codebase',
  data: unknown
): Promise<void> {
  try {
    await fetch('/api/studio/workspace', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, section, data }),
    });
  } catch {
    // Offline or server unavailable — browser copy is still saved
  }
}

export function useStudioPersistence(
  workspaceId: string = DEFAULT_WORKSPACE_ID
): StudioPersistenceState {
  const storeRef = useRef(new WorkspaceStore(new BrowserPersistenceAdapter(), workspaceId));
  const [isLoaded, setIsLoaded] = useState(false);
  const [draftInput, setDraftInputState] = useState('');
  const [initialChat, setInitialChat] = useState<StudioPersistenceState['initialChat']>(null);
  const [initialCodebase, setInitialCodebase] = useState<StudioPersistenceState['initialCodebase']>(null);

  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codebaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on mount: browser first, then merge server if newer
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const store = storeRef.current;

      const [local, serverRes] = await Promise.all([
        store.loadAll(),
        fetch(`/api/studio/workspace?workspaceId=${encodeURIComponent(workspaceId)}`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      if (cancelled) return;

      const server = serverRes?.success ? serverRes.data : null;

      const chat = pickNewer(local.chat, server?.chat);
      const input = pickNewer(local.input, server?.input);
      const codebase = pickNewer(local.codebase, server?.codebase);

      if (chat) {
        setInitialChat({
          messages: (chat.messages ?? []) as ChatMessage[],
          agentHistory: (chat.agentHistory ?? []) as AgentMessage[],
          toolCalls: (chat.toolCalls ?? []) as ToolCallEntry[],
        });
      }

      if (codebase) {
        setInitialCodebase({
          deviceMode: codebase.deviceMode as DeviceMode,
          activeFileName: codebase.activeFileName ?? null,
          files: (codebase.files ?? []) as ProjectFile[],
          wiring: (codebase.wiring ?? null) as WiringManifest | RaspberryPiWiringManifest,
        });
      }

      if (input?.draft) {
        setDraftInputState(input.draft);
      }

      setIsLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [workspaceId]);

  const setDraftInput = useCallback((value: string) => {
    setDraftInputState(value);
    if (inputTimerRef.current) clearTimeout(inputTimerRef.current);
    inputTimerRef.current = setTimeout(async () => {
      const store = storeRef.current;
      await store.saveInput(value);
      await syncToServer(workspaceId, 'input', { draft: value, updatedAt: Date.now() });
    }, SAVE_DEBOUNCE_MS);
  }, [workspaceId]);

  const saveChat = useCallback((data: {
    messages: ChatMessage[];
    agentHistory: AgentMessage[];
    toolCalls: ToolCallEntry[];
  }) => {
    if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    chatTimerRef.current = setTimeout(async () => {
      const snapshot: Omit<StudioChatSnapshot, 'updatedAt'> = {
        messages: data.messages,
        agentHistory: data.agentHistory,
        toolCalls: data.toolCalls,
      };
      await storeRef.current.saveChat(snapshot);
      await syncToServer(workspaceId, 'chat', snapshot);
    }, SAVE_DEBOUNCE_MS);
  }, [workspaceId]);

  const saveCodebase = useCallback((data: {
    deviceMode: DeviceMode;
    activeFileName: string | null;
    files: ProjectFile[];
    wiring: WiringManifest | RaspberryPiWiringManifest;
  }) => {
    if (codebaseTimerRef.current) clearTimeout(codebaseTimerRef.current);
    codebaseTimerRef.current = setTimeout(async () => {
      const snapshot: Omit<StudioCodebaseSnapshot, 'updatedAt'> = {
        deviceMode: data.deviceMode,
        activeFileName: data.activeFileName,
        files: data.files.map(f => ({ name: f.name, content: f.content, type: f.type })),
        wiring: data.wiring,
      };
      await storeRef.current.saveCodebase(snapshot);
      await syncToServer(workspaceId, 'codebase', snapshot);
    }, SAVE_DEBOUNCE_MS);
  }, [workspaceId]);

  const clearChatPersistence = useCallback(async () => {
    await storeRef.current.clearChat();
    try {
      await fetch(
        `/api/studio/workspace?workspaceId=${encodeURIComponent(workspaceId)}&section=chat`,
        { method: 'DELETE' }
      );
    } catch { /* ignore */ }
  }, [workspaceId]);

  return {
    isLoaded,
    draftInput,
    setDraftInput,
    initialChat,
    initialCodebase,
    saveChat,
    saveCodebase,
    clearChatPersistence,
  };
}

function pickNewer<T extends { updatedAt?: number }>(
  local?: T | null,
  server?: T | null
): T | null {
  if (!local && !server) return null;
  if (!local) return server ?? null;
  if (!server) return local;
  return (local.updatedAt ?? 0) >= (server.updatedAt ?? 0) ? local : server;
}
