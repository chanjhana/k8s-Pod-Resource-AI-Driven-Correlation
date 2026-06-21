# EdgeMind Dashboard — Feature Addition Plan
## Helm Dependency Graph + NLP Chat Interface

> **Branch:** `frontend`  
> **Stack:** React 18 + Vite + Recharts + D3 v7 + TailwindCSS v3  
> **Backend:** FastAPI (`edgemind_server/main.py`) + WebSocket  
> **Existing pages:** CommandCenter · ResourceRadar · CorrelationMap · AnomalyTimeline · AIInvestigation · DemoLab

---

## 1. Overview & Motivation

The dashboard currently shows an **Anomaly Propagation Graph** (D3 pipeline graph of pods/services) and a static **AI Investigation** panel. Two powerful additions will close the remaining UX gaps:

| Feature | Value Delivered |
|---|---|
| **Helm Dependency Graph** | Visualises which Helm releases own which K8s resources (Deployments, Services, ConfigMaps, PVCs) and shows cross-release dependencies. Operators can instantly trace *which chart* owns a misbehaving pod. |
| **NLP Chat Interface** | Allows operators to ask plain-English questions ("Why is `redis-master` OOMKilling?", "Show me pods with >90% memory in the last 5 minutes") and receive AI-generated answers with evidence links. |

Both features integrate with the **existing `AppContext` state store**, the **WebSocket feed**, and the **`edgemind_server`** FastAPI backend.

---

## 2. Current Architecture Snapshot

```
edgemind-dashboard/src/
├── App.jsx                     ← BrowserRouter + 6 routes
├── index.css                   ← ABB brand tokens + animations
├── core/
│   ├── store/AppContext.jsx     ← global state (correlatedAlerts, graph, etc.)
│   ├── api/                    ← useGraph, usePumpAlerts, useSensorReadings
│   ├── ws/useWebSocket.js      ← WebSocket consumer (live events)
│   ├── constants/topology.js   ← MONITORING_LAYER node list
│   └── selectors/              ← derived state helpers
├── components/
│   ├── layout/Shell.jsx        ← DataHooks + GlobalHeader + <main>
│   ├── graph/                  ← PipelineGraph, GraphNode, GraphEdge, CausalPathOverlay
│   ├── charts/                 ← DualLineChart, RollingLineChart, StackedAreaChart, etc.
│   └── ui/                     ← PanelHeader, etc.
└── pages/
    ├── CommandCenter/          ← main dashboard (KPI, graph preview, IncidentCard)
    ├── CorrelationMap/         ← full-screen D3 graph with filters, timeline, drawers
    ├── AIInvestigation/        ← left-panel incident list + AI card + EvidenceMatrix
    └── ...
```

**Backend endpoints used (FastAPI):**

| Endpoint | Used by |
|---|---|
| `GET /graph` | `useGraph` hook → node/edge topology |
| `GET /alerts` | `usePumpAlerts` → correlated anomaly list |
| `GET /sensors` | `useSensorReadings` → timeseries metrics |
| `WS /ws` | `useWebSocket` → live event push |

---

## 3. Feature 1 — Helm Dependency Graph

### 3.1 What it shows

A **two-level interactive graph**:

```
[Helm Release: redis-stack]
  ├── Deployment: redis-master  (⚠ OOM anomaly)
  ├── Service: redis-svc
  ├── PVC: redis-data
  └── ConfigMap: redis-config

[Helm Release: app-backend]
  ├── Deployment: backend-api
  └── Service: backend-svc
      └── ─depends on─▶  [redis-svc]  (cross-release edge)
```

Nodes are **colour-coded by health** (ABB red/green/yellow) and **pulsing** when anomalous. Clicking a K8s resource node opens the existing `NodeDetailDrawer` from CorrelationMap with live metrics.

### 3.2 UI Layout — New Page: `/helm`

