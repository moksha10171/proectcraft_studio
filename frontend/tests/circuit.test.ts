import assert from 'node:assert/strict'
import test from 'node:test'
import { connect, buttonInputs } from '../features/circuit/graph'
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
