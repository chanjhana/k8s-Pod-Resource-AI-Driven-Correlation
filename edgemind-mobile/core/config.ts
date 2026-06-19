/**
 * API configuration — edit API_BASE_URL to point at your FastAPI server.
 * For local dev: your machine's LAN IP (not localhost — device can't reach localhost).
 * For production: your deployed URL.
 */
export const API_CONFIG = {
  // ⚠️  Change this to your FastAPI server's LAN IP when running on a device
  baseUrl: 'http://localhost:8000',
  wsUrl:   'ws://localhost:8000/ws',
  timeout: 10_000,
};
