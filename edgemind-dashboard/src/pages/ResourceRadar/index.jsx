import { useState } from 'react'
import PodListSidebar from './PodListSidebar.jsx'
import OverviewGrid from './OverviewGrid.jsx'
import PodDetailView from './PodDetailView.jsx'

export default function ResourceRadar() {
  const [selectedPod, setSelectedPod] = useState(null)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <PodListSidebar selectedPod={selectedPod} onSelectPod={setSelectedPod} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedPod ? (
          <PodDetailView podName={selectedPod} onBack={() => setSelectedPod(null)} />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>
              Resource Radar
            </div>
            <OverviewGrid onSelectPod={setSelectedPod} />
          </div>
        )}
      </div>
    </div>
  )
}
