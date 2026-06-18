import { useAppState } from '../../../core/store/AppContext.jsx'

export default function MockUploadPanel({ podName }) {
  const { metrics } = useAppState()
  const m = metrics[podName] || {}

  const netRxArr = m.net_rx || []
  const netRx = netRxArr.length ? netRxArr[netRxArr.length - 1] : null

  const total = netRxArr.reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>CLOUD UPLOAD SINK</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Receive rate</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
            {netRx != null ? `${(netRx / 1024).toFixed(1)} KB/s` : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Session total</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
            {total > 0 ? `${(total / 1024 / 1024).toFixed(2)} MB` : '—'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
        Simulates a cloud upload endpoint. Receives Parquet files from batch-sync and counts received bytes. No actual upload is performed.
      </div>
    </div>
  )
}
