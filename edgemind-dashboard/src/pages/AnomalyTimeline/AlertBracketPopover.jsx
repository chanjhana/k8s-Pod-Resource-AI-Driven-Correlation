import { useEffect, useRef } from 'react'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'
import ConfidenceTier from '../../components/ui/ConfidenceTier.jsx'

export default function AlertBracketPopover({ alert: a, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!a) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50, width: 380,
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
        borderRadius: 8, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <SeverityBadge severity={a.severity || 'critical'} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', flex: 1 }}>
          {a.alert_type || 'Correlated Alert'}
        </span>
        <ConfidenceTier value={a.confidence} />
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>✕</button>
      </div>

      {a.nlp_summary && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{a.nlp_summary}</div>
      )}

      {a.causal_chain?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>CAUSAL CHAIN</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {a.causal_chain.map((pod, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--color-info)' }}>{pod}</span>
                {i < a.causal_chain.length - 1 && <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {a.recommendation && (
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}>RECOMMENDATION — </span>
          {a.recommendation}
        </div>
      )}
    </div>
  )
}
