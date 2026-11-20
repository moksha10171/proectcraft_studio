import { cp, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(new URL('../frontend/package.json', import.meta.url))
const source = path.join(path.dirname(require.resolve('monaco-editor/package.json')), 'min', 'vs')
const destination = new URL('../frontend/public/monaco/vs', import.meta.url)
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true })

// Pyodide (Raspberry Pi Python simulation) is served as static files and loaded by the simulation worker on demand.
const pyodideSource = path.dirname(require.resolve('pyodide/package.json'))
const pyodideDestination = new URL('../frontend/public/pyodide/', import.meta.url)
await mkdir(pyodideDestination, { recursive: true })
for (const file of ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'])
  await cp(path.join(pyodideSource, file), new URL(file, pyodideDestination)).catch(error => { if (error.code !== 'ENOENT') throw error })
