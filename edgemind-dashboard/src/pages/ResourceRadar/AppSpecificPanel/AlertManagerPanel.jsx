import { useAppState } from '../../../core/store/AppContext.jsx'
import SeverityBadge from '../../../components/ui/SeverityBadge.jsx'
import PvcGauge from '../../../components/ui/PvcGauge.jsx'

function fmtTime(isoStr) {
  if (!isoStr) return ''
  try {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return '' }
}

export default function AlertManagerPanel({ podName }) {
  const { pumpAlerts, pvcs } = useAppState()
  const exportPvc = pvcs['export-data'] || {}
  const alerts = pumpAlerts.slice(0, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>ACTIVE PUMP ALERTS</div>

      {alerts.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '12px 0' }}>No active alerts</div>
      )}

      {alerts.map((a, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', borderBottom: '1px solid var(--color-border-secondary)', fontSize: 11 }}>
          <SeverityBadge severity={a.severity || 'info'} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--color-text-primary)' }}>{a.pump_id || a.pump || '—'}</div>
            <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>{a.fault_mode || a.anomaly_type || a.message || '—'}</div>
          </div>
          <div style={{ color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{fmtTime(a.timestamp)}</div>
        </div>
      ))}

      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>EXPORT STORAGE (PVC-2)</div>
        <PvcGauge
          pvcName="export-data"
          used={exportPvc.used}
          capacity={exportPvc.capacity}
          fillPct={exportPvc.fill_pct}
          consumers={['alert-manager', 'batch-sync']}
        />
      </div>
    </div>
  )
}
