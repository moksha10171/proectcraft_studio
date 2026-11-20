import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { UnoEngine } from '../features/execution/avr-engine'
import { PythonEngine, type PyodideLoader } from '../features/execution/python-engine'
import { runBatch } from '../features/execution/batch'
import { channelsOf, measure } from '../features/execution/signal-analysis'
import { analogInputs, buttonInputs } from '../features/circuit/graph'
import type { Circuit } from '../features/project/types'

const dimmerPath = process.env.PROJECTCRAFT_DIMMER_HEX_FIXTURE
const require = createRequire(import.meta.url)
const load: PyodideLoader = async () => (await import('pyodide')).loadPyodide({ indexURL: path.dirname(require.resolve('pyodide/package.json')) }) as never

test('a batch run of real dimmer firmware is unpaced and measures the PWM', { skip: !dimmerPath }, () => {
  const circuit: Circuit = { parts: [{ id: 'pot1', kind: 'potentiometer', label: 'Pot', x: 0, y: 0, value: '' }], nets: [
    { id: 's', label: '', terminals: ['board:5V', 'pot1:2'] }, { id: 'g', label: '', terminals: ['board:GND', 'pot1:1'] }, { id: 'w', label: '', terminals: ['board:A0', 'pot1:W'] }] }
  const run = (position: number) => {
    const engine = new UnoEngine(fs.readFileSync(dimmerPath!, 'utf8'))
    for (const [channel, volts] of Object.entries(analogInputs(circuit, { pot1: position }))) engine.analog(Number(channel), volts)
    const started = performance.now()
    const result = runBatch(engine, 5)
    return { result, wallMs: performance.now() - started }
  }
  const { result, wallMs } = run(0.25)
  assert.ok(result.durationUs >= 5_000_000 && result.durationUs < 5_000_100, `duration ${result.durationUs}`)
  // Typically 2-5x real time; the bound only catches an accidental real-time pacing loop or a gross slowdown on a busy machine.
  assert.ok(wallMs < 10_000, `5 simulated seconds took ${wallMs.toFixed(0)} ms`)
  const d9 = measure('D9', channelsOf(result.events).D9)
  assert.ok(Math.abs(d9.frequencyHz! - 490.2) < 1)
  assert.ok(Math.abs(d9.dutyPercent! - 25) < 1.5, `duty ${d9.dutyPercent}`)
  assert.match(result.events.map(e => e.serial || '').join(''), /raw=256 duty=63/)
  assert.ok(result.events.some(e => e.pin === 'A0' && e.volts === 1.25), 'the stimulus is in the trace')
  assert.ok(result.events.length <= 10_000)
  assert.ok(result.events.every((e, i) => i === 0 || e.timeUs >= result.events[i - 1].timeUs), 'trace is time-ordered')
})

test('a held button is applied before the first step', { timeout: 120_000 }, async () => {
  const circuit: Circuit = { parts: [{ id: 'button1', kind: 'button', label: 'B', x: 0, y: 0, value: '' }], nets: [
    { id: 'i', label: '', terminals: ['board:GPIO2', 'button1:1'] }, { id: 'g', label: '', terminals: ['board:GND', 'button1:2'] }] }
  const source = 'from gpiozero import LED, Button\nfrom signal import pause\nled = LED(17)\nb = Button(2)\nb.when_pressed = led.on\nb.when_released = led.off\nprint("ready")\npause()\n'
  const run = async (hold: string[]) => {
    const engine = await PythonEngine.create([{ name: 'main.py', content: source }], load, buttonInputs(circuit, new Set(hold)))
    return runBatch(engine, 2)
  }
  const released = await run([]), held = await run(['button1'])
  assert.ok(!released.events.some(e => e.pin === 'GPIO17' && e.value === 1))
  assert.ok(held.events.some(e => e.pin === 'GPIO17' && e.value === 1), 'the callback lit the LED')
  assert.ok(held.events.some(e => e.pin === 'GPIO2' && e.value === 0))
  assert.equal(held.events.filter(e => e.serial).map(e => e.serial).join(''), 'ready\n')
  assert.equal(held.notice, undefined, 'the script is still waiting at 2 s, so there is nothing to report')
})
