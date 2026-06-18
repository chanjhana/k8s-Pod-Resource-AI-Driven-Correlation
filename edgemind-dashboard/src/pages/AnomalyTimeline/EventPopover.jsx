import { useEffect, useRef } from 'react'
import AgentTag from '../../components/ui/AgentTag.jsx'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'

function Row({ label, value }) {
  if (value == null) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 11, padding: '2px 0', borderBottom: '1px solid var(--color-border-secondary)' }}>
      <span style={{ color: 'var(--color-text-tertiary)', width: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)' }}>{String(value)}</span>
    </div>
  )
}

export default function EventPopover({ finding: f, onClose, xLeft }) {
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const ts = f.timestamp ? new Date(f.timestamp).toLocaleString() : '—'

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: Math.min(xLeft, 'calc(100% - 240px)'),
        top: 30, zIndex: 30, width: 240,
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
        borderRadius: 6, padding: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <SeverityBadge severity={f.severity} />
        <AgentTag agent={f.agent} />
        <span style={{ fontSize: 11, color: 'var(--color-text-primary)', flex: 1, fontWeight: 600 }}>{f.anomaly_type}</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}>✕</button>
      </div>
      <Row label="Pod" value={f.pod} />
      <Row label="Timestamp" value={ts} />
      <Row label="Confidence" value={f.confidence != null ? `${(f.confidence * 100).toFixed(0)}%` : null} />
      {f.evidence && Object.keys(f.evidence).length > 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-text-tertiary)' }}>
          {Object.entries(f.evidence).slice(0, 3).map(([k, v]) => (
            <div key={k}>{k}: <span style={{ color: 'var(--color-text-secondary)' }}>{String(v)}</span></div>
          ))}
        </div>
      )}
    </div>
  )
}
