import { SEVERITY_COLORS } from '../../core/constants/colors.js'

export default function GraphEdge({
  fromPos, toPos,
  type = 'service',   // 'service' | 'shared-data'
  health = 'unknown',
  isActive = false,
}) {
  if (!fromPos || !toPos) return null
  const { x: x1, y: y1 } = fromPos
  const { x: x2, y: y2 } = toPos

  const color = isActive ? 'var(--color-coral)' :
                type === 'shared-data' ? 'var(--color-border-primary)' :
                SEVERITY_COLORS[health] || SEVERITY_COLORS.unknown

  const strokeWidth = isActive ? 2.5 : 1.5
  const dashArray   = type === 'shared-data' ? '5 3' : undefined

  // Simple straight line with a small arrow at the end
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return null
  const ux = dx / len, uy = dy / len
  const tx = x2 - ux * 18, ty = y2 - uy * 18  // stop before node

  return (
    <line
      x1={x1} y1={y1} x2={tx} y2={ty}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray}
      opacity={0.7}
      markerEnd={type === 'service' ? `url(#arrow-${health})` : undefined}
    />
  )
}

export function GraphEdgeMarkers() {
  const healths = ['healthy', 'warning', 'critical', 'unknown']
  return (
    <defs>
      {healths.map(h => (
        <marker key={h} id={`arrow-${h}`} markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={SEVERITY_COLORS[h] || SEVERITY_COLORS.unknown} opacity={0.7} />
        </marker>
      ))}
    </defs>
  )
}
