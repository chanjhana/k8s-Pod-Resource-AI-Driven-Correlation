import { useState } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import { useFaultInjection } from '../../core/api/useFaultInjection.js'

export default function DemoTopBar() {
  const { demoLab, ws: wsStatus } = useAppState()
  const [confirming, setConfirming] = useState(false)

  const pump1 = useFaultInjection('pump1')
  const pump2 = useFaultInjection('pump2')
  const pump3 = useFaultInjection('pump3')

  const activeFaults = Object.entries(demoLab.activeFaults || {}).filter(([, v]) => v)
  const anyActive = activeFaults.length > 0

  async function clearAll() {
    await Promise.all([pump1.clear(), pump2.clear(), pump3.clear()])
    setConfirming(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
      borderBottom: '1px solid var(--color-border-secondary)',
      background: 'var(--color-bg-surface)', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>Demo Lab</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: wsStatus?.connected ? 'var(--color-success)' : 'var(--color-danger)',
        }} />
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
          Backend {wsStatus?.connected ? 'online' : 'offline'}
        </span>
      </div>

      {activeFaults.map(([pump, fault]) => (
        <span key={pump} style={{ fontSize: 11, background: 'rgba(248,113,113,0.12)', color: 'var(--color-danger)', padding: '2px 8px', borderRadius: 10 }}>
          {pump}: {fault}
        </span>
      ))}

      <span style={{ flex: 1 }} />

      {anyActive && !confirming && (
        <button
          onClick={() => setConfirming(true)}
          style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)',
          }}
        >
          Clear All Faults
        </button>
      )}
      {confirming && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Clear all active faults?</span>
          <button
            onClick={clearAll}
            style={{ padding: '3px 10px', borderRadius: 4, cursor: 'pointer', background: 'var(--color-danger)', color: '#fff', border: 'none', fontSize: 11 }}
          >Confirm</button>
          <button
            onClick={() => setConfirming(false)}
            style={{ padding: '3px 10px', borderRadius: 4, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)', fontSize: 11 }}
          >Cancel</button>
        </div>
      )}
    </div>
  )
}
