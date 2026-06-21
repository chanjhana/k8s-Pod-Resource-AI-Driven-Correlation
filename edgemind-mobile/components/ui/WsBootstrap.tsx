/**
 * WsBootstrap — mounts the WebSocket + initial API calls.
 * This is a renderless component that lives inside AppProvider.
 */
import { useEffect } from 'react';
import { useWebSocket } from '../../core/ws/useWebSocket';
import { useAlertsAPI } from '../../core/api/useAlerts';
import { useSensorsAPI } from '../../core/api/useSensors';
import { useGraphAPI }   from '../../core/api/useGraph';

// Set to false to use the running server
const USE_MOCK = false;

export default function WsBootstrap() {
  useWebSocket();
  useAlertsAPI(USE_MOCK);
  useSensorsAPI(['pump1', 'pump2', 'pump3'], USE_MOCK);
  useGraphAPI(USE_MOCK);
  return null;
}
