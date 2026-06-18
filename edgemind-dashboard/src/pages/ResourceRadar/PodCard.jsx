import { useAppState } from '../../core/store/AppContext.jsx'
import StatusDot from '../../components/ui/StatusDot.jsx'
import MiniProgressBar from '../../components/ui/MiniProgressBar.jsx'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'
import { INFO_ONLY_PODS } from '../../core/constants/pods.js'

function fmtBytes(b) {
  if (b == null) return '—'
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB/s`
  return `${(b / 1e3).toFixed(0)} KB/s`
}

export default function PodCard({ podName, onClick }) {
  const { metrics, findings } = useAppState()
  const m = metrics[podName] || {}

  const cpuArr = m.cpu_usage || []
  const cpu = cpuArr.length ? cpuArr[cpuArr.length - 1] : null
  const cpuLimit = m.cpu_limit || null
  const cpuPct = cpu != null && cpuLimit ? (cpu / cpuLimit) * 100 : null

  const memArr = m.mem_working_set || []
  const mem = memArr.length ? memArr[memArr.length - 1] : null
  const memLimit = m.mem_limit || null
  const memPct = mem != null && memLimit ? (mem / memLimit) * 100 : null

  const txArr = m.net_tx || []
  const tx = txArr.length ? txArr[txArr.length - 1] : null

  const restarts = m.restarts || 0

  const podFindings = findings.filter(f => f.pod === podName)
  const worst = podFindings.find(f => f.severity === 'critical') || podFindings.find(f => f.severity === 'warning') || null
  const health = worst?.severity === 'critical' ? 'critical' : worst?.severity === 'warning' ? 'warning' : 'healthy'

  const infoOnly = INFO_ONLY_PODS.has(podName)

  return (
    <div
      onClick={() => onClick(podName)}
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid ${worst ? (health === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)') : 'var(--color-border-secondary)'}`,
        borderRadius: 6, padding: '10px 12px', cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <StatusDot health={worst ? health : 'healthy'} />
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: 'var(--color-text-primary)' }}>{podName}</span>
        {worst && <SeverityBadge severity={worst.severity} />}
      </div>
      {!infoOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MiniProgressBar label="CPU" value={cpuPct || 0} max={100} />
          <MiniProgressBar label="MEM" value={memPct || 0} max={100} />
          {tx != null && (
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>TX {fmtBytes(tx)}</div>
          )}
          {restarts > 0 && (
            <div style={{ fontSize: 10, color: 'var(--color-warning)' }}>Restarts: {restarts}</div>
          )}
        </div>
      )}
      {infoOnly && (
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Info only — no charts</div>
      )}
      {worst && (
        <div style={{ fontSize: 10, color: health === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)', marginTop: 6, borderTop: '1px solid var(--color-border-secondary)', paddingTop: 4 }}>
          {worst.anomaly_type}
        </div>
      )}
    </div>
  )
}
