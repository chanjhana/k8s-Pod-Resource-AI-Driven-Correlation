import StatusStrip from '../../components/layout/StatusStrip.jsx'
import NamespaceCard from './NamespaceCard.jsx'
import IncidentCard from './IncidentCard.jsx'
import MiniGraph from './MiniGraph.jsx'
import TopRiskyPods from './TopRiskyPods.jsx'
import ForecastStrip from './ForecastStrip.jsx'
import RecentAlertsStrip from './RecentAlertsStrip.jsx'

export default function CommandCenter() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Command Center</h1>
        <StatusStrip />
      </div>

      {/* Row 1 — Namespace cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        <NamespaceCard namespace="pump-station" />
        <NamespaceCard namespace="monitoring" />
        <NamespaceCard namespace="kube-system" />
      </div>

      {/* Row 2 — Incident card + mini graph */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 58%' }}>
          <IncidentCard />
        </div>
        <div style={{ flex: 1 }}>
          <MiniGraph />
        </div>
      </div>

      {/* Row 3 — Top risky pods */}
      <TopRiskyPods />

      {/* Row 4 — Forecast strip */}
      <ForecastStrip />

      {/* Row 5 — Recent pump alerts */}
      <RecentAlertsStrip />
    </div>
  )
}
