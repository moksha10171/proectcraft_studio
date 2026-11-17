'use client'
import { useMemo, useRef, useState } from 'react'
import { Download, Rows3, Square } from 'lucide-react'
import type { TraceEvent } from '../project/types'
import { formatTime, niceTicks } from './signal-analysis'
import { serialPlot, toCsv, valueScale, type PlotSample } from './serial-plot'

const WIDTH = 1000, GUTTER = 72, RIGHT = 70, PLOT = WIDTH - GUTTER - RIGHT, LANE = 64, LANE_GAP = 14, SHARED = 200, TOP = 10, AXIS = 26
const MAX_SERIES = 8 // Fixed categorical slots; never generate more hues.
const format = (value: number) => Math.abs(value) >= 1e5 || (Math.abs(value) < 1e-3 && value !== 0) ? value.toExponential(2) : String(Number(value.toPrecision(6)))

function nearest(samples: PlotSample[], timeUs: number) {
  let low = 0, high = samples.length - 1
  while (low < high) { const mid = (low + high) >> 1; if (samples[mid].timeUs < timeUs) low = mid + 1; else high = mid }
  return low > 0 && Math.abs(samples[low - 1].timeUs - timeUs) < Math.abs(samples[low].timeUs - timeUs) ? low - 1 : low
}

