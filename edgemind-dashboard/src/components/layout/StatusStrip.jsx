import { useAppState } from '../../core/store/AppContext.jsx'
import { useMemo } from 'react'

function podHealthFromFindings(findings) {
  const worst = {}
  findings.forEach(f => {
    const pod = f.pod
    if (!pod) return
    const sev = f.severity
    if (sev === 'critical' || !worst[pod]) {
      worst[pod] = sev
    } else if (sev === 'warning' && worst[pod] !== 'critical') {
      worst[pod] = sev
    }
  })
  return worst
}

export default function StatusStrip() {
  const { findings, metrics } = useAppState()

  const { running, warning, critical } = useMemo(() => {
    const worst = podHealthFromFindings(findings)
    let warning = 0, critical = 0
    Object.values(worst).forEach(s => {
      if (s === 'critical') critical++
      else if (s === 'warning') warning++
    })
    const running = Object.keys(metrics).length
    return { running, warning, critical }
  }, [findings, metrics])

  return (
    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
      <span>
        <span style={{ color: 'var(--color-success)' }}>✓</span> {running} Running
      </span>
      {warning > 0 && (
        <span>
          <span style={{ color: 'var(--color-warning)' }}>⚠</span> {warning} Warning
        </span>
      )}
      {critical > 0 && (
        <span>
          <span style={{ color: 'var(--color-danger)' }}>✕</span> {critical} Critical
        </span>
      )}
    </div>
  )
}
