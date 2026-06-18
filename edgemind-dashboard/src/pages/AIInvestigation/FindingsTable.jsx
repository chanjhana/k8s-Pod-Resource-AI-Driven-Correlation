import { useMemo } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'
import AgentTag from '../../components/ui/AgentTag.jsx'

export default function FindingsTable({ alert }) {
  const { findings } = useAppState()

  const relevant = useMemo(() => {
    if (!alert) return findings.slice(0, 20)
    const alertMs = alert.timestamp ? new Date(alert.timestamp).getTime() : null
    if (!alertMs) return findings.filter(f => alert.causal_chain?.includes(f.pod)).slice(0, 20)
    const windowMs = (alert.duration_s || 120) * 1000
    return findings.filter(f => {
      const ms = f.timestamp ? new Date(f.timestamp).getTime() : 0
      return ms >= alertMs - 5000 && ms <= alertMs + windowMs
    }).slice(0, 20)
  }, [findings, alert])

  if (relevant.length === 0) return null

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, padding: '6px 0', borderBottom: '1px solid var(--color-border-secondary)' }}>
        RELATED FINDINGS ({relevant.length})
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {relevant.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                <td style={{ padding: '3px 6px' }}><SeverityBadge severity={f.severity} /></td>
                <td style={{ padding: '3px 6px', color: 'var(--color-text-primary)' }}>{f.pod}</td>
                <td style={{ padding: '3px 6px' }}><AgentTag agent={f.agent} /></td>
                <td style={{ padding: '3px 6px', color: 'var(--color-text-secondary)' }}>{f.anomaly_type}</td>
                <td style={{ padding: '3px 6px', color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                  {f.confidence != null ? `${(f.confidence * 100).toFixed(0)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
