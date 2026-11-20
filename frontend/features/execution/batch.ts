import type { TraceEvent } from '../project/types'
import type { Engine } from './engine'

export interface BatchResult { events: TraceEvent[]; durationUs: number; dropped: number; notice?: string }

/** Run an engine for `seconds` of simulated time as fast as the CPU allows and collect the trace (no pacing, no UI). */
export function runBatch(engine: Engine, seconds: number, stepUs = 10_000, cap = 10_000): BatchResult {
  const events: TraceEvent[] = []
  let dropped = 0
  const take = () => {
    for (const event of engine.drain()) { if (events.length < cap) events.push(event); else dropped++ }
  }
  take() // Initial levels and stimulus applied before the first step.
  for (let elapsed = 0; elapsed < seconds * 1e6; elapsed += stepUs) { engine.run(stepUs); take() }
  return { events, durationUs: engine.timeUs, dropped: dropped + engine.dropped, notice: engine.notice }
}