```
┌─────────────────────────────────────────────────────────────────────┐
│  [HelmGraphControls]  Filter: Release ▼  Resource Type ▼  ● Anomalous only  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [HelmGraphCanvas]  — D3 force-directed graph                      │
│   Release nodes = large hexagons (ABB blue outline)                 │
│   K8s resource nodes = smaller circles (colour = health)            │
│   Cross-release deps = dashed orange arrows                         │
│   Intra-release edges = solid gray lines                            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [HelmTimelineStrip]  — reuses existing TimelineStrip component     │
│  [HelmReleaseDrawer]  — right panel: chart version, values, pods    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Breakdown

#### New files to create

```
src/pages/HelmGraph/
├── index.jsx                  ← page root, wires controls + canvas + drawer
├── HelmGraphControls.jsx      ← filter bar (release dropdown, resource type, anomalous toggle)
├── HelmGraphCanvas.jsx        ← D3 SVG force-directed graph; re-uses GraphNode/GraphEdge styles
├── HelmReleaseNode.jsx        ← hexagon SVG shape for Helm release clusters
├── HelmResourceNode.jsx       ← circle node for K8s resources (styled by type + health)
├── HelmReleaseDrawer.jsx      ← slide-in drawer: chart name, version, installed pods, live metrics
└── HelmLegend.jsx             ← colour legend (health status + resource type icons)

src/core/api/
└── useHelmGraph.js            ← fetches /helm/graph; subscribes to WS updates

src/core/constants/
└── helmTypes.js               ← resource type → icon/colour mapping
```

#### Reused existing components

- `GraphNode.jsx` — styled node badges (reusable for resource nodes)
- `NodeDetailDrawer.jsx` (from CorrelationMap) — open on resource node click
- `TimelineStrip.jsx` — anomaly timeline at the bottom
- `PanelHeader.jsx` — panel titles

### 3.4 Data Model

**Backend endpoint to add:** `GET /helm/graph`

```json
{
  "releases": [
    {
      "name": "redis-stack",
      "chart": "redis",
      "version": "19.1.0",
      "namespace": "default",
      "status": "deployed",
      "health": "warning",
      "resources": [
        { "kind": "Deployment", "name": "redis-master", "health": "critical", "anomaly": true },
        { "kind": "Service",    "name": "redis-svc",    "health": "healthy",  "anomaly": false },
        { "kind": "PVC",        "name": "redis-data",   "health": "healthy",  "anomaly": false }
      ]
    }
  ],
  "cross_release_deps": [
    { "from": { "release": "app-backend", "resource": "backend-api" },
      "to":   { "release": "redis-stack",  "resource": "redis-svc" },
      "type": "service_dependency" }
  ]
}
```

**D3 Graph Data Shape** (built inside `HelmGraphCanvas.jsx`):

```js
// nodes: releases (type='release') + resources (type='resource')
// links: intra-release (type='owns') + cross-release (type='depends')
const nodes = [
  { id: 'release/redis-stack', type: 'release', ... },
  { id: 'pod/redis-master',    type: 'resource', kind: 'Deployment', health: 'critical', ... }
]
const links = [
  { source: 'release/redis-stack', target: 'pod/redis-master', type: 'owns' },
  { source: 'pod/backend-api',     target: 'pod/redis-svc',    type: 'depends' }
]
```

### 3.5 D3 Force Layout Strategy

```js
// In HelmGraphCanvas.jsx
const simulation = d3.forceSimulation(nodes)
  .force('link',    d3.forceLink(links).id(d => d.id).distance(d => d.type === 'owns' ? 60 : 140))
  .force('charge',  d3.forceManyBody().strength(-300))
  .force('cluster', forceCluster()) // custom: attract same-release resources to their release node
  .force('center',  d3.forceCenter(width / 2, height / 2))
  .force('collide', d3.forceCollide(d => d.type === 'release' ? 40 : 20))
