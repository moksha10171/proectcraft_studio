/** ATmega328P execution adapter. CPU/peripheral emulation is provided by AVR8js (MIT). */
import { avrInstruction, CPU, AVRIOPort, AVRTimer, AVRUSART, portBConfig, portCConfig, portDConfig, timer0Config, timer1Config, timer2Config, usart0Config, PinState } from 'avr8js'
import type { TraceEvent } from '../project/types'

export function decodeHex(hex: string): Uint16Array {
  const bytes = new Uint8Array(32768)
  let base = 0, ended = false
  for (const line of hex.trim().split(/\r?\n/)) {
    if (!/^:[0-9a-f]+$/i.test(line) || line.length % 2 !== 1) throw new Error('Invalid Intel HEX record')
    const record = Uint8Array.from(line.slice(1).match(/../g)!.map(v => parseInt(v, 16)))
    const length = record[0]
    if (record.length !== length + 5 || record.reduce((sum, b) => sum + b, 0) % 256 !== 0) throw new Error('Intel HEX checksum mismatch')
    const address = (record[1] << 8) | record[2], type = record[3]
    if (type === 0) {
      if (base + address + length > bytes.length) throw new Error('Firmware exceeds Uno flash')
      bytes.set(record.slice(4, 4 + length), base + address)
    } else if (type === 1) { ended = true; break }
    else if (type === 4 && length === 2) base = ((record[4] << 8) | record[5]) * 65536
    else if (type === 2 && length === 2) base = ((record[4] << 8) | record[5]) * 16
    else if (type !== 3 && type !== 5) throw new Error('Unsupported Intel HEX record')
  }
  if (!ended) throw new Error('Firmware has no end record')
  return new Uint16Array(bytes.buffer)
}

export class UnoEngine {
  readonly cpu: CPU
  readonly ports: { B: AVRIOPort; C: AVRIOPort; D: AVRIOPort }
  readonly usart: AVRUSART
  readonly clockHz = 16_000_000
  readonly states: Record<string, number> = {}
  private pending: TraceEvent[] = []
  dropped = 0

  constructor(hex: string) {
    this.cpu = new CPU(decodeHex(hex), 2048) // ATmega328P SRAM; AVR8js defaults to a larger device.
    new AVRTimer(this.cpu, timer0Config)
    new AVRTimer(this.cpu, timer1Config)
    new AVRTimer(this.cpu, timer2Config)
    this.ports = { B: new AVRIOPort(this.cpu, portBConfig), C: new AVRIOPort(this.cpu, portCConfig), D: new AVRIOPort(this.cpu, portDConfig) }
    this.usart = new AVRUSART(this.cpu, usart0Config, this.clockHz)
    this.usart.onByteTransmit = byte => this.push({ timeUs: this.timeUs, serial: String.fromCharCode(byte) })
    for (const [name, port] of Object.entries(this.ports)) {
      port.addListener(() => {
        for (let bit = 0; bit < (name === 'B' || name === 'C' ? 6 : 8); bit++) {
          const pin = name === 'C' ? `A${bit}` : `D${name === 'B' ? bit + 8 : bit}`
          const state = port.pinState(bit)
          if (state !== PinState.High && state !== PinState.Low) continue
          const value = state === PinState.High ? 1 : 0
          if (this.states[pin] !== value) { this.states[pin] = value; this.push({ timeUs: this.timeUs, pin, value }) }
        }
      })
    }
  }
  get timeUs() { return this.cpu.cycles / 16 }
  private push(event: TraceEvent) {
    if (this.pending.length < 4000) this.pending.push(event)
    else this.dropped++
  }
  input(pin: number, high: boolean) {
    if (pin < 0 || pin > 13) throw new Error('Unsupported digital input')
    const port = pin >= 8 ? this.ports.B : this.ports.D
    port.setPin(pin >= 8 ? pin - 8 : pin, high)
    this.states[`D${pin}`] = high ? 1 : 0
    this.push({ timeUs: this.timeUs, pin: `D${pin}`, value: high ? 1 : 0 })
  }
  advance(cycles: number) {
    const end = this.cpu.cycles + cycles
    while (this.cpu.cycles < end) { avrInstruction(this.cpu); this.cpu.tick() }
  }
  drain() { const events = this.pending; this.pending = []; return events }
}
