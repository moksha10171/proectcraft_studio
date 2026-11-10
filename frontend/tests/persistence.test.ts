import assert from 'node:assert/strict'
import test from 'node:test'
import { WorkspaceStore } from '../lib/persistence/workspace-store'
import type { PersistenceAdapter } from '../lib/persistence/types'

test('workspace browser fallback keeps files, wiring, mode and chat separate', async () => {
  const data = new Map<string, unknown>()
  const adapter: PersistenceAdapter = {
    async read<T>(key: string) { return (data.get(key) as T) ?? null },
    async write(key, value) { data.set(key, value) },
    async delete(key) { data.delete(key) },
    async exists(key) { return data.has(key) },
  }
  const store = new WorkspaceStore(adapter, 'test')
  await store.saveCodebase({ deviceMode: 'raspberry-pi', activeFileName: 'main.py',
    files: [{ name: 'main.py', content: 'pass', type: 'code' }], wiring: null })
  await store.saveChat({ messages: [{ role: 'user', content: 'blink' }], agentHistory: [], toolCalls: [] })
  assert.equal((await store.loadCodebase())?.deviceMode, 'raspberry-pi')
  await store.clearChat()
  assert.equal(await store.loadChat(), null)
  assert.equal((await store.loadCodebase())?.files[0].name, 'main.py')
})
