import { useMemo, useState } from 'react'
import { scaleTime } from 'd3'
import { useAppState } from '../../core/store/AppContext.jsx'
import { PUMP_STATION_PODS, MONITORING_PODS, POD_NAMESPACES } from '../../core/constants/pods.js'
import TimelineRow from './TimelineRow.jsx'
import NamespaceHeader from './NamespaceHeader.jsx'
import CorrelationBracket from './CorrelationBracket.jsx'

const ROW_HEIGHT = 28
const LABEL_WIDTH = 140
const NS_ORDER = ['pump-station', 'monitoring']

function TimeAxis({ xScale, width, ticks }) {
  return (
    <div style={{ display: 'flex', height: 24, position: 'relative', marginLeft: LABEL_WIDTH }}>
      {ticks.map((t, i) => {
        const x = xScale(t)
        return (
          <div key={i} style={{ position: 'absolute', left: x, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 1, height: 8, background: 'var(--color-border-primary)' }} />
            <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
              {new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function TimelineCanvas({ windowMs, typeFilter, nsFilter, paused }) {
  const { findings, correlatedAlerts } = useAppState()
  const [collapsed, setCollapsed] = useState({})

  const now = paused ? (window.__timelinePauseTs || Date.now()) : Date.now()
  const domainStart = now - windowMs
  const canvasWidth = 900

  const xScale = useMemo(() => (
    scaleTime().domain([domainStart, now]).range([0, canvasWidth])
  ), [domainStart, now, canvasWidth])

  const ticks = useMemo(() => xScale.ticks(6).map(t => t.getTime()), [xScale])

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      const ms = f.timestamp ? new Date(f.timestamp).getTime() : 0
      if (ms < domainStart || ms > now) return false
      if (typeFilter !== 'all' && f.severity !== typeFilter) return false
      return true
    })
  }, [findings, domainStart, now, typeFilter])

  const allPods = [...PUMP_STATION_PODS, ...MONITORING_PODS]
  const podsByNs = {}
  NS_ORDER.forEach(ns => { podsByNs[ns] = allPods.filter(p => POD_NAMESPACES[p] === ns) })

  const filteredAlerts = useMemo(() => {
    return correlatedAlerts.filter(a => {
      const ms = a.timestamp ? new Date(a.timestamp).getTime() : 0
      return ms >= domainStart && ms <= now
    })
  }, [correlatedAlerts, domainStart, now])

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
      <TimeAxis xScale={xScale} width={canvasWidth} ticks={ticks} />

      <div style={{ position: 'relative', minWidth: canvasWidth + LABEL_WIDTH }}>
        {NS_ORDER.filter(ns => !nsFilter || ns === nsFilter).map(ns => {
          const pods = podsByNs[ns] || []
          const isCollapsed = collapsed[ns]

          return (
            <div key={ns}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: LABEL_WIDTH, flexShrink: 0 }}>
                  <NamespaceHeader
                    ns={ns} podCount={pods.length}
                    collapsed={isCollapsed}
                    onToggle={() => setCollapsed(c => ({ ...c, [ns]: !c[ns] }))}
                  />
                </div>
                <div style={{ flex: 1 }} />
              </div>

              {!isCollapsed && pods.map(pod => (
                <div key={pod} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    width: LABEL_WIDTH, flexShrink: 0, height: ROW_HEIGHT,
                    display: 'flex', alignItems: 'center', padding: '0 8px',
                    borderBottom: '1px solid var(--color-border-secondary)',
                    fontSize: 11, color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                  }}>
                    <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{pod}</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <TimelineRow podName={pod} findings={filteredFindings} xScale={x => xScale(x)} rowHeight={ROW_HEIGHT} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {filteredAlerts.map((a, i) => {
          const ms = new Date(a.timestamp).getTime()
          const x = xScale(ms)
          return (
            <CorrelationBracket
              key={i} alert={a}
              xLeft={LABEL_WIDTH + x}
              width={Math.max(40, (a.duration_s || 60) * (canvasWidth / (windowMs / 1000)))}
              rowCount={NS_ORDER.reduce((sum, ns) => sum + (podsByNs[ns]?.length || 0), 0)}
            />
          )
        })}
      </div>
    </div>
  )
}
