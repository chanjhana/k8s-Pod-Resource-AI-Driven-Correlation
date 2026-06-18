import DemoTopBar from './DemoTopBar.jsx'
import ScenarioLauncher from './ScenarioLauncher.jsx'
import ManualFaultControls from './ManualFaultControls.jsx'
import LiveCascadeMonitor from './LiveCascadeMonitor.jsx'

export default function DemoLab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <DemoTopBar />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ScenarioLauncher />
        <ManualFaultControls />
        <LiveCascadeMonitor />
      </div>
    </div>
  )
}
