/**
 * Numbers printed over UART, parsed the way the Arduino Serial Plotter reads them: each complete line is
 * one sample; `label:value` (or `label=value`) pairs are named series, bare numbers are "value 1",
 * "value 2"... by position. Separators are spaces, tabs, commas or semicolons. Text is ignored.
 */
import type { TraceEvent } from '../project/types'

export interface PlotSample { timeUs: number; values: Record<string, number> }
export interface SerialPlot { samples: PlotSample[]; series: string[]; lines: number }

export const MAX_SAMPLES = 5000
const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/
const PAIR = /^([A-Za-z_][\w.-]*)[:=]([^:=]*)$/

export function parseLine(line: string): Record<string, number> {
  const tokens = line.trim().split(/[\s,;]+/).filter(Boolean)
  const values: Record<string, number> = {}
  let unlabeled = 0
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i]
    // "temp: 23.5" or "temp = 23.5": a label ending in a separator takes the next token as its value.
    if (/^[A-Za-z_][\w.-]*[:=]$/.test(token) && i + 1 < tokens.length && NUMBER.test(tokens[i + 1])) token += tokens[++i]
    else if (/^[A-Za-z_][\w.-]*$/.test(token) && (tokens[i + 1] === '=' || tokens[i + 1] === ':') && i + 2 < tokens.length && NUMBER.test(tokens[i + 2])) { token += ':' + tokens[i + 2]; i += 2 }
    const pair = PAIR.exec(token)
    if (pair) {
      if (NUMBER.test(pair[2])) values[pair[1]] = Number(pair[2])
    } else if (NUMBER.test(token)) values[`value ${++unlabeled}`] = Number(token)
  }
  return values
}

/** Samples from complete UART lines; each is stamped with the simulation time its newline was sent. */
export function serialPlot(events: TraceEvent[]): SerialPlot {
  const samples: PlotSample[] = [], series: string[] = [], seen = new Set<string>()
  let buffer = '', lines = 0
  for (const event of events) {
    if (!event.serial) continue
    for (const char of event.serial) {
      if (char !== '\n') { if (buffer.length < 2000) buffer += char; continue }
      lines++
      const values = parseLine(buffer.replace(/\r$/, ''))
      buffer = ''
      const names = Object.keys(values)
      if (!names.length) continue
      for (const name of names) if (!seen.has(name)) { seen.add(name); series.push(name) }
      samples.push({ timeUs: event.timeUs, values })
    }
  }
  return { samples: samples.slice(-MAX_SAMPLES), series, lines }
}

export function toCsv(plot: SerialPlot): string {
  const quote = (text: string) => /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  const rows = [['time_us', ...plot.series].map(quote).join(',')]
  for (const sample of plot.samples) rows.push([String(sample.timeUs), ...plot.series.map(name => sample.values[name] ?? '')].join(','))
  return rows.join('\n') + '\n'
}

/** Round axis bounds and ticks for a value range. */
export function valueScale(min: number, max: number, target = 4): { low: number; high: number; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { low: 0, high: 1, ticks: [0, 1] }
  if (min === max) { const pad = Math.abs(min) * 0.1 || 1; min -= pad; max += pad }
  const magnitude = 10 ** Math.floor(Math.log10((max - min) / target))
  // Of the round steps that keep at most target + 2 intervals, take the one that wastes the least range.
  const bounds = (step: number) => ({ step, low: Math.floor(min / step) * step, high: Math.ceil(max / step) * step })
  const { step, low, high } = [1, 2, 2.5, 5, 10, 20].map(m => bounds(m * magnitude))
    .filter(c => Math.round((c.high - c.low) / c.step) <= target + 2)
    .reduce((best, c) => c.high - c.low < best.high - best.low ? c : best)
  const ticks: number[] = []
  for (let t = low; t <= high + step * 1e-9; t += step) ticks.push(Number(t.toPrecision(12)))
  return { low, high, ticks }
}
