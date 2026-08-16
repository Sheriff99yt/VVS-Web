'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { applyProjectSnapshot } from '@/lib/applyProjectSnapshot';
import { readUiPreference } from '@/lib/uiPreferences';
import type { ProjectSnapshot } from '@/types/projectSnapshot';
import { readAgentLlmSettings } from '@/lib/agent/agentSettings';
import {
  appendAgentTranscript,
  getAgentSession,
  patchAgentTranscript,
  setAgentReady,
  setAgentRunning,
} from '@/lib/agent/agentStatusStore';
import { buildAgentHistory, buildCanvasContext } from '@/lib/agent/canvasContext';
import { parseToolCommand } from '@/lib/agent/parseToolCommand';
import type { AgentWorkerInbound, AgentWorkerOutbound } from '@/lib/agent/protocol';
import { formatAgentToolResult } from '@/lib/agent/transcriptFormat';
import {
  invokeAgentTool,
  getAgentBridgeHost,
  installWindowAgentBridge,
  setAgentBridgeHost,
  uninstallWindowAgentBridge,
  type AgentApplyExtras,
} from '@/lib/agent/windowBridge';

let workerInstance: Worker | null = null;
let activeRequestId: string | null = null;

function newRequestId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getAgentWorker(): Worker | null {
  return workerInstance;
}

export async function runAgentPrompt(prompt: string): Promise<void> {
  const trimmed = prompt.trim();
  if (!trimmed) return;

  const history = buildAgentHistory(getAgentSession().items);

  appendAgentTranscript({ role: 'user', text: trimmed });

  const parsed = parseToolCommand(trimmed);
  if (parsed) {
    if ('error' in parsed) {
      appendAgentTranscript({ role: 'system', text: parsed.error });
      return;
    }
    const item = appendAgentTranscript({
      role: 'tool',
      text: `${parsed.name}…`,
      toolName: parsed.name,
      toolArgs: parsed.args,
    });
    try {
      const result = await invokeAgentTool(parsed.name, parsed.args);
      patchAgentTranscript(item.id, {
        text: formatAgentToolResult(parsed.name, result),
        toolOk: true,
      });
    } catch (err) {
      patchAgentTranscript(item.id, {
        text: `${parsed.name} failed: ${err instanceof Error ? err.message : String(err)}`,
        toolOk: false,
      });
    }
    return;
  }

  if (!workerInstance) {
    appendAgentTranscript({
      role: 'system',
      text: 'Agent worker is not ready. Tools still work via /tool name {json}.',
    });
    return;
  }

  const settings = readAgentLlmSettings();
  const requestId = newRequestId();
  activeRequestId = requestId;
  setAgentRunning(true);
  const host = getAgentBridgeHost();
  const snapshot = host?.getSnapshot() ?? null;
  const allowWrites = host?.getAllowWrites() ?? false;
  const canvasContext = snapshot
    ? buildCanvasContext(snapshot, { allowWrites })
    : `writes: ${allowWrites ? 'on' : 'off'}`;

  workerInstance.postMessage({
    type: 'run',
    requestId,
    prompt: trimmed,
    history,
    canvasContext,
    settings,
  } satisfies AgentWorkerInbound);
}

export function cancelAgentRun(): void {
  if (!workerInstance || !activeRequestId) return;
  workerInstance.postMessage({ type: 'cancel', requestId: activeRequestId } satisfies AgentWorkerInbound);
  activeRequestId = null;
  setAgentRunning(false);
}

