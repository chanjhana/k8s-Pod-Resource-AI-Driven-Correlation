export default function TimelineControls({ windowMs, setWindowMs, typeFilter, setTypeFilter, nsFilter, setNsFilter, paused, setPaused }) {
  const windows = [
    { label: '5 min', ms: 5 * 60 * 1000 },
    { label: '15 min', ms: 15 * 60 * 1000 },
    { label: '1 hr', ms: 60 * 60 * 1000 },
  ]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px',
      borderBottom: '1px solid var(--color-border-secondary)',
      background: 'var(--color-bg-surface)', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>Anomaly Timeline</span>

      <div style={{ display: 'flex', gap: 2 }}>
        {windows.map(w => (
          <button
            key={w.ms}
            onClick={() => setWindowMs(w.ms)}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
              background: windowMs === w.ms ? 'var(--color-info)' : 'transparent',
              color: windowMs === w.ms ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${windowMs === w.ms ? 'var(--color-info)' : 'var(--color-border-primary)'}`,
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      <select
        value={typeFilter}
        onChange={e => setTypeFilter(e.target.value)}
        style={{
          background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-primary)', borderRadius: 4, padding: '3px 8px', fontSize: 11,
        }}
      >
        <option value="all">All severities</option>
        <option value="critical">Critical</option>
        <option value="warning">Warning</option>
        <option value="info">Info</option>
      </select>

      <select
        value={nsFilter}
        onChange={e => setNsFilter(e.target.value)}
        style={{
          background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-primary)', borderRadius: 4, padding: '3px 8px', fontSize: 11,
        }}
      >
        <option value="">All namespaces</option>
        <option value="pump-station">pump-station</option>
        <option value="monitoring">monitoring</option>
      </select>

      <button
        onClick={() => {
          if (!paused) window.__timelinePauseTs = Date.now()
          setPaused(p => !p)
        }}
        style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
          background: paused ? 'rgba(251,191,36,0.15)' : 'transparent',
          color: paused ? 'var(--color-warning)' : 'var(--color-text-secondary)',
          border: `1px solid ${paused ? 'var(--color-warning)' : 'var(--color-border-primary)'}`,
        }}
      >
        {paused ? '▶ Resume' : '⏸ Pause'}
      </button>
    </div>
  )
}
