import type { Circuit, TraceEvent } from '../project/types'
import { analogInputs, buttonInputs } from '../circuit/graph'

export interface SimulationRequest {
  board: 'uno' | 'pi4'
  seconds: number
  hex?: string
  files?: { name: string; content: string }[]
  circuit: Circuit
  pots: Record<string, number>
  hold: string[]
}
export interface SimulationResult { events: TraceEvent[]; durationUs: number; dropped: number; notice?: string }

/** Run a project in a throwaway worker, faster than real time, and return its trace. Used by the assistant's RUN_SIMULATION tool. */
export function simulateHeadless(request: SimulationRequest, timeoutMs = 80_000): Promise<SimulationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' })
    const finish = (action: () => void) => { clearTimeout(timer); worker.terminate(); action() }
    const timer = setTimeout(() => finish(() => reject(new Error('The simulation did not finish in time'))), timeoutMs)
    worker.onmessage = ({ data }) => {
      if (data.type === 'batch') finish(() => resolve({ events: data.events, durationUs: data.durationUs, dropped: data.dropped, notice: data.notice }))
      else if (data.type === 'error') finish(() => reject(new Error(data.message)))
    }
    worker.onerror = () => finish(() => reject(new Error('The simulation worker stopped unexpectedly')))
    worker.postMessage({
      type: 'load', board: request.board, hex: request.hex, files: request.files, batchSeconds: request.seconds,
      inputs: buttonInputs(request.circuit, new Set(request.hold)), analog: analogInputs(request.circuit, request.pots),
    })
  })
}
