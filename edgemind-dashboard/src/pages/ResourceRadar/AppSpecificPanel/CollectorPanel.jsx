import { useAppState } from '../../../core/store/AppContext.jsx'
import TrendSparkline from '../../../components/charts/TrendSparkline.jsx'

export default function CollectorPanel({ podName }) {
  const { metrics } = useAppState()
  const m = metrics[podName] || {}

  const netRxArr = m.net_rx || []
  const netRx = netRxArr.length ? netRxArr[netRxArr.length - 1] : null

  const fsWriteArr = m.fs_write || []
  const fsWrite = fsWriteArr.length ? fsWriteArr[fsWriteArr.length - 1] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>COLLECTION STATS</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>OPC-UA Ingest</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {netRx != null ? `${(netRx / 1024).toFixed(1)}` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>KB/s from sensors</div>
        </div>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>InfluxDB Writes</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {fsWrite != null ? `${(fsWrite / 1024).toFixed(1)}` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>KB/s to historian</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Network RX trend (bytes/s)</div>
        <TrendSparkline podName={podName} series="net_rx" />
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: 4, padding: '6px 10px' }}>
        Subscribes to all three sensor-sims via OPC-UA and batches telemetry into InfluxDB every 5 s.
      </div>
    </div>
  )
}
