import { useNavigate } from 'react-router-dom'
import { useAppState } from '../../core/store/AppContext.jsx'
import { POD_ROLES, POD_NAMESPACES } from '../../core/constants/pods.js'
import { UPSTREAM, DOWNSTREAM } from '../../core/constants/topology.js'
import MetricTabs from '../../components/charts/MetricTabs.jsx'
import SeverityBadge from '../../components/ui/SeverityBadge.jsx'
import AgentTag from '../../components/ui/AgentTag.jsx'

export default function NodeDetailDrawer({ podName, onClose }) {
  const { findings } = useAppState()
  const navigate = useNavigate()

  if (!podName) return null

  const role = POD_ROLES[podName] || ''
  const ns = POD_NAMESPACES[podName] || 'unknown'
  const podFindings = findings.filter(f => f.pod === podName).slice(0, 5)
  const upstream = UPSTREAM[podName] || []
  const downstream = DOWNSTREAM[podName] || []

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 320,
      background: 'var(--color-bg-card)', borderLeft: '1px solid var(--color-border-secondary)',
      display: 'flex', flexDirection: 'column', zIndex: 20,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{podName}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{ns} · {role.slice(0, 50)}{role.length > 50 ? '…' : ''}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {podFindings.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 6 }}>ACTIVE FINDINGS</div>
            {podFindings.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--color-border-secondary)', fontSize: 11 }}>
                <SeverityBadge severity={f.severity} />
                <AgentTag agent={f.agent} />
                <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{f.anomaly_type}</span>
              </div>
            ))}
          </div>
        )}

        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 4 }}>METRICS</div>
          <MetricTabs podName={podName} />
        </div>

        {(upstream.length > 0 || downstream.length > 0) && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 6 }}>TOPOLOGY</div>
            {upstream.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Upstream: </span>
                {upstream.map(p => (
                  <span key={p} style={{ fontSize: 11, color: 'var(--color-info)', marginRight: 4 }}>{p}</span>
                ))}
              </div>
            )}
            {downstream.length > 0 && (
              <div>
                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Downstream: </span>
                {downstream.map(p => (
                  <span key={p} style={{ fontSize: 11, color: 'var(--color-info)', marginRight: 4 }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: 14, borderTop: '1px solid var(--color-border-secondary)' }}>
        <button
          onClick={() => navigate(`/radar?pod=${podName}`)}
          style={{
            width: '100%', padding: '6px 0', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', color: 'var(--color-info)', border: '1px solid var(--color-info)', fontSize: 12,
          }}
        >
          View in Resource Radar →
        </button>
      </div>
    </div>
  )
}
