'use client'
import { useRef, useState } from 'react'
import { Minus, Plus, Maximize2, Trash2, Cable } from 'lucide-react'
import type { Board, Circuit, Part } from '../project/types'
import { connect, partPorts } from './graph'

interface Props { circuit: Circuit; board: Board; states: Record<string, number>; onChange: (circuit: Circuit) => void; onButton: (id: string, pressed: boolean) => void; running: boolean }
export function CircuitCanvas({ circuit, board, states, onChange, onButton, running }: Props) {
  const [selected, setSelected] = useState('board:D13')
  const [from, setFrom] = useState('board:D2'), [to, setTo] = useState('board:GND')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ id: string; x: number; y: number; baseX: number; baseY: number } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const pinNames = board.pins
  const rightCount = Math.ceil(pinNames.length / 2)
  const diagramHeight = Math.max(510, rightCount * 24 + 110)
  const terminalPositions: Record<string, { x: number; y: number }> = {}
  pinNames.forEach((pin, i) => { terminalPositions[`board:${pin}`] = { x: i < rightCount ? 270 : 100, y: 92 + (i < rightCount ? i : i - rightCount) * 24 } })
  for (const part of circuit.parts) partPorts[part.kind].forEach((port, i) => { terminalPositions[`${part.id}:${port}`] = { x: part.x + i * 100, y: part.y + 64 } })
  const terminals = Object.keys(terminalPositions)
  const selectedNet = circuit.nets.find(n => n.terminals.includes(selected))
  const connected = new Set(selectedNet?.terminals || [selected])
  const addPart = (kind: Part['kind']) => {
    const id = `${kind}_${Date.now().toString(36)}`
    onChange({ ...circuit, parts: [...circuit.parts, { id, kind, label: kind === 'button' ? 'Push button' : kind === 'resistor' ? 'Resistor' : 'LED', value: kind === 'resistor' ? '330 Ω' : '', x: 460 + (circuit.parts.length % 2) * 150, y: 100 + Math.floor(circuit.parts.length / 2) * 150 }] })
  }
  const point = (event: React.PointerEvent) => {
    const matrix = svg.current?.getScreenCTM()?.inverse()
    if (!matrix) return { x: 0, y: 0 }
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix)
    return { x: p.x / zoom, y: p.y / zoom }
  }
  return <div className="circuit-workspace">
    <div className="canvas-tools"><span className="eyebrow">CONNECTIONS</span><div className="button-group">
      <button title="Zoom out" aria-label="Zoom out" onClick={() => setZoom(z => Math.max(.4, z - .15))}><Minus size={15} /></button>
      <span>{Math.round(zoom * 100)}%</span>
      <button title="Zoom in" aria-label="Zoom in" onClick={() => setZoom(z => Math.min(2, z + .15))}><Plus size={15} /></button>
      <button title="Fit circuit" aria-label="Fit circuit" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}><Maximize2 size={15} /></button>
    </div></div>
    <svg ref={svg} className="circuit-canvas" viewBox={`0 0 800 ${diagramHeight}`} aria-label={`${board.name} circuit diagram`} onPointerMove={event => {
      if (!drag.current) return
      const current = drag.current, p = point(event)
      if (current.id === 'pan') setOffset({ x: current.baseX + p.x - current.x, y: current.baseY + p.y - current.y })
      else onChange({ ...circuit, parts: circuit.parts.map(part => part.id === current.id ? { ...part, x: Math.round(Math.max(0, Math.min(3800, current.baseX + p.x - current.x))), y: Math.round(Math.max(0, Math.min(3800, current.baseY + p.y - current.y))) } : part) })
    }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
      <defs><pattern id="circuit-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" /></pattern></defs>
      <rect width="800" height={diagramHeight} fill="url(#circuit-dots)" className="canvas-dots" onPointerDown={event => { const p = point(event); drag.current = { id: 'pan', ...p, baseX: offset.x, baseY: offset.y }; event.currentTarget.setPointerCapture(event.pointerId) }} />
      <g transform={`scale(${zoom}) translate(${offset.x} ${offset.y})`}>
        {circuit.nets.flatMap(net => net.terminals.slice(1).map(terminal => {
          const a = terminalPositions[net.terminals[0]], b = terminalPositions[terminal]
          if (!a || !b) return null
          return <path key={net.id + terminal} d={`M${a.x} ${a.y} H${(a.x + b.x) / 2} V${b.y} H${b.x}`} fill="none" className={selectedNet?.id === net.id ? 'net-path selected' : 'net-path'} onClick={() => setSelected(terminal)} />
        }))}
        <g><rect x="100" y="52" width="170" height={diagramHeight - 120} rx="18" className="board-body" /><rect x="115" y="68" width="52" height="28" rx="4" className="board-usb" />
          <text x="185" y="140" textAnchor="middle" className="board-brand">PROJECTCRAFT</text><text x="185" y="163" textAnchor="middle" className="board-name">{board.id === 'uno' ? 'UNO' : board.id.toUpperCase()}</text>
          <rect x="153" y="190" width="64" height="145" rx="4" className="board-chip" /><text x="185" y="266" textAnchor="middle" className="chip-label" transform="rotate(-90 185 266)">{board.id === 'uno' ? 'ATmega328P' : 'Board reference'}</text>
          {board.id === 'uno' && <><circle cx="226" cy="387" r="6" className={states.D13 ? 'led-lit' : 'led-unlit'} /><text x="212" y="409" className="pin-label">L / D13</text></>}
        </g>
        {circuit.parts.map(part => <g key={part.id} className="circuit-part" tabIndex={0} role="button" aria-label={`Move ${part.label} with arrow keys`} onKeyDown={event => {
          if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
          event.preventDefault()
          onChange({ ...circuit, parts: circuit.parts.map(p => p.id === part.id ? { ...p, x: Math.max(0, p.x + (event.key === 'ArrowRight' ? 10 : event.key === 'ArrowLeft' ? -10 : 0)), y: Math.max(0, p.y + (event.key === 'ArrowDown' ? 10 : event.key === 'ArrowUp' ? -10 : 0)) } : p) })
        }} onPointerDown={event => { if ((event.target as Element).closest('[data-terminal]')) return; const p = point(event); drag.current = { id: part.id, ...p, baseX: part.x, baseY: part.y }; event.currentTarget.setPointerCapture(event.pointerId) }}>
          <rect x={part.x} y={part.y} width="100" height="64" rx="10" className="part-body" />
          <text x={part.x + 50} y={part.y + 24} textAnchor="middle" className="part-label">{part.label}</text><text x={part.x + 50} y={part.y + 44} textAnchor="middle" className="part-value">{part.value || part.kind}</text>
        </g>)}
        {terminals.map(terminal => { const p = terminalPositions[terminal], label = terminal.split(':')[1], isBoard = terminal.startsWith('board:'); return <g key={terminal} role="button" tabIndex={0} data-terminal={terminal} aria-label={`Inspect terminal ${terminal}`} className="terminal" onClick={() => setSelected(terminal)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(terminal) } }}>
          <circle cx={p.x} cy={p.y} r={connected.has(terminal) ? 5 : 4} className={connected.has(terminal) ? 'terminal-dot selected' : 'terminal-dot'} />
          <text x={p.x + (isBoard ? p.x > 100 ? 12 : -12 : 0)} y={p.y + (isBoard ? 4 : 19)} textAnchor={isBoard ? p.x > 100 ? 'start' : 'end' : 'middle'} className="pin-label">{label}</text>
        </g> })}
      </g>
    </svg>
    <div className="part-palette"><span>Add a part</span>{(['button', 'resistor', 'led'] as const).map(kind => <button key={kind} onClick={() => addPart(kind)} disabled={circuit.parts.length >= 50}><Plus size={13} />{kind}</button>)}</div>
    <div className="terminal-inspector"><div><Cable size={15} /><strong>{selected}</strong><span>{selectedNet ? selectedNet.label || selectedNet.id : 'Not connected'}</span></div>
      {selectedNet && <p>{selectedNet.terminals.join(' ↔ ')}</p>}
      <form className="connect-form" onSubmit={event => { event.preventDefault(); onChange(connect(circuit, from, to)) }}>
        <label className="sr-only" htmlFor="from-terminal">From terminal</label><select id="from-terminal" value={from} onChange={e => setFrom(e.target.value)}>{terminals.map(t => <option key={t}>{t}</option>)}</select>
        <span>→</span><label className="sr-only" htmlFor="to-terminal">To terminal</label><select id="to-terminal" value={to} onChange={e => setTo(e.target.value)}>{terminals.map(t => <option key={t}>{t}</option>)}</select><button className="small-button" disabled={!terminals.includes(from) || !terminals.includes(to) || from === to}>Connect</button>
      </form>
      {circuit.nets.length > 0 && <details><summary>Connection table · {circuit.nets.length} nets</summary><ul className="net-list">{circuit.nets.map(net => <li key={net.id}><button onClick={() => setSelected(net.terminals[0])}>{net.label || net.id}: {net.terminals.join(' ↔ ')}</button><button aria-label={`Delete connection ${net.label || net.id}`} onClick={() => onChange({ ...circuit, nets: circuit.nets.filter(n => n.id !== net.id) })}><Trash2 size={13} /></button></li>)}</ul></details>}
      {circuit.parts.map(part => <div className="part-actions" key={part.id}><span>{part.label}</span>{part.kind === 'button' && <button disabled={!running} onPointerDown={() => onButton(part.id, true)} onPointerUp={() => onButton(part.id, false)} onPointerLeave={() => onButton(part.id, false)} onKeyDown={e => { if (e.code === 'Space') { e.preventDefault(); onButton(part.id, true) } }} onKeyUp={e => { if (e.code === 'Space') onButton(part.id, false) }} onBlur={() => onButton(part.id, false)}>Hold button</button>}<button aria-label={`Remove ${part.label}`} onClick={() => onChange({ parts: circuit.parts.filter(p => p.id !== part.id), nets: circuit.nets.map(n => ({ ...n, terminals: n.terminals.filter(t => !t.startsWith(part.id + ':')) })).filter(n => n.terminals.length >= 2) })}><Trash2 size={13} /></button></div>)}
      <p className="muted-note">Logical terminal diagram, not physical header placement. Digital model: Uno built-in LED, GPIO and push buttons. External LED/resistor artwork shows connectivity; analog current and voltage are not calculated.</p>
    </div>
  </div>
}
