'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { useUiPreference } from '@/hooks/useUiPreference';
import { VvsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth/session';
import { isHostedFeaturesEnabled } from '@/lib/hostedFeatures';
import {
  buildClaudeDesktopMcpConfig,
  buildCursorMcpConfig,
  buildLocalMcpCliHint,
  buildVsCodeMcpConfig,
  buildWindsurfMcpConfig,
  defaultLocalMcpUrl,
  MCP_TOOL_SUMMARIES,
} from '@/lib/mcpPasteConfig';
import { AGENT_TOOLS } from '@/lib/agent/toolDefs';
import {
  readAgentLlmSettings,
  writeAgentLlmSettings,
  type AgentLlmSettings,
} from '@/lib/agent/agentSettings';
import { getAgentSession, subscribeAgentSession } from '@/lib/agent/agentStatusStore';
import { cancelAgentRun, runAgentPrompt } from '@/hooks/useAgentHost';
import { useIsMobile } from '@/hooks/useIsMobile';
import { canOpenAgentPanel } from '@/lib/mobileViewport';

function useAgentSession() {
  return useSyncExternalStore(subscribeAgentSession, getAgentSession, getAgentSession);
}

export function AgentPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const session = useAgentSession();
  const [prompt, setPrompt] = useState('');
  const [llm, setLlm] = useState<AgentLlmSettings>(() => readAgentLlmSettings());
  const [allowWrites, setAllowWrites] = useUiPreference('agentAllowWrites');
  const [showSidecar, setShowSidecar] = useState(false);
  const [mcpAllowDangerousTools, setMcpAllowDangerousTools] = useUiPreference('mcpAllowDangerousTools');
  const [mcpProbeState, setMcpProbeState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [mcpProbeMessage, setMcpProbeMessage] = useState<string | null>(null);
  const [mcpCopiedKey, setMcpCopiedKey] = useState<string | null>(null);
  const hosted = isHostedFeaturesEnabled();
  const mcpUrl = defaultLocalMcpUrl();
  const cursorMcpConfig = useMemo(() => buildCursorMcpConfig(mcpUrl), [mcpUrl]);
  const vsCodeMcpConfig = useMemo(() => buildVsCodeMcpConfig(mcpUrl), [mcpUrl]);
  const windsurfMcpConfig = useMemo(() => buildWindsurfMcpConfig(mcpUrl), [mcpUrl]);
  const claudeMcpConfig = useMemo(() => buildClaudeDesktopMcpConfig(mcpUrl), [mcpUrl]);
  const mcpCliHint = useMemo(() => buildLocalMcpCliHint(), []);
  const isNarrowViewport = useIsMobile();

  if (!open || !canOpenAgentPanel(isNarrowViewport)) return null;

  const patchLlm = (patch: Partial<AgentLlmSettings>) => {
    setLlm(writeAgentLlmSettings(patch));
  };

  const handleRun = () => {
    void runAgentPrompt(prompt);
    setPrompt('');
  };

  const copyMcpText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMcpCopiedKey(key);
      window.setTimeout(() => setMcpCopiedKey((prev) => (prev === key ? null : prev)), 1600);
    } catch {
      setMcpCopiedKey(null);
    }
  };

  const handleMcpProbe = async () => {
    setMcpProbeState('testing');
    setMcpProbeMessage(null);
    try {
      const result = await VvsApi.probeMcp(mcpUrl);
      setMcpProbeState(result.ok ? 'ok' : 'fail');
      setMcpProbeMessage(result.message);
    } catch {
      setMcpProbeState('fail');
      setMcpProbeMessage('Connection test failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-[min(680px,calc(100%-2rem))] max-h-[min(92vh,760px)] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-zinc-100 font-semibold text-sm">Agent</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Tools run on the live canvas. Enable writes to edit.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Type a prompt to run the worker LLM loop, or run a tool directly with{' '}
            <span className="font-mono text-zinc-300">/tool name {'{json}'}</span> — no API key needed
            for <span className="font-mono">/tool</span>.
          </p>

          <div className="min-h-[180px] max-h-56 overflow-y-auto rounded border border-zinc-800 bg-zinc-900/70 px-3 py-2 space-y-2">
            {session.items.length === 0 ? (
              <p className="text-[11px] text-zinc-600">
                No turns yet. Example: <span className="font-mono text-zinc-500">/tool list_available_nodes</span>
              </p>
            ) : (
              session.items.map((item) => (
                <div key={item.id} className="text-[11px] leading-relaxed">
                  <span
                    className={
                      item.role === 'user'
                        ? 'text-sky-300'
                        : item.role === 'assistant'
                          ? 'text-zinc-200'
                          : item.role === 'tool'
                            ? item.toolOk === false
                              ? 'text-red-300'
                              : 'text-amber-300'
                            : 'text-zinc-500'
                    }
                  >
                    {item.role === 'tool' ? `tool ${item.toolName ?? ''}` : item.role}
                  </span>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] text-zinc-400 mt-0.5">
                    {item.text}
                  </pre>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleRun();
                }
              }}
              rows={3}
              placeholder="Ask the agent, or /tool get_graph {}"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-zinc-600"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRun}
                disabled={session.running || !prompt.trim()}
                className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs px-3 py-1.5 rounded font-medium"
              >
                {session.running ? 'Running…' : 'Run'}
              </button>
              {session.running ? (
                <button
                  type="button"
                  onClick={() => cancelAgentRun()}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              ) : null}
              <span className="ml-auto text-[10px] text-zinc-600">
                {session.ready === 'ready'
                  ? 'Worker up'
                  : session.ready === 'error'
                    ? session.readyError ?? 'Worker error'
                    : 'Worker starting'}
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-zinc-800 pt-3">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
              Local LLM (not a VVS account)
            </label>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              OpenAI-compatible chat completions. Paste a key here only — it stays in localStorage.
              Point the base URL at OpenAI, Groq, or a local server.
            </p>
            <input
              type="password"
              value={llm.apiKey}
              onChange={(e) => patchLlm({ apiKey: e.target.value })}
              placeholder="API key (local only)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={llm.baseUrl}
                onChange={(e) => patchLlm({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono outline-none"
              />
              <input
                value={llm.model}
                onChange={(e) => patchLlm({ model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono outline-none"
              />
            </div>
            <label className="flex items-start gap-2 text-[11px] text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900"
                checked={allowWrites}
                onChange={(e) => setAllowWrites(e.target.checked)}
              />
              <span>
                Allow <span className="text-amber-300/90">agent writes</span> (add/remove nodes, connect
                pins, add class). Off by default. This checkbox gates the TypeScript runtime, including{' '}
                <span className="font-mono">/tool</span>.
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
              In-page tools
            </label>
            <ul className="max-h-28 overflow-y-auto space-y-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-1.5">
              {AGENT_TOOLS.map((tool) => (
                <li key={tool.name} className="flex items-start gap-2 text-[10px] leading-snug">
                  <span
                    className={`shrink-0 mt-0.5 px-1 rounded ${
                      tool.safety === 'write' ? 'bg-amber-500/15 text-amber-300' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {tool.safety === 'write' ? 'write' : 'read'}
                  </span>
                  <span className="min-w-0">
                    <span className="font-mono text-zinc-300">{tool.name}</span>
                    <span className="text-zinc-600"> — {tool.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <button
              type="button"
              onClick={() => setShowSidecar((v) => !v)}
              className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-300"
            >
              {showSidecar ? '▾' : '▸'} Other apps (later)
            </button>
            {showSidecar ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Go MCP is an optional local sidecar for Cursor / VS Code / Claude Desktop. It is not
                  the hosted path — this in-page agent is. Paste a config only if you run the Go server
                  yourself.
                </p>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Start local MCP
                  </label>
                  <pre className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {mcpCliHint}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void copyMcpText('cli', mcpCliHint)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    {mcpCopiedKey === 'cli' ? 'Copied' : 'Copy hint'}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Cursor / VS Code mcp.json
                  </label>
                  <pre className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-300 font-mono whitespace-pre-wrap max-h-28 overflow-auto">
                    {cursorMcpConfig}
                  </pre>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyMcpText('cursor', cursorMcpConfig)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium"
                    >
                      {mcpCopiedKey === 'cursor' ? 'Copied' : 'Copy Cursor config'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyMcpText('vscode', vsCodeMcpConfig)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium"
                    >
                      {mcpCopiedKey === 'vscode' ? 'Copied' : 'Copy VS Code config'}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Windsurf / Claude Desktop
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyMcpText('windsurf', windsurfMcpConfig)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium"
                    >
                      {mcpCopiedKey === 'windsurf' ? 'Copied' : 'Copy Windsurf config'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyMcpText('claude', claudeMcpConfig)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded font-medium"
                    >
                      {mcpCopiedKey === 'claude' ? 'Copied' : 'Copy Claude config'}
                    </button>
                  </div>
                </div>
                <ul className="max-h-24 overflow-y-auto space-y-1 rounded border border-zinc-800 bg-zinc-900/80 px-2 py-1.5">
                  {MCP_TOOL_SUMMARIES.map((tool) => (
                    <li key={tool.name} className="flex items-start gap-2 text-[10px] leading-snug">
                      <span className="font-mono text-zinc-500">{tool.name}</span>
                      <span className="text-zinc-600">— {tool.summary}</span>
                    </li>
                  ))}
                </ul>
                <label className="flex items-start gap-2 text-[11px] text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-900"
                    checked={mcpAllowDangerousTools}
                    onChange={(e) => setMcpAllowDangerousTools(e.target.checked)}
                  />
                  <span>
                    Sidecar write intent only — Go MCP still requires{' '}
                    <span className="font-mono text-zinc-300">VVS_MCP_ALLOW_WRITE=1</span>. This does not
                    gate the in-page agent.
                  </span>
                </label>
                {hosted ? (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    {getAccessToken() ? (
                      <p className="text-[11px] text-emerald-400/90">
                        Signed in — sidecar probe includes your access token.
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleMcpProbe()}
                      disabled={mcpProbeState === 'testing'}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-zinc-100 text-xs px-4 py-2 rounded font-medium border border-zinc-700"
                    >
                      {mcpProbeState === 'testing' ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Testing sidecar…
                        </>
                      ) : (
                        'Test local MCP sidecar'
                      )}
                    </button>
                    <p className="text-[11px] text-zinc-500">
                      {mcpProbeState === 'idle'
                        ? 'Optional — start the Go server to probe localhost MCP.'
                        : mcpProbeMessage}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Sidecar probe inactive in this build. The in-page agent above does not use
                    localhost:8080.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
