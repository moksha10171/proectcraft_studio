import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { UnoEngine } from '../features/execution/avr-engine'
import { channelsOf, measure, niceTicks, toVcd, valueAt, windowEdges, formatTime, formatFrequency, comparePins } from '../features/execution/signal-analysis'
import type { TraceEvent } from '../features/project/types'

const wave = (pin: string, rises: number[], highUs: number, firstLevel?: 0 | 1): TraceEvent[] => [
  ...(firstLevel === undefined ? [] : [{ timeUs: 0, pin, value: firstLevel }]),
  ...rises.flatMap(t => [{ timeUs: t, pin, value: 1 }, { timeUs: t + highUs, pin, value: 0 }]),
]

test('measures period, frequency, duty cycle and pulse widths of a square wave', () => {
  const events = wave('D9', [100, 1100, 2100, 3100], 250, 0)
  const m = measure('D9', channelsOf(events).D9)
  assert.equal(m.cycles, 3)
  assert.equal(m.periodUs, 1000)
  assert.equal(m.frequencyHz, 1000)
  assert.equal(m.highUs, 250)
  assert.equal(m.lowUs, 750)
  assert.ok(Math.abs(m.dutyPercent! - 25) < 1e-9)
})

test('a level present when recording began is not treated as a rising edge', () => {
  // Starts high, falls, then rises once: no complete cycle can be measured.
  const m = measure('D2', channelsOf([{ timeUs: 0, pin: 'D2', value: 1 }, { timeUs: 50, pin: 'D2', value: 0 }, { timeUs: 150, pin: 'D2', value: 1 }]).D2)
  assert.equal(m.cycles, 0)
  assert.equal(m.periodUs, null)
  assert.equal(m.frequencyHz, null)
  assert.equal(m.dutyPercent, null)
  assert.equal(m.highUs, null, 'the opening high pulse has an unknown start')
  assert.equal(m.lowUs, 100, 'the low pulse between the observed fall and rise is fully measured')
  assert.equal(m.transitions, 2)
})

test('irregular pulses use the median and report whole-cycle duty', () => {
  const events = [{ timeUs: 0, pin: 'D3', value: 0 }, ...[100, 1100, 2300, 3300].flatMap((t, i) => [{ timeUs: t, pin: 'D3', value: 1 }, { timeUs: t + [200, 300, 400, 100][i], pin: 'D3', value: 0 }])]
  const m = measure('D3', channelsOf(events).D3)
  assert.equal(m.periodUs, 1000, 'intervals 1000, 1200, 1000 have a median of 1000')
  assert.equal(m.highUs, 250, 'median of the four complete high pulses 100, 200, 300, 400')
  assert.ok(Math.abs(m.dutyPercent! - 28.125) < 1e-9, 'high 200+300+400 µs over the 3200 µs between first and last rise')
})

test('channelsOf drops repeated levels and ignores serial events', () => {
  const channels = channelsOf([{ timeUs: 1, pin: 'D13', value: 1 }, { timeUs: 2, pin: 'D13', value: 1 }, { timeUs: 3, serial: 'x' }, { timeUs: 4, pin: 'D13', value: 0 }])
  assert.deepEqual(channels.D13, [{ timeUs: 1, value: 1 }, { timeUs: 4, value: 0 }])
})

test('valueAt and windowEdges select the visible levels', () => {
  const edges = channelsOf(wave('D4', [100, 300], 50, 0)).D4
  assert.equal(valueAt(edges, 99), 0)
  assert.equal(valueAt(edges, 120), 1)
  assert.equal(valueAt(edges, -1), null)
  const visible = windowEdges(edges, 110, 290)
  assert.deepEqual(visible.map(e => e.timeUs), [100, 150, 300], 'includes the entering level and the first edge past the window')
})

test('axis ticks are round numbers inside the window', () => {
  const ticks = niceTicks(0, 1_000_000)
  assert.ok(ticks.length >= 4 && ticks.length <= 12)
  assert.ok(ticks.every(t => t >= 0 && t <= 1_000_000))
  assert.ok(ticks.every(t => Math.abs(t / 100_000 - Math.round(t / 100_000)) < 1e-9 || Math.abs(t / 250_000 - Math.round(t / 250_000)) < 1e-9 || Math.abs(t / 200_000 - Math.round(t / 200_000)) < 1e-9))
  assert.deepEqual(niceTicks(5, 5), [5])
})

test('formatters choose readable units', () => {
  assert.equal(formatTime(1_500_000), '1.500 s')
  assert.equal(formatTime(2500), '2.500 ms')
  assert.equal(formatTime(4.25), '4.25 µs')
  assert.equal(formatTime(0), '0 s')
  assert.equal(formatFrequency(0.5), '0.500 Hz')
  assert.equal(formatFrequency(980.4), '980.4 Hz')
  assert.equal(formatFrequency(null), '—')
  assert.deepEqual(['D10', 'A0', 'D2'].sort(comparePins), ['D2', 'D10', 'A0'])
})

test('VCD export is well formed with monotonic nanosecond timestamps', () => {
  const vcd = toVcd([...wave('D13', [1000.0625], 500), ...wave('D9', [1000.0625, 2000], 100)].sort((a, b) => a.timeUs - b.timeUs), 5000)
  const lines = vcd.trim().split('\n')
  assert.ok(lines.includes('$timescale 1 ns $end'))
  assert.ok(lines.includes('$enddefinitions $end'))
  const vars = lines.filter(l => l.startsWith('$var'))
  assert.deepEqual(vars.map(l => l.split(' ')[4]), ['D9', 'D13'])
  const stamps = lines.filter(l => l.startsWith('#')).map(l => Number(l.slice(1)))
  assert.deepEqual(stamps, [...stamps].sort((a, b) => a - b), 'timestamps never go backwards')
  assert.equal(new Set(stamps).size, stamps.length, 'one marker per time')
  assert.ok(lines.includes('#1000063'), '1000.0625 µs rounds to the nearest nanosecond')
  assert.equal(stamps[stamps.length - 1], 5_000_000, 'ends at the recording length')
  assert.equal(lines.filter(l => l.startsWith('x')).length, 2, 'unknown levels before the first edge')
})

test('VCD export handles an empty recording and rejects too many channels', () => {
  const empty = toVcd([], 1234)
  assert.match(empty, /\$enddefinitions \$end/)
  assert.ok(!empty.includes('$var'))
  const many = Array.from({ length: 91 }, (_, i) => ({ timeUs: i, pin: `P${i}`, value: 1 }))
  assert.throws(() => toVcd(many, 100), /at most 90 channels/)
})

const fixturePath = process.env.PROJECTCRAFT_HEX_FIXTURE
test('real compiled Blink measures as a 0.5 Hz, 50 % duty signal on D13', { skip: !fixturePath }, () => {
  const engine = new UnoEngine(fs.readFileSync(fixturePath!, 'utf8'))
  const events: TraceEvent[] = []
  for (let i = 0; i < 520; i++) { engine.advance(160_000); events.push(...engine.drain()) }
  const m = measure('D13', channelsOf(events).D13)
  assert.ok(m.cycles >= 2, `expected at least two cycles, saw ${m.cycles}`)
  assert.ok(Math.abs(m.periodUs! - 2_000_000) < 10_000, `period ${m.periodUs}`)
  assert.ok(Math.abs(m.frequencyHz! - 0.5) < 0.01)
  assert.ok(Math.abs(m.dutyPercent! - 50) < 1, `duty ${m.dutyPercent}`)
})
