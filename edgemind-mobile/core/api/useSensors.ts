import { useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { API_CONFIG } from '../config';

// Generate realistic mock sensor timeseries for demo mode
function mockTimeseries(pumpId: string, points = 20) {
  const bases: Record<string, Record<string, number>> = {
    pump1: { vibration_axial: 0.82, vibration_radial: 0.76, temperature: 46.5, rpm: 1452, flow_rate: 95, pressure: 4.2 },
    pump2: { vibration_axial: 0.71, vibration_radial: 0.65, temperature: 52.3, rpm: 1445, flow_rate: 88, pressure: 4.0 },
    pump3: { vibration_axial: 0.44, vibration_radial: 0.41, temperature: 38.1, rpm: 920,  flow_rate: 42, pressure: 2.8 },
  };
  const base = bases[pumpId] ?? bases.pump1;
  const now = Date.now();

  // Simulate fault injection for pump1 (bearing fault = rising vibration)
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - i) * 5_000; // 5s intervals
    const faultFactor = pumpId === 'pump1' ? 1 + (i / points) * 3.5 : 1;
    return {
      pump_id: pumpId,
      timestamp: new Date(t).toISOString(),
      vibration_axial:  +(base.vibration_axial  * faultFactor + (Math.random() - 0.5) * 0.05).toFixed(3),
      vibration_radial: +(base.vibration_radial  * faultFactor + (Math.random() - 0.5) * 0.04).toFixed(3),
      temperature:       +(base.temperature       + (pumpId === 'pump1' ? i * 0.8 : 0) + (Math.random() - 0.5) * 0.5).toFixed(1),
      rpm:               +(base.rpm               + (Math.random() - 0.5) * 10).toFixed(0),
      flow_rate:         +(base.flow_rate          + (Math.random() - 0.5) * 2).toFixed(1),
      pressure:          +(base.pressure           + (Math.random() - 0.5) * 0.1).toFixed(2),
    };
  });
}

export function useSensorsAPI(pumpIds = ['pump1', 'pump2', 'pump3'], useMock = false) {
  const { dispatch } = useApp();

  const fetchSensors = useCallback(async () => {
    for (const pump_id of pumpIds) {
      if (useMock) {
        dispatch({ type: 'SET_SENSORS', payload: { pump_id, readings: mockTimeseries(pump_id) } });
        continue;
      }
      try {
        const res = await fetch(`${API_CONFIG.baseUrl}/sensors?pump_id=${pump_id}`, {
          signal: AbortSignal.timeout(API_CONFIG.timeout),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        dispatch({ type: 'SET_SENSORS', payload: { pump_id, readings: data } });
      } catch {
        dispatch({ type: 'SET_SENSORS', payload: { pump_id, readings: mockTimeseries(pump_id) } });
      }
    }
  }, [dispatch, pumpIds.join(','), useMock]);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 5_000);  // 5s live refresh
    return () => clearInterval(interval);
  }, [fetchSensors]);

  return { refetch: fetchSensors };
}
