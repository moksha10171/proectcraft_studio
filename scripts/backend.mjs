import { spawnSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const cwd = fileURLToPath(new URL('../backend', import.meta.url))
const python = path.join(cwd, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
function run(command, args) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}
const setup = process.argv.includes('--setup')
if (!existsSync(python)) run(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'venv', '.venv'])
if (setup) {
  run(python, ['-m', 'pip', 'install', '-r', 'requirements-dev.txt'])
} else {
  const child = spawn(python, ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'], { cwd, stdio: 'inherit' })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
  child.on('exit', code => process.exit(code || 0))
}
