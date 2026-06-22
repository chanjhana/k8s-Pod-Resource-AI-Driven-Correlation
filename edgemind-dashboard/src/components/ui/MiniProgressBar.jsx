export default function MiniProgressBar({ value, max, label, unit = '%', warn = 70, crit = 85 }) {
  const pct = max ? Math.min(100, (value / max) * 100) : (value || 0)
  const color = pct >= crit ? 'var(--color-danger)' :
                pct >= warn ? 'var(--color-warning)' : 'var(--color-success)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      {label && <span style={{ color: 'var(--color-text-tertiary)', width: 28, flexShrink: 0 }}>{label}</span>}
      <div style={{
        flex: 1,
        height: 4,
        borderRadius: 2,
        background: 'var(--color-border-secondary)',
        overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ color: 'var(--color-text-secondary)', width: 36, textAlign: 'right', flexShrink: 0 }}>
        {Math.round(pct)}{unit}
      </span>
    </div>
  )
}