export function Plotter({ events, timeUs }: { events: TraceEvent[]; timeUs: number }) {
  const plot = useMemo(() => serialPlot(events), [events])
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [shared, setShared] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const plotted = plot.series.slice(0, MAX_SERIES)
  const visible = plotted.filter(name => !hidden.has(name))
  const slot = (name: string) => `var(--plot-${plotted.indexOf(name) + 1})` // Colour follows the series, not its position on screen.
  const last = plot.samples.at(-1)
  const end = Math.max(timeUs, last?.timeUs ?? 0, 1)
  const x = (t: number) => GUTTER + (t / end) * PLOT
  const ranges = useMemo(() => Object.fromEntries(plotted.map(name => {
    const values = plot.samples.map(s => s.values[name]).filter((v): v is number => v !== undefined)
    return [name, valueScale(Math.min(...values), Math.max(...values), 3)]
  })), [plot, plotted])
  const sharedScale = useMemo(() => {
    const values = plot.samples.flatMap(s => visible.map(name => s.values[name]).filter((v): v is number => v !== undefined))
    return valueScale(Math.min(...values), Math.max(...values), 5)
  }, [plot, visible])
  const height = shared ? TOP + SHARED + AXIS : TOP + Math.max(1, visible.length) * (LANE + LANE_GAP) + AXIS
  const band = (name: string) => {
    if (shared) return { top: TOP, bottom: TOP + SHARED, scale: sharedScale }
    const index = visible.indexOf(name), top = TOP + index * (LANE + LANE_GAP)
    return { top, bottom: top + LANE, scale: ranges[name] }
  }
  const y = (name: string, value: number) => { const { top, bottom, scale } = band(name); return bottom - ((value - scale.low) / (scale.high - scale.low || 1)) * (bottom - top) }
  const path = (name: string) => {
    let d = '', pen = false
    for (const sample of plot.samples) {
      const value = sample.values[name]
      if (value === undefined) { pen = false; continue }
      d += `${pen ? 'L' : 'M'}${x(sample.timeUs).toFixed(1)} ${y(name, value).toFixed(1)}`
      pen = true
    }
    return d
  }
  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box || !plot.samples.length) return
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    if (px < GUTTER || px > GUTTER + PLOT) { setCursor(null); return }
    setCursor(nearest(plot.samples, ((px - GUTTER) / PLOT) * end))
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(plot)], { type: 'text/csv' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'projectcraft-serial.csv'; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!plot.samples.length) return <div className="signal-view"><p className="empty-result">
    {plot.lines ? `${plot.lines} serial lines received, none with numbers to plot.` : 'No serial output yet.'} Print one line per sample, for example <code>Serial.print(&quot;raw=&quot;); Serial.print(raw); Serial.print(&quot; duty=&quot;); Serial.println(duty);</code> Labels use <code>name:value</code> or <code>name=value</code>; bare numbers become value 1, value 2, …
  </p></div>

  const active = cursor !== null ? plot.samples[Math.min(cursor, plot.samples.length - 1)] : null
  const left = active ? x(active.timeUs) / WIDTH : 0
  return <div className="signal-view plotter">
    <div className="signal-toolbar">
      <div className="signal-chips" role="group" aria-label="Plotted series">{plotted.map(name => <button key={name} type="button" className="signal-chip plot-chip" aria-pressed={!hidden.has(name)} onClick={() => setHidden(current => { const next = new Set(current); if (next.has(name)) next.delete(name); else next.add(name); return next })}>
        <svg width="14" height="8" aria-hidden="true"><line x1="0" y1="4" x2="14" y2="4" stroke={slot(name)} strokeWidth="2" strokeLinecap="round" /></svg>{name}<span className="plot-latest">{last?.values[name] !== undefined ? format(last.values[name]) : '—'}</span></button>)}</div>
      <div className="signal-controls" role="group" aria-label="Plot layout">
        <button type="button" aria-pressed={!shared} onClick={() => setShared(false)} title="One lane per series, each with its own scale"><Rows3 size={14} />Lanes</button>
        <button type="button" aria-pressed={shared} onClick={() => setShared(true)} title="All series on one value axis"><Square size={14} />Shared axis</button>
        <button type="button" className="signal-export" onClick={download} title="Download every parsed sample as CSV"><Download size={14} />CSV</button>
      </div>
    </div>
    <p className="signal-summary">{plot.samples.length} samples from {plot.lines} serial lines · {formatTime(end)} simulated · x axis is emulated time when each line ended{plot.series.length > MAX_SERIES ? ` · ${plot.series.length - MAX_SERIES} more series only in the table and CSV` : ''}</p>
    <div className="signal-scroll plot-scroll" tabIndex={0} aria-label="Serial plot. Left and right arrows step through samples; Escape hides the readout." onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setCursor(current => Math.max(0, Math.min(plot.samples.length - 1, (current ?? plot.samples.length) + (event.key === 'ArrowLeft' ? -1 : 1)))) }
      else if (event.key === 'Escape') setCursor(null)
    }}>
      <div className="plot-frame">
        <svg ref={svg} viewBox={`0 0 ${WIDTH} ${height}`} className="signal-svg" role="img" aria-label={`Serial plot of ${visible.join(', ') || 'no series'}`} onPointerMove={point} onPointerLeave={() => setCursor(null)}>
          {(shared ? [visible[0]] : visible).filter(Boolean).map(name => {
            const { top, bottom, scale } = band(name)
            const ticks = shared ? scale.ticks : [scale.low, scale.high]
            return <g key={`axis-${name}`}>
              {ticks.map(t => { const ty = bottom - ((t - scale.low) / (scale.high - scale.low || 1)) * (bottom - top); return <g key={t}><line x1={GUTTER} x2={GUTTER + PLOT} y1={ty} y2={ty} className="signal-grid" /><text x={GUTTER - 6} y={ty + 3} textAnchor="end" className="signal-tick">{format(t)}</text></g> })}
              {!shared && <text x={GUTTER + PLOT + 8} y={top + 12} className="signal-label plot-name">{name}</text>}
            </g>
          })}
          {visible.map(name => <path key={name} d={path(name)} fill="none" stroke={slot(name)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
          {shared && visible.length <= 4 && last && visible.map(name => last.values[name] !== undefined && <text key={`label-${name}`} x={x(last.timeUs) + 6} y={y(name, last.values[name]) + 4} className="signal-label plot-name">{name}</text>)}
          <line x1={GUTTER} x2={GUTTER + PLOT} y1={height - AXIS} y2={height - AXIS} className="signal-guide" />
          {niceTicks(0, end, 6).map(t => <text key={t} x={x(t)} y={height - 8} textAnchor="middle" className="signal-tick">{formatTime(t, 2)}</text>)}
          {active && <g className="plot-crosshair"><line x1={x(active.timeUs)} x2={x(active.timeUs)} y1={TOP} y2={height - AXIS} />
            {visible.map(name => active.values[name] !== undefined && <circle key={name} cx={x(active.timeUs)} cy={y(name, active.values[name])} r="4" fill={slot(name)} className="plot-dot" />)}</g>}
        </svg>
        {active && <div className="plot-tooltip" role="status" style={left > 0.6 ? { right: `${(1 - left) * 100 + 1}%` } : { left: `${left * 100 + 1}%` }}>
          <div className="plot-tooltip-time">{formatTime(active.timeUs)}</div>
          {visible.map(name => <div key={name}><svg width="12" height="6" aria-hidden="true"><line x1="0" y1="3" x2="12" y2="3" stroke={slot(name)} strokeWidth="2" /></svg><strong>{active.values[name] !== undefined ? format(active.values[name]) : '—'}</strong><span>{name}</span></div>)}
        </div>}
      </div>
    </div>
    <details><summary>Table view · last {Math.min(100, plot.samples.length)} samples</summary><table><thead><tr><th scope="col">Simulation time</th>{plot.series.map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead>
      <tbody>{plot.samples.slice(-100).map((sample, i) => <tr key={i}><td>{formatTime(sample.timeUs)}</td>{plot.series.map(name => <td key={name}>{sample.values[name] !== undefined ? format(sample.values[name]) : ''}</td>)}</tr>)}</tbody></table></details>
  </div>
}
