import { API_CONFIG } from '../config';

export interface ChatPayload {
  message: string;
  context?: { active_page: string; selected_pod?: string };
  history?: Array<{ role: string; content: string }>;
}

export interface ChatChunk {
  type: 'text' | 'chart' | 'link' | 'alert_card' | 'done';
  content?: string;
  [key: string]: any;
}

// ── Mock streaming response for offline/demo ────────────────────────────────
const MOCK_RESPONSES: Record<string, ChatChunk[]> = {
  default: [
    { type: 'text', content: 'Analysing current cluster state...' },
    { type: 'text', content: ' Pump 1 is showing a bearing fault pattern with vibration RMS 4.2× above baseline.' },
    { type: 'text', content: ' Root cause: Inner race bearing defect at 187 Hz harmonic frequency.' },
    { type: 'link', label: 'View in Dependency Graph', route: '/graph' },
  ],
  oom: [
    { type: 'text', content: 'OOM analysis: sensor-sim-1 container is approaching its memory limit.' },
    { type: 'text', content: ' Memory usage: 487 Mi of 512 Mi limit (95%).' },
    { type: 'chart', chart_type: 'line', metric: 'memory', pod: 'sensor-sim-1' },
    { type: 'link', label: 'View Alert History', route: '/history' },
  ],
  pump: [
    { type: 'text', content: 'Pump status summary:' },
    { type: 'text', content: '\n• Pump 1 (CRITICAL): Bearing fault — immediate attention required.' },
    { type: 'text', content: '\n• Pump 2 (WARNING): Elevated temperature +15% — monitor closely.' },
    { type: 'text', content: '\n• Pump 3 (HEALTHY): All parameters nominal.' },
  ],
  help: [
    { type: 'text', content: 'I can help you with:\n• Alert root cause analysis\n• Live pump status\n• Sensor metric trends\n• Dependency graph navigation\n• Incident summaries' },
    { type: 'text', content: '\nTry asking: "Why is pump1 critical?" or "Show pump2 temperature"' },
  ],
};

function pickMockResponse(message: string): ChatChunk[] {
  const lower = message.toLowerCase();
  if (lower.includes('oom') || lower.includes('memory'))   return MOCK_RESPONSES.oom;
  if (lower.includes('pump') || lower.includes('status'))  return MOCK_RESPONSES.pump;
  if (lower.includes('help') || lower.includes('what'))    return MOCK_RESPONSES.help;
  return MOCK_RESPONSES.default;
}

/**
 * Send a chat message and receive streamed response chunks.
 * Uses SSE from the real API, or simulates streaming with the mock.
 */
export async function sendChatMessage(
  payload: ChatPayload,
  onChunk: (chunk: ChatChunk) => void,
  useMock = true,
): Promise<void> {
  if (useMock) {
    const chunks = pickMockResponse(payload.message);
    for (const chunk of chunks) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      onChunk(chunk);
    }
    onChunk({ type: 'done' });
    return;
  }

  const res = await fetch(`${API_CONFIG.baseUrl}/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Chat API error: HTTP ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(line.slice(6));
          onChunk(chunk);
          if (chunk.type === 'done') return;
        } catch {
          // incomplete JSON — skip
        }
      }
    }
  }
}
