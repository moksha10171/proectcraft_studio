import type {
  PersistenceAdapter,
  StudioChatSnapshot,
  StudioCodebaseSnapshot,
  StudioInputSnapshot,
} from './types';
import { studioPaths } from './paths';

export class WorkspaceStore {
  constructor(
    private adapter: PersistenceAdapter,
    private workspaceId: string
  ) {}

  async loadChat(): Promise<StudioChatSnapshot | null> {
    const [messages, agentHistory, toolCalls, meta] = await Promise.all([
      this.adapter.read<unknown[]>(studioPaths.chatMessages(this.workspaceId)),
      this.adapter.read<unknown[]>(studioPaths.chatAgentHistory(this.workspaceId)),
      this.adapter.read<unknown[]>(studioPaths.chatToolCalls(this.workspaceId)),
      this.adapter.read<{ updatedAt: number }>(studioPaths.chatMeta(this.workspaceId)),
    ]);
    if (!messages && !agentHistory && !toolCalls) return null;
    return {
      messages: messages ?? [],
      agentHistory: agentHistory ?? [],
      toolCalls: toolCalls ?? [],
      updatedAt: meta?.updatedAt ?? 0,
    };
  }

  async saveChat(snapshot: Omit<StudioChatSnapshot, 'updatedAt'>): Promise<void> {
    await Promise.all([
      this.adapter.write(studioPaths.chatMeta(this.workspaceId), { updatedAt: Date.now() }),
      this.adapter.write(studioPaths.chatMessages(this.workspaceId), snapshot.messages),
      this.adapter.write(studioPaths.chatAgentHistory(this.workspaceId), snapshot.agentHistory),
      this.adapter.write(studioPaths.chatToolCalls(this.workspaceId), snapshot.toolCalls),
    ]);
  }

  async clearChat(): Promise<void> {
    await Promise.all([
      this.adapter.delete(studioPaths.chatMeta(this.workspaceId)),
      this.adapter.delete(studioPaths.chatMessages(this.workspaceId)),
      this.adapter.delete(studioPaths.chatAgentHistory(this.workspaceId)),
      this.adapter.delete(studioPaths.chatToolCalls(this.workspaceId)),
    ]);
  }

  async loadInput(): Promise<StudioInputSnapshot | null> {
    return this.adapter.read<StudioInputSnapshot>(studioPaths.inputDraft(this.workspaceId));
  }

  async saveInput(draft: string): Promise<void> {
    await this.adapter.write<StudioInputSnapshot>(studioPaths.inputDraft(this.workspaceId), {
      draft,
      updatedAt: Date.now(),
    });
  }

  async loadCodebase(): Promise<StudioCodebaseSnapshot | null> {
    const [meta, wiring] = await Promise.all([
      this.adapter.read<Omit<StudioCodebaseSnapshot, 'wiring'>>(
        studioPaths.codebaseMeta(this.workspaceId)
      ),
      this.adapter.read<unknown>(studioPaths.codebaseWiring(this.workspaceId)),
    ]);
    if (!meta) return null;
    return { ...meta, wiring: wiring ?? null, updatedAt: meta.updatedAt ?? 0 };
  }

  async saveCodebase(snapshot: Omit<StudioCodebaseSnapshot, 'updatedAt'>): Promise<void> {
    const { wiring, ...meta } = snapshot;
    await Promise.all([
      this.adapter.write(studioPaths.codebaseMeta(this.workspaceId), { ...meta, updatedAt: Date.now() }),
      this.adapter.write(studioPaths.codebaseWiring(this.workspaceId), wiring),
    ]);
  }

  async loadAll() {
    const [chat, input, codebase] = await Promise.all([
      this.loadChat(),
      this.loadInput(),
      this.loadCodebase(),
    ]);
    return {
      workspaceId: this.workspaceId,
      ...(chat ? { chat } : {}),
      ...(input ? { input } : {}),
      ...(codebase ? { codebase } : {}),
    };
  }
}
