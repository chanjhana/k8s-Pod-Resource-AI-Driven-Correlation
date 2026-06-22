import { SEVERITY_COLORS } from '../../core/constants/colors.js'

const DOT_CHARS = { healthy: '●', warning: '◐', critical: '●', unknown: '○' }

export default function StatusDot({ health = 'unknown', size = 8, style: extra }) {
  const color = SEVERITY_COLORS[health] || SEVERITY_COLORS.unknown
  const pulse = health === 'critical'
  return (
    <span
      className={pulse ? 'animate-pulse-border' : ''}
      style={{
        display: 'inline-block',
        width: size, height: size, borderRadius: '50%',
        background: color,
        flexShrink: 0,
        ...extra,
      }}
      title={health}
    />
  )
}
