# EdgeMind Mobile App

React Native (Expo) mobile companion for the EdgeMind K8s anomaly detection platform.

## Screens

| Tab | Screen | Description |
|---|---|---|
| 🔴 Alert | **Current Alert** | Live critical alert with pulsing card, AI root cause, sparklines |
| 📋 History | **Alert History** | Sorted alert list + full investigation modal |
| 🤖 Chat | **NLP Interface** | AI chat with SSE streaming, quick prompts, inline charts |
| 📈 Timeline | **Anomaly Timeline** | Horizontal SVG timeline strip + event log |
| 🕸 Graph | **Dependency Graph** | Pannable SVG pipeline graph with node health coloring |

## Features

- **Live WebSocket** — real-time alerts from EdgeMind server, auto-reconnect with backoff
- **Push Notifications** — CRITICAL alerts fire local push notifications even when app is in background
- **Mock Mode** — all screens work offline with realistic demo data (pump1 bearing fault scenario)
- **ABB Brand Design** — exact colour tokens from the web dashboard (ABB Red, Blue, Green)
- **Animated** — pulsing severity dots, slide-up modals, toast banners

## Quick Start

```bash
cd edgemind-mobile
npm install --legacy-peer-deps
npx expo start
```

Then scan the QR code with **Expo Go** (iOS/Android) or press `a` for Android emulator / `i` for iOS simulator.

## Connect to Live Server

Edit `core/config.ts`:
```ts
export const API_CONFIG = {
  baseUrl: 'http://YOUR_LAN_IP:8000',   // ← your FastAPI server IP
  wsUrl:   'ws://YOUR_LAN_IP:8000/ws',
};
```

And in `components/ui/WsBootstrap.tsx`, set `USE_MOCK = false`.

## Architecture

```
edgemind-mobile/
├── app/(tabs)/           ← 5 screens (Expo Router)
├── components/
│   ├── ui/               ← tokens, Card, Badge, SeverityDot, Sparkline, Toast
│   ├── alerts/           ← AlertCard, RootCausePanel, InvestigationModal
│   ├── nlp/              ← ChatBubble, ChatInput
│   ├── timeline/         ← TimelineStrip (SVG)
│   ├── graph/            ← DependencyGraph (SVG + PanResponder)
│   └── notifications/    ← notificationService
└── core/
    ├── store/AppContext   ← global state (useReducer)
    ├── ws/useWebSocket    ← WS client + reconnect
    └── api/              ← useAlerts, useSensors, useGraph, useChatAPI
```
