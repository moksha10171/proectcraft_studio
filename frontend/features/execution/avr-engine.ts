/** ATmega328P execution adapter. CPU/peripheral emulation is provided by AVR8js (MIT). */
import { avrInstruction, CPU, AVRADC, adcConfig, AVRIOPort, AVRTimer, AVRUSART, portBConfig, portCConfig, portDConfig, timer0Config, timer1Config, timer2Config, usart0Config, PinState } from 'avr8js'
import type { TraceEvent } from '../project/types'
import type { Engine } from './engine'

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

export class UnoEngine implements Engine {
  readonly cpu: CPU
  readonly ports: { B: AVRIOPort; C: AVRIOPort; D: AVRIOPort }
  readonly usart: AVRUSART
  readonly adc: AVRADC
  readonly clockHz = 16_000_000
  readonly states: Record<string, number> = {}
  private pending: TraceEvent[] = []
  dropped = 0
  // Per-pin time spent high since the last levels() call, in CPU cycles (independent of the trace cap).
  private frameStart = 0
  private highCycles: Record<string, number> = {}
  private highSince: Record<string, number> = {}

  constructor(hex: string) {
    this.cpu = new CPU(decodeHex(hex), 2048) // ATmega328P SRAM; AVR8js defaults to a larger device.
    new AVRTimer(this.cpu, timer0Config)
    new AVRTimer(this.cpu, timer1Config)
    new AVRTimer(this.cpu, timer2Config)
    this.ports = { B: new AVRIOPort(this.cpu, portBConfig), C: new AVRIOPort(this.cpu, portCConfig), D: new AVRIOPort(this.cpu, portDConfig) }
    this.usart = new AVRUSART(this.cpu, usart0Config, this.clockHz)
    // Without an ADC peripheral, analogRead() would wait forever for the conversion-complete flag.
    this.adc = new AVRADC(this.cpu, adcConfig)
    this.usart.onByteTransmit = byte => this.push({ timeUs: this.timeUs, serial: String.fromCharCode(byte) })
    for (const [name, port] of Object.entries(this.ports)) {
      port.addListener(() => {
        for (let bit = 0; bit < (name === 'B' || name === 'C' ? 6 : 8); bit++) {
          const pin = name === 'C' ? `A${bit}` : `D${name === 'B' ? bit + 8 : bit}`
          const state = port.pinState(bit)
          if (state !== PinState.High && state !== PinState.Low) continue
          const value = state === PinState.High ? 1 : 0
          if (this.states[pin] !== value) { this.track(pin, value); this.states[pin] = value; this.push({ timeUs: this.timeUs, pin, value }) }
        }
      })
    }
  }
  get timeUs() { return this.cpu.cycles / 16 }
  private track(pin: string, value: number) {
    const now = this.cpu.cycles
    if (value) this.highSince[pin] = now
    else if (this.states[pin] === 1) this.highCycles[pin] = (this.highCycles[pin] || 0) + now - Math.max(this.highSince[pin] ?? this.frameStart, this.frameStart)
  }
  /** Share of time (0–1) each pin was high since the previous call; PWM pins report their duty cycle. */
  levels(): Record<string, number> {
    const now = this.cpu.cycles, span = now - this.frameStart
    const result: Record<string, number> = {}
    if (span <= 0) return result
    for (const [pin, value] of Object.entries(this.states)) {
      let high = this.highCycles[pin] || 0
      if (value === 1) high += now - Math.max(this.highSince[pin] ?? this.frameStart, this.frameStart)
      result[pin] = Math.min(1, high / span)
    }
    this.highCycles = {}
    this.frameStart = now
    return result
  }
  private push(event: TraceEvent) {
    if (this.pending.length < 4000) this.pending.push(event)
    else this.dropped++
  }
  input(pin: number, high: boolean) {
    if (pin < 0 || pin > 13) throw new Error('Unsupported digital input')
    const port = pin >= 8 ? this.ports.B : this.ports.D
    port.setPin(pin >= 8 ? pin - 8 : pin, high)
    if (this.states[`D${pin}`] !== (high ? 1 : 0)) this.track(`D${pin}`, high ? 1 : 0)
    this.states[`D${pin}`] = high ? 1 : 0
    this.push({ timeUs: this.timeUs, pin: `D${pin}`, value: high ? 1 : 0 })
  }
  /** Apply a voltage (0–5 V) to analog input A<channel>; the stimulus is recorded in the trace. */
  analog(channel: number, volts: number) {
    if (!Number.isInteger(channel) || channel < 0 || channel > 5) throw new Error('Unsupported analog input')
    if (!Number.isFinite(volts) || volts < 0 || volts > 5) throw new Error('Analog input must be between 0 and 5 V')
    const rounded = Math.round(volts * 1000) / 1000
    if (this.adc.channelValues[channel] === rounded) return
    this.adc.channelValues[channel] = rounded
    this.push({ timeUs: this.timeUs, pin: `A${channel}`, volts: rounded })
  }
  run(us: number) { this.advance(us * 16) }
  advance(cycles: number) {
    const end = this.cpu.cycles + cycles
    while (this.cpu.cycles < end) { avrInstruction(this.cpu); this.cpu.tick() }
  }
  drain() { const events = this.pending; this.pending = []; return events }
}
