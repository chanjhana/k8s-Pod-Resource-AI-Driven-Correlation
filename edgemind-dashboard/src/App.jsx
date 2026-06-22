import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './core/store/AppContext.jsx'
import Shell from './components/layout/Shell.jsx'
import CommandCenter from './pages/CommandCenter/index.jsx'
import ResourceRadar from './pages/ResourceRadar/index.jsx'
import CorrelationMap from './pages/CorrelationMap/index.jsx'
import AnomalyTimeline from './pages/AnomalyTimeline/index.jsx'
import AIInvestigation from './pages/AIInvestigation/index.jsx'
import DemoLab from './pages/DemoLab/index.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell>
          <Routes>
            <Route path="/"            element={<CommandCenter />} />
            <Route path="/radar"       element={<ResourceRadar />} />
            <Route path="/graph"       element={<CorrelationMap />} />
            <Route path="/timeline"    element={<AnomalyTimeline />} />
            <Route path="/investigate" element={<AIInvestigation />} />
            <Route path="/demo"        element={<DemoLab />} />
          </Routes>
        </Shell>
      </AppProvider>
    </BrowserRouter>
  )
}
