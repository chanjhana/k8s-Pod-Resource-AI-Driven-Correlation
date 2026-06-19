import { useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { API_CONFIG } from '../config';

const MOCK_GRAPH = {
  nodes: [
    { id: 'sensor-sim-1',      label: 'sensor-sim-1\npump1',    severity: 'CRITICAL', type: 'sensor' },
    { id: 'sensor-sim-2',      label: 'sensor-sim-2\npump2',    severity: 'WARNING',  type: 'sensor' },
    { id: 'sensor-sim-3',      label: 'sensor-sim-3\npump3',    severity: 'HEALTHY',  type: 'sensor' },
    { id: 'opc-ua-collector',  label: 'opc-ua-collector',       severity: 'HEALTHY',  type: 'collector' },
    { id: 'data-historian',    label: 'data-historian\nInfluxDB', severity: 'HEALTHY', type: 'storage' },
    { id: 'feature-extractor', label: 'feature-extractor',      severity: 'HEALTHY',  type: 'processor' },
    { id: 'health-scorer',     label: 'health-scorer',          severity: 'HEALTHY',  type: 'processor' },
    { id: 'alert-manager',     label: 'alert-manager',          severity: 'WARNING',  type: 'output' },
    { id: 'batch-sync',        label: 'batch-sync',             severity: 'HEALTHY',  type: 'output' },
    { id: 'mock-upload',       label: 'mock-upload',            severity: 'HEALTHY',  type: 'output' },
  ],
  edges: [
    { source: 'sensor-sim-1',      target: 'opc-ua-collector',  type: 'data' },
    { source: 'sensor-sim-2',      target: 'opc-ua-collector',  type: 'data' },
    { source: 'sensor-sim-3',      target: 'opc-ua-collector',  type: 'data' },
    { source: 'opc-ua-collector',  target: 'data-historian',    type: 'data' },
    { source: 'data-historian',    target: 'feature-extractor', type: 'data' },
    { source: 'feature-extractor', target: 'health-scorer',     type: 'data' },
    { source: 'health-scorer',     target: 'alert-manager',     type: 'trigger' },
    { source: 'health-scorer',     target: 'batch-sync',        type: 'trigger' },
    { source: 'batch-sync',        target: 'mock-upload',       type: 'upload' },
  ],
};

export function useGraphAPI(useMock = false) {
  const { dispatch } = useApp();

  const fetchGraph = useCallback(async () => {
    if (useMock) {
      dispatch({ type: 'SET_GRAPH', payload: MOCK_GRAPH });
      return;
    }
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}/graph`, {
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      dispatch({ type: 'SET_GRAPH', payload: data });
    } catch {
      dispatch({ type: 'SET_GRAPH', payload: MOCK_GRAPH });
    }
  }, [dispatch, useMock]);

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 15_000);
    return () => clearInterval(interval);
  }, [fetchGraph]);

  return { refetch: fetchGraph };
}

export { MOCK_GRAPH };
