import type { AgentToolDef } from './toolDefs';

export type AgentWorkerInbound =
  | {
      type: 'run';
      requestId: string;
      prompt: string;
      history: AgentChatMessage[];
      settings: { baseUrl: string; apiKey: string; model: string };
    }
  | { type: 'tool_result'; requestId: string; callId: string; ok: boolean; result: unknown; error?: string }
  | { type: 'cancel'; requestId: string };

export type AgentWorkerOutbound =
  | { type: 'assistant_delta'; requestId: string; text: string }
  | { type: 'assistant_final'; requestId: string; text: string }
  | { type: 'tool_request'; requestId: string; callId: string; name: string; args: Record<string, unknown> }
  | { type: 'error'; requestId: string; message: string }
  | { type: 'done'; requestId: string };

export interface AgentChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface VvsAgentBridge {
  listTools(): AgentToolDef[];
  callTool(name: string, args?: Record<string, unknown>): Promise<unknown>;
}

export const AGENT_SYSTEM_PROMPT = [
  'You are the VVS in-page graph agent.',
  'The live editor canvas is the source of truth. Use tools to inspect and edit it.',
  'Do not invent constructs: no Component node, no fake Verse GetInput, no MI emit.',
  'Leftover kinds are unspawnable and must not be added: event_on_start, event_on_update, event_emit, event_subscribe, flow_sequence, action_await_wait, graph_ref.',
  'Prefer existing spawnable kinds from list_available_nodes.',
  'Writes may be refused if the user has not enabled Allow agent writes.',
].join(' ');
