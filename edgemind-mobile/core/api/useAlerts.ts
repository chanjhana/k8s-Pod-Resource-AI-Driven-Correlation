import { useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { API_CONFIG } from '../config';

// ── Mock data for offline/demo mode ───────────────────────────────────────
const MOCK_ALERTS = [
  {
    id: 'alert-001',
    pod_id: 'sensor-sim-1',
    pump_id: 'pump1',
    severity: 'CRITICAL' as const,
    title: 'Bearing Fault Pattern Detected',
    description: 'Vibration anomaly at bearing characteristic frequency (BCF). RMS vibration 4.2× above baseline.',
    root_cause: 'Inner race bearing defect identified. Vibration spectral analysis shows harmonic pattern at 187 Hz (BCF for 1450 RPM). Recommend bearing replacement within 48h.',
    evidence: [
      { metric: 'vibration_axial_rms', value: '4.21 g',    deviation: '+320%' },
      { metric: 'vibration_radial',    value: '3.87 g',    deviation: '+290%' },
      { metric: 'temperature',         value: '72.4 °C',   deviation: '+58%'  },
      { metric: 'rpm_stability',       value: '±18 RPM',   deviation: '+240%' },
    ],
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-002',
    pod_id: 'sensor-sim-2',
    pump_id: 'pump2',
    severity: 'WARNING' as const,
    title: 'Elevated Temperature',
    description: 'Pump 2 temperature trending upward. 15% above normal operating range.',
    root_cause: 'Possible partial flow restriction. Check inlet valve and strainer.',
    evidence: [
      { metric: 'temperature', value: '58.3 °C', deviation: '+15%' },
      { metric: 'flow_rate',   value: '82 L/min', deviation: '-12%' },
    ],
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-003',
    pod_id: 'sensor-sim-3',
    pump_id: 'pump3',
    severity: 'HEALTHY' as const,
    title: 'Chemical Dosing Pump — Normal',
    description: 'All parameters within normal operating range.',
    root_cause: '',
    evidence: [],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolved: true,
    resolution_time: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];

export function useAlertsAPI(useMock = false) {
  const { dispatch } = useApp();

  const fetchAlerts = useCallback(async () => {
    if (useMock) {
      dispatch({ type: 'SET_ALERTS', payload: MOCK_ALERTS });
      return;
    }
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/alerts`, {
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      dispatch({ type: 'SET_ALERTS', payload: Array.isArray(data) ? data : data.alerts ?? [] });
    } catch (err) {
      console.warn('[useAlertsAPI] Falling back to mock data:', err);
      dispatch({ type: 'SET_ALERTS', payload: MOCK_ALERTS });
    }
  }, [dispatch, useMock]);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { refetch: fetchAlerts };
}

export { MOCK_ALERTS };
