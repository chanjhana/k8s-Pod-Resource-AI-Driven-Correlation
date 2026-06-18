import { useAppState } from '../../../core/store/AppContext.jsx'

const PUMPS = ['pump1', 'pump2', 'pump3']

function ScoreBar({ pump, readings }) {
  const r = readings[pump] || {}
  const score = r.health_score ?? r.bearing_health_score ?? null
  const pct = score != null ? Math.round(score * 100) : null

  const color = pct == null ? 'var(--color-text-tertiary)'
    : pct >= 80 ? 'var(--color-success)'
    : pct >= 50 ? 'var(--color-warning)'
    : 'var(--color-danger)'

  const label = pct == null ? 'no data' : pct >= 80 ? 'HEALTHY' : pct >= 50 ? 'WARNING' : 'CRITICAL'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0', borderBottom: '1px solid var(--color-border-secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{pump}</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pct != null && (
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>{pct}%</span>
          )}
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: `${color}22`, color }}>{label}</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--color-border-secondary)', borderRadius: 3, overflow: 'hidden' }}>
        {pct != null && (
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
        )}
      </div>
    </div>
  )
}

export default function HealthScorerPanel({ podName }) {
  const { sensorReadings } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>PUMP HEALTH SCORES</div>

      {PUMPS.map(pump => (
        <ScoreBar key={pump} pump={pump} readings={sensorReadings} />
      ))}

      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: 4, padding: '6px 10px' }}>
        Health scores are computed from feature-extractor output. Thresholds: ≥80% = Healthy, 50–79% = Warning, &lt;50% = Critical.
      </div>
    </div>
  )
}
