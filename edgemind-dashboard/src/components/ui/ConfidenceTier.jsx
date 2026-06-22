function getTier(confidence) {
  if (confidence == null) return { label: 'UNKNOWN', color: 'var(--color-text-tertiary)' }
  if (confidence >= 0.9)  return { label: 'HIGH',         color: 'var(--color-success)' }
  if (confidence >= 0.7)  return { label: 'MED-HIGH',     color: 'var(--color-info)' }
  if (confidence >= 0.5)  return { label: 'MEDIUM',       color: 'var(--color-warning)' }
  return                          { label: 'INSUFFICIENT', color: 'var(--color-danger)' }
}

export default function ConfidenceTier({ confidence, value, compact }) {
  const resolved = confidence ?? value
  const { label, color } = getTier(resolved)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        padding: '1px 7px', borderRadius: 10,
        background: `${color}22`, border: `1px solid ${color}`,
        color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      {resolved != null && !compact && (
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>
          {(resolved * 100).toFixed(0)}%
        </span>
      )}
    </span>
  )
}
