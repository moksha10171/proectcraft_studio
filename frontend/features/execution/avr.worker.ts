/// <reference lib="webworker" />
import { UnoEngine } from './avr-engine'

let engine: UnoEngine | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let running = false
function stop() { running = false; if (timer) clearTimeout(timer); timer = undefined }
function tick() {
  if (!running || !engine) return
  try {
    const started = performance.now()
    engine.advance(160_000) // Simulation advances by CPU cycles, never React frames.
    postMessage({ type: 'frame', timeUs: engine.timeUs, states: engine.states, events: engine.drain(), dropped: engine.dropped })
    timer = setTimeout(tick, Math.max(0, 10 - (performance.now() - started)))
  } catch (error) { stop(); postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Emulation failed' }) }
}
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'load') {
      stop(); engine = new UnoEngine(data.hex)
      for (const [pin, high] of Object.entries(data.inputs || {})) engine.input(Number(pin), Boolean(high))
      running = true; tick()
    } else if (data.type === 'input' && engine) engine.input(data.pin, data.high)
    else if (data.type === 'pause') stop()
    else if (data.type === 'resume' && engine && !running) { running = true; tick() }
    else if (data.type === 'stop') { stop(); engine = null; postMessage({ type: 'stopped' }) }
  } catch (error) { stop(); postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Invalid firmware' }) }
}
