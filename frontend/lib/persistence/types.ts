/** Client-side persistence types (mirrors backend Python layout). */

export type WorkspaceSection = 'chat' | 'input' | 'codebase';

export interface StudioChatSnapshot {
  messages: unknown[];
  agentHistory: unknown[];
  toolCalls: unknown[];
  updatedAt: number;
}

export interface StudioInputSnapshot {
  draft: string;
  updatedAt: number;
}

export interface StudioCodebaseSnapshot {
  deviceMode: 'arduino' | 'raspberry-pi';
  activeFileName: string | null;
  files: Array<{ name: string; content: string; type: string }>;
  wiring: unknown;
  updatedAt: number;
}

export interface PersistenceAdapter {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, data: T): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
