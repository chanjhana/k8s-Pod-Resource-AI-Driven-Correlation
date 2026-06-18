import { useState } from 'react'
import PodListItem from './PodListItem.jsx'
import { PUMP_STATION_PODS, MONITORING_PODS } from '../../core/constants/pods.js'

const GROUPS = [
  { ns: 'pump-station', pods: PUMP_STATION_PODS, defaultOpen: true },
  { ns: 'monitoring',   pods: MONITORING_PODS,   defaultOpen: true },
]

export default function PodListSidebar({ selectedPod, onSelect }) {
  const [open, setOpen] = useState({ 'pump-station': true, monitoring: true })

  return (
    <div style={{
      width: 200, flexShrink: 0,
      borderRight: '1px solid var(--color-border-secondary)',
      overflowY: 'auto',
      height: '100%',
    }}>
      {GROUPS.map(({ ns, pods }) => (
        <div key={ns}>
          <div
            onClick={() => setOpen(p => ({ ...p, [ns]: !p[ns] }))}
            style={{
              padding: '6px 12px', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
              color: 'var(--color-text-tertiary)',
              display: 'flex', justifyContent: 'space-between',
              background: 'var(--color-bg-card)',
              borderBottom: '1px solid var(--color-border-secondary)',
            }}
          >
            <span>{ns.toUpperCase()}</span>
            <span>{open[ns] ? '▾' : '▸'}</span>
          </div>
          {open[ns] && pods.map(pod => (
            <PodListItem
              key={pod}
              podName={pod}
              isSelected={selectedPod === pod}
              onClick={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
