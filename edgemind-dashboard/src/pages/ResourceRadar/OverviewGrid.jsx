import PvcFillRow from './PvcFillRow.jsx'
import PodCard from './PodCard.jsx'
import { PUMP_STATION_PODS, MONITORING_PODS } from '../../core/constants/pods.js'
import PanelHeader from '../../components/ui/PanelHeader.jsx'

const KUBE_SYSTEM_PODS = ['coredns', 'local-path-provisioner', 'metrics-server']

const NAMESPACE_GROUPS = [
  { ns: 'pump-station', pods: PUMP_STATION_PODS },
  { ns: 'monitoring',   pods: MONITORING_PODS },
  { ns: 'kube-system',  pods: KUBE_SYSTEM_PODS },
]

export default function OverviewGrid({ onSelectPod, nsFilter = 'pump-station' }) {
  const groups = NAMESPACE_GROUPS.filter(g => g.ns === nsFilter)

  return (
    <div>
      <PvcFillRow />
      {groups.map(({ ns, pods }) => (
        <div key={ns} style={{ marginBottom: 24 }}>
          <div style={{ paddingBottom: 6, marginBottom: 10, borderBottom: '1px solid var(--color-border-card)' }}>
            <PanelHeader title={ns} />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: 10,
            width: '100%',
            justifyContent: pods.length < 10 ? 'center' : 'flex-start',
          }}>
            {pods.map(pod => (
              <div key={pod} style={{ width: 'calc((100% - 90px) / 10)', flexShrink: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <PodCard podName={pod} onClick={onSelectPod} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
