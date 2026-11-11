'use client'
import { useState, useEffect } from 'react'
import { Bot, ArrowUp, Square, Settings2, X, Check, FileDiff } from 'lucide-react'
import { useAgentEngine, type ChatMessage } from '@/hooks/useAgentEngine'
import type { ModelConfig } from '@/hooks/useAgentEngine'
import type { ModelSection } from '@/lib/arduino-studio/agent-types'
import ModelManager from '@/components/studio/ModelManager'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Project, Patch } from '../project/types'

export function Assistant({ project, patches, beforeSend, onPatch, onDecision, onClose }: { project: Project; patches: Patch[]; beforeSend: () => Promise<Project>; onPatch: (patch: Patch) => void; onDecision: (patch: Patch, action: 'apply' | 'reject') => Promise<void>; onClose: () => void }) {
  const [models, setModels] = useLocalStorage<ModelSection[]>('studio-model-sections', [])
  const [settings, setSettings] = useState(false), [input, setInput] = useState(''), [error, setError] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  useEffect(() => { let active = true; fetch(`/api/studio/workspace?workspaceId=${project.id}&section=chat`).then(r => r.json()).then(body => { if (active && body.success) setHistory(body.data.messages || []) }).catch(() => {}); return () => { active = false } }, [project.id])
  const [intent, setIntent] = useState<'explain' | 'debug' | 'modify'>('explain')
  const active = models.find(m => m.isActive)
  const config: ModelConfig | undefined = active ? { ...active, model: active.model, provider: active.provider } : undefined
  const agent = useAgentEngine(undefined, { workspaceId: project.id, skipLegacySync: true, intent,
    getContext: () => ({ files: project.files, deviceMode: project.boardId === 'pi4' ? 'raspberry-pi' : 'arduino' }),
    modelConfig: config, onPatch, initialMessages: history, welcomeMessage: 'What would you like to understand? Explain mode reads your project without changing it. AI is optional; your files, builds and emulator work without it.' })
  const busy = ['thinking', 'streaming', 'calling_tool'].includes(agent.status)
  return <aside className="assistant-drawer" aria-label="Project assistant">
    <header><div><Bot size={18} /><strong>Project assistant</strong></div><button title="Configure AI providers" aria-label="Configure AI providers" onClick={() => setSettings(s => !s)}><Settings2 size={17} /></button><button aria-label="Close assistant" onClick={() => { agent.stopGeneration(); onClose() }}><X size={18} /></button></header>
    {settings ? <div className="model-settings"><ModelManager models={models} onModelsChange={setModels} /></div> : <>
      <div className="assistant-intents" role="group" aria-label="Assistant intent">{(['explain', 'debug', 'modify'] as const).map(value => <button aria-pressed={intent === value} key={value} disabled={busy} onClick={() => setIntent(value)}>{value}</button>)}</div>
      <p className="assistant-context">{project.boardId.toUpperCase()} · revision {project.revision} · {active?.name || 'Server configuration / optional AI'}</p>
      <div className="assistant-scroll" aria-live="polite">{agent.messages.map(message => <div key={message.id} className={`assistant-message ${message.role} ${message.type === 'error' ? 'error' : ''}`}><span>{message.role === 'user' ? 'You' : 'Assistant'}</span><p>{message.content}</p></div>)}
        {agent.allToolCalls.slice(-5).map(call => <div key={call.id} className="tool-progress"><Check size={12} />{call.label} · {call.status}</div>)}
        {patches.filter(p => p.status === 'proposed').map(patch => <section key={patch.id} className="proposal"><h3><FileDiff size={16} />Proposed changes</h3><p>{patch.explanation}</p><small>Based on revision {patch.baseRevision}{patch.baseRevision !== project.revision ? ' · stale, request a new proposal' : ''}</small>
          {patch.after.files.filter(file => patch.before.files.find(f => f.name === file.name)?.content !== file.content).map(file => <details key={file.name} open><summary>{file.name}</summary><div className="patch-diff"><div><span>Current</span><pre>{patch.before.files.find(f => f.name === file.name)?.content || '(new file)'}</pre></div><div><span>Proposed</span><pre>{file.content}</pre></div></div></details>)}
          <div className="proposal-actions"><button className="primary" disabled={patch.baseRevision !== project.revision || busy} onClick={() => onDecision(patch, 'apply').catch(e => setError(e.message))}>Apply changes</button><button onClick={() => onDecision(patch, 'reject').catch(e => setError(e.message))}>Reject</button></div>
        </section>)}
      </div>
      {error && <p role="alert" className="error-note">{error}</p>}
      <form className="assistant-composer" onSubmit={async event => { event.preventDefault(); if (!input.trim() || busy) return; try { setError(''); await beforeSend(); const text = input; setInput(''); await agent.sendMessage(text) } catch (e) { setError(e instanceof Error ? e.message : 'Could not sync project') } }}>
        <label className="sr-only" htmlFor="assistant-input">Ask the project assistant</label><textarea id="assistant-input" value={input} onChange={e => setInput(e.target.value)} placeholder={intent === 'explain' ? 'Explain why this pin needs a pull-up…' : intent === 'debug' ? 'Help me understand the build error…' : 'Propose a change to this project…'} rows={3} />
        <div><span>Changes require your review</span>{busy ? <button type="button" aria-label="Stop assistant" onClick={agent.stopGeneration}><Square size={15} /></button> : <button className="primary" aria-label="Send message" disabled={!input.trim()}><ArrowUp size={17} /></button>}</div>
      </form>
    </>}
  </aside>
}
