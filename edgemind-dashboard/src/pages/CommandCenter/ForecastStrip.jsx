import { useAppState } from '../../core/store/AppContext.jsx'
import ForecastCard from '../../components/ui/ForecastCard.jsx'

export default function ForecastStrip() {
  const { forecasts, findings } = useAppState()

  const cpuThrottle = findings.find(f => f.anomaly_type === 'cpu_throttle')
  const cpuThrottlePod = cpuThrottle?.pod

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <ForecastCard
        title="PVC-2 Time to Full"
        value={forecasts.pvc2_ttf_minutes}
        unit="min"
        warning={forecasts.pvc2_ttf_minutes != null && forecasts.pvc2_ttf_minutes < 60}
        subtitle="export-data fill forecast"
      />
      <ForecastCard
        title="Feature Extractor OOM ETA"
        value={forecasts.featureExtractor_oom_minutes}
        unit="min"
        warning={forecasts.featureExtractor_oom_minutes != null && forecasts.featureExtractor_oom_minutes < 30}
        subtitle="based on RSS slope"
        color="var(--color-text-info)"
      />
      <ForecastCard
        title="CPU Throttle Risk"
        value={cpuThrottlePod ? '!' : null}
        unit=""
        warning={!!cpuThrottle}
        subtitle={cpuThrottlePod || 'No throttle detected'}
        color="var(--color-warning)"
      />
    </div>
  )
}
