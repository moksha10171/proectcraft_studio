/** Line diff for reviewing proposals: longest common subsequence, grouped into hunks with context. */

export interface DiffLine { kind: 'same' | 'add' | 'del'; text: string; oldNo?: number; newNo?: number }
export interface Hunk { lines: DiffLine[]; oldStart: number; newStart: number }

const MAX_CELLS = 4_000_000

export function diffLines(before: string, after: string): DiffLine[] {
  const split = (text: string) => text === '' ? [] : text.split('\n') // An empty file has no lines.
  const a = split(before), b = split(after)
  // Trim the shared prefix and suffix first; most proposals touch a few lines.
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length, endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB-- }
  const midA = a.slice(start, endA), midB = b.slice(start, endB)
  const middle: DiffLine[] = []
  if (midA.length * midB.length > MAX_CELLS) {
    midA.forEach(text => middle.push({ kind: 'del', text }))
    midB.forEach(text => middle.push({ kind: 'add', text }))
  } else {
    // lengths[i][j] = LCS length of midA[i:] and midB[j:]
    const lengths = Array.from({ length: midA.length + 1 }, () => new Uint32Array(midB.length + 1))
    for (let i = midA.length - 1; i >= 0; i--)
      for (let j = midB.length - 1; j >= 0; j--)
        lengths[i][j] = midA[i] === midB[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    let i = 0, j = 0
    while (i < midA.length || j < midB.length) {
      if (i < midA.length && j < midB.length && midA[i] === midB[j]) { middle.push({ kind: 'same', text: midA[i] }); i++; j++ }
      else if (i < midA.length && (j === midB.length || lengths[i + 1][j] >= lengths[i][j + 1])) middle.push({ kind: 'del', text: midA[i++] })
      else middle.push({ kind: 'add', text: midB[j++] })
    }
  }
  const lines: DiffLine[] = [
    ...a.slice(0, start).map(text => ({ kind: 'same' as const, text })),
    ...middle,
    ...a.slice(endA).map(text => ({ kind: 'same' as const, text })),
  ]
  let oldNo = 1, newNo = 1
  for (const line of lines) {
    if (line.kind !== 'add') line.oldNo = oldNo++
    if (line.kind !== 'del') line.newNo = newNo++
  }
  return lines
}

/** Changed regions with `context` unchanged lines around each; distant regions become separate hunks. */
export function hunks(lines: DiffLine[], context = 3): Hunk[] {
  const keep = new Uint8Array(lines.length)
  lines.forEach((line, index) => {
    if (line.kind === 'same') return
    for (let k = Math.max(0, index - context); k <= Math.min(lines.length - 1, index + context); k++) keep[k] = 1
  })
  const result: Hunk[] = []
  let current: DiffLine[] | null = null
  lines.forEach((line, index) => {
    if (!keep[index]) { current = null; return }
    if (!current) {
      current = []
      result.push({ lines: current, oldStart: line.oldNo ?? (lines[index - 1]?.oldNo ?? 0) + 1, newStart: line.newNo ?? (lines[index - 1]?.newNo ?? 0) + 1 })
    }
    current.push(line)
  })
  return result
}

export function diffStats(lines: DiffLine[]) {
  return { added: lines.filter(l => l.kind === 'add').length, removed: lines.filter(l => l.kind === 'del').length }
}
