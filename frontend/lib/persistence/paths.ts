export const DEFAULT_WORKSPACE_ID = 'default';

export function workspaceRoot(workspaceId: string): string {
  return `workspaces/${workspaceId}`;
}

export const studioPaths = {
  chatMessages: (ws: string) => `${workspaceRoot(ws)}/chat/messages.json`,
  chatAgentHistory: (ws: string) => `${workspaceRoot(ws)}/chat/agent-history.json`,
  chatToolCalls: (ws: string) => `${workspaceRoot(ws)}/chat/tool-calls.json`,
  inputDraft: (ws: string) => `${workspaceRoot(ws)}/input/draft.json`,
  codebaseMeta: (ws: string) => `${workspaceRoot(ws)}/codebase/meta.json`,
  codebaseWiring: (ws: string) => `${workspaceRoot(ws)}/codebase/wiring.json`,
} as const;

export function browserStorageKey(virtualPath: string): string {
  return `projectcraft:studio:${virtualPath.replace(/\//g, ':')}`;
}
