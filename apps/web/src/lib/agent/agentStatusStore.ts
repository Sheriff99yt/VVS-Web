export type AgentReadyState = 'starting' | 'ready' | 'error';

export interface AgentTranscriptItem {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  text: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolOk?: boolean;
  at: number;
}

interface AgentSessionState {
  ready: AgentReadyState;
  readyError: string | null;
  running: boolean;
  items: AgentTranscriptItem[];
}

type Listener = () => void;

const listeners = new Set<Listener>();

let state: AgentSessionState = {
  ready: 'starting',
  readyError: null,
  running: false,
  items: [],
};

function emit(): void {
  for (const listener of listeners) listener();
}

export function getAgentSession(): AgentSessionState {
  return state;
}

export function subscribeAgentSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAgentReady(ready: AgentReadyState, error?: string | null): void {
  state = { ...state, ready, readyError: error ?? null };
  emit();
}

export function setAgentRunning(running: boolean): void {
  state = { ...state, running };
  emit();
}

export function appendAgentTranscript(item: Omit<AgentTranscriptItem, 'id' | 'at'>): AgentTranscriptItem {
  const full: AgentTranscriptItem = {
    ...item,
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
  };
  state = { ...state, items: [...state.items, full].slice(-80) };
  emit();
  return full;
}

export function patchAgentTranscript(id: string, patch: Partial<AgentTranscriptItem>): void {
  state = {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  };
  emit();
}

export function clearAgentTranscript(): void {
  state = { ...state, items: [] };
  emit();
}
