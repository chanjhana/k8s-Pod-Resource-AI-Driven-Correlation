import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  pod_id: string;
  pump_id?: string;
  severity: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  title: string;
  description: string;
  root_cause?: string;
  evidence?: Array<{ metric: string; value: string; deviation: string }>;
  timestamp: string;
  resolved?: boolean;
  resolution_time?: string;
}

export interface SensorReading {
  pump_id: string;
  timestamp: string;
  vibration_axial: number;
  vibration_radial: number;
  temperature: number;
  rpm: number;
  flow_rate: number;
  pressure: number;
}

export interface GraphNode {
  id: string;
  label: string;
  severity: string;
  type: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  blocks?: Array<{ type: string; [key: string]: any }>;
  timestamp: string;
}

export interface AppState {
  alerts: Alert[];
  activeAlert: Alert | null;
  sensorReadings: Record<string, SensorReading[]>;   // keyed by pump_id
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  wsConnected: boolean;
  wsLastEvent: string | null;
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  toastMessage: string | null;
}

// ── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ALERTS';    payload: Alert[] }
  | { type: 'ADD_ALERT';     payload: Alert }
  | { type: 'SET_ACTIVE_ALERT'; payload: Alert | null }
  | { type: 'SET_SENSORS';   payload: { pump_id: string; readings: SensorReading[] } }
  | { type: 'SET_GRAPH';     payload: { nodes: GraphNode[]; edges: GraphEdge[] } }
  | { type: 'SET_WS_CONNECTED'; payload: boolean }
  | { type: 'SET_WS_LAST_EVENT'; payload: string }
  | { type: 'ADD_CHAT_MSG';  payload: ChatMessage }
  | { type: 'UPDATE_LAST_CHAT_MSG'; payload: Partial<ChatMessage> }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_TOAST'; payload: string | null };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ALERTS':
      return {
        ...state,
        alerts: action.payload,
        activeAlert: action.payload.find(a => !a.resolved && a.severity === 'CRITICAL')
          ?? action.payload.find(a => !a.resolved)
          ?? state.activeAlert,
      };
    case 'ADD_ALERT': {
      const exists = state.alerts.find(a => a.id === action.payload.id);
      const alerts = exists
        ? state.alerts.map(a => a.id === action.payload.id ? action.payload : a)
        : [action.payload, ...state.alerts];
      return {
        ...state,
        alerts,
        activeAlert:
          (!action.payload.resolved && action.payload.severity === 'CRITICAL')
            ? action.payload
            : state.activeAlert,
      };
    }
    case 'SET_ACTIVE_ALERT':
      return { ...state, activeAlert: action.payload };
    case 'SET_SENSORS':
      return {
        ...state,
        sensorReadings: {
          ...state.sensorReadings,
          [action.payload.pump_id]: action.payload.readings,
        },
      };
    case 'SET_GRAPH':
      return { ...state, graph: action.payload };
    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload };
    case 'SET_WS_LAST_EVENT':
      return { ...state, wsLastEvent: action.payload };
    case 'ADD_CHAT_MSG':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'UPDATE_LAST_CHAT_MSG': {
      const msgs = [...state.chatHistory];
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...action.payload };
      }
      return { ...state, chatHistory: msgs };
    }
    case 'SET_CHAT_LOADING':
      return { ...state, chatLoading: action.payload };
    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [] };
    case 'SET_TOAST':
      return { ...state, toastMessage: action.payload };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

const initialState: AppState = {
  alerts: [],
  activeAlert: null,
  sensorReadings: {},
  graph: { nodes: [], edges: [] },
  wsConnected: false,
  wsLastEvent: null,
  chatHistory: [],
  chatLoading: false,
  toastMessage: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function useAlerts()       { return useApp().state.alerts; }
export function useActiveAlert()  { return useApp().state.activeAlert; }
export function useSensors()      { return useApp().state.sensorReadings; }
export function useGraph()        { return useApp().state.graph; }
export function useWsConnected()  { return useApp().state.wsConnected; }
export function useChatHistory()  { return useApp().state.chatHistory; }
export function useChatLoading()  { return useApp().state.chatLoading; }
export function useToast()        { return useApp().state.toastMessage; }
