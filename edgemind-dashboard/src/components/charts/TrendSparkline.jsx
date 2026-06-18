import { LineChart, Line, ResponsiveContainer } from 'recharts'

function fmtSlope(slope) {
  if (slope == null) return ''
  const abs = Math.abs(slope)
  const unit = abs >= 1 ? `${abs.toFixed(1)} MB/min` : `${(abs * 1024).toFixed(0)} KB/min`
  return slope > 0 ? `↑ ${unit}` : `↓ ${unit}`
}

export default function TrendSparkline({ data = [], color = 'var(--color-text-info)', slopeMbPerMin }) {
  const chartData = data.map((v, i) => ({ i, v: v ?? 0 }))
  const rising = slopeMbPerMin != null && slopeMbPerMin > 0

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 60, display: 'inline-block' }}>
        <ResponsiveContainer width="100%" height={18}>
          <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </span>
      {slopeMbPerMin != null && (
        <span style={{ fontSize: 11, color: rising ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {fmtSlope(slopeMbPerMin)}
        </span>
      )}
    </span>
  )
}
