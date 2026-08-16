import type { ProjectSnapshot } from '@vvs/graph-types';
import { listAgentTools, callTool } from './toolRuntime';
import type { AgentToolDef } from './toolDefs';
import type { VvsAgentBridge } from './protocol';

export interface AgentBridgeHost {
  getSnapshot(): ProjectSnapshot | null;
  applySnapshot(snapshot: ProjectSnapshot, label: string): void;
  getAllowWrites(): boolean;
}

let host: AgentBridgeHost | null = null;

export function setAgentBridgeHost(next: AgentBridgeHost | null): void {
  host = next;
}

export function getAgentBridgeHost(): AgentBridgeHost | null {
  return host;
}

export async function invokeAgentTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  if (!host) {
    throw new Error('agent host is not mounted');
  }
  const snapshot = host.getSnapshot();
  if (!snapshot) {
    throw new Error('editor graph is not ready');
  }
  const result = callTool(name, args, {
    snapshot,
    allowWrites: host.getAllowWrites(),
  });
  if (result.snapshot) {
    host.applySnapshot(result.snapshot, `Agent ${name}`);
  }
  if (!result.ok) {
    throw new Error(result.error ?? 'tool failed');
  }
  return result.data;
}

export function createAgentBridge(): VvsAgentBridge {
  return {
    listTools(): AgentToolDef[] {
      return listAgentTools();
    },
    callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
      return invokeAgentTool(name, args);
    },
  };
}

export function installWindowAgentBridge(): VvsAgentBridge {
  const api = createAgentBridge();
  if (typeof window === 'undefined') return api;
  const prev = window.vvs ?? {};
  window.vvs = { ...prev, agent: api, tools: api };
  return api;
}

export function uninstallWindowAgentBridge(): void {
  if (typeof window === 'undefined') return;
  if (!window.vvs) return;
  delete window.vvs.agent;
  delete window.vvs.tools;
}

declare global {
  interface Window {
    vvs?: {
      agent?: VvsAgentBridge;
      tools?: VvsAgentBridge;
    };
  }
}
