import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { diffLines, diffStats, hunks } from '../features/assistant/diff'
import { Markdown } from '../features/assistant/Markdown'

const blink = 'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}\n'

test('a one-line change is one deletion and one addition with numbered context', () => {
  const lines = diffLines(blink, blink.replace('HIGH);\n  delay(1000)', 'HIGH);\n  delay(250)'))
  assert.deepEqual(diffStats(lines), { added: 1, removed: 1 })
  const [hunk, ...rest] = hunks(lines)
  assert.equal(rest.length, 0)
  const changed = hunk.lines.filter(l => l.kind !== 'same')
  assert.deepEqual(changed.map(l => [l.kind, l.text, l.oldNo, l.newNo]), [['del', '  delay(1000);', 7, undefined], ['add', '  delay(250);', undefined, 7]])
  assert.equal(hunk.lines.length, 2 + 6, 'three context lines either side')
  assert.equal(hunk.oldStart, 4)
})

test('insertions keep both numberings aligned and distant edits form separate hunks', () => {
  const longer = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n')
  const edited = longer.replace('line 2\n', 'line 2\ninserted\n').replace('line 28', 'line twenty-eight')
  const lines = diffLines(longer, edited)
  assert.deepEqual(diffStats(lines), { added: 2, removed: 1 })
  const groups = hunks(lines)
  assert.equal(groups.length, 2)
  const inserted = lines.find(l => l.text === 'inserted')!
  assert.equal(inserted.newNo, 3)
  assert.equal(lines.find(l => l.text === 'line 3')!.oldNo, 3)
  assert.equal(lines.find(l => l.text === 'line 3')!.newNo, 4)
})

test('new files are all additions and identical files have no hunks', () => {
  assert.deepEqual(diffStats(diffLines('', 'a\nb')), { added: 2, removed: 0 })
  assert.deepEqual(hunks(diffLines(blink, blink)), [])
})

test('markdown renders structure without passing through HTML', () => {
  const html = renderToStaticMarkup(createElement(Markdown, { text: '## Cause\nThe pin `D2` **floats**.\n\n- add `INPUT_PULLUP`\n- rebuild\n\n```cpp\npinMode(2, INPUT_PULLUP);\n```\n<script>alert(1)</script> [docs](https://docs.arduino.cc/) [x](javascript:alert(1))' }))
  assert.match(html, /<p class="md-heading">Cause<\/p>/)
  assert.match(html, /<code>D2<\/code> <strong>floats<\/strong>/)
  assert.match(html, /<ul><li>add <code>INPUT_PULLUP<\/code><\/li><li>rebuild<\/li><\/ul>/)
  assert.match(html, /<pre class="md-code" data-lang="cpp"><code>pinMode\(2, INPUT_PULLUP\);<\/code><\/pre>/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /<a href="https:\/\/docs.arduino.cc\/" target="_blank" rel="noopener noreferrer">docs<\/a>/)
  assert.doesNotMatch(html, /href="javascript/)
})

test('markdown tolerates an unterminated code fence while streaming and indented headings', () => {
  const html = renderToStaticMarkup(createElement(Markdown, { text: '  # Title\n```\nvoid loop() {' }))
  assert.match(html, /md-heading">Title/)
  assert.match(html, /<code>void loop\(\) \{<\/code>/)
})
