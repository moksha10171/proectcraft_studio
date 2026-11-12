/** Pure helpers for inspecting recorded digital traces: edges, measurements, axis ticks and VCD export. */
import type { TraceEvent } from '../project/types'

export interface Edge { timeUs: number; value: 0 | 1 }
export interface Measurement {
  pin: string
  transitions: number
  /** Complete rising-edge to rising-edge cycles observed. */
  cycles: number
  periodUs: number | null
  frequencyHz: number | null
  /** Share of time spent high between the first and last rising edge. */
  dutyPercent: number | null
  highUs: number | null
  lowUs: number | null
}

const pinOrder = (pin: string) => {
  const match = /^([DA])(\d+)$/.exec(pin)
  return match ? (match[1] === 'D' ? 0 : 1000) + Number(match[2]) : 2000
}
export const comparePins = (a: string, b: string) => pinOrder(a) - pinOrder(b) || a.localeCompare(b)

/** Group pin events by channel, dropping repeated levels so every entry is a real edge. */
export function channelsOf(events: TraceEvent[]): Record<string, Edge[]> {
  const channels: Record<string, Edge[]> = {}
  for (const event of events) {
    if (!event.pin || event.value == null) continue
    const value = event.value ? 1 : 0
    const edges = channels[event.pin] ||= []
    if (edges.length && edges[edges.length - 1].value === value) continue
    edges.push({ timeUs: event.timeUs, value })
  }
  return channels
}

export function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Measure a channel from its retained edges. A rising edge only counts when the previous level was
 * observed low, so a level that was merely present when recording began does not distort the period.
 */
export function measure(pin: string, edges: Edge[]): Measurement {
  const rises: number[] = [], highs: number[] = [], lows: number[] = []
  let highTotal = 0
  for (let i = 1; i < edges.length; i++) {
    const previous = edges[i - 1], edge = edges[i]
    if (edge.value === 1) {
      rises.push(edge.timeUs)
      if (i >= 2) lows.push(edge.timeUs - previous.timeUs)
    } else if (i >= 2) {
      // The pulse being closed started at an observed rising edge (edges[i - 1], preceded by a low).
      highs.push(edge.timeUs - previous.timeUs)
    }
  }
  // Duty cycle over whole cycles: first rise → last rise.
  if (rises.length >= 2) {
    const start = rises[0], end = rises[rises.length - 1]
    for (let i = 0; i + 1 < edges.length; i++) {
      if (edges[i].value !== 1) continue
      const from = Math.max(edges[i].timeUs, start), to = Math.min(edges[i + 1].timeUs, end)
      if (to > from) highTotal += to - from
    }
    const span = end - start
    const intervals = rises.slice(1).map((time, index) => time - rises[index])
    const periodUs = median(intervals)
    return {
      pin, transitions: Math.max(0, edges.length - 1), cycles: intervals.length, periodUs,
      frequencyHz: periodUs && periodUs > 0 ? 1e6 / periodUs : null,
      dutyPercent: span > 0 ? Math.min(100, (highTotal / span) * 100) : null,
      highUs: median(highs), lowUs: median(lows),
    }
  }
  return { pin, transitions: Math.max(0, edges.length - 1), cycles: 0, periodUs: null, frequencyHz: null, dutyPercent: null, highUs: median(highs), lowUs: median(lows) }
}

/** Level at a given time, or null before the first recorded edge. */
export function valueAt(edges: Edge[], timeUs: number): 0 | 1 | null {
  let level: 0 | 1 | null = null
  for (const edge of edges) { if (edge.timeUs > timeUs) break; level = edge.value }
  return level
}

export function formatTime(us: number, digits = 3): string {
  if (us === 0) return '0 s'
  const abs = Math.abs(us)
  if (abs >= 1e6) return `${(us / 1e6).toFixed(digits)} s`
  if (abs >= 1e3) return `${(us / 1e3).toFixed(digits)} ms`
  return `${us.toFixed(abs < 10 ? 2 : 1)} µs`
}

export function formatFrequency(hz: number | null): string {
  if (hz == null) return '—'
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`
  return `${hz.toFixed(hz < 10 ? 3 : 1)} Hz`
}

/** Round, human-friendly tick positions for the visible window. */
export function niceTicks(startUs: number, endUs: number, target = 8): number[] {
  const span = endUs - startUs
  if (!(span > 0)) return [startUs]
  const rough = span / target, magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= rough) || 10 * magnitude
  const ticks: number[] = []
  for (let t = Math.ceil(startUs / step) * step; t <= endUs + step * 1e-9; t += step) ticks.push(Number(t.toPrecision(12)))
  return ticks
}

/** Edges needed to draw [start, end]: the level entering the window plus every edge inside it. */
export function windowEdges(edges: Edge[], startUs: number, endUs: number): Edge[] {
  let first = 0
  while (first < edges.length && edges[first].timeUs < startUs) first++
  const out = edges.slice(Math.max(0, first - 1))
  const last = out.findIndex(e => e.timeUs > endUs)
  return last < 0 ? out : out.slice(0, last + 1)
}

/**
 * Value Change Dump for GTKWave, PulseView/sigrok and other waveform viewers. Times are integer
 * nanoseconds (the AVR clock period of 62.5 ns is not an integer number of microseconds).
 * Levels before a pin's first recorded edge are written as unknown (x).
 */
export function toVcd(events: TraceEvent[], endUs: number, pins?: string[]): string {
  const channels = channelsOf(events)
  const names = (pins || Object.keys(channels)).filter(pin => channels[pin]?.length).sort(comparePins)
  const ids = new Map(names.map((pin, index) => [pin, String.fromCharCode(33 + index)]))
  if (names.length > 90) throw new Error('VCD export supports at most 90 channels')
  const lines = ['$version ProjectCraft Studio $end', '$comment Digital pin changes recorded from the Uno emulator. UART text is not included. $end', '$timescale 1 ns $end', '$scope module board $end']
  for (const pin of names) lines.push(`$var wire 1 ${ids.get(pin)} ${pin} $end`)
  lines.push('$upscope $end', '$enddefinitions $end', '#0', '$dumpvars')
  for (const pin of names) lines.push(`x${ids.get(pin)}`)
  lines.push('$end')
  const changes: { ns: number; line: string }[] = []
  for (const pin of names) for (const edge of channels[pin]) changes.push({ ns: Math.round(edge.timeUs * 1000), line: `${edge.value}${ids.get(pin)}` })
  changes.sort((a, b) => a.ns - b.ns)
  let emitted = 0 // Last timestamp written; VCD time never goes backwards.
  for (const change of changes) {
    const ns = Math.max(change.ns, emitted)
    if (ns > emitted) { lines.push(`#${ns}`); emitted = ns }
    lines.push(change.line)
  }
  const finalNs = Math.max(Math.round(endUs * 1000), emitted)
  if (finalNs > emitted) lines.push(`#${finalNs}`)
  return lines.join('\n') + '\n'
}
