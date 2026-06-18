import SensorSimPanel from './SensorSimPanel.jsx'
import CollectorPanel from './CollectorPanel.jsx'
import HistorianPanel from './HistorianPanel.jsx'
import FeatureExtractorPanel from './FeatureExtractorPanel.jsx'
import HealthScorerPanel from './HealthScorerPanel.jsx'
import AlertManagerPanel from './AlertManagerPanel.jsx'
import BatchSyncPanel from './BatchSyncPanel.jsx'
import MockUploadPanel from './MockUploadPanel.jsx'
import EdgeMindAgentsPanel from './EdgeMindAgentsPanel.jsx'
import EdgeMindServerPanel from './EdgeMindServerPanel.jsx'
import InfraOnlyPanel from './InfraOnlyPanel.jsx'

const PANEL_MAP = {
  'sensor-sim-1':   SensorSimPanel,
  'sensor-sim-2':   SensorSimPanel,
  'sensor-sim-3':   SensorSimPanel,
  'opc-ua-collector':  CollectorPanel,
  'data-historian':    HistorianPanel,
  'feature-extractor': FeatureExtractorPanel,
  'health-scorer':     HealthScorerPanel,
  'alert-manager':     AlertManagerPanel,
  'batch-sync':        BatchSyncPanel,
  'mock-upload':       MockUploadPanel,
  'edgemind-agents':   EdgeMindAgentsPanel,
  'edgemind-server':   EdgeMindServerPanel,
}

export default function AppSpecificPanel({ podName }) {
  const Panel = PANEL_MAP[podName] || InfraOnlyPanel
  return <Panel podName={podName} />
}
