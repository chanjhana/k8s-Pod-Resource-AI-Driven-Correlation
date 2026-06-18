import { useState, useMemo } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'
import AgentTag from '../../components/ui/AgentTag.jsx'
import EmptyNominal from '../../components/ui/EmptyNominal.jsx'

const PAGE_SIZE = 50

function fmtTs(isoStr) {
  if (!isoStr) return '—'
  try { return new Date(isoStr).toLocaleString() } catch { return isoStr }
}

function exportCsv(rows) {
  const header = 'timestamp,pod,agent,severity,anomaly_type,confidence\n'
  const body = rows.map(f =>
    [f.timestamp, f.pod, f.agent, f.severity, f.anomaly_type, f.confidence].map(v => `"${v ?? ''}"`).join(',')
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'edgemind-findings.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function HistoryPanel() {
  const { findings } = useAppState()
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => [...findings].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)), [findings])
  const total = sorted.length
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (total === 0) return <div style={{ padding: 16 }}><EmptyNominal /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--color-border-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border-secondary)' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{total} findings</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => exportCsv(sorted)} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4, cursor: 'pointer', background: 'transparent', color: 'var(--color-info)', border: '1px solid var(--color-info)' }}>
          Export CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-secondary)', background: 'var(--color-bg-surface)' }}>
              {['Timestamp', 'Pod', 'Agent', 'Severity', 'Anomaly Type', 'Confidence'].map(h => (
                <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--color-text-tertiary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                <td style={{ padding: '4px 8px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{fmtTs(f.timestamp)}</td>
                <td style={{ padding: '4px 8px', color: 'var(--color-text-primary)' }}>{f.pod}</td>
                <td style={{ padding: '4px 8px' }}><AgentTag agent={f.agent} /></td>
                <td style={{ padding: '4px 8px' }}><SeverityBadge severity={f.severity} /></td>
                <td style={{ padding: '4px 8px', color: 'var(--color-text-secondary)' }}>{f.anomaly_type}</td>
                <td style={{ padding: '4px 8px', color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                  {f.confidence != null ? `${(f.confidence * 100).toFixed(0)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 8 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, cursor: page === 0 ? 'not-allowed' : 'pointer', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', opacity: page === 0 ? 0.4 : 1 }}>‹</button>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>{page + 1} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, cursor: page === pages - 1 ? 'not-allowed' : 'pointer', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', opacity: page === pages - 1 ? 0.4 : 1 }}>›</button>
        </div>
      )}
    </div>
  )
}
