import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { createRequire } from 'node:module'
import { PythonEngine, type PyodideLoader } from '../features/execution/python-engine'
import { channelsOf, measure } from '../features/execution/signal-analysis'
import type { TraceEvent } from '../features/project/types'

const require = createRequire(import.meta.url)
const indexURL = path.dirname(require.resolve('pyodide/package.json'))
let shared: Promise<unknown> | undefined
// Loading the interpreter takes a few seconds; every test shares one instance (each run reinstalls the shim).
const load: PyodideLoader = async () => {
  shared ||= import('pyodide').then(m => m.loadPyodide({ indexURL }))
  return (await shared) as Awaited<ReturnType<PyodideLoader>>
}

async function simulate(source: string, seconds: number, inputs: Record<number, boolean> = {}, maxSeconds = 30) {
  const engine = await PythonEngine.create([{ name: 'main.py', content: source }], load, inputs, maxSeconds)
  const events: TraceEvent[] = []
  for (let t = 0; t < seconds * 1e6; t += 10_000) { engine.run(10_000); events.push(...engine.drain()) }
  return { engine, events, serial: events.map(e => e.serial || '').join('') }
}

test('RPi.GPIO blink toggles on a virtual clock: 0.5 Hz, 50 %, no wall-clock wait', { timeout: 120_000 }, async () => {
  const started = Date.now()
  const { events, serial } = await simulate(`
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)
for i in range(6):
    GPIO.output(17, GPIO.HIGH); print("on", i); time.sleep(1)
    GPIO.output(17, GPIO.LOW); time.sleep(1)
`, 13)
  const m = measure('GPIO17', channelsOf(events).GPIO17)
  assert.ok(Math.abs(m.frequencyHz! - 0.5) < 1e-6, `frequency ${m.frequencyHz}`)
  assert.ok(Math.abs(m.dutyPercent! - 50) < 1e-6)
  assert.equal(serial, 'on 0\non 1\non 2\non 3\non 4\non 5\n')
  assert.ok(Date.now() - started < 60_000)
})

test('gpiozero LED.blink runs in the background and Button callbacks react to input', { timeout: 120_000 }, async () => {
  const { events, engine } = await simulate(`
from gpiozero import LED, Button
from signal import pause
led = LED(18, initial_value=False)
button = Button(2)
button.when_pressed = led.on
button.when_released = led.off
pause()
`, 1, { 2: true })
  assert.equal(engine.states.GPIO2, 1, 'pull-up input reads high when the button is open')
  assert.equal(engine.states.GPIO18, 0)
  engine.input(2, false) // button to ground
  engine.run(10_000)
  assert.equal(engine.states.GPIO18, 1, 'when_pressed turned the LED on')
  engine.run(500_000)
  engine.input(2, true)
  engine.run(10_000)
  assert.equal(engine.states.GPIO18, 0)
  const all = [...events, ...engine.drain()]
  assert.ok(all.some(e => e.pin === 'GPIO2' && e.value === 0), 'the pressed level is part of the trace')
})

test('software PWM reports duty and edges at the requested frequency', { timeout: 120_000 }, async () => {
  const { events, engine } = await simulate(`
import RPi.GPIO as GPIO, time
GPIO.setmode(GPIO.BCM); GPIO.setup(12, GPIO.OUT)
p = GPIO.PWM(12, 100); p.start(25)
time.sleep(1)
p.ChangeDutyCycle(75)
time.sleep(1)
`, 2)
  const edges = channelsOf(events).GPIO12
  const m = measure('GPIO12', edges.filter(e => e.timeUs < 1_000_000))
  assert.ok(Math.abs(m.frequencyHz! - 100) < 0.5, `frequency ${m.frequencyHz}`)
  assert.ok(Math.abs(m.dutyPercent! - 25) < 1, `duty ${m.dutyPercent}`)
  const late = measure('GPIO12', edges.filter(e => e.timeUs > 1_100_000 && e.timeUs < 1_900_000))
  assert.ok(Math.abs(late.dutyPercent! - 75) < 1.5, `duty ${late.dutyPercent}`)
  assert.equal(engine.levels().GPIO12, 0.75, "PWM pins report their duty directly")
})

test('real library errors surface as a traceback and a notice', { timeout: 120_000 }, async () => {
  const { serial, engine } = await simulate(`
import RPi.GPIO as GPIO
GPIO.setup(17, GPIO.OUT)
`, 1)
  assert.match(serial, /Traceback \(most recent call last\):/)
  assert.match(serial, /GPIO\.setup\(17, GPIO\.OUT\)/)
  assert.match(serial, /RuntimeError: Please set pin numbering mode/)
  assert.match(engine.notice || '', /stopped with an error/)
  const wrong = await simulate('import RPi.GPIO as GPIO\nGPIO.setmode(GPIO.BCM)\nGPIO.output(5, 1)\n', 1)
  assert.match(wrong.serial, /has not been set up as an OUTPUT/)
})

test('endless scripts are cut off at the simulation limit and the notice says so', { timeout: 120_000 }, async () => {
  const { engine, events } = await simulate('import time\nwhile True:\n    time.sleep(0.5)\n', 5, {}, 2)
  assert.match(engine.notice || '', /2 s limit/)
  assert.ok(events.length === 0)
  const busy = await simulate('import time\nwhile time.time() < 1.7e9 + 100:\n    pass\n', 1, {}, 1)
  assert.ok(busy.engine, 'busy-waiting on the clock terminates')
})
