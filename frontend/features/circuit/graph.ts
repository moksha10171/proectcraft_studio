import type { Circuit, Net } from '../project/types'
export const partPorts = { led: ['A', 'K'], resistor: ['1', '2'], button: ['1', '2'] }

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
