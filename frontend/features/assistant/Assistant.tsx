'use client'
import { useState, useEffect, useRef } from 'react'
import { Bot, ArrowUp, Square, Settings2, X, Check, FileDiff, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { useAgentEngine, type ChatMessage, type ToolCallEntry } from '@/hooks/useAgentEngine'
import type { ModelConfig } from '@/hooks/useAgentEngine'
import type { ModelSection } from '@/lib/arduino-studio/agent-types'
import ModelManager from '@/components/studio/ModelManager'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Project, Patch, Verification } from '../project/types'
import { Markdown } from './Markdown'
import { diffLines, diffStats, hunks } from './diff'

const STARTERS = {
  explain: ['Check my wiring against the sketch', 'What does my latest recording show?', 'Which pins on this board support PWM?'],
  debug: ['Why does my build fail?', 'Why is my LED not behaving as expected?'],
  modify: ['Make the LED blink twice per second', 'Print the button state only when it changes'],
} as const

const WELCOME = 'Ask about this experiment. **Explain** reads your project without changing it; **debug** and **modify** can draft edits, which I compile and wiring-check before you review them. Your files, builds and emulator work without AI.'

function argHint(call: ToolCallEntry) {
  const value = call.args?.path ?? call.args?.query
  return typeof value === 'string' ? value : ''
}

function ToolActivity({ calls }: { calls: ToolCallEntry[] }) {
  if (!calls.length) return null
  return <ol className="tool-activity" aria-label="Assistant steps">{calls.map(call => <li key={call.id} className={call.status}>
    <details>
      <summary>
        {call.status === 'running' ? <Loader2 size={12} className="spin" aria-label="Running" /> : call.status === 'error' ? <AlertTriangle size={12} aria-label="Failed" /> : <Check size={12} aria-label="Done" />}
        <span>{call.label}</span>{argHint(call) && <code>{argHint(call)}</code>}
        {call.elapsedMs != null && <small>{call.elapsedMs < 1000 ? `${call.elapsedMs} ms` : `${(call.elapsedMs / 1000).toFixed(1)} s`}</small>}
      </summary>
      {call.result && <pre>{call.result}</pre>}
    </details>
  </li>)}</ol>
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return <div className={`assistant-message ${message.role} ${message.type === 'error' ? 'error' : ''}`}>
    <span>{isUser ? 'You' : 'Assistant'}</span>
    {message.thinking && <details className="assistant-thinking"><summary>Reasoning</summary><p>{message.thinking}</p></details>}
    <ToolActivity calls={message.toolCalls ?? []} />
    {isUser || message.type === 'error' ? <p>{message.content}</p> : message.content && <Markdown text={message.content} />}
  </div>
}

