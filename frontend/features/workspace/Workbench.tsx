'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, Bot, Check, ChevronDown, CircuitBoard, Code2, Cpu, Download, FileCode2, FolderOpen, History, Loader2, Moon, Play, Plus, RotateCcw, Save, Square, Sun, Upload, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { OnMount } from '@monaco-editor/react'
import { loader } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { request, contentOf, type Board, type Project, type ProjectContent, type Patch, type Run, type TraceEvent, type WiringReport } from '../project/types'
import { CircuitCanvas } from '../circuit/CircuitCanvas'
import { WiringCheck } from '../circuit/WiringCheck'
import { buttonInputs } from '../circuit/graph'
import { Signals } from '../execution/Signals'
import { CompareRuns } from '../execution/CompareRuns'
import { Assistant } from '../assistant/Assistant'
import './workbench.css'

loader.config({ paths: { vs: '/monaco/vs' } })
// Browser storage is a recovery aid; server-backed editing also works when storage is blocked.
const cache = {
  get(key: string) { try { return localStorage.getItem(key) } catch { return null } },
  set(key: string, value: string) { try { localStorage.setItem(key, value) } catch { /* Server save remains available. */ } },
  remove(key: string) { try { localStorage.removeItem(key) } catch { /* Best-effort recovery cache. */ } },
}
const Editor = dynamic(() => import('@monaco-editor/react').then(m => m.default), { ssr: false, loading: () => <div className="editor-loading"><Loader2 className="spin" size={20} />Loading local editor…</div> })

