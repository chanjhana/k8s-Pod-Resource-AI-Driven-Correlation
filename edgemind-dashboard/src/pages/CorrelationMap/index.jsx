import { useState } from 'react'
import GraphControls from './GraphControls.jsx'
import GraphCanvas from './GraphCanvas.jsx'
import NodeDetailDrawer from './NodeDetailDrawer.jsx'
import TimelineStrip from './TimelineStrip.jsx'

export default function CorrelationMap() {
  const [showPvcEdges, setShowPvcEdges] = useState(true)
  const [showMonitoring, setShowMonitoring] = useState(false)
  const [onlyAnomalous, setOnlyAnomalous] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <GraphControls
        showPvcEdges={showPvcEdges} setShowPvcEdges={setShowPvcEdges}
        showMonitoring={showMonitoring} setShowMonitoring={setShowMonitoring}
        onlyAnomalous={onlyAnomalous} setOnlyAnomalous={setOnlyAnomalous}
      />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <GraphCanvas
          showPvcEdges={showPvcEdges}
          showMonitoring={showMonitoring}
          onlyAnomalous={onlyAnomalous}
          onNodeClick={pod => setSelectedNode(pod)}
        />
        <TimelineStrip />

        {selectedNode && (
          <NodeDetailDrawer podName={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  )
}