function VerificationBadges({ verification }: { verification?: Verification }) {
  if (!verification) return <p className="verify-row unknown"><ShieldQuestion size={14} />Not verified by the assistant. Build it yourself after applying.</p>
  const { build, wiring } = verification
  const size = build.summary.split('\n').find(line => line.startsWith('Sketch uses'))
  const issues = wiring?.findings.filter(f => f.severity !== 'info') ?? []
  return <div className="verify">
    <p className={`verify-row ${build.status}`}>{build.status === 'passed' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
      <span>Draft build {build.status} <small>({build.engine === 'python-ast' ? 'Python syntax check' : `Arduino CLI, ${build.boardId}`})</small>{size && <small> · {size.replace(/ Maximum is.*$/, '')}</small>}</span></p>
    {build.status !== 'passed' && <pre className="verify-detail">{build.summary}</pre>}
    {wiring && <p className={`verify-row ${issues.length ? 'warn' : 'passed'}`}>{issues.length ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
      <span>{issues.length ? `${issues.length} wiring ${issues.length === 1 ? 'finding' : 'findings'}` : 'Wiring check clean'}</span></p>}
    {issues.length > 0 && <ul className="verify-findings">{issues.map((f, i) => <li key={i}><code>{f.code}</code>{f.line ? ` ${f.file}:${f.line}` : ''} — {f.message}</li>)}</ul>}
  </div>
}

function FileDiffView({ name, before, after }: { name: string; before: string | undefined; after: string }) {
  const lines = diffLines(before ?? '', after)
  const { added, removed } = diffStats(lines)
  return <details open className="file-diff"><summary><code>{name}</code>{before === undefined && <small> new file</small>}<span className="diff-stat"><ins>+{added}</ins> <del>−{removed}</del></span></summary>
    <div className="unified-diff" role="table" aria-label={`Changes to ${name}`}>{hunks(lines).map((hunk, h) => <div key={h} role="rowgroup">
      <div className="hunk-head" role="row"><span role="cell">@@ line {hunk.oldStart} → {hunk.newStart}</span></div>
      {hunk.lines.map((line, i) => <div key={i} role="row" className={`diff-line ${line.kind}`}>
        <span role="cell" className="ln">{line.oldNo ?? ''}</span><span role="cell" className="ln">{line.newNo ?? ''}</span>
        <span role="cell" className="mark" aria-label={line.kind === 'add' ? 'added' : line.kind === 'del' ? 'removed' : undefined}>{line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ' '}</span>
        <code role="cell">{line.text || ' '}</code></div>)}
    </div>)}</div>
  </details>
}

function Proposal({ patch, project, busy, onDecision, onError }: { patch: Patch; project: Project; busy: boolean; onDecision: (patch: Patch, action: 'apply' | 'reject') => Promise<void>; onError: (message: string) => void }) {
  const stale = patch.baseRevision !== project.revision
  const changed = patch.after.files.filter(file => patch.before.files.find(f => f.name === file.name)?.content !== file.content)
  return <section className="proposal" aria-label="Proposed changes">
    <h3><FileDiff size={16} />Proposed changes <small>{changed.length} {changed.length === 1 ? 'file' : 'files'} · from revision {patch.baseRevision}</small></h3>
    <VerificationBadges verification={patch.verification} />
    {patch.explanation && <details className="proposal-why"><summary>Explanation</summary><Markdown text={patch.explanation} /></details>}
    {changed.map(file => <FileDiffView key={file.name} name={file.name} before={patch.before.files.find(f => f.name === file.name)?.content} after={file.content} />)}
    {stale && <p className="proposal-stale">The project changed after this proposal was made. Reject it and ask again.</p>}
    <div className="proposal-actions">
      <button className="primary" disabled={stale || busy} onClick={() => onDecision(patch, 'apply').catch(e => onError(e.message))}>Apply changes</button>
      <button onClick={() => onDecision(patch, 'reject').catch(e => onError(e.message))}>Reject</button>
    </div>
  </section>
}

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
    modelConfig: config, onPatch, initialMessages: history, welcomeMessage: WELCOME })
  const busy = ['thinking', 'streaming', 'calling_tool'].includes(agent.status)
  const scroll = useRef<HTMLDivElement>(null)
  const pending = patches.filter(p => p.status === 'proposed')
  useEffect(() => { const el = scroll.current; if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight }, [agent.messages, pending.length])
  const send = async () => {
    if (!input.trim() || busy) return
    try { setError(''); await beforeSend(); const text = input; setInput(''); await agent.sendMessage(text) } catch (e) { setError(e instanceof Error ? e.message : 'Could not sync project') }
  }
  return <aside className="assistant-drawer" aria-label="Project assistant">
    <header><div><Bot size={18} /><strong>Project assistant</strong></div><button title="Configure AI providers" aria-label="Configure AI providers" onClick={() => setSettings(s => !s)}><Settings2 size={17} /></button><button aria-label="Close assistant" onClick={() => { agent.stopGeneration(); onClose() }}><X size={18} /></button></header>
    {settings ? <div className="model-settings"><ModelManager models={models} onModelsChange={setModels} /></div> : <>
      <div className="assistant-intents" role="group" aria-label="Assistant intent">{(['explain', 'debug', 'modify'] as const).map(value => <button aria-pressed={intent === value} key={value} disabled={busy} onClick={() => setIntent(value)}>{value}</button>)}</div>
      {agent.messages.length <= 1 && !busy && <div className="assistant-starters" role="group" aria-label="Suggested questions">{STARTERS[intent].map(text => <button type="button" key={text} onClick={() => setInput(text)}>{text}</button>)}</div>}
      <p className="assistant-context">{project.boardId.toUpperCase()} · revision {project.revision} · {active?.name || 'Server configuration / optional AI'}</p>
      <div className="assistant-scroll" ref={scroll} aria-live="polite">{agent.messages.map(message => <Message key={message.id} message={message} />)}
        {busy && agent.status === 'thinking' && <p className="assistant-working"><Loader2 size={12} className="spin" />Working…</p>}
        {pending.map(patch => <Proposal key={patch.id} patch={patch} project={project} busy={busy} onDecision={onDecision} onError={setError} />)}
      </div>
      {error && <p role="alert" className="error-note">{error}</p>}
      <form className="assistant-composer" onSubmit={event => { event.preventDefault(); void send() }}>
        <label className="sr-only" htmlFor="assistant-input">Ask the project assistant</label><textarea id="assistant-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send() } }} placeholder={intent === 'explain' ? 'Explain why this pin needs a pull-up…' : intent === 'debug' ? 'Help me understand the build error…' : 'Describe the change you want…'} rows={3} />
        <div><span>{intent === 'explain' ? 'Read-only' : 'Edits are drafted, checked, then reviewed by you'} · Ctrl+Enter sends</span>{busy ? <button type="button" aria-label="Stop assistant" onClick={agent.stopGeneration}><Square size={15} /></button> : <button className="primary" aria-label="Send message" disabled={!input.trim()}><ArrowUp size={17} /></button>}</div>
      </form>
    </>}
  </aside>
}
