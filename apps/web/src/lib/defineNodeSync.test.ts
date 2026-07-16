import { describe, expect, it } from 'vitest';
import {
  createClassSymbol,
  createVariableSymbol,
  MAIN_GRAPH_CONTAINER_ID,
} from '@vvs/graph-types';
import {
  hasDefineNodeForClass,
  insertDefineNodeForVariable,
  insertClassDefineNode,
  insertProgramEntryHandlerNode,
  syncDefineNodesForClass,
  relocateClassHomeGraph,
} from './defineNodeSync';

describe('defineNodeSync', () => {
  it('inserts var_define on class graph exec chain', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const variable = createVariableSymbol('A', { id: 'var-a', classId: cls.id, type: 'data_number' });

    const documents = insertDefineNodeForVariable(
      {
        [MAIN_GRAPH_CONTAINER_ID]: {
          nodes: [
            {
              id: 'entry',
              type: 'vvs_standard_node',
              position: { x: 0, y: 120 },
              data: {
                label: 'On start',
                category: 'Events',
                kindId: 'event_define',
                properties: { eventId: 'evt-start', eventName: 'start' },
                inputs: [],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
              },
            },
          ],
          edges: [],
        },
      },
      cls,
      variable
    );

    const doc = documents[MAIN_GRAPH_CONTAINER_ID]!;
    const defineNode = doc.nodes.find((n) => n.data.kindId === 'var_define');
    expect(defineNode).toBeDefined();
    expect(defineNode?.data.properties?.symbolId).toBe(variable.id);
    // Define nodes are placed without auto-wiring into the execution chain
    expect(doc.edges.length).toBe(0);
  });

  it('skips var_define for function-scoped locals', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const local = createVariableSymbol('temp', {
      id: 'var-local',
      classId: cls.id,
      type: 'data_number',
      graphTabId: 'fn-sample',
    });
    const documents = {
      [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] },
    };
    const next = insertDefineNodeForVariable(documents, cls, local);
    expect(next[MAIN_GRAPH_CONTAINER_ID]!.nodes).toHaveLength(0);
  });

  it('places program entry handler on target tab', () => {
    const cls = createClassSymbol('Widget', {
      id: 'cls-widget',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const entry = {
      kind: 'event' as const,
      id: 'evt-start',
      name: 'start',
      classId: cls.id,
      parameters: [],
    };
    const documents = insertProgramEntryHandlerNode(
      { 'other-tab': { nodes: [], edges: [] } },
      cls,
      entry,
      'other-tab'
    );
    expect(documents['other-tab']!.nodes.some((n) => n.data.kindId === 'event_define')).toBe(true);
    expect(documents[MAIN_GRAPH_CONTAINER_ID]).toBeUndefined();
  });

  it('inserts class_define with symbolId and detects by class id', () => {
    const cls = createClassSymbol('Widget', {
      id: 'cls-widget',
      containerId: 'container-a',
    });

    const documents = insertClassDefineNode(
      { 'container-a': { nodes: [], edges: [] } },
      cls
    );

    const defineNode = documents['container-a']!.nodes.find((n) => n.data.kindId === 'class_define');
    expect(defineNode?.id).toBe('class-define-cls-widget');
    expect(defineNode?.data.properties?.symbolId).toBe('cls-widget');
    expect(hasDefineNodeForClass(documents, cls)).toBe(true);
  });

  it('syncs class_define label on rename', () => {
    const cls = createClassSymbol('Old', { id: 'cls-1', containerId: 'container-a' });
    let documents = insertClassDefineNode(
      { 'container-a': { nodes: [], edges: [] } },
      cls
    );
    documents = syncDefineNodesForClass(documents, { ...cls, name: 'Renamed' });
    const defineNode = documents['container-a']!.nodes.find((n) => n.data.kindId === 'class_define');
    expect(defineNode?.data.label).toBe('Declare Renamed');
    expect(defineNode?.data.properties?.name).toBe('Renamed');
  });

  it('relocates sole class home graph when moving container', () => {
    const cls = createClassSymbol('Moved', { id: 'cls-moved', containerId: 'container-b' });
    const documents = {
      'container-a': {
        nodes: [
          {
            id: 'class-define-cls-moved',
            type: 'vvs_standard_node',
            position: { x: 0, y: 0 },
            data: {
              label: 'Declare Moved',
              kindId: 'class_define',
              properties: { symbolId: 'cls-moved', name: 'Moved' },
              inputs: [],
              outputs: [],
              inlineValues: {},
            },
          },
        ],
        edges: [],
      },
      'container-b': { nodes: [], edges: [] },
    };

    const next = relocateClassHomeGraph(
      documents,
      cls,
      'container-a',
      'container-b',
      [cls]
    );

    expect(next['container-a']!.nodes).toHaveLength(0);
    expect(next['container-b']!.nodes).toHaveLength(1);
    expect(next['container-b']!.nodes[0]?.id).toBe('class-define-cls-moved');
  });
});
