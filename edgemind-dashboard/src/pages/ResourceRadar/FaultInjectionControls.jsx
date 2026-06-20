import { useState } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import { useFaultInjection } from '../../core/api/useFaultInjection.js'
import { POD_TO_PUMP } from '../../core/constants/pods.js'
import { FAULT_MODES } from '../../core/constants/faultModes.js'

export default function FaultInjectionControls({ selectedPod }) {
  const { demoLab } = useAppState()
  const pumpId = POD_TO_PUMP[selectedPod] || 'pump1'
  const { inject, clear, loading, error } = useFaultInjection(pumpId)

  const [mode, setMode] = useState('imbalance')
  const [duration, setDuration] = useState(120)
  const activeFault = demoLab.activeFaults[pumpId]
  const selectedMode = FAULT_MODES.find(f => f.id === mode)

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 6,
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      alignSelf: 'stretch',
      boxSizing: 'border-box',
      minWidth: 340,
    }}>
      {/* Left Column: Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ color: 'var(--color-danger)', fontSize: 18 }}>⚡</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>
            INJECT FAULT
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {pumpId.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: '80%', background: 'var(--color-border-card)', flexShrink: 0 }} />

      {/* Right Column: Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10, justifyContent: 'center' }}>
        
        {/* Top row: Select & Duration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={mode} onChange={e => setMode(e.target.value)} style={{
            flex: 1, height: 26, background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-primary)', borderRadius: 4, padding: '0 8px', fontSize: 11,
            outline: 'none', cursor: 'pointer', minWidth: 0,
          }}>
            {FAULT_MODES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 60, flexShrink: 0 }}>
            {!selectedMode?.sustained ? (
              <>
                <input
                  type="number" value={duration} min={30} max={3600}
                  onChange={e => setDuration(Number(e.target.value))}
                  style={{
                    flex: 1, minWidth: 0, height: 26, background: 'var(--color-bg-input)', color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border-primary)', borderRadius: 4, padding: '0 4px', fontSize: 11, textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>s</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Bottom row: Actions & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => inject(mode, selectedMode?.sustained ? undefined : duration)}
            disabled={loading || !!activeFault}
            style={{
              flex: 1, height: 26, borderRadius: 4, cursor: loading || activeFault ? 'not-allowed' : 'pointer',
              background: 'var(--color-danger)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700,
              opacity: loading || activeFault ? 0.5 : 1, transition: 'all 0.2s', minWidth: 0,
            }}
          >
            ▶ Inject
          </button>
          <button
            onClick={clear}
            disabled={loading || !activeFault}
            style={{
              width: 60, height: 26, padding: 0, borderRadius: 4, cursor: loading || !activeFault ? 'not-allowed' : 'pointer',
              background: 'transparent', color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-primary)', fontSize: 11,
              opacity: loading || !activeFault ? 0.5 : 1, transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
