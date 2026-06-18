import { NAMESPACE_COLORS } from '../../core/constants/colors.js'
import { POD_NAMESPACES } from '../../core/constants/pods.js'

export default function PodLabel({ pod, showNamespace = false }) {
  const ns = POD_NAMESPACES[pod] || 'unknown'
  const color = NAMESPACE_COLORS[ns] || 'var(--color-text-tertiary)'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '1px 7px',
      borderRadius: 4,
      background: `${color}1a`,
      border: `1px solid ${color}44`,
      color: 'var(--color-text-primary)',
      fontSize: 12,
    }}>
      {showNamespace && <span style={{ color, fontSize: 10 }}>{ns}</span>}
      {pod}
    </span>
  )
}
