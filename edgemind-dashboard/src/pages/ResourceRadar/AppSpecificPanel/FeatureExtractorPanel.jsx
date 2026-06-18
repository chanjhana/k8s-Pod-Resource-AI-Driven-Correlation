import { useAppState } from '../../../core/store/AppContext.jsx'
import TrendSparkline from '../../../components/charts/TrendSparkline.jsx'
import IsoZoneBadge from '../../../components/ui/IsoZoneBadge.jsx'

const PUMPS = ['pump1', 'pump2', 'pump3']

function PumpBearingRow({ pump, sensorReadings }) {
  const readings = sensorReadings[pump] || {}
  const vib = readings.vibration_axial
  const score = readings.bearing_health_score

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--color-border-secondary)', fontSize: 12 }}>
      <span style={{ width: 56, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{pump}</span>
      <span style={{ flex: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
        {vib != null ? `${Number(vib).toFixed(2)} mm/s axial` : '— no data'}
      </span>
      {vib != null && <IsoZoneBadge mmPerS={vib} />}
      {score != null && (
        <span style={{
          fontSize: 11, padding: '1px 6px', borderRadius: 10,
          background: score > 0.8 ? 'rgba(52,211,153,0.12)' : score > 0.5 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
          color: score > 0.8 ? 'var(--color-success)' : score > 0.5 ? 'var(--color-warning)' : 'var(--color-danger)',
        }}>
          BH {(score * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}

export default function FeatureExtractorPanel({ podName }) {
  const { sensorReadings, metrics } = useAppState()
  const m = metrics[podName] || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700 }}>BEARING HEALTH PER PUMP</div>

      {PUMPS.map(pump => (
        <PumpBearingRow key={pump} pump={pump} sensorReadings={sensorReadings} />
      ))}

      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Memory trend (extractor working set)</div>
        <TrendSparkline podName={podName} series="mem_working_set" />
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: 4, padding: '6px 10px' }}>
        Queries InfluxDB every 10 s. Computes vibration features (RMS, kurtosis, crest factor) and bearing health score via a lightweight ML model.
      </div>
    </div>
  )
}
