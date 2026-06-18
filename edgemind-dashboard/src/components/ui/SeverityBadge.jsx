import { SEVERITY_COLORS } from '../../core/constants/colors.js'

export default function SeverityBadge({ severity }) {
  const sev = (severity || 'info').toLowerCase()
  const color = SEVERITY_COLORS[sev] || SEVERITY_COLORS.info
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 7px',
      borderRadius: 10,
      border: `1px solid ${color}`,
      color,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>
      {sev}
    </span>
  )
}
