import { useAppState } from '../../core/store/AppContext.jsx'

function StepRow({ step, status }) {
  const color = status === 'done' ? 'var(--color-success)'
    : status === 'active' ? 'var(--color-warning)'
    : 'var(--color-text-tertiary)'
  const icon = status === 'done' ? '✓' : status === 'active' ? '●' : '○'

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, padding: '2px 0' }}>
      <span style={{ color, width: 12, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: status === 'pending' ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)' }}>{step.label}</span>
    </div>
  )
}

export default function ScenarioCard({ scenario, running, completed, onLaunch, onClear, disabled }) {
  const { findings, correlatedAlerts } = useAppState()

  const stepStatuses = scenario.steps.map(step => {
    if (step.waitForAlert) {
      const hit = correlatedAlerts.some(a => a.timestamp && (Date.now() - new Date(a.timestamp).getTime()) < 10 * 60 * 1000)
      if (hit) return 'done'
    }
    if (step.anomalyType && step.pod) {
      const hit = findings.some(f => f.anomaly_type === step.anomalyType && f.pod === step.pod)
      if (hit) return 'done'
    }
    if (!step.anomalyType) {
      if (running || completed) return 'done'
    }
    return 'pending'
  })

  const doneCount = stepStatuses.filter(s => s === 'done').length
  const totalCount = scenario.steps.length
  const activeIdx = running ? stepStatuses.findIndex(s => s !== 'done') : -1
  const finalStatuses = stepStatuses.map((s, i) => (i === activeIdx ? 'active' : s))

  const borderColor = completed ? 'var(--color-success)' : running ? 'var(--color-warning)' : 'var(--color-border-secondary)'

  return (
    <div style={{
      background: 'var(--color-bg-card)', border: `1px solid ${borderColor}`,
      borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 3 }}>
          {scenario.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{scenario.description}</div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
        Expected: {scenario.expectedDuration}
      </div>

      <div>
        {scenario.steps.map((step, i) => (
          <StepRow key={step.id} step={step} status={finalStatuses[i]} />
        ))}
      </div>

      {running && (
        <div style={{ fontSize: 11, color: 'var(--color-warning)' }}>
          Progress: {doneCount}/{totalCount} steps
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {!running && !completed && (
          <button
            onClick={onLaunch}
            disabled={disabled}
            style={{
              flex: 1, padding: '5px 0', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
              background: disabled ? 'var(--color-border-primary)' : 'var(--color-info)',
              color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, opacity: disabled ? 0.5 : 1,
            }}
          >
            Launch
          </button>
        )}
        {(running || completed) && (
          <button
            onClick={onClear}
            style={{
              flex: 1, padding: '5px 0', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-primary)', fontSize: 12,
            }}
          >
            {completed ? 'Reset' : 'Abort'}
          </button>
        )}
      </div>
    </div>
  )
}
