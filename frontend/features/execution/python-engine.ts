/**
 * Raspberry Pi Python adapter: runs the user's script in Pyodide against a simulated RPi.GPIO/gpiozero
 * on a virtual clock (see pi-shim.ts), then replays the recorded pin activity as simulated time advances.
 *
 * The run is a pure function of (files, input timeline). When an input changes during replay the script is
 * run again with that input applied at the current playhead; everything before the playhead is identical
 * by determinism, so the user sees the program react without the interpreter ever being paused.
 */
import type { TraceEvent } from '../project/types'
import type { Engine } from './engine'
import { PI_SHIM } from './pi-shim'

export interface PyodideLike {
  runPython(code: string): unknown
  FS: { writeFile(path: string, data: string): void; mkdirTree?(path: string): void }
  globals: { get(name: string): (arg: string) => string }
}
export type PyodideLoader = () => Promise<PyodideLike>
export interface PythonFile { name: string; content: string }

type Raw = ['p', number, string, number] | ['s', number, string] | ['d', number, string, number | null]
interface Outcome { events: Raw[]; endUs: number; ended: boolean; error: string | null; truncated: boolean }

export const MAX_SIM_SECONDS = 30
const RETAINED = 4000 // Per drain window, matching the Uno adapter's buffer.

export class PythonEngine implements Engine {
  readonly states: Record<string, number> = {}
  dropped = 0
  notice?: string
  timeUs = 0
  private events: Raw[] = []
  private cursor = 0
  private outcome!: Outcome
  private timeline: [number, number, boolean][] = []
  private duty: Record<string, number> = {}
  private pending: TraceEvent[] = []
  private windowHigh: Record<string, number> = {}
  private windowStart = 0
  private noticed = false

  private constructor(private pyodide: PyodideLike, private main: string, private maxUs: number) {}

  static async create(files: PythonFile[], load: PyodideLoader, inputs: Record<number, boolean> = {}, maxSeconds = MAX_SIM_SECONDS): Promise<PythonEngine> {
    const py = files.filter(f => f.name.endsWith('.py'))
    if (!py.length) throw new Error('No Python file to run')
    const pyodide = await load()
    const main = py.find(f => f.name === 'main.py')?.name ?? py[0].name
    for (const file of py) {
      const parts = file.name.split('/')
      if (parts.length > 1) pyodide.FS.mkdirTree?.(`/home/pyodide/${parts.slice(0, -1).join('/')}`)
      pyodide.FS.writeFile(`/home/pyodide/${file.name}`, file.content)
    }
    pyodide.runPython(PI_SHIM)
    const engine = new PythonEngine(pyodide, main, maxSeconds * 1e6)
    for (const [pin, high] of Object.entries(inputs)) engine.timeline.push([0, Number(pin), Boolean(high)])
    engine.simulate()
    engine.deliver(0) // Events at t = 0 (initial pin levels) are part of the first frame.
    return engine
  }

  private simulate() {
    const args = JSON.stringify({ main: this.main, limitUs: this.maxUs, inputs: this.timeline })
    const text = this.pyodide.globals.get('__run')(args)
    this.outcome = JSON.parse(text) as Outcome
    this.events = this.outcome.events
  }

  /** Events at or before `until`, once. */
  private deliver(until: number) {
    while (this.cursor < this.events.length && this.events[this.cursor][1] <= until) {
      const event = this.events[this.cursor++]
      this.accumulate(event[1])
      if (event[0] === 'p') {
        this.states[event[2]] = event[3]
        this.push({ timeUs: event[1], pin: event[2], value: event[3] })
      } else if (event[0] === 's') this.push({ timeUs: event[1], serial: event[2] })
      else if (event[3] === null) delete this.duty[event[2]]
      else this.duty[event[2]] = event[3] / 100
    }
  }
  private lastEdge = 0
  /** Credit time-high to every pin that is high, up to t. */
  private accumulate(t: number) {
    for (const [pin, value] of Object.entries(this.states)) if (value === 1) this.windowHigh[pin] = (this.windowHigh[pin] || 0) + (t - Math.max(this.lastEdge, this.windowStart))
    this.lastEdge = t
  }
  private push(event: TraceEvent) {
    if (this.pending.length < RETAINED) this.pending.push(event)
    else this.dropped++
  }

  run(us: number) {
    this.timeUs += us
    this.deliver(this.timeUs)
    if (!this.noticed && this.timeUs >= this.outcome.endUs && (this.outcome.ended || this.outcome.error)) {
      this.noticed = true
      this.notice = this.outcome.error ? `The script stopped with an error: ${this.outcome.error}` : 'The script finished. Pin levels stay as the script left them.'
    } else if (!this.noticed && this.timeUs >= this.outcome.endUs) {
      this.noticed = true
      this.notice = `Simulation stopped at the ${this.maxUs / 1e6} s limit; a script that never ends is cut off there.`
    }
  }

  drain() { const out = this.pending; this.pending = []; return out }

  levels(): Record<string, number> {
    this.accumulate(this.timeUs)
    const span = this.timeUs - this.windowStart
    const result: Record<string, number> = {}
    if (span > 0) for (const pin of Object.keys(this.states)) result[pin] = pin in this.duty ? this.duty[pin] : Math.min(1, (this.windowHigh[pin] || 0) / span)
    this.windowHigh = {}
    this.windowStart = this.timeUs
    this.lastEdge = this.timeUs
    return result
  }

  input(pin: number, high: boolean) {
    if (!Number.isInteger(pin) || pin < 2 || pin > 27) throw new Error('Unsupported GPIO input')
    const last = this.timeline.filter(item => item[1] === pin).at(-1)
    if (last ? last[2] === high : high) return // No change from what the script already saw.
    // Applied 1 µs after the playhead so every event up to the playhead is identical in the new run.
    this.timeline.push([Math.round(this.timeUs) + 1, pin, high])
    this.simulate()
    this.cursor = this.events.findIndex(event => event[1] > this.timeUs)
    if (this.cursor < 0) this.cursor = this.events.length
    this.noticed = false
    this.notice = undefined
    this.deliver(this.timeUs)
  }
}
