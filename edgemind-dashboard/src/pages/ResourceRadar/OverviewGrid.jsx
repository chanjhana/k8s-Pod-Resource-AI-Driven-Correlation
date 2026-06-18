import PvcFillRow from './PvcFillRow.jsx'
import PodCard from './PodCard.jsx'
import { PUMP_STATION_PODS, MONITORING_PODS } from '../../core/constants/pods.js'

const ALL_PODS = [...PUMP_STATION_PODS, ...MONITORING_PODS]

export default function OverviewGrid({ onSelectPod }) {
  return (
    <div>
      <PvcFillRow />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {ALL_PODS.map(pod => (
          <PodCard key={pod} podName={pod} onClick={onSelectPod} />
        ))}
      </div>
    </div>
  )
}
