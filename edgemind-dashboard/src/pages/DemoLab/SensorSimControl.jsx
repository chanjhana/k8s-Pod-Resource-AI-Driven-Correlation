import { useState } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import { useFaultInjection } from '../../core/api/useFaultInjection.js'
import { FAULT_MODES } from '../../core/constants/faultModes.js'
import IsoZoneBadge from '../../components/ui/IsoZoneBadge.jsx'

function ReadingPill({ label, value, unit }) {
  return (
    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginRight: 6 }}>
      {label}: <span style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        {value != null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
      </span>
    </span>
  )
}

export default function SensorSimControl({ pumpId }) {
  const { sensorReadings, demoLab } = useAppState()
  const readings = sensorReadings[pumpId] || {}
  const { inject, clear, loading } = useFaultInjection(pumpId)
  const activeFault = demoLab.activeFaults?.[pumpId]

  const [mode, setMode] = useState('imbalance')
  const [duration, setDuration] = useState(120)
  const selectedMode = FAULT_MODES.find(f => f.id === mode)

  return (
    <div style={{ background: 'var(--color-bg-card)', borderRadius: 6, border: activeFault ? '1px solid var(--color-danger)' : '1px solid var(--color-border-secondary)', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-primary)' }}>{pumpId}</span>
        {activeFault && (
          <span style={{ fontSize: 10, background: 'rgba(248,113,113,0.12)', color: 'var(--color-danger)', padding: '1px 6px', borderRadius: 10 }}>
            {activeFault}
          </span>
        )}
        {readings.vibration_axial != null && <IsoZoneBadge mmPerS={readings.vibration_axial} />}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 8 }}>
        <ReadingPill label="Vib Rad" value={readings.vibration_radial} unit="mm/s" />
        <ReadingPill label="Vib Ax"  value={readings.vibration_axial}  unit="mm/s" />
        <ReadingPill label="Temp"    value={readings.temperature}       unit="°C" />
        <ReadingPill label="RPM"     value={readings.rpm}               unit="rpm" />
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={mode} onChange={e => setMode(e.target.value)} style={{
          background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-primary)', borderRadius: 4, padding: '3px 6px', fontSize: 11,
        }}>
          {FAULT_MODES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>

        {!selectedMode?.sustained && (
          <input
            type="number" value={duration} min={30} max={3600}
            onChange={e => setDuration(Number(e.target.value))}
            style={{
              width: 60, background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-primary)', borderRadius: 4, padding: '3px 6px', fontSize: 11,
            }}
          />
        )}

        <button
          onClick={() => inject(mode, selectedMode?.sustained ? undefined : duration)}
          disabled={loading || !!activeFault}
          style={{
            padding: '3px 10px', borderRadius: 4, cursor: loading || activeFault ? 'not-allowed' : 'pointer',
            background: 'var(--color-danger)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700,
            opacity: loading || activeFault ? 0.5 : 1,
          }}
        >Inject</button>

        <button
          onClick={clear}
          disabled={loading || !activeFault}
          style={{
            padding: '3px 8px', borderRadius: 4, cursor: loading || !activeFault ? 'not-allowed' : 'pointer',
            background: 'transparent', color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-primary)', fontSize: 11,
            opacity: loading || !activeFault ? 0.5 : 1,
          }}
        >Clear</button>
      </div>
    </div>
  )
}
