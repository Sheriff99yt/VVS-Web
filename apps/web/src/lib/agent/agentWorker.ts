/**
 * Dedicated Worker for the in-page agent loop (LLM fetch + tool-call JSON).
 *
 * A Service Worker is a poor fit: it has no live graph, is request-driven, and
 * cannot talk to React ProjectContext. This Worker only does network + JSON;
 * the main thread runs toolRuntime against the live canvas and postMessages results.
 */
import { AGENT_SYSTEM_PROMPT, type AgentChatMessage, type AgentWorkerInbound, type AgentWorkerOutbound } from './protocol';
import { agentToolsForChatCompletions } from './toolDefs';
import { chatCompletionsUrl } from './agentSettings';

// Typed against a minimal worker port so this file typechecks under the app DOM tsconfig.
const ctx = self as unknown as {
  postMessage(message: AgentWorkerOutbound): void;
  onmessage: ((event: MessageEvent<AgentWorkerInbound>) => void) | null;
};

let activeRequestId: string | null = null;
const pendingTools = new Map<string, (payload: { ok: boolean; result: unknown; error?: string }) => void>();

function post(message: AgentWorkerOutbound): void {
  ctx.postMessage(message);
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

async function requestTool(
  requestId: string,
  name: string,
  args: Record<string, unknown>
): Promise<{ ok: boolean; result: unknown; error?: string }> {
  const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await new Promise<{ ok: boolean; result: unknown; error?: string }>((resolve) => {
    pendingTools.set(callId, resolve);
    post({ type: 'tool_request', requestId, callId, name, args });
  });
  pendingTools.delete(callId);
  return result;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

async function runChat(requestId: string, prompt: string, history: AgentChatMessage[], settings: { baseUrl: string; apiKey: string; model: string }): Promise<void> {
  const messages: ChatMessage[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ...history.map((item) => ({
      role: item.role,
      content: item.content,
      ...(item.toolCallId ? { tool_call_id: item.toolCallId } : {}),
      ...(item.name ? { name: item.name } : {}),
    })),
    { role: 'user', content: prompt },
  ];

  const url = chatCompletionsUrl(settings.baseUrl);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey.trim()) {
    headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  }

  for (let round = 0; round < 8; round += 1) {
    if (activeRequestId !== requestId) return;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model,
        messages,
        tools: agentToolsForChatCompletions(),
        tool_choice: 'auto',
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`LLM ${response.status}: ${raw.slice(0, 400) || response.statusText}`);
    }

    const payload = JSON.parse(raw) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>;
        };
      }>;
    };
    const message = payload.choices?.[0]?.message;
    if (!message) throw new Error('LLM returned no message');

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length > 0) {
      const assistantToolCalls = toolCalls.map((call, index) => ({
        id: call.id || `tool-${index}`,
        type: 'function' as const,
        function: {
          name: call.function?.name ?? '',
          arguments: call.function?.arguments ?? '{}',
        },
      }));
      messages.push({
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: assistantToolCalls,
      });

      for (const call of assistantToolCalls) {
        if (activeRequestId !== requestId) return;
        const args = parseArgs(call.function.arguments);
        const toolResult = await requestTool(requestId, call.function.name, args);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(
            toolResult.ok ? toolResult.result : { error: toolResult.error ?? 'tool failed' }
          ),
        });
      }
      continue;
    }

    const text = (message.content ?? '').trim();
    if (text) post({ type: 'assistant_final', requestId, text });
    post({ type: 'done', requestId });
    return;
  }

  throw new Error('agent stopped after 8 tool rounds');
}

ctx.onmessage = (event: MessageEvent<AgentWorkerInbound>) => {
  const message = event.data;
  if (!message) return;

  if (message.type === 'cancel') {
    if (activeRequestId === message.requestId) {
      activeRequestId = null;
      pendingTools.clear();
    }
    return;
  }

  if (message.type === 'tool_result') {
    pendingTools.get(message.callId)?.({
      ok: message.ok,
      result: message.result,
      error: message.error,
    });
    return;
  }

  if (message.type === 'run') {
    activeRequestId = message.requestId;
    pendingTools.clear();
    void runChat(message.requestId, message.prompt, message.history, message.settings)
      .catch((err: unknown) => {
        if (activeRequestId !== message.requestId) return;
        post({
          type: 'error',
          requestId: message.requestId,
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        if (activeRequestId === message.requestId) activeRequestId = null;
      });
  }
};
