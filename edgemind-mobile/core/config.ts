/**
 * API configuration — edit API_BASE_URL to point at your FastAPI server.
 * For local dev: your machine's LAN IP (not localhost — device can't reach localhost).
 * For production: your deployed URL.
 */
export const API_CONFIG = {
  // Configured to point directly to VM public NodePort for physical mobile devices
  baseUrl: 'http://98.70.57.128:30080',
  wsUrl:   'ws://98.70.57.128:30080/ws',
  timeout: 10_000,
};
