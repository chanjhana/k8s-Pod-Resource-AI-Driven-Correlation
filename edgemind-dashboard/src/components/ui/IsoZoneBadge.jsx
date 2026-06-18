const ZONE_COLORS = {
  A: 'var(--color-success)',
  B: 'var(--color-info)',
  C: 'var(--color-warning)',
  D: 'var(--color-danger)',
}

export function getVibZone(mmPerS) {
  if (mmPerS == null) return null
  if (mmPerS < 2.3)  return 'A'
  if (mmPerS < 4.5)  return 'B'
  if (mmPerS < 7.1)  return 'C'
  return 'D'
}

export default function IsoZoneBadge({ zone, mmPerS }) {
  const z = zone || getVibZone(mmPerS)
  if (!z) return null
  const color = ZONE_COLORS[z] || 'var(--color-text-tertiary)'
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 4,
      border: `1px solid ${color}`,
      color,
      fontSize: 10,
      fontWeight: 700,
    }}>
      ISO {z}
    </span>
  )
}
