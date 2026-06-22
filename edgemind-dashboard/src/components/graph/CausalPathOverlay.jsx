import { useMemo } from 'react'
import { NODE_POSITIONS } from '../../core/constants/topology.js'

export default function CausalPathOverlay({ causalChain = [] }) {
  const points = useMemo(() => {
    return causalChain
      .map(pod => NODE_POSITIONS[pod])
      .filter(Boolean)
      .map(p => `${p.x},${p.y}`)
      .join(' ')
  }, [causalChain])

  if (!points || causalChain.length < 2) return null

  return (
    <polyline
      points={points}
      fill="none"
      stroke="var(--color-coral)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="12 6"
      opacity={0.85}
      className="animate-dash-flow"
    />
  )
}
