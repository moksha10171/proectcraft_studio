'use client'
import { useState } from 'react'
import type { Run } from '../project/types'
import { summarizeTrace } from './trace-summary'

export function CompareRuns({ runs }: { runs: Run[] }) {
  const captures = runs.filter(run => run.trace?.length)
  const [leftId, setLeft] = useState(''), [rightId, setRight] = useState('')
  if (captures.length < 2) return <p className="empty-result">Save two captures to compare GPIO timing and serial output. Imported captures are reference observations.</p>
  const left = captures.find(run => run.id === leftId) || captures[0]
  const right = captures.find(run => run.id === rightId) || captures[1]
  const a = summarizeTrace(left.trace!), b = summarizeTrace(right.trace!)
  const pins = [...new Set([...Object.keys(a.pins), ...Object.keys(b.pins)])].sort()
  const choose = (label: string, value: string, onChange: (id: string) => void) => <label>{label}<select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{captures.map(run => <option key={run.id} value={run.id}>{run.origin} · rev {run.sourceRevision} · {run.id.slice(0, 8)}</option>)}</select></label>
  const duty = (n: number | null | undefined) => n == null ? '—' : `${n.toFixed(1)} %`
  const interval = (n: number | null | undefined) => n == null ? '—' : `${(n / 1000).toFixed(2)} ms`
  return <div className="run-comparison"><div className="signal-toolbar">{choose('Reference capture', left.id, setLeft)}{choose('Comparison capture', right.id, setRight)}</div>
    <p>{left.boardId} / {left.engine} ↔ {right.boardId} / {right.engine}. Durations: {(left.durationMs / 1000).toFixed(3)} s / {(right.durationMs / 1000).toFixed(3)} s.</p>
    {(left.dropped || right.dropped) ? <p className="warning-note">A recording dropped events. Counts and intervals describe retained observations only.</p> : null}
    <table><thead><tr><th>Signal</th><th>Reference transitions</th><th>Comparison transitions</th><th>Reference rising interval</th><th>Comparison rising interval</th><th>Reference duty</th><th>Comparison duty</th></tr></thead><tbody>{pins.map(pin => <tr key={pin}><th>{pin}</th><td>{a.pins[pin]?.transitions || 0}</td><td>{b.pins[pin]?.transitions || 0}</td><td>{interval(a.pins[pin]?.risingIntervalUs)}</td><td>{interval(b.pins[pin]?.risingIntervalUs)}</td><td>{duty(a.pins[pin]?.dutyPercent)}</td><td>{duty(b.pins[pin]?.dutyPercent)}</td></tr>)}</tbody></table>
    <details><summary>Compare captured UART text</summary><div className="capture-text"><pre>{a.serial || '(no UART output)'}</pre><pre>{b.serial || '(no UART output)'}</pre></div></details>
    <p className="muted">Median interval between retained rising edges and duty cycle across whole cycles; — means fewer than two observed rises. Captures may have different durations or inputs. This comparison does not establish electrical correctness or physical hardware behavior.</p>
  </div>
}
