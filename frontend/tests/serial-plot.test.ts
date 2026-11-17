import assert from 'node:assert/strict'
import test from 'node:test'
import { parseLine, serialPlot, toCsv, valueScale } from '../features/execution/serial-plot'
import type { TraceEvent } from '../features/project/types'

const uart = (chunks: [number, string][]): TraceEvent[] => chunks.map(([timeUs, serial]) => ({ timeUs, serial }))

test('lines follow Arduino Serial Plotter conventions', () => {
  assert.deepEqual(parseLine('raw=512 duty=127'), { raw: 512, duty: 127 })
  assert.deepEqual(parseLine('temp:23.5,humidity:40'), { temp: 23.5, humidity: 40 })
  assert.deepEqual(parseLine('temp: -4.25\tlight = 1e3'), { temp: -4.25, light: 1000 })
  assert.deepEqual(parseLine('12 34.5;-7'), { 'value 1': 12, 'value 2': 34.5, 'value 3': -7 })
  assert.deepEqual(parseLine('LED on'), {})
  assert.deepEqual(parseLine('state=on count=3'), { count: 3 }, 'non-numeric values are ignored')
  assert.deepEqual(parseLine('Reading 42 ok'), { 'value 1': 42 })
})

test('each complete line becomes one sample stamped when its newline was sent', () => {
  const plot = serialPlot(uart([[100, 'raw=5'], [200, '12 duty=127\r'], [300, '\n'], [400, 'LED on\n'], [500, 'raw=1023 duty=255\nraw=9']]))
  assert.equal(plot.lines, 3)
  assert.deepEqual(plot.series, ['raw', 'duty'])
  assert.deepEqual(plot.samples, [{ timeUs: 300, values: { raw: 512, duty: 127 } }, { timeUs: 500, values: { raw: 1023, duty: 255 } }])
})

test('csv lists every series with blanks for missing values', () => {
  const plot = serialPlot(uart([[10, 'a=1\n'], [20, 'b=2.5\n'], [30, 'say "hi",x=3\n']]))
  assert.equal(toCsv(plot), 'time_us,a,b,x\n10,1,,\n20,,2.5,\n30,,,3\n')
})

test('value scales are rounded and include the data', () => {
  assert.deepEqual(valueScale(0, 1023, 3), { low: 0, high: 1250, ticks: [0, 250, 500, 750, 1000, 1250] })
  assert.deepEqual(valueScale(0, 1023, 5).ticks, [0, 200, 400, 600, 800, 1000, 1200])
  assert.deepEqual(valueScale(-0.3, 4.7, 4).ticks, [-1, 0, 1, 2, 3, 4, 5])
  const flat = valueScale(5, 5)
  assert.ok(flat.low < 5 && flat.high > 5)
  assert.deepEqual(valueScale(Infinity, -Infinity), { low: 0, high: 1, ticks: [0, 1] })
})
