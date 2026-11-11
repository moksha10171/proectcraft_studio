'use client'
import { useMemo, useState } from 'react'
import type { TraceEvent } from '../project/types'
export function Signals({ events, timeUs, dropped }: { events: TraceEvent[]; timeUs: number; dropped: number }) {
  const pins = [...new Set(['D13', ...events.flatMap(e => e.pin ? [e.pin] : [])])]
  const [pin, setPin] = useState('D13')
  const transitions = useMemo(() => events.filter(e => e.pin === pin), [events, pin])
  const range = Math.max(timeUs, 1)
  const commands = ['M40 94']
  for (const event of transitions) {
    const x = 40 + event.timeUs / range * 900, y = event.value ? 30 : 94
    commands.push(`H${x} V${y}`)
  }
  commands.push('H940')
  return <div className="signal-view"><div className="signal-toolbar"><label>Probe <select aria-label="Signal pin" value={pin} onChange={e => setPin(e.target.value)}>{pins.map(p => <option key={p}>{p}</option>)}</select></label><span>{(timeUs / 1e6).toFixed(3)} s simulated · {events.length} retained events</span></div>
    <svg viewBox="0 0 1000 132" role="img" aria-label={`${pin} digital waveform, ${transitions.length} transitions`}><text x="5" y="34">1</text><text x="5" y="98">0</text><path d="M40 30H940 M40 94H940" className="signal-guide" /><path d={commands.join(' ')} className="signal-line" /><text x="40" y="125">0 s</text><text x="845" y="125">{(timeUs / 1e6).toFixed(3)} s</text></svg>
    {dropped > 0 && <p className="warning-note">Recording buffer limit reached: {dropped} events were not retained. Exported traces include this count.</p>}
    <details><summary>Accessible event table · {transitions.length} transitions</summary><table><thead><tr><th>Simulation time</th><th>Pin</th><th>Value</th></tr></thead><tbody>{transitions.slice(-100).map((event, i) => <tr key={i}><td>{event.timeUs.toFixed(2)} µs</td><td>{event.pin}</td><td>{event.value}</td></tr>)}</tbody></table></details>
    {!events.length && <p className="empty-result">Build and run the Uno example to inspect real GPIO transitions.</p>}
  </div>
}
