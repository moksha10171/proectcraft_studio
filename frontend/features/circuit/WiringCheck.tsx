'use client'
import type { WiringReport } from '../project/types'

interface Props { report: WiringReport | null; error: string; savedRevision: number | undefined; dirty: boolean; onJump: (file?: string, line?: number) => void }

export function WiringCheck({ report, error, savedRevision, dirty, onJump }: Props) {
  if (error) return <p className="empty-result" role="alert">{error}</p>
  if (!report) return <p className="empty-result">Checking the sketch against your connections…</p>
  if (!report.supported) return <p className="empty-result">{report.summary}</p>
  const actionable = report.findings.filter(f => f.severity !== 'info').length
  return <div className="wiring-check">
    <p className="wiring-summary">{report.summary}{(dirty || report.revision !== savedRevision) && <span className="warning-note"> Showing the saved revision {report.revision}; unsaved edits are not included.</span>}</p>
    {report.findings.length === 0 && <p className="empty-result">No wiring issues found. The sketch&apos;s literal pin usage is consistent with the connections you defined.</p>}
    <ul className="wiring-findings">{report.findings.map((finding, index) => <li key={index}>
      <span className={`severity ${finding.severity}`}>{finding.severity}</span>
      <div><p>{finding.message}</p>{finding.terminals.length > 0 && <code>{finding.terminals.join(' · ')}</code>}</div>
      {finding.file && finding.line ? <button type="button" className="small-button" onClick={() => onJump(finding.file, finding.line)}>{finding.file}:{finding.line}</button> : <span />}
    </li>)}</ul>
    {report.pinUsage.length > 0 && <details><summary>Pins used by the sketch · {report.pinUsage.length}</summary>
      <table className="signal-measurements"><thead><tr><th scope="col">Pin</th><th scope="col">Roles</th><th scope="col">Connection</th><th scope="col">First use</th></tr></thead>
        <tbody>{report.pinUsage.map(item => <tr key={item.terminal}><th scope="row">{item.terminal.slice(6)}</th><td>{item.roles.join(', ') || '—'}</td><td>{item.connected ? 'wired' : item.builtinLed ? 'on-board LED' : 'not connected'}</td><td><button type="button" className="link-button" onClick={() => onJump(item.calls[0].file, item.calls[0].line)}>{item.calls[0].call} · {item.calls[0].file}:{item.calls[0].line}</button></td></tr>)}</tbody></table></details>}
    {report.unresolved.length > 0 && <p className="muted">Not checked (computed or non-constant pins): {report.unresolved.map(u => `${u.call}(${u.expression}) at ${u.file}:${u.line}`).join('; ')}.</p>}
    <p className="muted">{actionable} issue{actionable === 1 ? '' : 's'} to review. This compares source text with the logical circuit; it cannot see library-managed pins and does not verify voltages, currents or physical wiring.</p>
  </div>
}
