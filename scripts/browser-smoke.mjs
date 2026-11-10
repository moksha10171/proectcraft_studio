import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Start the full app first. Run against a disposable instance, not a live workspace.
const origin = process.env.STUDIO_ORIGIN || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const path of ['/', '/resources', '/projects', '/studio']) {
    const response = await page.goto(origin + path, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200, path)
  }
  await page.locator('.monaco-editor').first().waitFor({ timeout: 30_000 })
  const health = await (await page.request.get(origin + '/api/health')).json()
  assert.equal(health.status, 'healthy')
  const syntax = await page.request.post(origin + '/api/compile', { data: {
    deviceMode: 'raspberry-pi', files: [{ name: 'main.py', content: 'print("hello")' }],
  } })
  assert.equal((await syntax.json()).valid, true)
  const source = await page.request.get(origin + '/api/projects/download?slug=arduino-led-blink')
  assert.equal(source.status(), 200)
  assert.match(await source.text(), /digitalWrite/)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(origin + '/studio', { waitUntil: 'networkidle' })
  assert.equal(await page.getByText('No File Selected', { exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  console.log('Desktop/mobile pages, local Monaco, health, syntax checks and example download passed.')
} finally {
  await browser.close()
}
