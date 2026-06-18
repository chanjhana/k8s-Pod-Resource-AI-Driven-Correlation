import { useState, useMemo } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import ActiveAlertsBanner from './ActiveAlertsBanner.jsx'
import IncidentList from './IncidentList.jsx'
import AIExplanationCard from './AIExplanationCard.jsx'
import AppAlertsFeed from './AppAlertsFeed.jsx'
import FindingsTable from './FindingsTable.jsx'
import PodEventLog from './PodEventLog.jsx'

export default function AIInvestigation() {
  const { correlatedAlerts } = useAppState()
  const [selectedId, setSelectedId] = useState(null)

  const selectedAlert = useMemo(() => {
    if (selectedId == null) return correlatedAlerts[0] || null
    return correlatedAlerts.find((a, i) => (a.id || i) === selectedId) || correlatedAlerts[0] || null
  }, [correlatedAlerts, selectedId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ActiveAlertsBanner />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--color-border-secondary)', overflow: 'hidden' }}>
          <IncidentList selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AIExplanationCard alert={selectedAlert} />

          {selectedAlert && (
            <div style={{ borderTop: '1px solid var(--color-border-secondary)', padding: '0 16px 12px', overflowY: 'auto', maxHeight: 260 }}>
              <FindingsTable alert={selectedAlert} />
              <div style={{ marginTop: 12 }}>
                <PodEventLog podName={selectedAlert?.root_cause_pod} />
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid var(--color-border-secondary)', overflow: 'hidden' }}>
          <AppAlertsFeed />
        </div>
      </div>
    </div>
  )
}
