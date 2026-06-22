import { AGENT_COLORS } from '../../core/constants/colors.js'

const BARS = [
  { key: 'cpu',     label: 'CPU', color: AGENT_COLORS.cpu },
  { key: 'mem',     label: 'MEM', color: AGENT_COLORS.memory },
  { key: 'net',     label: 'NET', color: AGENT_COLORS.network_log },
  { key: 'pvc',     label: 'PVC', color: AGENT_COLORS.storage },
]

export default function SparkBar({ cpu = 0, mem = 0, net = 0, pvc = 0 }) {
  const vals = { cpu, mem, net, pvc }
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 24 }}>
      {BARS.map(b => {
        const h = Math.max(3, Math.round(vals[b.key] * 24))
        return (
          <div key={b.key} title={`${b.label}: ${Math.round(vals[b.key] * 100)}%`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div style={{ width: 6, height: h, background: b.color, borderRadius: 2 }} />
          </div>
        )
      })}
    </div>
  )
}
