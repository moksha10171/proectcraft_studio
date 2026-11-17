import assert from 'node:assert/strict'
import test from 'node:test'
import { analogInputs, connect, buttonInputs, ledDrives } from '../features/circuit/graph'
import type { Circuit } from '../features/project/types'

test('joining existing nets merges terminal identities without duplicate membership', () => {
  const circuit: Circuit = { parts: [], nets: [{ id: 'signal', label: 'Signal', terminals: ['board:D2', 'button:1'] }, { id: 'ground', label: 'GND', terminals: ['board:GND', 'button:2'] }] }
  const joined = connect(circuit, 'button:1', 'button:2')
  assert.equal(joined.nets.length, 1)
  assert.equal(new Set(joined.nets[0].terminals).size, 4)
})

test('button changes the configured GPIO input through terminal connectivity', () => {
  const circuit: Circuit = { parts: [{ id: 'sw', kind: 'button', label: 'Switch', x: 0, y: 0, value: '' }], nets: [{ id: 'input', label: '', terminals: ['board:D2', 'sw:1'] }, { id: 'gnd', label: '', terminals: ['board:GND', 'sw:2'] }] }
  assert.equal(buttonInputs(circuit, new Set())[2], true)
  assert.equal(buttonInputs(circuit, new Set(['sw']))[2], false)
  assert.equal(buttonInputs({ ...circuit, nets: circuit.nets.slice(0, 1) }, new Set(['sw']))[2], true)
})

const divider = (low: string, high: string, wiper: string): Circuit => ({
  parts: [{ id: 'pot1', kind: 'potentiometer', label: 'Potentiometer', x: 0, y: 0, value: '10 kΩ' }],
  nets: [{ id: 'w', label: '', terminals: [`board:${wiper}`, 'pot1:W'] }, { id: 'lo', label: '', terminals: [low, 'pot1:1'] }, { id: 'hi', label: '', terminals: [high, 'pot1:2'] }],
})

test('a potentiometer between 5V and GND drives its analog pin as a voltage divider', () => {
  const circuit = divider('board:GND', 'board:5V', 'A0')
  assert.deepEqual(analogInputs(circuit, { pot1: 0 }), { 0: 0 })
  assert.deepEqual(analogInputs(circuit, { pot1: 1 }), { 0: 5 })
  assert.deepEqual(analogInputs(circuit, { pot1: 0.25 }), { 0: 1.25 })
  assert.deepEqual(analogInputs(circuit), { 0: 2.5 }, 'defaults to the middle of the track')
  assert.deepEqual(analogInputs(divider('board:5V', 'board:GND', 'A3'), { pot1: 0.25 }), { 3: 3.75 }, 'reversed ends invert the sweep')
  assert.deepEqual(analogInputs(divider('board:GND', 'board:3V3', 'A1'), { pot1: 1 }), { 1: 3.3 })
})

test('undriven analog inputs are left unset rather than guessed', () => {
  const open = divider('board:GND', 'board:5V', 'A0')
  assert.deepEqual(analogInputs({ ...open, nets: open.nets.filter(n => n.id !== 'hi') }, { pot1: 1 }), {}, 'an unconnected end leaves the wiper floating')
  const tied: Circuit = { parts: [{ id: 'pot1', kind: 'potentiometer', label: 'Potentiometer', x: 0, y: 0, value: '' }], nets: [{ id: 'w', label: '', terminals: ['board:A0', 'pot1:W'] }, { id: 'rail', label: '', terminals: ['board:5V', 'pot1:1', 'pot1:2'] }] }
  assert.deepEqual(analogInputs(tied, { pot1: 0.3 }), { 0: 5 }, 'both ends on the same rail pin the wiper to it')
  const shorted: Circuit = { parts: [], nets: [{ id: 's', label: '', terminals: ['board:5V', 'board:GND', 'board:A0'] }] }
  assert.deepEqual(analogInputs(shorted), {}, 'a short between rails has no single voltage')
  assert.deepEqual(analogInputs({ parts: [], nets: [{ id: 'd', label: '', terminals: ['board:D2', 'board:GND'] }] }), {}, 'digital pins are not analog channels')
})

test('an analog pin wired straight to a rail reads that rail', () => {
  assert.deepEqual(analogInputs({ parts: [], nets: [{ id: 'a', label: '', terminals: ['board:A2', 'board:5V'] }, { id: 'b', label: '', terminals: ['board:A5', 'board:GND'] }] }), { 2: 5, 5: 0 })
})

test('LED drive is resolved through one resistor to a pin and the matching rail', () => {
  const parts: Circuit['parts'] = [
    { id: 'r1', kind: 'resistor', label: 'R', x: 0, y: 0, value: '330 Ω' },
    { id: 'led1', kind: 'led', label: 'Series LED', x: 0, y: 0, value: '' },
    { id: 'led2', kind: 'led', label: 'Sink LED', x: 0, y: 0, value: '' },
    { id: 'led3', kind: 'led', label: 'Open LED', x: 0, y: 0, value: '' },
  ]
  const circuit: Circuit = { parts, nets: [
    { id: 'pwm', label: '', terminals: ['board:D9', 'r1:1'] },
    { id: 'led', label: '', terminals: ['r1:2', 'led1:A'] },
    { id: 'gnd', label: '', terminals: ['led1:K', 'board:GND'] },
    { id: 'supply', label: '', terminals: ['board:5V', 'led2:A'] },
    { id: 'sink', label: '', terminals: ['led2:K', 'board:D4'] },
    { id: 'open', label: '', terminals: ['led3:A', 'board:D7'] },
  ] }
  assert.deepEqual(ledDrives(circuit), {
    led1: { pin: 'D9', activeLow: false, resistor: true },
    led2: { pin: 'D4', activeLow: true, resistor: false },
  })
})
