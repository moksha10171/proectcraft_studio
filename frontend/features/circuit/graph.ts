import type { Circuit, Net } from '../project/types'
export const partPorts = { led: ['A', 'K'], resistor: ['1', '2'], button: ['1', '2'], potentiometer: ['1', 'W', '2'] }

/** Merge nets on connection; a terminal always belongs to a single net. */
export function connect(circuit: Circuit, from: string, to: string): Circuit {
  if (from === to) return circuit
  const connected = circuit.nets.filter(net => net.terminals.includes(from) || net.terminals.includes(to))
  const rest = circuit.nets.filter(net => !connected.includes(net))
  const net: Net = { id: connected[0]?.id || `net_${Date.now().toString(36)}`, label: connected[0]?.label || 'Connection', terminals: [...new Set([from, to, ...connected.flatMap(n => n.terminals)])] }
  return { ...circuit, nets: [...rest, net] }
}

/** Digital push-button model: closing the switch joins its two terminal nets. */
export function buttonInputs(circuit: Circuit, pressed: Set<string>): Record<number, boolean> {
  const links = new Map<string, Set<string>>()
  const join = (a: string, b: string) => { if (!links.has(a)) links.set(a, new Set()); links.get(a)!.add(b); if (!links.has(b)) links.set(b, new Set()); links.get(b)!.add(a) }
  for (const net of circuit.nets) for (const terminal of net.terminals) join(net.terminals[0], terminal)
  const inputs: Record<number, boolean> = {}
  for (const part of circuit.parts.filter(p => p.kind === 'button')) {
    for (const net of circuit.nets.filter(n => n.terminals.some(t => t.startsWith(`${part.id}:`)))) {
      for (const t of net.terminals) if (/^board:D\d+$/.test(t)) inputs[Number(t.slice(7))] = true
    }
    if (pressed.has(part.id)) join(`${part.id}:1`, `${part.id}:2`)
  }
  const seen = new Set<string>(), queue = ['board:GND']
  while (queue.length) { const t = queue.pop()!; if (seen.has(t)) continue; seen.add(t); queue.push(...(links.get(t) || [])) }
  for (const pin of Object.keys(inputs)) if (seen.has(`board:D${pin}`)) inputs[Number(pin)] = false
  return inputs
}

const RAILS: Record<string, number> = { 'board:5V': 5, 'board:3V3': 3.3, 'board:GND': 0 }

/**
 * Voltages (0–5 V) the circuit applies to analog inputs, keyed by channel (A0 = 0).
 * Resolved purely from connectivity: an analog pin tied to a power rail takes that voltage, and a
 * potentiometer whose two ends are both tied to rails drives its wiper between them (position 0 =
 * terminal 1, 1 = terminal 2). Series resistors, loads and other sources are not modelled.
 */
export function analogInputs(circuit: Circuit, positions: Record<string, number> = {}): Record<number, number> {
  const netOf = new Map<string, Net>()
  for (const net of circuit.nets) for (const terminal of net.terminals) netOf.set(terminal, net)
  const rail = (terminal: string): number | null => {
    const levels = new Set((netOf.get(terminal)?.terminals || []).flatMap(t => t in RAILS ? [RAILS[t]] : []))
    return levels.size === 1 ? [...levels][0] : null
  }
  const channelOf = (terminal: string) => /^board:A[0-5]$/.test(terminal) ? Number(terminal.slice(7)) : null
  const volts: Record<number, number> = {}
  for (const net of circuit.nets) for (const terminal of net.terminals) {
    const channel = channelOf(terminal), level = channel === null ? null : rail(terminal)
    if (channel !== null && level !== null) volts[channel] = level
  }
  for (const part of circuit.parts.filter(p => p.kind === 'potentiometer')) {
    const wiper = netOf.get(`${part.id}:W`), low = rail(`${part.id}:1`), high = rail(`${part.id}:2`)
    if (!wiper || low === null || high === null) continue
    const position = Math.min(1, Math.max(0, positions[part.id] ?? 0.5))
    for (const terminal of wiper.terminals) {
      const channel = channelOf(terminal)
      if (channel !== null) volts[channel] = Math.round((low + (high - low) * position) * 1000) / 1000
    }
  }
  return volts
}

export interface LedDrive { pin: string; activeLow: boolean; resistor: boolean }

/**
 * Which board pin switches each LED, from connectivity alone. An LED is driven when one leg reaches a
 * digital pin (directly or through one resistor) and the other leg reaches the matching rail: GND on the
 * cathode for an active-high pin, or 5V/3V3 on the anode for an active-low pin. LEDs without a
 * complete path are left out. Nothing here models current or forward voltage.
 */
export function ledDrives(circuit: Circuit): Record<string, LedDrive> {
  const netOf = new Map<string, Net>()
  for (const net of circuit.nets) for (const terminal of net.terminals) netOf.set(terminal, net)
  const resistors = new Set(circuit.parts.filter(p => p.kind === 'resistor').map(p => p.id))
  /** Terminals reachable from one terminal: its net, plus the far side of at most one resistor. */
  const reach = (terminal: string): { terminal: string; resistor: boolean }[] => {
    const near = (netOf.get(terminal)?.terminals || [terminal]).map(t => ({ terminal: t, resistor: false }))
    const far = near.flatMap(({ terminal: t }) => {
      const [id, port] = t.split(':')
      if (!resistors.has(id)) return []
      const other = `${id}:${port === '1' ? '2' : '1'}`
      return (netOf.get(other)?.terminals || []).map(x => ({ terminal: x, resistor: true }))
    })
    return [...near, ...far]
  }
  const pinOn = (terminal: string) => reach(terminal).find(r => /^board:D\d+$/.test(r.terminal))
  const railOn = (terminal: string, rails: string[]) => reach(terminal).find(r => rails.includes(r.terminal))
  const drives: Record<string, LedDrive> = {}
  for (const led of circuit.parts.filter(p => p.kind === 'led')) {
    const anodePin = pinOn(`${led.id}:A`), cathodeGround = railOn(`${led.id}:K`, ['board:GND'])
    if (anodePin && cathodeGround) { drives[led.id] = { pin: anodePin.terminal.slice(6), activeLow: false, resistor: anodePin.resistor || cathodeGround.resistor }; continue }
    const cathodePin = pinOn(`${led.id}:K`), anodeSupply = railOn(`${led.id}:A`, ['board:5V', 'board:3V3'])
    if (cathodePin && anodeSupply) drives[led.id] = { pin: cathodePin.terminal.slice(6), activeLow: true, resistor: cathodePin.resistor || anodeSupply.resistor }
  }
  return drives
}