export default function Workbench() {
  const { resolvedTheme, setTheme } = useTheme()
  const [projects, setProjects] = useState<Project[]>([]), [boards, setBoards] = useState<Board[]>([])
  const [project, setProject] = useState<Project | null>(null), [draft, setDraft] = useState<ProjectContent | null>(null)
  const projectRef = useRef<Project | null>(null), draftRef = useRef<ProjectContent | null>(null)
  const saveTask = useRef<Promise<Project> | null>(null)
  const stopTask = useRef<Promise<void> | null>(null)
  const [saveState, setSaveState] = useState('Saved'), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const [activeFile, setActiveFile] = useState('sketch.ino'), [runs, setRuns] = useState<Run[]>([]), [patches, setPatches] = useState<Patch[]>([])
  const [run, setRun] = useState<Run | null>(null), [building, setBuilding] = useState(false)
  const [surface, setSurface] = useState<'code' | 'circuit'>('code'), [results, setResults] = useState('problems'), [assistant, setAssistant] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [wiring, setWiring] = useState<WiringReport | null>(null), [wiringError, setWiringError] = useState('')
  const [dialog, setDialog] = useState(false), [name, setName] = useState('Untitled experiment'), [target, setTarget] = useState<ProjectContent['boardId']>('uno'), [newTemplate, setNewTemplate] = useState('blink')
  const [newFile, setNewFile] = useState(''), [fileActions, setFileActions] = useState(false)
  const [running, setRunning] = useState(false), [events, setEvents] = useState<TraceEvent[]>([]), [timeUs, setTimeUs] = useState(0), [states, setStates] = useState<Record<string, number>>({}), [dropped, setDropped] = useState(0)
  const worker = useRef<Worker | null>(null), trace = useRef<TraceEvent[]>([]), clock = useRef(0), lost = useRef(0), executing = useRef<{ projectId: string; buildId: string } | null>(null)
  const pressed = useRef(new Set<string>())
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null), monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const currentFile = draft?.files.find(f => f.name === activeFile) || draft?.files[0]
  const board = boards.find(b => b.id === draft?.boardId)
  const dirty = !!project && !!draft && JSON.stringify(contentOf(project)) !== JSON.stringify(draft)
  const stale = !!run && (dirty || run.sourceRevision !== project?.revision || run.origin === 'imported')
  const activeBuild = run?.origin === 'compiler' && run.valid && !stale && !!run.artifact

  const refreshRecords = useCallback(async (id: string) => {
    const [nextRuns, nextPatches] = await Promise.all([request<Run[]>(`/projects/${id}/runs`), request<Patch[]>(`/projects/${id}/patches`)])
    if (projectRef.current?.id === id) { setRuns(nextRuns); setPatches(nextPatches); setRun(current => current || nextRuns.find(r => r.origin === 'compiler') || nextRuns[0] || null) }
  }, [])

  const stop = useCallback(async () => {
    if (stopTask.current) return stopTask.current
    worker.current?.terminate(); worker.current = null; setRunning(false); setStates({})
    const execution = executing.current; executing.current = null
    const recording = { events: [...trace.current], durationUs: clock.current, dropped: lost.current }
    const task = (async () => {
      if (execution && recording.events.length) {
        try {
          await request(`/projects/${execution.projectId}/recordings`, { method: 'POST', body: JSON.stringify({ buildId: execution.buildId, ...recording }) })
          await refreshRecords(execution.projectId)
        } catch (e) { setError(e instanceof Error ? e.message : 'Recording could not be saved') }
      }
    })()
    stopTask.current = task
    try { await task } finally { stopTask.current = null }
  }, [refreshRecords])

  const activate = useCallback(async (next: Project) => {
    await stop()
    projectRef.current = next; draftRef.current = contentOf(next)
    setProject(next); setDraft(contentOf(next)); setActiveFile(next.files[0].name); setRun(null); setEvents([]); setTimeUs(0); setStates({}); setSaveState('Saved'); setError(''); setDialog(false); setAssistant(false); setRailOpen(false)
    const cached = cache.get(`projectcraft:draft:${next.id}`)
    if (cached) {
      try {
        const recovery = JSON.parse(cached)
        if (recovery.baseRevision === next.revision && recovery.content?.files?.length) {
          draftRef.current = recovery.content; setDraft(recovery.content); setSaveState('Recovered local draft')
        } else if (recovery.baseRevision) setError('A local draft from an earlier revision exists. Export the local draft before discarding it.')
      } catch { /* Ignore malformed browser cache, preserve server project. */ }
    }
    cache.set('projectcraft:last-project', next.id)
    await refreshRecords(next.id)
  }, [stop, refreshRecords])

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [catalog, list] = await Promise.all([request<{ boards: Board[] }>('/boards'), request<Project[]>('/projects')])
      setBoards(catalog.boards); setProjects(list)
      const last = cache.get('projectcraft:last-project')
      const next = list.find(p => p.id === last) || list[0]
      if (next) await activate(next)
      else setDialog(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Local backend is unavailable') }
    finally { setLoading(false) }
  }, [activate])
  useEffect(() => { void load(); return () => { worker.current?.terminate() } }, [load])
  // The report describes the saved revision; refetch whenever a new revision is stored.
  const savedId = project?.id, savedRevision = project?.revision
  useEffect(() => {
    if (!savedId) { setWiring(null); return }
    let current = true
    setWiringError('')
    request<WiringReport>(`/projects/${savedId}/wiring-check`).then(report => { if (current) setWiring(report) }).catch(e => { if (current) { setWiring(null); setWiringError(e instanceof Error ? e.message : 'Wiring check unavailable') } })
    return () => { current = false }
  }, [savedId, savedRevision])

  const persist = useCallback(async (): Promise<Project> => {
    if (saveTask.current) return saveTask.current
    const task: Promise<Project> = (async (): Promise<Project> => {
      if (!projectRef.current || !draftRef.current) throw new Error('Open a project first')
      while (JSON.stringify(contentOf(projectRef.current!)) !== JSON.stringify(draftRef.current)) {
        const previous: Project = projectRef.current!, content = draftRef.current!
        setSaveState('Saving…')
        try {
          const saved: Project = await request<Project>(`/projects/${previous.id}`, { method: 'PUT', body: JSON.stringify({ baseRevision: previous.revision, content }) })
          projectRef.current = saved; setProject(saved); setProjects(list => list.map(p => p.id === saved.id ? saved : p)); setSaveState('Saved')
          if (JSON.stringify(draftRef.current) === JSON.stringify(content)) cache.remove(`projectcraft:draft:${saved.id}`)
        } catch (e) { setSaveState('Not saved'); throw e }
      }
      return projectRef.current!
    })()
    saveTask.current = task
    try { return await task } finally { saveTask.current = null }
  }, [])

  const change = useCallback((next: ProjectContent) => {
    if (worker.current) void stop()
    draftRef.current = next; setDraft(next); setSaveState('Unsaved')
    if (projectRef.current) cache.set(`projectcraft:draft:${projectRef.current.id}`, JSON.stringify({ baseRevision: projectRef.current.revision, content: next }))
  }, [stop])

  useEffect(() => {
    if (!draft || !dirty) return
    const timer = setTimeout(() => { void persist().catch(e => setError(e.message)) }, 700)
    return () => clearTimeout(timer)
  }, [draft, dirty, persist])
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (draftRef.current && projectRef.current && JSON.stringify(draftRef.current) !== JSON.stringify(contentOf(projectRef.current))) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const build = useCallback(async () => {
    if (building) return
    try {
      setBuilding(true); setError(''); await stop()
      const saved = await persist()
      const result = await request<Run>(`/projects/${saved.id}/build`, { method: 'POST', body: JSON.stringify({ revision: saved.revision }) })
      if (projectRef.current?.id === saved.id) { setRun(result); setResults(result.valid ? 'output' : 'problems'); await refreshRecords(saved.id) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Build failed') }
    finally { setBuilding(false) }
  }, [building, stop, persist, refreshRecords])

  const start = async () => {
    if (running) { await stop(); return }
    await stop()
    if (!activeBuild || !run?.artifact || !project || !draft || draft.boardId !== 'uno') return
    setError(''); trace.current = []; clock.current = 0; lost.current = 0; pressed.current.clear()
    setEvents([]); setDropped(0); setTimeUs(0); setStates({}); setResults('signals')
    const instance = new Worker(new URL('../execution/avr.worker.ts', import.meta.url), { type: 'module' })
    worker.current = instance; executing.current = { projectId: project.id, buildId: run.id }; setRunning(true)
    instance.onmessage = ({ data }) => {
      if (data.type === 'error') { setError(data.message); void stop(); return }
      if (data.type === 'frame') {
        const capacity = Math.max(0, 10_000 - trace.current.length)
        trace.current.push(...data.events.slice(0, capacity)); lost.current = Math.max(lost.current, data.dropped || 0) + Math.max(0, data.events.length - capacity)
        clock.current = data.timeUs; setTimeUs(data.timeUs); setStates(data.states); setDropped(lost.current); setEvents([...trace.current])
      }
    }
    instance.onerror = () => { setError('The emulator worker stopped unexpectedly'); void stop() }
    instance.postMessage({ type: 'load', hex: run.artifact.content, inputs: buttonInputs(draft.circuit, pressed.current) })
  }

  const button = (id: string, down: boolean) => {
    if (!draftRef.current) return
    if (down) pressed.current.add(id); else pressed.current.delete(id)
    for (const [pin, high] of Object.entries(buttonInputs(draftRef.current.circuit, pressed.current))) worker.current?.postMessage({ type: 'input', pin: Number(pin), high })
  }

  useEffect(() => {
    if (dialog && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [dialog])

  const downloadDraft = () => {
    if (!projectRef.current || !draftRef.current) return
    const raw = cache.get(`projectcraft:draft:${projectRef.current.id}`)
    const recovered = raw ? JSON.parse(raw).content : draftRef.current
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'projectcraft-experiment', schemaVersion: 1, project: recovered, runs: [] }, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'recovered-draft.projectcraft.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (projectRef.current) await persist()
      const next = await request<Project>('/projects', { method: 'POST', body: JSON.stringify({ name, boardId: target, template: newTemplate }) })
      setProjects(list => [...list, next]); await activate(next)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create project') }
  }
  const importFile = async (file: File) => {
    try {
      if (file.size > 2_000_000) throw new Error('Import must be smaller than 2 MB')
      if (projectRef.current) await persist()
      const raw = await file.text()
      let next: Project
      if (file.name.endsWith('.json')) next = await request<Project>('/import', { method: 'POST', body: raw })
      else {
        if (!/\.(ino|py)$/.test(file.name)) throw new Error('Import an experiment JSON bundle, .ino sketch or .py file')
        const initial = await request<Project>('/projects', { method: 'POST', body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, ''), boardId: file.name.endsWith('.py') ? 'pi4' : 'uno', template: 'empty' }) })
        next = await request<Project>(`/projects/${initial.id}`, { method: 'PUT', body: JSON.stringify({ baseRevision: initial.revision, content: { ...contentOf(initial), files: [{ name: file.name, content: raw, type: 'code' }] } }) })
      }
      setProjects(list => [...list, next]); await activate(next)
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed') }
  }
  const exportProject = async () => {
    try {
      await stop(); const saved = await persist()
      const bundle = await request(`/projects/${saved.id}/export`)
      const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }))
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${saved.name.replace(/[^a-z0-9_-]/gi, '-')}.projectcraft.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed') }
  }
  const undo = async () => {
    try { const saved = await persist(); const previous = await request<Project>(`/projects/${saved.id}/undo`, { method: 'POST', body: JSON.stringify({ baseRevision: saved.revision }) }); await activate(previous); setProjects(list => list.map(p => p.id === previous.id ? previous : p)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Cannot undo') }
  }
  const decide = async (patch: Patch, action: 'apply' | 'reject') => {
    if (action === 'apply') await stop()
    const saved = await persist()
    const next = await request<Project>(`/projects/${saved.id}/patches/${patch.id}/${action}`, { method: 'POST' })
    if (action === 'apply') { projectRef.current = next; draftRef.current = contentOf(next); setProject(next); setDraft(contentOf(next)); setProjects(list => list.map(p => p.id === next.id ? next : p)) }
    await refreshRecords(saved.id)
  }
  const jump = (file?: string, line = 1, column = 1) => { if (file) setActiveFile(file); setSurface('code'); setTimeout(() => { editorRef.current?.revealLineInCenter(line); editorRef.current?.setPosition({ lineNumber: line, column }); editorRef.current?.focus() }, 100) }
  useEffect(() => {
    const instance = editorRef.current, monaco = monacoRef.current, model = instance?.getModel()
    if (!model || !monaco) return
    const markers = !stale ? (run?.diagnostics || []).filter(d => d.file === currentFile?.name && d.line).map(d => ({ startLineNumber: d.line!, endLineNumber: d.line!, startColumn: d.column || 1, endColumn: (d.column || 1) + 1, severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning, message: d.message })) : []
    monaco.editor.setModelMarkers(model, 'projectcraft-build', markers)
  }, [run, stale, currentFile])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); void persist().catch(error => setError(error.message)) } if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void build() } }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [persist, build])

  return <div className="workbench" data-theme={resolvedTheme === 'light' ? 'light' : 'dark'}>
    <a className="wb-skip" href="#workbench-editor">Skip to code editor</a>
    <header className="workbench-header"><button className="mobile-project-menu" aria-label="Open workspace navigation" aria-expanded={railOpen} aria-controls="project-navigation" onClick={() => setRailOpen(!railOpen)}><FolderOpen size={17} /></button><Link href="/" className="workbench-brand"><span><CircuitBoard size={21} /></span><strong>ProjectCraft</strong><span className="brand-sub">STUDIO</span></Link>
      <span className="header-divider" />
      <label className="project-name"><span className="sr-only">Project name</span><input aria-label="Project name" value={draft?.name || 'Your workbench'} disabled={!draft} onChange={e => draft && change({ ...draft, name: e.target.value })} /></label>
      <span className={`save-status ${dirty ? 'dirty' : ''}`}><span />{saveState}</span>
      <div className="header-actions"><button className="icon-button" aria-label="Toggle color theme" onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>{resolvedTheme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button><button onClick={exportProject} disabled={!project} title="Export project and run records"><Download size={16} /><span>Export</span></button><button aria-pressed={assistant} onClick={() => { if (!assistant && project) void refreshRecords(project.id); setAssistant(!assistant) }} disabled={!project}><Bot size={16} /><span>Assistant</span></button></div>
    </header>
    {error && <div role="alert" className="workbench-error"><span>{error}</span><button onClick={() => project ? void persist().then(() => setError('')).catch(e => setError(e.message)) : void load()}>{project ? 'Retry save' : 'Retry connection'}</button><button onClick={downloadDraft} disabled={!project}>Export local draft</button><button aria-label="Dismiss message" onClick={() => setError('')}><X size={14} /></button></div>}
    <div className="workbench-body">
      <aside id="project-navigation" className={`project-rail ${railOpen ? 'is-open' : ''}`}><button className="mobile-close-rail" aria-label="Close workspace navigation" onClick={() => setRailOpen(false)}><X size={17} /></button><div className="rail-section"><div className="rail-heading"><span>WORKSPACE</span><button aria-label="New project" onClick={() => setDialog(true)}><Plus size={16} /></button></div>
        <label className="sr-only" htmlFor="project-switcher">Open project</label><select id="project-switcher" value={project?.id || ''} onChange={async e => { try { await persist(); const selected = await request<Project>(`/projects/${e.target.value}`); await activate(selected) } catch (err) { setError(err instanceof Error ? err.message : 'Could not open project') } }}>{!project && <option value="">Open a project</option>}{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="rail-section file-section"><div className="rail-heading"><span>FILES</span><button aria-label="File actions" onClick={() => setFileActions(!fileActions)}><Plus size={16} /></button></div>
        {draft?.files.map(file => <button key={file.name} className={`file-item ${currentFile?.name === file.name ? 'active' : ''}`} onClick={() => setActiveFile(file.name)}><FileCode2 size={15} /><span>{file.name}</span></button>)}
        {fileActions && draft && currentFile && <div className="file-actions"><button onClick={() => {
          if (!/^[A-Za-z0-9_.-]+$/.test(newFile) || ['.', '..'].includes(newFile) || draft.files.some(f => f.name === newFile)) { setError('Enter a new, unique name in the file name field.'); return }
          change({ ...draft, files: draft.files.map(f => f.name === currentFile.name ? { ...f, name: newFile } : f) }); setActiveFile(newFile); setNewFile(''); setFileActions(false)
        }}>Rename selected</button><button disabled={draft.files.length < 2} onClick={() => { change({ ...draft, files: draft.files.filter(f => f.name !== currentFile.name) }); setActiveFile(draft.files.find(f => f.name !== currentFile.name)!.name); setFileActions(false) }}>Delete selected</button></div>}
        {fileActions && draft && <form className="file-form" onSubmit={e => { e.preventDefault(); if (!newFile || draft.files.some(f => f.name === newFile)) return; change({ ...draft, files: [...draft.files, { name: newFile, content: '', type: /\.(md|txt)$/.test(newFile) ? 'doc' : 'code' }] }); setActiveFile(newFile); setNewFile(''); setFileActions(false) }}><input aria-label="New file name" placeholder="helper.h" value={newFile} onChange={e => setNewFile(e.target.value)} required pattern="[A-Za-z0-9_.-]+" /><button>Add file</button></form>}
      </div>
      <div className="rail-section"><div className="rail-heading"><span>EXPERIMENTS</span><History size={14} /></div><button className="rail-action" onClick={() => setResults('runs')}><History size={15} />Run history<span className="count">{runs.length}</span></button><button className="rail-action" onClick={() => importInput.current?.click()}><Upload size={15} />Import project</button><button className="rail-action" onClick={() => setDialog(true)}><Plus size={15} />New experiment</button></div>
      <div className="rail-footer"><span className="status-dot" />LOCAL WORKSPACE<p>Your files. Your tools.<br />AI is always optional.</p><a href="https://github.com/moksha10171/proectcraft_studio" target="_blank" rel="noreferrer">Source & setup ↗</a></div></aside>
      {railOpen && <button className="mobile-rail-backdrop" aria-label="Close workspace navigation backdrop" onClick={() => setRailOpen(false)} />}<main className="workbench-main">
        <div className="workbench-toolbar"><div className="board-picker"><Cpu size={16} /><label className="sr-only" htmlFor="board-profile">Board profile</label><select id="board-profile" value={draft?.boardId || 'uno'} disabled={!draft || running} onChange={e => {
        if (!draft) return
        const nextBoard = boards.find(b => b.id === e.target.value)!
        const unknown = draft.circuit.nets.flatMap(n => n.terminals).filter(t => t.startsWith('board:') && !nextBoard.pins.includes(t.slice(6)))
        if (unknown.length) { setError(`Remove incompatible connections first: ${unknown.join(', ')}`); return }
        change({ ...draft, boardId: nextBoard.id, coreVersion: nextBoard.id === 'pi4' ? null : draft.coreVersion || '1.8.8' })
      }}>{boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><ChevronDown size={13} /></div><span className="target-capability">{board?.fqbn || 'Python syntax check'}</span><div className="build-controls"><button className="quiet-button" onClick={undo} disabled={!project || project.revision < 2 || running} title="Restore the previous revision"><RotateCcw size={15} /><span>Undo</span></button><button className="build-button" onClick={build} disabled={!project || building}>{building ? <Loader2 className="spin" size={15} /> : <Check size={16} />}{building ? 'Building…' : draft?.boardId === 'pi4' ? 'Check syntax' : 'Build'}</button><button className="primary" disabled={!running && (!activeBuild || draft?.boardId !== 'uno')} onClick={() => void start()} title={draft?.boardId !== 'uno' ? 'Execution adapter currently supports Uno; other targets support compilation or syntax checking' : !activeBuild ? 'Build the current revision before running' : 'Execute compiled firmware in AVR8js'}>{running ? <Square size={14} /> : <Play size={14} />}{running ? 'Stop' : 'Run'}</button></div></div>
        <nav className="mobile-surfaces" aria-label="Work surface"><button aria-current={surface === 'code'} onClick={() => setSurface('code')}><Code2 size={15} />Code</button><button aria-current={surface === 'circuit'} onClick={() => setSurface('circuit')}><CircuitBoard size={15} />Circuit</button><button onClick={() => setResults('signals')}>Results</button></nav>
        {loading ? <div className="workbench-empty"><Loader2 className="spin" />Opening your local workspace…</div> : !draft ? <div className="workbench-empty"><div className="welcome-mark"><CircuitBoard size={40} /></div><span className="eyebrow">A WORKBENCH FOR CURIOUS MINDS</span><h1>Build something.<br />Understand how it works.</h1><p>Code, connect and inspect real firmware.<br />Start with an example. No AI key required.</p><button className="primary" onClick={() => setDialog(true)}>Create an experiment<ArrowRight size={16} /></button></div> : <>
          <div className={`work-surfaces surface-${surface}`}>
            <section className="code-surface" id="workbench-editor" aria-label="Code editor"><div className="surface-title"><span><Code2 size={15} />{currentFile?.name}</span><span>{currentFile?.name.endsWith('.py') ? 'Python' : 'Arduino C++'}<span className="muted"> · rev {project?.revision}</span></span></div>
              <div className="monaco-wrap"><Editor height="100%" path={`${project?.id}/${currentFile?.name}`} value={currentFile?.content || ''} language={currentFile?.name.endsWith('.py') ? 'python' : currentFile?.name.endsWith('.md') ? 'markdown' : 'cpp'} theme={resolvedTheme === 'light' ? 'vs' : 'vs-dark'} onChange={value => currentFile && change({ ...draft, files: draft.files.map(f => f.name === currentFile.name ? { ...f, content: value || '' } : f) })} onMount={(instance, monaco) => { editorRef.current = instance; monacoRef.current = monaco }} options={{ fontSize: 13, lineHeight: 23, minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, automaticLayout: true, wordWrap: 'on', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }} /></div>
              <div className="editor-footer"><span>{currentFile?.content.split('\n').length || 0} lines</span><span>UTF-8</span><button onClick={() => void persist().catch(e => setError(e.message))}><Save size={12} />{saveState}</button></div>
            </section>
            <section className="circuit-surface" aria-label="Circuit"><div className="surface-title"><span><CircuitBoard size={15} />Circuit</span><span className={running ? 'execution-label' : 'muted'}>{running ? '● EMULATED' : 'TERMINAL VIEW'}</span></div>{board && <CircuitCanvas circuit={draft.circuit} board={board} states={states} running={running} onButton={button} onChange={circuit => change({ ...draft, circuit })} />}</section>
          </div>
          <section className="results-panel" aria-label="Experiment results"><nav aria-label="Result views">{['problems', 'output', 'serial', 'signals', 'runs', 'compare', 'wiring', 'notes'].map(tab => <button aria-current={results === tab} onClick={() => setResults(tab)} key={tab}>{tab === 'output' ? 'Build output' : tab === 'runs' ? 'Run history' : tab === 'wiring' ? 'Wiring check' : tab}{tab === 'problems' && !!run?.diagnostics.length && <span className="count">{run.diagnostics.length}</span>}{tab === 'wiring' && !!wiring?.findings.filter(f => f.severity !== 'info').length && <span className="count">{wiring.findings.filter(f => f.severity !== 'info').length}</span>}</button>)}<span className={`run-status ${stale ? 'stale' : run?.valid ? 'passed' : ''}`}>{stale ? 'Source changed · rebuild required' : run ? `${run.status} · ${run.engine}` : 'No checks run yet'}</span></nav>
            <div className="result-content">
              {results === 'problems' && (run?.diagnostics.length ? run.diagnostics.map((d, i) => <button className="diagnostic" key={i} onClick={() => jump(d.file, d.line, d.column)}><span className={`severity ${d.severity}`}>{d.severity}</span><span>{d.message}</span>{d.file && <code>{d.file}:{d.line}</code>}</button>) : <p className="empty-result">{run?.valid ? stale ? `Showing a saved result from revision ${run.sourceRevision}. Rebuild to check the current source.` : 'This revision passed its compiler check.' : 'Build your project to see compiler diagnostics. Click a problem to jump to its source.'}</p>)}
              {results === 'output' && <pre className="build-output">{run ? `Run ${run.id}\nRevision ${run.sourceRevision} · ${run.boardId} · ${run.durationMs} ms\n\n${run.output}` : 'No build output. Start with Build; AI is not required.'}</pre>}
              {results === 'serial' && <><div className="result-caption">{events.length ? 'AVR USART output · simulated time' : 'No serial capture yet. Build and run an Uno sketch using Serial.print().'}</div><pre className="serial-output">{events.filter(e => e.serial).map(e => e.serial).join('')}</pre></>}
              {results === 'signals' && <Signals events={events} timeUs={timeUs} dropped={dropped} />}
              {results === 'runs' && <div className="run-list">{!runs.length && <p className="empty-result">Every build and saved capture will appear here with its source revision.</p>}{runs.map(item => <button key={item.id} onClick={() => { setRun(item); if (item.trace) { setEvents(item.trace); setTimeUs(item.durationMs * 1000); setDropped(item.dropped || 0); setResults('signals') } else setResults('output') }}><span className={`run-dot ${item.valid ? 'passed' : ''}`} /><strong>{item.engine}</strong><span>{item.origin}</span><span>rev {item.sourceRevision}</span><span>{item.status}</span><code>{item.id.slice(0, 8)}</code></button>)}</div>}
              {results === 'compare' && <CompareRuns runs={runs} />}
              {results === 'wiring' && <WiringCheck report={wiring} error={wiringError} savedRevision={project?.revision} dirty={dirty} onJump={(file, line) => jump(file, line)} />}
              {results === 'notes' && <label className="experiment-notes"><span>Prediction, observations and limitations</span><textarea aria-label="Experiment notes" value={draft.notes} onChange={e => change({ ...draft, notes: e.target.value })} placeholder="What do you expect to happen? What did you observe?" /></label>}
            </div>
          </section>
        </>}
        <footer className="workbench-status"><span><span className="status-dot" />Local backend · {project ? `Project ${project.id.slice(0, 8)}` : 'Ready to begin'}</span><span>{running ? `${(timeUs / 1e6).toFixed(2)} s simulated` : 'Build checks code · Run executes Uno firmware'}</span><span>Ctrl/⌘ + Enter to build</span></footer>
      </main>
      {assistant && project && <Assistant key={project.id} project={project} patches={patches} beforeSend={persist} onPatch={patch => setPatches(list => [...list, patch])} onDecision={decide} onClose={() => setAssistant(false)} />}
    </div>
    <input type="file" ref={importInput} className="sr-only" aria-label="Import experiment file" accept=".json,.ino,.py" onChange={e => { const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = '' }} />
    {dialog && <div className="workbench-overlay"><dialog ref={dialogRef} className="new-project-dialog" aria-labelledby="new-project-title" onCancel={e => { if (!project) e.preventDefault(); else setDialog(false) }}><header><span className="welcome-mark"><CircuitBoard size={25} /></span>{project && <button aria-label="Close new project" onClick={() => setDialog(false)}><X size={20} /></button>}</header><span className="eyebrow">YOUR NEXT EXPERIMENT</span><h1 id="new-project-title">Start with a little curiosity.</h1><p>A local workspace for code, connections and real results.<br />No account. No paid compiler. AI optional.</p>
      <form onSubmit={create}><label>Project name<input autoFocus value={name} onChange={e => setName(e.target.value)} required maxLength={100} /></label><label>Target board<select value={target} onChange={e => setTarget(e.target.value as ProjectContent['boardId'])}>{boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><div className="template-cards" role="group" aria-label="Starting point">{[{ id: 'blink', title: 'Blink & observe', text: 'Timing, GPIO and serial' }, { id: 'button', title: 'Button input', text: 'Read a digital input' }, { id: 'empty', title: 'Empty project', text: 'Make something yours' }].filter(t => target !== 'pi4' || t.id !== 'button').map(t => <button type="button" aria-pressed={newTemplate === t.id} key={t.id} onClick={() => setNewTemplate(t.id)}><Cpu size={18} /><strong>{t.title}</strong><span>{t.text}</span></button>)}</div><button className="primary create-project">Create experiment<ArrowRight size={16} /></button></form><button className="import-link" onClick={() => importInput.current?.click()}><FolderOpen size={15} />Already have a project? Import .ino, .py or a bundle</button>
    </dialog></div>}
  </div>
}
