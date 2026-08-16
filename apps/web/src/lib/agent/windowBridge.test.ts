import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { createEmptyProjectSnapshot, type ProjectSnapshot } from '@vvs/graph-types';
import {
  createAgentBridge,
  installWindowAgentBridge,
  setAgentBridgeHost,
  uninstallWindowAgentBridge,
} from './windowBridge';
import { AGENT_TOOL_NAMES } from './toolDefs';

describe('window.vvs.agent bridge', () => {
  let snapshot: ProjectSnapshot;

  beforeEach(() => {
    const windowLike = { vvs: undefined as { agent?: unknown; tools?: unknown } | undefined };
    Object.defineProperty(globalThis, 'window', { value: windowLike, configurable: true });
    snapshot = createEmptyProjectSnapshot();
    setAgentBridgeHost({
      getSnapshot: () => snapshot,
      applySnapshot: (next) => {
        snapshot = next;
      },
      getAllowWrites: () => true,
    });
  });

  afterEach(() => {
    uninstallWindowAgentBridge();
    setAgentBridgeHost(null);
  });

  test('lists the in-page tools', () => {
    const tools = createAgentBridge().listTools();
    expect(tools.map((t) => t.name)).toEqual([...AGENT_TOOL_NAMES]);
  });

  test('installs window.vvs.agent and window.vvs.tools', () => {
    const api = installWindowAgentBridge();
    expect(window.vvs?.agent).toBe(api);
    expect(window.vvs?.tools).toBe(api);
    expect(window.vvs?.agent?.listTools().map((t) => t.name)).toEqual([...AGENT_TOOL_NAMES]);
  });
});
