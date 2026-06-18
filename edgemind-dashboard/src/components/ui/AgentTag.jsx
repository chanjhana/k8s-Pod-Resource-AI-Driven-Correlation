import { AGENT_COLORS } from '../../core/constants/colors.js'

const LABELS = {
  cpu:         'CPU',
  memory:      'MEM',
  storage:     'STOR',
  network_log: 'NET',
}

export default function AgentTag({ agent }) {
  const color = AGENT_COLORS[agent] || 'var(--color-text-tertiary)'
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 4,
      background: `${color}22`,
      border: `1px solid ${color}`,
      color,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {LABELS[agent] || agent}
    </span>
  )
}
