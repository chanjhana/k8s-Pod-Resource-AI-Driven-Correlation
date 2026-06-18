import { SEVERITY_COLORS } from '../../core/constants/colors.js'

const BASE_W = 80
const BASE_H = 32

export default function GraphNode({
  id, label, sublabel,
  health = 'unknown',
  cpuRate = 0,
  hasActiveFinding = false,
  isRootCause = false,
  isInCausalPath = false,
  isPvc = false,
  x, y,
  onClick,
}) {
  const w = Math.round(Math.min(1.6, Math.max(1.0, cpuRate / 0.5)) * BASE_W)
  const h = BASE_H
  const cx = x - w / 2
  const cy = y - h / 2

  const borderColor = isRootCause ? 'var(--color-danger)' :
                      isInCausalPath ? 'var(--color-coral)' :
                      SEVERITY_COLORS[health] || SEVERITY_COLORS.unknown

  const bg = health === 'critical' ? 'rgba(248,113,113,0.12)' :
             health === 'warning'  ? 'rgba(251,191,36,0.10)' :
             'rgba(30,41,59,0.9)'

  return (
    <g
      className={hasActiveFinding ? 'animate-pulse-border' : ''}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick ? () => onClick(id) : undefined}
    >
      {isPvc ? (
        <>
          <ellipse cx={x} cy={cy + 4} rx={w / 2} ry={6} fill={bg} stroke={borderColor} strokeWidth={1.5} />
          <rect x={cx} y={cy + 4} width={w} height={h - 8} fill={bg} stroke="none" />
          <ellipse cx={x} cy={cy + h - 4} rx={w / 2} ry={6} fill={bg} stroke={borderColor} strokeWidth={1.5} />
          <line x1={cx} y1={cy + 4} x2={cx} y2={cy + h - 4} stroke={borderColor} strokeWidth={1.5} />
          <line x1={cx + w} y1={cy + 4} x2={cx + w} y2={cy + h - 4} stroke={borderColor} strokeWidth={1.5} />
        </>
      ) : (
        <rect
          x={cx} y={cy} width={w} height={h} rx={4}
          fill={bg} stroke={borderColor} strokeWidth={isRootCause || isInCausalPath ? 2 : 1.5}
        />
      )}
      <text x={x} y={y + (sublabel ? -3 : 4)} textAnchor="middle" fontSize={9} fill="var(--color-text-primary)" fontWeight={600}>
        {label.length > 14 ? label.slice(0, 13) + '…' : label}
      </text>
      {sublabel && (
        <text x={x} y={y + 8} textAnchor="middle" fontSize={8} fill="var(--color-text-tertiary)">
          {sublabel}
        </text>
      )}
    </g>
  )
}
