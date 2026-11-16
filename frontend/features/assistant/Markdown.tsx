/**
 * Small Markdown renderer for assistant replies: headings, paragraphs, lists, fenced code, inline code,
 * bold and links. It builds React elements directly (no HTML injection), so model output cannot add markup.
 */
import type { ReactNode } from 'react'

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g

function inline(text: string, key: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, index) => {
    const k = `${key}-${index}`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={k}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={k}>{part.slice(2, -2)}</strong>
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part)
    if (link) return <a key={k} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>
    return part
  })
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i], key = `b${i}`
    const fence = /^\s*```(\S*)/.exec(line)
    if (fence) {
      const body: string[] = []
      i++
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++])
      i++ // closing fence (or end of a still-streaming block)
      blocks.push(<pre key={key} className="md-code" data-lang={fence[1] || undefined}><code>{body.join('\n')}</code></pre>)
      continue
    }
    const heading = /^\s*(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push(<p key={key} className="md-heading">{inline(heading[2], key)}</p>)
      i++
      continue
    }
    if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      const items: ReactNode[] = []
      while (i < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i])) {
        items.push(<li key={i}>{inline(lines[i].replace(/^\s*([-*]|\d+[.)])\s+/, ''), `${key}-${i}`)}</li>)
        i++
      }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>)
      continue
    }
    if (!line.trim()) { i++; continue }
    const paragraph: string[] = []
    do paragraph.push(lines[i++])
    while (i < lines.length && lines[i].trim() && !/^\s*(```|#{1,4}\s|[-*]\s|\d+[.)]\s)/.test(lines[i]))
    blocks.push(<p key={key}>{inline(paragraph.join('\n'), key)}</p>)
  }
  return <div className="md">{blocks}</div>
}
