import { useState } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import { useDispatch } from '../../core/store/AppContext.jsx'
import { NAMESPACES } from '../../core/constants/pods.js'

export default function GraphControls({ showPvcEdges, setShowPvcEdges, showMonitoring, setShowMonitoring, onlyAnomalous, setOnlyAnomalous }) {
  const { graph } = useAppState()
  const dispatch = useDispatch()

  const lastRebuild = graph?.timestamp
    ? new Date(graph.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  function handleRediscover() {
    fetch('/api/graph').then(r => r.json()).then(data => {
      dispatch({ type: 'GRAPH_UPDATE', payload: data })
    }).catch(() => {})
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
      borderBottom: '1px solid var(--color-border-secondary)',
      background: 'var(--color-bg-surface)', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>Correlation Map</span>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showPvcEdges} onChange={e => setShowPvcEdges(e.target.checked)} />
          PVC edges
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showMonitoring} onChange={e => setShowMonitoring(e.target.checked)} />
          Monitoring pods
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyAnomalous} onChange={e => setOnlyAnomalous(e.target.checked)} />
          Anomalous only
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {lastRebuild && (
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Last rebuild {lastRebuild}</span>
        )}
        <button
          onClick={handleRediscover}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', color: 'var(--color-info)', border: '1px solid var(--color-info)',
          }}
        >
          Rediscover
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--color-text-tertiary)' }}>
        <span><span style={{ display: 'inline-block', width: 16, borderTop: '2px solid var(--color-text-tertiary)', marginRight: 4, verticalAlign: 'middle' }} />pipeline</span>
        <span><span style={{ display: 'inline-block', width: 16, borderTop: '2px dashed var(--color-text-tertiary)', marginRight: 4, verticalAlign: 'middle' }} />shared PVC</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--color-danger)', marginRight: 4, verticalAlign: 'middle' }} />critical</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--color-warning)', marginRight: 4, verticalAlign: 'middle' }} />warning</span>
      </div>
    </div>
  )
}
