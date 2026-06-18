import { useAppState } from '../../../core/store/AppContext.jsx'
import { useNavigate } from 'react-router-dom'
import MiniProgressBar from '../../../components/ui/MiniProgressBar.jsx'

function StatBox({ label, value }) {
  return (
    <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>{value ?? '—'}</div>
    </div>
  )
}

export default function EdgeMindServerPanel({ podName }) {
  const { correlatedAlerts, findings, ws: wsStatus, metrics } = useAppState()
  const navigate = useNavigate()

  const m = metrics[podName] || {}
  const cpuArr = m.cpu_usage || []
  const cpu = cpuArr.length ? cpuArr[cpuArr.length - 1] : null
  const cpuLimit = m.cpu_limit || null
  const cpuPct = cpu != null && cpuLimit ? ((cpu / cpuLimit) * 100) : null

  const memArr = m.mem_working_set || []
  const mem = memArr.length ? memArr[memArr.length - 1] : null
  const memLimit = m.mem_limit || null
  const memPct = mem != null && memLimit ? ((mem / memLimit) * 100) : null

  const connected = wsStatus?.connected
  const activeAlert = correlatedAlerts.find(a => a.status !== 'resolved')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>ORCHESTRATOR</div>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 10,
          background: connected ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
          color: connected ? 'var(--color-success)' : 'var(--color-danger)',
        }}>
          WS {connected ? 'connected' : 'disconnected'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatBox label="Correlated Alerts" value={correlatedAlerts.length} />
        <StatBox label="Total Findings" value={findings.length} />
      </div>

      {cpuPct != null && <MiniProgressBar label="CPU" value={cpuPct} max={100} />}
      {memPct != null && <MiniProgressBar label="MEM" value={memPct} max={100} />}

      {activeAlert && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid var(--color-danger)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>ACTIVE INCIDENT</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            {activeAlert.nlp_summary?.slice(0, 80) || activeAlert.alert_type || 'Active incident'}…
          </div>
          <button
            onClick={() => navigate('/investigate')}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', color: 'var(--color-info)',
              border: '1px solid var(--color-info)',
            }}
          >
            Investigate →
          </button>
        </div>
      )}

      <button
        onClick={() => navigate('/graph')}
        style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
          background: 'transparent', color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-primary)', textAlign: 'left',
        }}
      >
        View Correlation Map →
      </button>
    </div>
  )
}
