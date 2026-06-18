import { useAppState } from '../../../core/store/AppContext.jsx'
import PvcGauge from '../../../components/ui/PvcGauge.jsx'
import TrendSparkline from '../../../components/charts/TrendSparkline.jsx'

export default function HistorianPanel({ podName }) {
  const { pvcs, metrics } = useAppState()
  const pvc1 = pvcs['historian-data'] || {}
  const m = metrics[podName] || {}

  const fsReadArr = m.fs_read || []
  const fsRead = fsReadArr.length ? fsReadArr[fsReadArr.length - 1] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>STORAGE (PVC-1)</div>

      <PvcGauge
        pvcName="historian-data"
        used={pvc1.used}
        capacity={pvc1.capacity}
        fillPct={pvc1.fill_pct}
        consumers={['data-historian', 'feature-extractor']}
      />

      <div>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>FS Read trend (bytes/s)</div>
        <TrendSparkline podName={podName} series="fs_read" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Read rate</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {fsRead != null ? `${(fsRead / 1024).toFixed(1)} KB/s` : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--color-bg-surface)', borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>PVC fill</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: pvc1.fill_pct > 85 ? 'var(--color-danger)' : pvc1.fill_pct > 70 ? 'var(--color-warning)' : 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>
            {pvc1.fill_pct != null ? `${pvc1.fill_pct.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