export function useAgentHost(): void {
  const project = useProject();
  const workspace = useGraphWorkspace();
  const { expandCode } = useEditorPanels();
  const projectRef = useRef(project);
  const workspaceRef = useRef(workspace);
  const expandCodeRef = useRef(expandCode);
  useEffect(() => {
    projectRef.current = project;
    workspaceRef.current = workspace;
    expandCodeRef.current = expandCode;
  }, [project, workspace, expandCode]);

  const buildSnapshot = useCallback((): ProjectSnapshot | null => {
    const documents = workspaceRef.current.getDocuments();
    if (!documents) return null;
    const p = projectRef.current;
    return {
      version: 3,
      projectId: p.projectId,
      savedAt: new Date().toISOString(),
      projectDetails: p.projectDetails,
      classes: p.classes,
      activeClassId: p.activeClassId,
      graphContainers: p.graphContainers,
      variables: p.variables,
      events: p.events,
      functions: p.functions,
      openTabs: p.openTabs,
      activeGraphTab: p.activeGraphTab,
      targetLanguage: p.targetLanguage,
      targetFileExtensions: p.targetFileExtensions,
      autoCompile: p.autoCompile,
      autoSave: p.autoSave,
      documents,
      installedLibrary: p.installedLibrary,
      environmentId: p.environmentId,
      environmentVersion: p.environmentVersion,
      integration: p.integration,
      syntaxPackLock: p.syntaxPackLock,
      codegenCapabilities: p.codegenCapabilities,
      workspaceFiles: p.workspaceFiles,
    };
  }, []);

  const applySnapshot = useCallback((snapshot: ProjectSnapshot, label: string, extras?: AgentApplyExtras) => {
    const p = projectRef.current;
    const w = workspaceRef.current;
    w.pushHistory(label);
    applyProjectSnapshot(snapshot, {
      setVariables: p.setVariables,
      setEvents: p.setEvents,
      setFunctions: p.setFunctions,
      setClasses: p.setClasses,
      setActiveClassId: p.setActiveClassId,
      setOpenTabs: p.setOpenTabs,
      setActiveGraphTab: p.setActiveGraphTab,
      setProjectDetails: p.setProjectDetails,
      setTargetLanguage: p.setTargetLanguage,
      setTargetFileExtensions: p.setTargetFileExtensions,
      setAutoCompile: p.setAutoCompile,
      setAutoSave: p.setAutoSave,
      setSelection: p.setSelection,
      loadDocuments: w.loadDocuments,
      setInstalledLibrary: p.setInstalledLibrary,
      setEnvironmentLink: p.setEnvironmentLink,
      setIntegration: p.setIntegration,
      setWorkspaceFiles: p.setWorkspaceFiles,
      setSyntaxPackLock: p.setSyntaxPackLock,
      setCodegenCapabilities: p.setCodegenCapabilities,
    });
    const dirtyTabId = extras?.dirtyTabId ?? snapshot.activeGraphTab;
    p.markTabDirty(dirtyTabId);
    p.setCompileState('dirty');
    if (extras?.selectNodeId) {
      const nodeId = extras.selectNodeId;
      const select = () => {
        p.setSelection({ type: 'node', id: nodeId });
        p.setSelectedNodeIds([nodeId]);
      };
      select();
      queueMicrotask(select);
    }
  }, []);

  useEffect(() => {
    setAgentBridgeHost({
      getSnapshot: buildSnapshot,
      applySnapshot,
      getAllowWrites: () => readUiPreference('agentAllowWrites'),
      expandCode: () => expandCodeRef.current(),
    });
    installWindowAgentBridge();
    return () => {
      uninstallWindowAgentBridge();
      setAgentBridgeHost(null);
    };
  }, [applySnapshot, buildSnapshot]);

  useEffect(() => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('../lib/agent/agentWorker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      setAgentReady('error', err instanceof Error ? err.message : String(err));
      return;
    }
    workerInstance = worker;
    setAgentReady('ready');

    worker.onmessage = (event: MessageEvent<AgentWorkerOutbound>) => {
      const message = event.data;
      if (!message) return;
      if (message.type === 'tool_request') {
        const item = appendAgentTranscript({
          role: 'tool',
          text: `${message.name}…`,
          toolName: message.name,
          toolArgs: message.args,
        });
        void invokeAgentTool(message.name, message.args)
          .then((result) => {
            patchAgentTranscript(item.id, {
              text: formatAgentToolResult(message.name, result),
              toolOk: true,
            });
            worker.postMessage({
              type: 'tool_result',
              requestId: message.requestId,
              callId: message.callId,
              ok: true,
              result,
            } satisfies AgentWorkerInbound);
          })
          .catch((err: unknown) => {
            const error = err instanceof Error ? err.message : String(err);
            patchAgentTranscript(item.id, {
              text: `${message.name} failed: ${error}`,
              toolOk: false,
            });
            worker.postMessage({
              type: 'tool_result',
              requestId: message.requestId,
              callId: message.callId,
              ok: false,
              result: null,
              error,
            } satisfies AgentWorkerInbound);
          });
        return;
      }
      if (message.type === 'assistant_final') {
        appendAgentTranscript({ role: 'assistant', text: message.text });
        return;
      }
      if (message.type === 'error') {
        appendAgentTranscript({ role: 'system', text: message.message });
        setAgentRunning(false);
        activeRequestId = null;
        return;
      }
      if (message.type === 'done') {
        setAgentRunning(false);
        activeRequestId = null;
      }
    };

    worker.onerror = (event) => {
      setAgentReady('error', event.message || 'agent worker failed');
    };

    return () => {
      worker.terminate();
      if (workerInstance === worker) workerInstance = null;
      setAgentReady('starting');
    };
  }, []);
}
