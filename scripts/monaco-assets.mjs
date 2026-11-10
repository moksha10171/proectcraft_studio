import { cp, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(new URL('../frontend/package.json', import.meta.url))
const source = path.join(path.dirname(require.resolve('monaco-editor/package.json')), 'min', 'vs')
const destination = new URL('../frontend/public/monaco/vs', import.meta.url)
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true })
