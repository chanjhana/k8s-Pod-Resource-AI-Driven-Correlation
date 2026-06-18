import { useState } from 'react'
import TimelineControls from './TimelineControls.jsx'
import TimelineCanvas from './TimelineCanvas.jsx'
import HistoryPanel from './HistoryPanel.jsx'

export default function AnomalyTimeline() {
  const [windowMs, setWindowMs] = useState(15 * 60 * 1000)
  const [typeFilter, setTypeFilter] = useState('all')
  const [nsFilter, setNsFilter] = useState('')
  const [paused, setPaused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TimelineControls
        windowMs={windowMs} setWindowMs={setWindowMs}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        nsFilter={nsFilter} setNsFilter={setNsFilter}
        paused={paused} setPaused={setPaused}
      />
      <TimelineCanvas
        windowMs={windowMs} typeFilter={typeFilter}
        nsFilter={nsFilter} paused={paused}
      />
      <HistoryPanel />
    </div>
  )
}
