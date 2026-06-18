export default function WhyNotSection({ alternatives }) {
  if (!alternatives?.length) return null

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 6 }}>WHY NOT ALTERNATIVES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alternatives.slice(0, 3).map((alt, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 10px', background: 'var(--color-bg-surface)', borderRadius: 4, borderLeft: '3px solid var(--color-border-primary)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              {alt.hypothesis || alt.label || `Alt ${i + 1}`}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flex: 1 }}>
              {alt.reason || alt.why_not || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
