'use client'
import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import type { TraceEvent } from '../project/types'
import { channelsOf, comparePins, formatFrequency, formatTime, measure, niceTicks, toVcd, valueAt, windowEdges } from './signal-analysis'

const WIDTH = 1000, GUTTER = 64, PLOT = WIDTH - GUTTER - 16, LANE = 34, PITCH = 50, TOP = 10, MIN_SPAN_US = 10
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

export function Signals({ events, timeUs, dropped }: { events: TraceEvent[]; timeUs: number; dropped: number }) {
  const channels = useMemo(() => channelsOf(events), [events])
  const pins = useMemo(() => Object.keys(channels).sort(comparePins), [channels])
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [view, setView] = useState<{ start: number; end: number } | null>(null)
  const [cursors, setCursors] = useState<number[]>([])
  const svg = useRef<SVGSVGElement>(null)

  const visible = useMemo(() => pins.filter(pin => !hidden.has(pin)), [pins, hidden])
  const lastEvent = events.length ? events[events.length - 1].timeUs : 0
  const fullEnd = Math.max(timeUs, lastEvent, 1)
  const start = view ? clamp(view.start, 0, fullEnd - MIN_SPAN_US) : 0
  const end = view ? clamp(view.end, start + MIN_SPAN_US, fullEnd) : fullEnd
  const span = end - start
  const x = (t: number) => GUTTER + clamp((t - start) / span, 0, 1) * PLOT
  const height = TOP + Math.max(visible.length, 1) * PITCH + 30
  const measurements = useMemo(() => visible.map(pin => measure(pin, channels[pin])), [visible, channels])

  const zoom = (factor: number) => {
    const center = cursors.length ? cursors[cursors.length - 1] : start + span / 2
    const nextSpan = clamp(span * factor, MIN_SPAN_US, fullEnd)
    const nextStart = clamp(center - (center - start) * (nextSpan / span), 0, fullEnd - nextSpan)
    setView({ start: nextStart, end: nextStart + nextSpan })
  }
  const pan = (direction: -1 | 1) => {
    const nextStart = clamp(start + direction * span * 0.25, 0, fullEnd - span)
    setView({ start: nextStart, end: nextStart + span })
  }
  const place = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    if (px < GUTTER || px > GUTTER + PLOT) return
    const t = start + ((px - GUTTER) / PLOT) * span
    setCursors(current => current.length >= 2 ? [t] : [...current, t])
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([toVcd(events, timeUs, visible)], { type: 'text/plain' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'projectcraft-signals.vcd'; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const [a, b] = cursors
  const delta = a !== undefined && b !== undefined ? Math.abs(b - a) : null
  const table = useMemo(() => events.filter(e => e.pin && !hidden.has(e.pin)).slice(-100), [events, hidden])

  if (!pins.length) return <div className="signal-view"><p className="empty-result">Build and run the Uno example to inspect real GPIO transitions. Pins appear here when the firmware changes their level.</p>{dropped > 0 && <p className="warning-note">{dropped} events were not retained.</p>}</div>

  return <div className="signal-view">
    <div className="signal-toolbar">
      <div className="signal-chips" role="group" aria-label="Visible pins">{pins.map(pin => <button key={pin} type="button" className="signal-chip" aria-pressed={!hidden.has(pin)} onClick={() => setHidden(current => { const next = new Set(current); if (next.has(pin)) next.delete(pin); else next.add(pin); return next })}>{pin}</button>)}</div>
      <div className="signal-controls" role="group" aria-label="Time axis">
        <button type="button" aria-label="Pan earlier" title="Pan earlier (←)" onClick={() => pan(-1)}><ChevronLeft size={14} /></button>
        <button type="button" aria-label="Zoom out" title="Zoom out (−)" onClick={() => zoom(2)}><ZoomOut size={14} /></button>
        <button type="button" aria-label="Zoom in" title="Zoom in (+)" onClick={() => zoom(0.5)}><ZoomIn size={14} /></button>
        <button type="button" aria-label="Fit whole recording" title="Fit whole recording (0)" onClick={() => setView(null)}><Maximize2 size={14} /></button>
        <button type="button" aria-label="Pan later" title="Pan later (→)" onClick={() => pan(1)}><ChevronRight size={14} /></button>
        <button type="button" className="signal-export" onClick={download} disabled={!visible.length} title="Download visible pins as a Value Change Dump for GTKWave or PulseView"><Download size={14} />VCD</button>
      </div>
    </div>
    <p className="signal-summary">{formatTime(start)} – {formatTime(end)} of {formatTime(fullEnd)} simulated · {events.length} retained events{cursors.length ? <> · <button type="button" className="link-button" onClick={() => setCursors([])}>Clear cursors</button></> : ' · click the waveform to place cursor A, then B'}</p>
    <div className="signal-scroll" tabIndex={0} aria-label="Waveform. Use plus and minus to zoom, left and right arrows to pan, zero to fit." onKeyDown={event => {
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(0.5) }
      else if (event.key === '-') { event.preventDefault(); zoom(2) }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); pan(-1) }
      else if (event.key === 'ArrowRight') { event.preventDefault(); pan(1) }
      else if (event.key === '0') { event.preventDefault(); setView(null) }
    }}>
      <svg ref={svg} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={`Digital waveforms for ${visible.join(', ') || 'no pins'}`} onClick={place} className="signal-svg">
        {visible.map((pin, lane) => {
          const top = TOP + lane * PITCH, high = top + 4, low = top + LANE - 4
          const edges = windowEdges(channels[pin], start, end)
          const known = edges[0].timeUs < start
          const first = known ? start : edges[0].timeUs
          const levelY = (value: number) => value ? high : low
          let d = `M${x(first)} ${levelY(edges[0].value)}`
          for (let i = 1; i < edges.length; i++) d += ` H${x(edges[i].timeUs)} V${levelY(edges[i].value)}`
          d += ` H${x(Math.min(end, fullEnd))}`
          return <g key={pin}>
            <text x={GUTTER - 8} y={top + LANE / 2 + 4} textAnchor="end" className="signal-label">{pin}</text>
            <path d={`M${GUTTER} ${high}H${GUTTER + PLOT} M${GUTTER} ${low}H${GUTTER + PLOT}`} className="signal-guide" />
            <path d={d} className="signal-line" />
          </g>
        })}
        <line x1={GUTTER} x2={GUTTER + PLOT} y1={height - 24} y2={height - 24} className="signal-guide" />
        {niceTicks(start, end).map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={TOP} y2={height - 24} className="signal-grid" /><text x={x(t)} y={height - 8} textAnchor="middle" className="signal-tick">{formatTime(t, 2)}</text></g>)}
        {cursors.map((t, index) => t >= start && t <= end && <g key={index}><line x1={x(t)} x2={x(t)} y1={TOP} y2={height - 24} className="signal-cursor" /><text x={x(t) + 4} y={TOP + 9} className="signal-cursor-label">{index ? 'B' : 'A'}</text></g>)}
      </svg>
    </div>
    {a !== undefined && <p className="signal-readout" aria-live="polite">A {formatTime(a)}{b !== undefined && delta !== null && <> · B {formatTime(b)} · Δ {formatTime(delta)}{delta > 0 && <> · 1/Δ {formatFrequency(1e6 / delta)}</>}</>}</p>}
    {dropped > 0 && <p className="warning-note">Recording buffer limit reached: {dropped} events were not retained. Measurements describe retained events only; exported traces include this count.</p>}
    <table className="signal-measurements"><caption>Measurements over the retained recording</caption><thead><tr><th scope="col">Pin</th><th scope="col">Frequency</th><th scope="col">Period</th><th scope="col">Duty</th><th scope="col">High</th><th scope="col">Low</th><th scope="col">Edges</th>{a !== undefined && <th scope="col">@A</th>}{b !== undefined && <th scope="col">@B</th>}</tr></thead>
      <tbody>{measurements.map(m => <tr key={m.pin}><th scope="row">{m.pin}</th><td>{formatFrequency(m.frequencyHz)}</td><td>{m.periodUs == null ? '—' : formatTime(m.periodUs)}</td><td>{m.dutyPercent == null ? '—' : `${m.dutyPercent.toFixed(1)} %`}</td><td>{m.highUs == null ? '—' : formatTime(m.highUs)}</td><td>{m.lowUs == null ? '—' : formatTime(m.lowUs)}</td><td>{m.transitions}</td>{a !== undefined && <td>{valueAt(channels[m.pin], a) ?? '?'}</td>}{b !== undefined && <td>{valueAt(channels[m.pin], b) ?? '?'}</td>}</tr>)}</tbody></table>
    <p className="muted">A measurement needs at least two observed rising edges (— otherwise). Simulation time comes from the emulated CPU clock, not wall-clock time.</p>
    <details><summary>Accessible event table · last {table.length} edges</summary><table><thead><tr><th>Simulation time</th><th>Pin</th><th>Value</th></tr></thead><tbody>{table.map((event, i) => <tr key={i}><td>{formatTime(event.timeUs)}</td><td>{event.pin}</td><td>{event.value}</td></tr>)}</tbody></table></details>
  </div>
}
