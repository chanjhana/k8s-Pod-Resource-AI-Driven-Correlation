import StatusDot from '../../components/ui/StatusDot.jsx'
import { useAppState } from '../../core/store/AppContext.jsx'
import { INFO_ONLY_PODS } from '../../core/constants/pods.js'

function podHealth(findings, podName) {
  const pf = findings.filter(f => f.pod === podName)
  if (pf.some(f => f.severity === 'critical')) return 'critical'
  if (pf.some(f => f.severity === 'warning'))  return 'warning'
  if (pf.length > 0)                           return 'healthy'
  return INFO_ONLY_PODS.has(podName) ? 'unknown' : 'healthy'
}

export default function PodListItem({ podName, isSelected, onClick }) {
  const { findings } = useAppState()
  const health = podHealth(findings, podName)
  const hasAnomaly = findings.some(f => f.pod === podName)

  return (
    <div
      onClick={() => onClick(podName)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', cursor: 'pointer',
        borderLeft: `3px solid ${isSelected ? 'var(--color-info)' : 'transparent'}`,
        background: isSelected ? 'rgba(56,189,248,0.07)' : 'transparent',
        fontSize: 12,
      }}
    >
      <StatusDot health={health} />
      <span style={{ color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', flex: 1 }}>
        {podName}
      </span>
      {hasAnomaly && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: health === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)',
          flexShrink: 0,
        }} />
      )}
    </div>
  )
}
