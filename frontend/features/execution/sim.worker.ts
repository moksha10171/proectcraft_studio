/// <reference lib="webworker" />
import type { Engine } from './engine'
import { UnoEngine } from './avr-engine'
import { PythonEngine, type PyodideLike } from './python-engine'
import { runBatch } from './batch'

let engine: Engine | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let running = false
// Inputs that arrive while an engine is still starting (the Python interpreter takes seconds) are applied once it is ready.
const waitingInputs = new Map<number, boolean>(), waitingAnalog = new Map<number, number>()
let generation = 0 // Bumped on every load/stop so a slow interpreter start cannot resurrect a stopped run.
function stop() { running = false; generation++; if (timer) clearTimeout(timer); timer = undefined }
function tick() {
  if (!running || !engine) return
  try {
    const started = performance.now()
    engine.run(10_000) // Simulation advances by simulated time, never React frames.
    postMessage({ type: 'frame', timeUs: engine.timeUs, states: engine.states, levels: engine.levels(), events: engine.drain(), dropped: engine.dropped, notice: engine.notice })
    timer = setTimeout(tick, Math.max(0, 10 - (performance.now() - started)))
  } catch (error) { stop(); postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Emulation failed' }) }
}
/** Pyodide is served from /pyodide (copied from the npm package at build time), not bundled into the worker. */
async function loadInterpreter(): Promise<PyodideLike> {
  const url = `${self.location.origin}/pyodide/pyodide.mjs`
  const runtime = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
  return runtime.loadPyodide({ indexURL: `${self.location.origin}/pyodide/` })
}
async function create(data: { board?: string; hex?: string; files?: { name: string; content: string }[]; inputs?: Record<string, boolean> }): Promise<Engine> {
  if (data.board === 'pi4') {
    postMessage({ type: 'status', message: 'Starting the Python interpreter…' })
    const inputs = Object.fromEntries(Object.entries(data.inputs || {}).map(([pin, high]) => [pin, Boolean(high)]))
    return PythonEngine.create(data.files || [], loadInterpreter, inputs)
  }
  const uno = new UnoEngine(data.hex || '')
  for (const [pin, high] of Object.entries(data.inputs || {})) uno.input(Number(pin), Boolean(high))
  return uno
}
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      stop(); engine = null; waitingInputs.clear(); waitingAnalog.clear(); const mine = generation
      const created = await create(data)
      if (mine !== generation) return // Stopped while starting.
      engine = created
      for (const [pin, high] of waitingInputs) engine.input(pin, high)
      waitingInputs.clear()
      for (const [channel, volts] of Object.entries(data.analog || {})) engine.analog?.(Number(channel), Number(volts))
      for (const [channel, volts] of waitingAnalog) engine.analog?.(channel, volts)
      waitingAnalog.clear()
      if (typeof data.batchSeconds === 'number') { // Headless run for the assistant: no pacing, one result message.
        postMessage({ type: 'batch', ...runBatch(engine, data.batchSeconds) }); engine = null; return
      }
      running = true; postMessage({ type: 'started' }); tick()
    } else if (data.type === 'input') { if (engine) engine.input(data.pin, data.high); else waitingInputs.set(data.pin, data.high) }
    else if (data.type === 'analog') { if (engine) engine.analog?.(data.channel, data.volts); else waitingAnalog.set(data.channel, data.volts) }
    else if (data.type === 'pause') stop()
    else if (data.type === 'resume' && engine && !running) { running = true; tick() }
    else if (data.type === 'stop') { stop(); engine = null; postMessage({ type: 'stopped' }) }
  } catch (error) { stop(); postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Invalid firmware' }) }
}