```

**Release nodes** rendered as `<polygon>` (hexagon), **resource nodes** as `<circle>`. Cross-release deps use `stroke-dasharray` + animated `stroke-dashoffset` (reusing `.animate-dash-flow` CSS class already in `index.css`).

### 3.6 Integration with CommandCenter

Add a **Helm mini-panel** in Band 2 of CommandCenter (between DigitalTwinMatrix and IncidentCard):

```jsx
// CommandCenter/index.jsx — Band 2 addition
<div style={{ flex: '0 0 240px', minWidth: 0, cursor: 'pointer' }}
     onClick={() => navigate('/helm')}
     title="Click to open full Helm Graph">
  <PanelHeader title="Helm Release Health" hint="click to expand →" />
  <HelmMiniMap />  {/* tiny static summary: release count, anomalous count, sparkline */}
</div>
```

### 3.7 Navigation

Add to `GlobalHeader.jsx` sidebar/nav:
- Icon: Helm diamond SVG
- Label: **Helm Graph**
- Route: `/helm`

Add route in `App.jsx`:
```jsx
<Route path="/helm" element={<HelmGraph />} />
```

---

## 4. Feature 2 — NLP Chat Interface

### 4.1 What it provides

A **floating chat panel** (accessible from any page) that lets operators ask questions in natural language:

| Example Query | Response |
|---|---|
| `"Why is redis-master OOM killing?"` | Correlated alert card + memory trend + AI root cause text |
| `"Show pods with >90% CPU last 10 min"` | Inline table of matching pods with sparklines |
| `"Compare redis-master vs app-api memory"` | Side-by-side dual line chart |
| `"Summarise today's incidents"` | Bullet list with severity badges |
| `"Run memory stress scenario"` | Trigger DemoLab scenario with confirmation |

### 4.2 UI Layout — Floating Chat Panel

```
┌────────────────────────────────────────────┐
│  🤖 EdgeMind AI Assistant           [─] [✕] │
├────────────────────────────────────────────┤
│                                            │
│  [ChatMessageList]                         │
│  ┌──────────────────────────────┐          │
│  │ AI: Detected 2 critical      │          │
│  │    alerts at 14:32 UTC.      │          │
│  │    Root cause: redis-master  │          │
│  │    [View Graph] [View Alerts]│          │
│  └──────────────────────────────┘          │
│       [User: Why is OOM happening?]        │
│  ┌──────────────────────────────┐          │
│  │ AI: [DualLineChart: memory]  │          │
│  │ Container hit 512Mi limit... │          │
│  └──────────────────────────────┘          │
│                                            │
├────────────────────────────────────────────┤
│  [ChatInputBar]                            │
│  ┌──────────────────────────────────[Send]─┐│
│  │ Ask anything about your cluster...     │ │
│  └────────────────────────────────────────┘│
│  Quick: [Why OOM?] [Top alerts] [CPU usage]│
└────────────────────────────────────────────┘
```

**Chat panel is a fixed overlay** (bottom-right, z-index 9999). Toggle via a floating action button (FAB) in the Shell layout. Panel can be **minimised** to just the FAB.

### 4.3 Component Breakdown

#### New files to create

```
src/components/chat/
├── ChatPanel.jsx              ← main panel container (open/closed state, drag to reposition)
├── ChatFAB.jsx                ← floating action button (bottom-right corner) with unread badge
├── ChatMessageList.jsx        ← scrollable message history; renders rich content cards
├── ChatMessage.jsx            ← single message: text | chart | table | alert card | links
├── ChatInputBar.jsx           ← textarea + Send button + quick-prompt chips
├── ChatChartCard.jsx          ← inline chart renderer (Recharts) embedded in a message
├── ChatAlertCard.jsx          ← inline alert summary card embedded in a message
└── ChatSuggestions.jsx        ← contextual quick-prompt chips based on active page

src/core/api/
└── useChatAPI.js              ← POST /chat/query; streaming SSE response parser

