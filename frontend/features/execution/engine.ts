/**
 * What the simulation worker needs from any execution engine. An engine owns a simulated clock and
 * reports what the program did as trace events; everything downstream (signals, plotter, VCD, recordings,
 * wiring, the assistant) consumes only this.
 */
import type { TraceEvent } from '../project/types'

export interface Engine {
  /** Current simulated time. */
  readonly timeUs: number
  /** Last known level (0/1) of each pin the program has driven or read. */
  readonly states: Record<string, number>
  /** Events that did not fit the retention buffer. */
  readonly dropped: number
  /** Advance simulated time. */
  run(us: number): void
  /** Events since the last call. */
  drain(): TraceEvent[]
  /** Share of time (0–1) each pin was high since the last call; PWM pins report their duty cycle. */
  levels(): Record<string, number>
  /** An external part sets a digital input. `high` is the level it presents, or false when it pulls the pin low. */
  input(pin: number, high: boolean): void
  /** Optional: apply a voltage (0–5 V) to an analog input. Engines without an ADC leave this undefined. */
  analog?(channel: number, volts: number): void
  /** Set when the program stopped on its own (finished or crashed) with a message for the user. */
  readonly notice?: string
}
