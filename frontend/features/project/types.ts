export interface SourceFile { name: string; content: string; type: 'code' | 'config' | 'doc' }
export interface Part { id: string; kind: 'led' | 'resistor' | 'button'; label: string; x: number; y: number; value: string }
export interface Net { id: string; label: string; terminals: string[] }
export interface Circuit { parts: Part[]; nets: Net[] }
export interface Dependency { name: string; version: string; source: string }
export interface ProjectContent { name: string; boardId: 'uno' | 'nano' | 'mega' | 'pi4'; coreVersion: string | null; files: SourceFile[]; circuit: Circuit; dependencies: Dependency[]; notes: string }
export interface Project extends ProjectContent { id: string; revision: number; schemaVersion: 1; updatedAt: string; sourceHash: string }
export interface Board { id: ProjectContent['boardId']; name: string; mode: 'arduino' | 'raspberry-pi'; fqbn: string | null; clockHz: number | null; emulator: string | null; pins: string[] }
export interface Diagnostic { severity: 'error' | 'warning' | 'info'; message: string; file?: string; line?: number; column?: number }
export interface TraceEvent { timeUs: number; pin?: string; value?: number; serial?: string }
export interface Run { id: string; projectId: string; sourceRevision: number; sourceHash: string; boardId: string; origin: string; engine: string; status: string; valid: boolean; output: string; diagnostics: Diagnostic[]; durationMs: number; dropped?: number; artifact?: { format: string; content: string; sha256: string }; trace?: TraceEvent[] }
export interface Patch { id: string; projectId: string; baseRevision: number; status: 'proposed' | 'applied' | 'rejected'; explanation: string; before: ProjectContent; after: ProjectContent }
export function contentOf(project: Project): ProjectContent {
  return { name: project.name, boardId: project.boardId, coreVersion: project.coreVersion, files: project.files, circuit: project.circuit, dependencies: project.dependencies, notes: project.notes }
}
export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/workbench${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  const body = await response.json()
  if (!response.ok) {
    const detail = body.detail
    throw new Error(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg).join('; ') : 'Request failed')
  }
  return body as T
}