src/core/hooks/
└── useChatHistory.js          ← localStorage persistence of conversation history
```

#### Modified existing files

| File | Change |
|---|---|
| `Shell.jsx` | Import and render `<ChatFAB />` + `<ChatPanel />` at root level |
| `AppContext.jsx` | Add `chatOpen`, `setChatOpen`, `chatHistory`, `addChatMessage` to global state |
| `index.css` | Add chat animation keyframes (slide-up, fade-in) |

### 4.4 Backend API — NLP Query Endpoint

**New endpoint to add:** `POST /chat/query`

```python
# edgemind_server/main.py
@app.post("/chat/query")
async def chat_query(req: ChatRequest):
    """
    Intent classification → tool dispatch → structured response.
    Returns StreamingResponse (SSE) for real-time token streaming.
    """
```

**Request schema:**
```json
{
  "message": "Why is redis-master OOM killing?",
  "context": {
    "active_page": "correlation-map",
    "selected_pod": "redis-master",
    "time_range_minutes": 30
  },
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response schema (streamed SSE):**
```
data: {"type": "text", "content": "Analysing redis-master..."}
data: {"type": "text", "content": " Memory usage spiked at 14:32 UTC."}
data: {"type": "chart", "chart_type": "dual_line", "metric": "memory", "pods": ["redis-master"]}
data: {"type": "link", "label": "View in Correlation Map", "route": "/graph?node=redis-master"}
data: {"type": "done"}
```

### 4.5 NLP Intent Classification Flow

```
User input
    │
    ▼
[Intent Classifier]  (rule-based regex + Gemini LLM fallback)
    │
    ├─→ "metric_query"   → fetch /sensors, render chart card
    ├─→ "incident_query" → fetch /alerts, render alert cards
    ├─→ "graph_navigate" → return deep-link to /graph?node=X
    ├─→ "helm_query"     → fetch /helm/graph, render release table
    ├─→ "demo_trigger"   → call /demo/run with confirmation
    ├─→ "compare_pods"   → fetch metrics for N pods, render multi-line chart
    └─→ "general"        → Gemini LLM with system prompt + current cluster state
```

**System prompt template:**
```
You are EdgeMind, an AI operations assistant for a Kubernetes cluster.
Current state: {N} pods, {K} active alerts, top anomaly: {alert}.
Answer concisely. If showing metrics, emit a chart object.
Always cite evidence from the live data.
```

### 4.6 Rich Message Rendering

Messages support **typed content blocks**:

```jsx
// ChatMessage.jsx
function ChatMessage({ message }) {
  return (
    <div className={`chat-msg chat-msg--${message.role}`}>
      {message.blocks.map(block => {
        if (block.type === 'text')       return <p>{block.content}</p>
        if (block.type === 'chart')      return <ChatChartCard {...block} />
        if (block.type === 'alert_card') return <ChatAlertCard {...block} />
        if (block.type === 'table')      return <ChatTableCard {...block} />
        if (block.type === 'link')       return <ChatLink {...block} />
      })}
    </div>
  )
}
```

`ChatChartCard` wraps the existing `DualLineChart` / `RollingLineChart` / `StackedAreaChart` components — **no new chart code needed**.

### 4.7 Contextual Awareness

The chat panel reads the current route and sends it as context:

| Active Page | Auto-suggestions shown |
|---|---|
| CommandCenter | "Top 3 critical pods", "Today's incident summary" |
| CorrelationMap + node selected | "Why is `{node}` anomalous?", "Show `{node}` CPU trend" |
| HelmGraph + release selected | "What owns `{release}`?", "Any anomalies in `{release}`?" |
| AnomalyTimeline | "What caused the spike at `{time}`?" |

### 4.8 Streaming with SSE

```js
// useChatAPI.js
export async function sendChatMessage(payload, onChunk) {
  const res = await fetch('/chat/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const chunk = JSON.parse(line.slice(6))
        onChunk(chunk)   // update React state incrementally
      }
    }
  }
}
```

---

## 5. Integration Map — How Both Features Fit Together

```
┌─────────────────────────────────────────────────────────────┐
│  Shell.jsx  (layout root)                                   │
│  ┌───────────┐  ┌──────────────────────────────────────┐   │
│  │GlobalHead │  │  <main>  (current page content)       │   │
│  │           │  │                                      │   │
│  │ nav items:│  │  CommandCenter  ←── HelmMiniMap panel │   │
│  │  /helm ←NEW  │  CorrelationMap                       │   │
│  └───────────┘  │  HelmGraph ←────────────── NEW PAGE   │   │
│                 │  AIInvestigation                      │   │
│                 └──────────────────────────────────────┘   │
│                                                             │
│  <ChatFAB />  ←──── NEW (fixed bottom-right)               │
│  <ChatPanel /> ←─── NEW (overlay, z-index 9999)            │
└─────────────────────────────────────────────────────────────┘

AppContext additions:
  helmGraph: { releases, cross_deps }      ← useHelmGraph hook
  chat: { open, history, isLoading }       ← useChatHistory hook
```

---

## 6. Phased Implementation Plan

### Phase 1 — Foundation (Day 1 morning)

- [ ] Add `helmTypes.js` constants (resource kinds → colour/icon)
- [ ] Add `useHelmGraph.js` hook (fetch + poll `/helm/graph`)
- [ ] Extend `AppContext` with `helmGraph` state slice
- [ ] Add `chatOpen` + `chatHistory` slices to `AppContext`
- [ ] Add `/helm` route in `App.jsx`
- [ ] Add nav item to `GlobalHeader.jsx`

### Phase 2 — Helm Graph Page (Day 1 afternoon)

- [ ] Build `HelmGraphCanvas.jsx` with D3 force simulation
  - [ ] Release hexagon nodes
  - [ ] Resource circle nodes (colour by health)
  - [ ] Intra-release edges (solid, gray)
  - [ ] Cross-release edges (dashed, animated, orange)
  - [ ] Drag + zoom (d3.zoom)
  - [ ] Node click → opens NodeDetailDrawer
- [ ] Build `HelmGraphControls.jsx` (filter bar)
- [ ] Build `HelmReleaseDrawer.jsx` (right-side panel on release click)
- [ ] Build `HelmLegend.jsx`
- [ ] Wire into `HelmGraph/index.jsx`
- [ ] Add `HelmMiniMap.jsx` mini-panel in CommandCenter Band 2

### Phase 3 — Chat Backend (Day 1 afternoon / Day 2 morning)

- [ ] Add `POST /chat/query` endpoint in `edgemind_server/main.py`
- [ ] Add `GET /helm/graph` endpoint in `edgemind_server/main.py`
- [ ] Implement intent classifier (`chat_intents.py`)
- [ ] Wire Gemini LLM for fallback general queries
- [ ] Implement SSE streaming response
- [ ] Write mock fixtures for offline dev (`/chat/query?mock=true`)

### Phase 4 — Chat UI (Day 2)

- [ ] Build `ChatFAB.jsx` (floating button, unread badge)
- [ ] Build `ChatPanel.jsx` (sliding panel, minimise/close)
- [ ] Build `ChatMessageList.jsx` + auto-scroll
- [ ] Build `ChatMessage.jsx` with typed block renderer
- [ ] Build `ChatChartCard.jsx` (wraps existing Recharts charts)
- [ ] Build `ChatAlertCard.jsx`
- [ ] Build `ChatInputBar.jsx` + quick prompt chips
- [ ] Build `ChatSuggestions.jsx` (context-aware chips)
- [ ] Implement `useChatAPI.js` (SSE streaming)
- [ ] Implement `useChatHistory.js` (localStorage)
- [ ] Integrate FAB + Panel into `Shell.jsx`
- [ ] Add chat animations to `index.css`

### Phase 5 — Polish & Wiring (Day 2 afternoon)

- [ ] Deep-link: chat "View in Graph" links navigate to `/graph?node=X`
- [ ] Deep-link: chat "Open Helm release" navigates to `/helm?release=X`
- [ ] Context injection: chat reads selected node from CorrelationMap
- [ ] Keyboard shortcut: `Ctrl+/` or `Cmd+/` toggles chat panel
- [ ] Accessibility: ARIA labels on chat, keyboard navigation
- [ ] Error states: retry button on API failure, offline mode with mock data

---

## 7. File Change Summary

### New files (22 total)

```
edgemind-dashboard/src/
  pages/HelmGraph/
    index.jsx
    HelmGraphControls.jsx
    HelmGraphCanvas.jsx
    HelmReleaseNode.jsx
    HelmResourceNode.jsx
    HelmReleaseDrawer.jsx
    HelmLegend.jsx
  components/chat/
    ChatPanel.jsx
    ChatFAB.jsx
    ChatMessageList.jsx
    ChatMessage.jsx
    ChatInputBar.jsx
    ChatChartCard.jsx
    ChatAlertCard.jsx
    ChatSuggestions.jsx
  core/api/
    useHelmGraph.js
    useChatAPI.js
  core/hooks/
    useChatHistory.js
  core/constants/
    helmTypes.js

edgemind_server/
  chat_intents.py
```

### Modified files (7 total)

```
edgemind-dashboard/src/
  App.jsx                    ← +HelmGraph route
  index.css                  ← +chat animation keyframes
  components/layout/Shell.jsx      ← +ChatFAB, ChatPanel
  components/layout/GlobalHeader.jsx ← +Helm nav item
  core/store/AppContext.jsx  ← +helmGraph, chat state slices
  pages/CommandCenter/index.jsx ← +HelmMiniMap in Band 2

edgemind_server/main.py      ← +/chat/query, /helm/graph endpoints
```

---

## 8. Design Decisions & Constraints

### Helm Graph

| Decision | Rationale |
|---|---|
| **D3 force-directed** (not React Flow) | Project already uses D3 v7 for CorrelationMap. No extra dependency. |
| **Hexagon release nodes** | Visually distinct from existing circle pod nodes. ABB blue outline = branded. |
| **Reuse `NodeDetailDrawer`** | Consistent UX — same drawer for pod details whether opened from CorrelationMap or HelmGraph. |
| **`/helm/graph` polling (10s interval)** | Helm releases change infrequently; polling simpler than WS for this. |
| **Mock data fallback** | For hackathon demo, a static JSON fixture in `useHelmGraph.js` used when backend is unavailable. |

### NLP Chat

| Decision | Rationale |
|---|---|
| **Floating panel, not a page** | Operators need to see the graph *and* chat simultaneously. |
| **SSE streaming** | Gives real-time typing effect; feels faster even if total latency is the same. |
| **`localStorage` history** | Survives page refresh; keeps demo continuity. Cap at 50 messages. |
| **Typed content blocks** | Enables embedding live charts/tables in chat; more powerful than plain text. |
| **Contextual quick-prompts** | Reduces typing during demo; shows reviewers the AI knows what's on screen. |
| **`Ctrl+/` shortcut** | Standard convention for search/chat panels (VS Code, Linear, etc.). |

---

## 9. Mock Data Strategy (Offline / Demo Mode)

Both features work offline with fixture data:

```js
// useHelmGraph.js — mock fixture
const MOCK_HELM_GRAPH = {
  releases: [
    { name: 'redis-stack', chart: 'redis', version: '19.1.0', health: 'warning',
      resources: [
        { kind: 'Deployment', name: 'redis-master', health: 'critical', anomaly: true },
        { kind: 'Service',    name: 'redis-svc',    health: 'healthy',  anomaly: false },
        { kind: 'PVC',        name: 'redis-data',   health: 'healthy',  anomaly: false }
      ]
    },
    { name: 'app-backend', chart: 'myapp', version: '2.3.1', health: 'healthy',
      resources: [
        { kind: 'Deployment', name: 'backend-api', health: 'healthy', anomaly: false },
        { kind: 'Service',    name: 'backend-svc', health: 'healthy', anomaly: false }
      ]
    }
  ],
  cross_release_deps: [
    { from: { release: 'app-backend', resource: 'backend-api' },
      to:   { release: 'redis-stack',  resource: 'redis-svc' },
      type: 'service_dependency' }
  ]
}
```

```js
// useChatAPI.js — mock responses
const MOCK_RESPONSES = {
  'oom': [
    { type: 'text', content: 'redis-master hit its 512Mi memory limit at 14:32 UTC.' },
    { type: 'chart', chart_type: 'rolling_line', metric: 'memory', pods: ['redis-master'] },
    { type: 'link', label: 'View in Correlation Map', route: '/graph?node=redis-master' }
  ]
}
```

---

## 10. Dependencies to Install

```bash
# No new npm packages required!
# D3 v7, Recharts, React Router already in package.json
# Backend: Gemini SDK already used in edgemind_server
```

---

## 11. Open Questions

> [!IMPORTANT]
> **Q1 — Helm data source:** Does the backend have real `kubectl`/Helm API access in the demo environment, or should we mock `/helm/graph` entirely? This affects Phase 3 complexity.

> [!IMPORTANT]
> **Q2 — Chat LLM:** Is the Gemini API key available server-side? Should the NLP chat call the existing `orchestrator.py` agent pipeline or use a direct Gemini API call?

> [!NOTE]
> **Q3 — Chat panel position:** Should the chat panel open as a right sidebar (fixed width, pushes content) or as a floating overlay? Overlay is faster to build; sidebar gives more space for chart cards.

> [!NOTE]
> **Q4 — Helm graph scope:** Should we show all namespaces or only the `default` namespace? Multi-namespace layouts need grouping logic.

---

## 12. Visual Design Spec

### Helm Graph Colours

| Node type | Fill | Border |
|---|---|---|
| Release (healthy) | `#e6eef7` (ABB blue tint) | `#004c97` (ABB blue) |
| Release (warning) | `#fff8e0` | `#b89400` (ABB amber) |
| Release (critical) | `rgba(255,0,15,0.08)` | `#ff000f` (ABB red) |
| Resource — Deployment | white | `#595959` |
| Resource — Service | white | `#004c97` |
| Resource — PVC | white | `#007a33` |
| Resource — ConfigMap | white | `#b89400` |
| Resource — anomalous | applies `animate-pulse-border` CSS class | |

### Chat Panel Design

- **Background:** `#ffffff` (ABB white card)  
- **Border:** `1.5px solid var(--color-border-card)`  
- **Shadow:** `0 8px 32px rgba(0,0,0,0.18)`  
- **Border radius:** `12px`  
- **Width:** `380px` (desktop), `100vw` (mobile)  
- **Max height:** `70vh`  
- **FAB colour:** `var(--abb-red)` background, white icon  
- **User messages:** right-aligned, `var(--color-info-background)` background  
- **AI messages:** left-aligned, `var(--color-bg-card)` background, subtle border  
- **Typing indicator:** three pulsing dots using `.animate-pulse-dot` CSS class  

---

## 13. Testing Checklist

- [ ] Helm graph renders without backend (mock mode)
- [ ] Helm graph nodes are draggable; simulation stabilises
- [ ] Clicking a Helm resource node opens NodeDetailDrawer with correct pod name
- [ ] HelmGraph Controls filter by release and resource type correctly
- [ ] Chat panel opens/closes via FAB and keyboard shortcut
- [ ] Chat sends a message and receives streaming response
- [ ] Chart cards render inside chat messages
- [ ] Chat links navigate correctly (`/graph?node=X`, `/helm?release=X`)
- [ ] Chat history persists across page refresh
- [ ] Both features work on 1280px wide viewport (no overflow)
- [ ] Both features work with existing WS connection live data

---

*Last updated: 2026-06-19 · Branch: `frontend`*
