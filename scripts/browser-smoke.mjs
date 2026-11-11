import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Use a disposable instance. These checks create projects and run local tools.
const origin = process.env.STUDIO_ORIGIN || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const replaceSource = async content => {
    await page.locator('.monaco-editor .view-lines').click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.locator('.monaco-editor textarea').first().evaluate((element, text) => {
      const clipboardData = new DataTransfer()
      clipboardData.setData('text/plain', text)
      element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
    }, content)
  }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const path of ['/', '/resources', '/projects', '/studio']) {
    const response = await page.goto(origin + path, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200, path)
  }
  if (!await page.getByRole('dialog').count()) await page.getByRole('button', { name: 'New project', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Project name', { exact: true }).fill('Browser blink experiment')
  await dialog.getByLabel('Target board').selectOption('uno')
  const created = page.waitForResponse(r => r.url().endsWith('/api/workbench/projects') && r.request().method() === 'POST')
  await dialog.getByRole('button', { name: 'Create experiment' }).click()
  const project = await (await created).json()
  await page.locator('.monaco-editor').first().waitFor({ timeout: 30_000 })
  const health = await (await page.request.get(origin + '/api/health')).json()
  assert.equal(health.status, 'healthy')

  const compiled = page.waitForResponse(r => r.url().endsWith(`/projects/${project.id}/build`), { timeout: 150_000 })
  await page.getByRole('button', { name: 'Build', exact: true }).click()
  const build = await (await compiled).json()
  const cli = await (await page.request.get(origin + '/api/compile/info')).json()
  if (cli.arduinoCli) {
    assert.equal(build.status, 'passed', build.output)
    assert.ok(build.artifact?.content.startsWith(':'))
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await page.waitForFunction(() => /[2-9]\.\d{2} s simulated/.test(document.querySelector('.workbench-status')?.textContent || ''), { timeout: 30_000 })
    await page.getByRole('button', { name: 'serial', exact: true }).click()
    await page.getByText(/LED on/).last().waitFor()
    const captured = page.waitForResponse(r => r.url().endsWith(`/projects/${project.id}/recordings`))
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    const capture = await (await captured).json()
    assert.equal(capture.origin, 'emulator')
    assert.ok(capture.trace.some(e => e.pin === 'D13' && e.value === 1))
    assert.ok(capture.trace.some(e => e.pin === 'D13' && e.value === 0))
  } else {
    assert.equal(build.status, 'unavailable')
    assert.match(build.output, /Arduino CLI/)
    assert.equal(await page.getByRole('button', { name: 'Run', exact: true }).isDisabled(), true)
  }
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  assert.match((await download).suggestedFilename(), /projectcraft\.json$/)
  const exported = await (await page.request.get(`${origin}/api/workbench/projects/${project.id}/export`)).json()
  const reopenedResponse = await page.request.post(origin + '/api/workbench/import', { data: exported })
  assert.equal(reopenedResponse.status(), 200)
  const reopened = await reopenedResponse.json()
  assert.deepEqual(reopened.files, project.files)
  assert.equal(reopened.boardId, 'uno')
  assert.equal(reopened.coreVersion, project.coreVersion)

  // Stale results are visible as soon as source changes.
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.insertText('\n// edit after build\n')
  await page.getByText('Source changed · rebuild required', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Run', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: 'Export', exact: true }).click()

  if (cli.arduinoCli) {
    // Rebuild an edited timing value, then compare the two actual captures.
    await replaceSource(project.files[0].content.replaceAll('delay(1000)', 'delay(500)'))
    const fasterBuild = page.waitForResponse(r => r.url().endsWith(`/projects/${project.id}/build`), { timeout: 150_000 })
    await page.getByRole('button', { name: 'Build', exact: true }).click()
    assert.equal((await (await fasterBuild).json()).status, 'passed')
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await page.waitForFunction(() => /[2-9]\.\d{2} s simulated/.test(document.querySelector('.workbench-status')?.textContent || ''), { timeout: 30_000 })
    // Export immediately after Stop must include the recording still being saved.
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    const savedDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export', exact: true }).click()
    await savedDownload
    const capturedBundle = await (await page.request.get(`${origin}/api/workbench/projects/${project.id}/export`)).json()
    assert.equal(capturedBundle.runs.filter(run => run.trace?.length).length, 2)
    await page.getByRole('button', { name: 'compare', exact: true }).click()
    await page.getByRole('columnheader', { name: 'Reference rising interval', exact: true }).waitFor()
    assert.match(await page.locator('.run-comparison').innerText(), /1000\.\d+ ms/)
    assert.match(await page.locator('.run-comparison').innerText(), /2000\.\d+ ms/)

    // Compiler diagnostics remain linked to the selected source file and line.
    await replaceSource('void setup() {\n  unknown_function();\n}\nvoid loop() {}\n')
    const invalidBuild = page.waitForResponse(r => r.url().endsWith(`/projects/${project.id}/build`), { timeout: 150_000 })
    await page.getByRole('button', { name: 'Build', exact: true }).click()
    const invalid = await (await invalidBuild).json()
    assert.equal(invalid.status, 'failed')
    assert.ok(invalid.diagnostics.some(d => d.file === 'sketch.ino' && d.line === 2))
    await page.locator('.diagnostic').first().click()
    await page.waitForFunction(() => document.activeElement?.closest('.monaco-editor') !== null)
  }

  if (cli.arduinoCli) {
    await page.getByRole('button', { name: 'New project', exact: true }).click()
    const newDialog = page.getByRole('dialog')
    await newDialog.getByLabel('Project name', { exact: true }).fill('Browser button experiment')
    await newDialog.getByRole('button', { name: /Button input/ }).click()
    const nextProject = page.waitForResponse(r => r.url().endsWith('/api/workbench/projects') && r.request().method() === 'POST')
    await newDialog.getByRole('button', { name: 'Create experiment' }).click()
    const buttonProject = await (await nextProject).json()
    const buttonBuild = page.waitForResponse(r => r.url().endsWith(`/projects/${buttonProject.id}/build`), { timeout: 150_000 })
    await page.getByRole('button', { name: 'Build', exact: true }).click()
    assert.equal((await (await buttonBuild).json()).status, 'passed')
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    const input = page.getByRole('button', { name: 'Hold button', exact: true })
    await input.focus()
    await page.keyboard.down('Space')
    await page.waitForFunction(() => document.querySelector('.led-lit') !== null)
    await page.keyboard.up('Space')
    const buttonCapture = page.waitForResponse(r => r.url().endsWith(`/projects/${buttonProject.id}/recordings`))
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    const captured = await (await buttonCapture).json()
    assert.ok(captured.trace.some(e => e.pin === 'D13' && e.value === 1))
  }

  // Real Python parser path, without execution or an API key.
  const syntax = await page.request.post(origin + '/api/compile', { data: {
    deviceMode: 'raspberry-pi', files: [{ name: 'main.py', content: 'raise RuntimeError("never executed")' }],
  } })
  assert.equal((await syntax.json()).valid, true)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(origin + '/studio', { waitUntil: 'networkidle' })
  await page.getByRole('navigation', { name: 'Work surface' }).getByRole('button', { name: 'Circuit', exact: true }).click()
  await page.getByRole('img', { name: /circuit diagram/ }).waitFor()
  await page.getByRole('button', { name: 'Open workspace navigation' }).click()
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  assert.equal(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth), true)
  assert.deepEqual(errors, [])
  console.log('Project creation, local editor, build/availability, firmware capture, stale status, export/import and mobile circuit checks passed.')
} finally {
  await browser.close()
}
