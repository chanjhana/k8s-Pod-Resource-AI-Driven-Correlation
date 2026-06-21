import { useState } from 'react'
import { useDispatch, useAppState } from '../../core/store/AppContext.jsx'
import { useFaultInjection } from '../../core/api/useFaultInjection.js'
import { SCENARIOS } from '../../core/constants/faultModes.js'
import ScenarioCard from './ScenarioCard.jsx'

export default function ScenarioLauncher({ showError }) {
  const { demoLab } = useAppState()
  const dispatch = useDispatch()
  const [runningScenario, setRunningScenario] = useState(null)
  const [completedScenario, setCompletedScenario] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const pump1 = useFaultInjection('pump1')
  const pump2 = useFaultInjection('pump2')
  const pump3 = useFaultInjection('pump3')
  const injectors = { pump1, pump2, pump3 }

  const anyActiveFault = Object.values(demoLab.activeFaults || {}).some(Boolean)

  async function handleLaunch(scenario) {
    if (anyActiveFault && runningScenario !== scenario.id) {
      showError("Cannot launch scenario: Another fault or scenario is currently active. Please stop it first.")
      return
    }

    setRunningScenario(scenario.id)
    setCompletedScenario(null)
    if (scenario.faultMode && scenario.targetPump) {
      const inj = injectors[scenario.targetPump]
      if (inj) await inj.inject(scenario.faultMode)
    }
    dispatch({ type: 'SET_DEMO_SCENARIO', payload: { activeScenarioId: scenario.id, scenarioStartedAt: new Date().toISOString() } })
  }

  async function handleClear(scenario) {
    if (scenario.targetPump) {
      const inj = injectors[scenario.targetPump]
      if (inj) await inj.clear()
    }
    if (runningScenario === scenario.id) {
      setCompletedScenario(scenario.id)
      setRunningScenario(null)
    } else {
      setCompletedScenario(null)
    }
    dispatch({ type: 'SET_DEMO_SCENARIO', payload: { activeScenarioId: null } })
  }



  const nextScenario = () => setCurrentIndex((prev) => (prev + 1) % SCENARIOS.length)
  const prevScenario = () => setCurrentIndex((prev) => (prev === 0 ? SCENARIOS.length - 1 : prev - 1))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, background: 'var(--color-info)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
            Scenarios
          </span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prevScenario} style={navBtn}>‹</button>
          <button onClick={nextScenario} style={navBtn}>›</button>
        </div>
      </div>
      <div style={{ flex: 1, height: 210, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex',
          width: `${SCENARIOS.length * 100}%`,
          height: '100%',
          transform: `translateX(-${(currentIndex / SCENARIOS.length) * 100}%)`,
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
        }}>
          {SCENARIOS.map(scen => (
            <div key={scen.id} style={{ width: `${100 / SCENARIOS.length}%`, height: '100%', paddingBottom: 4, paddingRight: 4, paddingLeft: 2 }}>
              <ScenarioCard
                scenario={scen}
                running={runningScenario === scen.id}
                completed={completedScenario === scen.id}
                disabled={anyActiveFault || (runningScenario && runningScenario !== scen.id)}
                onLaunch={() => handleLaunch(scen)}
                onClear={() => handleClear(scen)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const navBtn = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)',
  color: 'var(--color-text-primary)', fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', boxShadow: '0 2px 4px var(--color-shadow)',
  lineHeight: 0, paddingBottom: 2
}
