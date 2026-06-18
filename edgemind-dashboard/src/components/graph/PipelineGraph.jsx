import { useMemo } from 'react'
import { useAppState } from '../../core/store/AppContext.jsx'
import { LAYERS, PVC_NODES, NODE_POSITIONS, SERVICE_EDGES, DATA_EDGES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../core/constants/topology.js'
import GraphNode from './GraphNode.jsx'
import GraphEdge, { GraphEdgeMarkers } from './GraphEdge.jsx'
import CausalPathOverlay from './CausalPathOverlay.jsx'

function podHealth(findings, podName) {
  const podFindings = findings.filter(f => f.pod === podName)
  if (podFindings.some(f => f.severity === 'critical')) return 'critical'
  if (podFindings.some(f => f.severity === 'warning'))  return 'warning'
  if (podFindings.length > 0)                           return 'healthy'
  return 'unknown'
}

export default function PipelineGraph({
  onNodeClick,
  showPvcEdges = true,
  showMonitoring = true,
  onlyAnomalous = false,
  width,
  height,
}) {
  const { findings, activeIncident, metrics } = useAppState()

  const causalChain = activeIncident?.causal_chain || []
  const rootCausePod = activeIncident?.root_cause_pod || null

  const allPods = useMemo(() => LAYERS.flat(), [])

  const podHealthMap = useMemo(() => {
    const map = {}
    allPods.forEach(pod => { map[pod] = podHealth(findings, pod) })
    return map
  }, [findings, allPods])

  const activeFindingPods = useMemo(() => new Set(findings.map(f => f.pod)), [findings])

  const svgW = width  || CANVAS_WIDTH
  const svgH = height || CANVAS_HEIGHT

  return (
    <svg
      width={svgW}
      height={svgH}
      style={{ overflow: 'visible', fontFamily: 'inherit' }}
    >
      <GraphEdgeMarkers />

      {/* Service edges */}
      {SERVICE_EDGES.map((e, i) => (
        <GraphEdge
          key={`se-${i}`}
          fromPos={NODE_POSITIONS[e.from]}
          toPos={NODE_POSITIONS[e.to]}
          type="service"
          health={podHealthMap[e.from] || 'unknown'}
          isActive={causalChain.includes(e.from) && causalChain.includes(e.to)}
        />
      ))}

      {/* Data (PVC) edges */}
      {showPvcEdges && DATA_EDGES.map((e, i) => (
        <GraphEdge
          key={`de-${i}`}
          fromPos={NODE_POSITIONS[e.from]}
          toPos={NODE_POSITIONS[e.to]}
          type="shared-data"
          health="unknown"
          isActive={false}
        />
      ))}

      {/* Causal path overlay */}
      <CausalPathOverlay causalChain={causalChain} />

      {/* Pipeline pod nodes */}
      {allPods.map(pod => {
        const pos = NODE_POSITIONS[pod]
        if (!pos) return null
        const cpuArr = metrics[pod]?.cpu_usage || []
        const cpuRate = cpuArr.length ? cpuArr[cpuArr.length - 1] || 0 : 0
        const health = podHealthMap[pod]
        if (onlyAnomalous && health === 'unknown' && !causalChain.includes(pod)) return null
        return (
          <GraphNode
            key={pod}
            id={pod}
            label={pod}
            health={health}
            cpuRate={cpuRate}
            hasActiveFinding={activeFindingPods.has(pod)}
            isRootCause={pod === rootCausePod}
            isInCausalPath={causalChain.includes(pod)}
            isPvc={false}
            x={pos.x}
            y={pos.y}
            onClick={onNodeClick}
          />
        )
      })}

      {/* PVC nodes */}
      {PVC_NODES.map(pvc => {
        const pos = NODE_POSITIONS[pvc.id]
        if (!pos) return null
        return (
          <GraphNode
            key={pvc.id}
            id={pvc.id}
            label={pvc.label}
            sublabel={pvc.sublabel}
            health="unknown"
            isPvc={true}
            x={pos.x}
            y={pos.y}
            onClick={onNodeClick}
          />
        )
      })}
    </svg>
  )
}
