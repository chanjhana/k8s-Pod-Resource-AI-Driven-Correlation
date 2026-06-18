import SensorSimControl from './SensorSimControl.jsx'

const PUMPS = ['pump1', 'pump2', 'pump3']

export default function ManualFaultControls() {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, marginBottom: 10 }}>MANUAL FAULT INJECTION</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {PUMPS.map(pump => <SensorSimControl key={pump} pumpId={pump} />)}
      </div>
    </div>
  )
}
