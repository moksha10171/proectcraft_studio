import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeTrace } from '../features/execution/trace-summary'

test('capture comparison measures actual transitions and median rising intervals', () => {
  const capture = (period: number) => summarizeTrace([
    { timeUs: 0, pin: 'D13', value: 0 },
    { timeUs: 10, pin: 'D13', value: 1 },
    { timeUs: 10 + period / 2, pin: 'D13', value: 0 },
    { timeUs: 10 + period, pin: 'D13', value: 1 },
    { timeUs: 11 + period, pin: 'D13', value: 1 }, // duplicate level is not another edge
    { timeUs: 12 + period, serial: 'OK\n' },
  ])
  const slow = capture(2_000_000), fast = capture(1_000_000)
  assert.equal(slow.pins.D13.transitions, 3)
  assert.equal(slow.pins.D13.risingIntervalUs, 2_000_000)
  assert.equal(fast.pins.D13.risingIntervalUs, 1_000_000)
  assert.equal(fast.serial, 'OK\n')
  assert.equal(summarizeTrace([{ timeUs: 0, pin: 'D2', value: 1 }]).pins.D2.risingIntervalUs, null)
})
