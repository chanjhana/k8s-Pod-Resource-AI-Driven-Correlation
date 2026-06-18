import { Outlet } from 'react-router-dom'
import { useWebSocket } from '../../core/ws/useWebSocket.js'
import { useGraph } from '../../core/api/useGraph.js'
import { usePumpAlerts } from '../../core/api/usePumpAlerts.js'
import { useSensorReadings } from '../../core/api/useSensorReadings.js'
import Sidebar from './Sidebar.jsx'
import GlobalHeader from './GlobalHeader.jsx'

function DataHooks() {
  useWebSocket()
  useGraph()
  usePumpAlerts()
  useSensorReadings()
  return null
}

export default function Shell({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <DataHooks />
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <GlobalHeader />
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--color-bg-surface)',
          padding: '16px',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
