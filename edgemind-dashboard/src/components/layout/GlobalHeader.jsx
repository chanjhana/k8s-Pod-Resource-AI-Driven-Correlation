import { useState, useEffect } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'

function UtcClock() {
  const [time, setTime] = useState(() => new Date().toUTCString().slice(17, 25))
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toUTCString().slice(17, 25)), 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{time} UTC</span>
}

function WsDot({ status }) {
  const color = status === 'connected' ? 'var(--color-success)' :
                status === 'reconnecting' ? 'var(--color-warning)' : 'var(--color-danger)'
  const pulse = status !== 'connected'
  return (
    <span
      title={`WebSocket: ${status}`}
      className={pulse ? 'animate-blink' : ''}
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

export default function GlobalHeader() {
  const { ws } = useAppState()

  return (
    <header style={{
      height: 'var(--header-height)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      borderBottom: '1px solid var(--color-border-secondary)',
      background: 'var(--color-bg-card)',
      gap: 12,
    }}>
      <span style={{ color: 'var(--color-info)', fontSize: 18, fontWeight: 700 }}>◈</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 14 }}>EdgeMind</span>
      <span style={{ color: 'var(--color-border-primary)', margin: '0 2px' }}>·</span>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>ABB Edgenius · pump-station</span>

      <div style={{ flex: 1 }} />

      <UtcClock />
      <WsDot status={ws.status} />
    </header>
  )
}
