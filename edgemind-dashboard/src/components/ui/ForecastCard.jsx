export default function ForecastCard({ title, subtitle, value, unit, color, warning = false }) {
  const c = color || (warning ? 'var(--color-warning)' : 'var(--color-text-info)')
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: `1px solid ${warning ? 'var(--color-warning-border)' : 'var(--color-border-secondary)'}`,
      borderRadius: 6,
      padding: '10px 14px',
      minWidth: 130,
      flex: 1,
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{title}</div>
      {value != null ? (
        <div style={{ fontSize: 22, fontWeight: 700, color: c, lineHeight: 1.1 }}>
          {value}<span style={{ fontSize: 13, marginLeft: 3 }}>{unit}</span>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>—</div>
      )}
      {subtitle && (
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  )
}
