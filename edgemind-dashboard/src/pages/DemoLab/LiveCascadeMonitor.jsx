import { useMemo } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import { PUMP_STATION_PODS } from '../../core/constants/pods.js'
import MiniProgressBar from '../../components/ui/MiniProgressBar.jsx'

const WATCH_PODS = ['sensor-sim-2', 'opc-ua-collector', 'data-historian', 'feature-extractor', 'health-scorer']

function PodStatus({ podName, findings, metrics }) {
  const podFindings = findings.filter(f => f.pod === podName)
  const worst = podFindings.find(f => f.severity === 'critical') || podFindings.find(f => f.severity === 'warning')
  const health = worst?.severity === 'critical' ? 'critical' : worst?.severity === 'warning' ? 'warning' : 'healthy'
  const m = metrics[podName] || {}
  const cpuArr = m.cpu_usage || []
  const cpu = cpuArr.length ? cpuArr[cpuArr.length - 1] : null
  const cpuLimit = m.cpu_limit || 0.5
  const cpuPct = cpu != null ? (cpu / cpuLimit) * 100 : 0

  const dotColor = health === 'critical' ? 'var(--color-danger)' : health === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 90 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 6,
        background: 'var(--color-bg-surface)',
        border: `2px solid ${dotColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: dotColor, fontWeight: 700, textAlign: 'center',
        padding: 2, lineHeight: 1.2,
      }}>
        {podName.replace('sensor-sim', 'ss').replace('opc-ua-collector', 'opc').replace('data-historian', 'dh').replace('feature-extractor', 'fe').replace('health-scorer', 'hs')}
      </div>
      <div style={{ width: '100%' }}>
        <MiniProgressBar label="CPU" value={cpuPct} max={100} />
      </div>
      {worst && (
        <div style={{ fontSize: 9, color: dotColor, textAlign: 'center', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {worst.anomaly_type}
        </div>
      )}
    </div>
  )
}

export default function LiveCascadeMonitor() {
  const { findings, metrics, correlatedAlerts } = useAppState()

  const agentScoreboard = useMemo(() => {
    const recentCutoff = Date.now() - 10 * 60 * 1000
    const recent = findings.filter(f => f.timestamp && new Date(f.timestamp).getTime() > recentCutoff)
    const agents = ['cpu', 'memory', 'storage', 'network_log']
    return agents.map(agent => ({
      agent,
      count: recent.filter(f => f.agent === agent).length,
    }))
  }, [findings])

  const recentAlerts = correlatedAlerts.slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>LIVE CASCADE MONITOR</div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {WATCH_PODS.map((pod, i) => (
          <div key={pod} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PodStatus podName={pod} findings={findings} metrics={metrics} />
            {i < WATCH_PODS.length - 1 && (
              <span style={{ fontSize: 16, color: 'var(--color-text-tertiary)' }}>→</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 6 }}>DETECTION SCOREBOARD (last 10 min)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {agentScoreboard.map(({ agent, count }) => (
              <div key={agent} style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '6px 10px', textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: count > 0 ? 'var(--color-warning)' : 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{count}</div>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{agent}</div>
              </div>
            ))}
          </div>
        </div>

        {recentAlerts.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 6 }}>RECENT CORRELATED ALERTS</div>
            {recentAlerts.map((a, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '3px 0', borderBottom: '1px solid var(--color-border-secondary)' }}>
                {a.alert_type || 'Alert'}: <span style={{ color: 'var(--color-text-primary)' }}>{a.nlp_summary?.slice(0, 60)}…</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
