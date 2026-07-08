import { describe, expect, it } from 'vitest';
import {
  analyzeProject,
  createClassSymbol,
  createProgramEntryEvent,
  createVariableSymbol,
  MAIN_GRAPH_CONTAINER_ID,
  type ProjectEventDefinition,
} from './index';

const HOME_GRAPH = MAIN_GRAPH_CONTAINER_ID;

function baseInput(overrides: {
  documents?: Record<string, { nodes: unknown[]; edges: unknown[] }>;
  events?: ProjectEventDefinition[];
  variables?: ReturnType<typeof createVariableSymbol>[];
  classes?: ReturnType<typeof createClassSymbol>[];
}) {
  const cls = overrides.classes?.[0] ?? createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
  return {
    documents: overrides.documents ?? { [HOME_GRAPH]: { nodes: [], edges: [] } },
    functions: [],
    events: overrides.events ?? [],
    variables: overrides.variables ?? [],
    classes: overrides.classes ?? [cls],
    projectDetails: { extendsType: '' },
    targetLanguage: 'python' as const,
  };
}

function lifecycleNode(id = 'legacy-start') {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'On Start',
      category: 'Events',
      kindId: 'event_on_start',
      inputs: [],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
    },
  };
}

function runtimeEventNode(kindId: 'event_emit' | 'event_subscribe' | 'event_dispatch', id: string) {
  const label =
    kindId === 'event_emit' ? 'Emit tick' : kindId === 'event_subscribe' ? 'Subscribe tick' : 'Dispatch tick';
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label,
      category: 'Events',
      kindId,
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      properties: { eventId: 'evt-tick', eventName: 'tick' },
    },
  };
}

describe('analyzeProject event fidelity', () => {
  it('emits PROGRAM_ENTRY_MISSING when class has symbols but no entry event', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
    const variable = createVariableSymbol('Score', { id: 'var-score', classId: cls.id });

    const result = analyzeProject(
      baseInput({
        variables: [variable],
        classes: [cls],
      })
    );

    const missing = result.diagnostics.filter((d) => d.code === 'PROGRAM_ENTRY_MISSING');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.level).toBe('error');
    expect(result.ok).toBe(false);
  });

  it('emits PROGRAM_ENTRY_NOT_ON_CANVAS when entry event lacks event_member_define', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
    const variable = createVariableSymbol('Score', { id: 'var-score', classId: cls.id });
    const entry = createProgramEntryEvent({ classId: cls.id });

    const result = analyzeProject(
      baseInput({
        variables: [variable],
        events: [entry],
        classes: [cls],
      })
    );

    const notOnCanvas = result.diagnostics.filter((d) => d.code === 'PROGRAM_ENTRY_NOT_ON_CANVAS');
    expect(notOnCanvas).toHaveLength(1);
    expect(notOnCanvas[0]?.level).toBe('error');
    expect(result.ok).toBe(false);
  });

  it('emits LIFECYCLE_NODE_DEPRECATED for legacy On Start nodes', () => {
    const result = analyzeProject(
      baseInput({
        documents: {
          [HOME_GRAPH]: {
            nodes: [lifecycleNode()],
            edges: [],
          },
        },
      })
    );

    const deprecated = result.diagnostics.filter((d) => d.code === 'LIFECYCLE_NODE_DEPRECATED');
    expect(deprecated).toHaveLength(1);
    expect(deprecated[0]?.level).toBe('error');
    expect(deprecated[0]?.nodeId).toBe('legacy-start');
    expect(result.ok).toBe(false);
  });

  it('blocks event_emit nodes with HIDDEN_EVENT_RUNTIME_UNSUPPORTED', () => {
    const result = analyzeProject(
      baseInput({
        documents: {
          [HOME_GRAPH]: {
            nodes: [runtimeEventNode('event_emit', 'emit-1')],
            edges: [],
          },
        },
      })
    );

    const hidden = result.diagnostics.filter((d) => d.code === 'HIDDEN_EVENT_RUNTIME_UNSUPPORTED');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]?.level).toBe('error');
    expect(hidden[0]?.nodeId).toBe('emit-1');
    expect(result.ok).toBe(false);
  });

  it('blocks event_subscribe nodes with HIDDEN_EVENT_RUNTIME_UNSUPPORTED', () => {
    const result = analyzeProject(
      baseInput({
        documents: {
          [HOME_GRAPH]: {
            nodes: [runtimeEventNode('event_subscribe', 'sub-1')],
            edges: [],
          },
        },
      })
    );

    const hidden = result.diagnostics.filter((d) => d.code === 'HIDDEN_EVENT_RUNTIME_UNSUPPORTED');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]?.nodeId).toBe('sub-1');
    expect(result.ok).toBe(false);
  });

  it('does not block event_dispatch nodes with HIDDEN_EVENT_RUNTIME_UNSUPPORTED', () => {
    const result = analyzeProject(
      baseInput({
        documents: {
          [HOME_GRAPH]: {
            nodes: [runtimeEventNode('event_dispatch', 'dispatch-1')],
            edges: [],
          },
        },
      })
    );

    const hidden = result.diagnostics.filter((d) => d.code === 'HIDDEN_EVENT_RUNTIME_UNSUPPORTED');
    expect(hidden).toHaveLength(0);
  });

  it('promotes MULTICAST_REQUIRES_SUBSCRIBE to error for duplicate handlers', () => {
    const handler = (id: string) => ({
      id,
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'On tick',
        category: 'Events',
        kindId: 'event_define',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
        inlineValues: {},
        properties: { eventId: 'evt-tick', eventName: 'tick' },
      },
    });

    const result = analyzeProject(
      baseInput({
        documents: {
          [HOME_GRAPH]: {
            nodes: [handler('h1'), handler('h2')],
            edges: [],
          },
        },
        events: [{ id: 'evt-tick', name: 'tick', parameters: [], role: 'custom' }],
      })
    );

    const multicast = result.diagnostics.filter((d) => d.code === 'MULTICAST_REQUIRES_SUBSCRIBE');
    expect(multicast).toHaveLength(1);
    expect(multicast[0]?.level).toBe('error');
    expect(result.ok).toBe(false);
  });
});
