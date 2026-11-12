import type { TraceEvent } from '../project/types'
import { channelsOf, measure } from './signal-analysis'

export function summarizeTrace(events: TraceEvent[]) {
  const pins: Record<string, { transitions: number; risingIntervalUs: number | null; dutyPercent: number | null }> = {}
  const previous: Record<string, number | undefined> = {}, rises: Record<string, number[]> = {}
  let serial = ''
  for (const event of events) {
    if (event.serial) serial += event.serial
    if (!event.pin || event.value == null) continue
    const summary = pins[event.pin] ||= { transitions: 0, risingIntervalUs: null, dutyPercent: null }
    const last = previous[event.pin]
    if (last !== undefined && last !== event.value) summary.transitions++
    if (last !== 1 && event.value === 1) (rises[event.pin] ||= []).push(event.timeUs)
    previous[event.pin] = event.value
  }
  for (const [pin, times] of Object.entries(rises)) {
    const intervals = times.slice(1).map((time, index) => time - times[index]).sort((a, b) => a - b)
    const middle = Math.floor(intervals.length / 2)
    if (intervals.length) pins[pin].risingIntervalUs = intervals.length % 2 ? intervals[middle] : (intervals[middle - 1] + intervals[middle]) / 2
  }
  for (const [pin, edges] of Object.entries(channelsOf(events))) if (pins[pin]) pins[pin].dutyPercent = measure(pin, edges).dutyPercent
  return { pins, serial }
}
