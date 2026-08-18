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
  insertDefineNodeForFunction,
  insertImplementNodeForFunction,
  insertBoundDefineFromCatalogTemplate,
  removeDefineNodesForSymbol,
  syncDefineNodesForSymbol,
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

  it('includes only execution pins on function_define and function_implement nodes', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const func = {
      id: 'fn-add',
      name: 'Add',
      classId: cls.id,
      visibility: 'public' as const,
      binding: 'instance' as const,
      overloads: [
        {
          id: 'ov-add',
          parameters: [
            { id: 'p-x', label: 'X', type: 'data_number' as const },
            { id: 'p-y', label: 'Y', type: 'data_number' as const },
          ],
          returnType: 'data_number',
        },
      ],
    };

    let documents = { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } };
    documents = insertDefineNodeForVariable(documents, cls, createVariableSymbol('dummy', { classId: cls.id }));

    // Insert function_define and function_implement
    documents = insertDefineNodeForFunction(documents, cls, func);
    documents = insertImplementNodeForFunction(documents, cls, func);

    const doc = documents[MAIN_GRAPH_CONTAINER_ID]!;
    const defNode = doc.nodes.find((n) => n.data.kindId === 'function_define');
    const implNode = doc.nodes.find((n) => n.data.kindId === 'function_implement');

    expect(defNode).toBeDefined();
    expect(defNode?.data.inputs).toEqual([
      { id: 'exec_in', label: '', type: 'execution' },
    ]);
    expect(defNode?.data.outputs).toEqual([
      { id: 'exec_out', label: '', type: 'execution' },
    ]);

    expect(implNode).toBeDefined();
    expect(implNode?.data.inputs).toEqual([
      { id: 'exec_in', label: '', type: 'execution' },
    ]);
    expect(implNode?.data.outputs).toEqual([
      { id: 'exec_out', label: '', type: 'execution' },
    ]);

    // Test sync when function parameter changes
    const updatedFunc = {
      ...func,
      overloads: [
        {
          id: 'ov-add',
          parameters: [
            { id: 'p-x', label: 'X', type: 'data_number' as const },
            { id: 'p-y', label: 'Y', type: 'data_number' as const },
            { id: 'p-z', label: 'Z', type: 'data_number' as const },
          ],
          returnType: 'data_number',
        },
      ],
    };

    const syncedDocs = syncDefineNodesForSymbol(documents, 'function', updatedFunc);
    const syncedDoc = syncedDocs[MAIN_GRAPH_CONTAINER_ID]!;
    const syncedDef = syncedDoc.nodes.find((n) => n.data.kindId === 'function_define');
    const syncedImpl = syncedDoc.nodes.find((n) => n.data.kindId === 'function_implement');

    expect(syncedDef?.data.inputs).toHaveLength(1); // just exec_in
    expect(syncedImpl?.data.inputs).toHaveLength(1); // just exec_in
  });

  it('syncs class_define extendsTypes with [0]===extendsType', () => {
    const cls = createClassSymbol('Child', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
      extendsType: 'Parent',
      extendsTypes: ['Mixin'],
    });
    const inserted = insertClassDefineNode(
      { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } },
      cls
    );
    const synced = syncDefineNodesForClass(inserted, cls);
    const node = synced[MAIN_GRAPH_CONTAINER_ID]!.nodes.find((n) => n.data.kindId === 'class_define');
    expect(node?.data.properties?.extendsType).toBe('Parent');
    expect(node?.data.properties?.extendsTypes).toEqual(['Parent', 'Mixin']);
  });

  it('preserves class_define isAbstract across rename sync', () => {
    const cls = createClassSymbol('Old', { id: 'cls-1', containerId: 'container-a' });
    let documents = insertClassDefineNode(
      { 'container-a': { nodes: [], edges: [] } },
      cls
    );
    const tab = documents['container-a']!;
    const node = tab.nodes.find((n) => n.data.kindId === 'class_define');
    if (!node) throw new Error('missing class_define');
    documents = {
      'container-a': {
        ...tab,
        nodes: [
          {
            ...node,
            data: {
              ...node.data,
              properties: { ...node.data.properties, isAbstract: true },
            },
          },
        ],
      },
    };
    documents = syncDefineNodesForClass(documents, { ...cls, name: 'Renamed' });
    const defineNode = documents['container-a']!.nodes.find((n) => n.data.kindId === 'class_define');
    expect(defineNode?.data.label).toBe('Declare Renamed');
    expect(defineNode?.data.properties?.name).toBe('Renamed');
    expect(defineNode?.data.properties?.isAbstract).toBe(true);
  });

  it('clears class_define form when symbol returns to class', () => {
    const cls = createClassSymbol('Child', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
      form: 'interface',
    });
    let documents = insertClassDefineNode(
      { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } },
      cls
    );
    documents = syncDefineNodesForClass(documents, { ...cls, form: undefined });
    const node = documents[MAIN_GRAPH_CONTAINER_ID]!.nodes.find((n) => n.data.kindId === 'class_define');
    expect(node?.data.properties?.form).toBeUndefined();
  });

  it('syncs class_define implementsTypes and form', () => {
    const cls = createClassSymbol('Child', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
      implementsTypes: ['IFoo', 'IBar'],
      form: 'interface',
    });
    const inserted = insertClassDefineNode(
      { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } },
      cls
    );
    const synced = syncDefineNodesForClass(inserted, cls);
    const node = synced[MAIN_GRAPH_CONTAINER_ID]!.nodes.find((n) => n.data.kindId === 'class_define');
    expect(node?.data.properties?.implementsTypes).toEqual(['IFoo', 'IBar']);
    expect(node?.data.properties?.form).toBe('interface');
  });

  it('catalog bound function_define inserts Declare, not a Call', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const func = {
      id: 'fn-add',
      name: 'Add',
      classId: cls.id,
      visibility: 'public' as const,
      binding: 'instance' as const,
      overloads: [{ id: 'ov-add', parameters: [], returnType: 'void' }],
    };
    const documents = { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } };
    const next = insertBoundDefineFromCatalogTemplate(
      documents,
      {
        type: 'function_define',
        linkedGraphId: func.id,
        graphBinding: { symbolId: func.id },
      },
      { cls, functions: [func], events: [] }
    );
    expect(next).not.toBeNull();
    const nodes = next![MAIN_GRAPH_CONTAINER_ID]!.nodes;
    expect(nodes.some((n) => n.data.kindId === 'function_define')).toBe(true);
    expect(nodes.some((n) => n.data.kindId === 'vvs.project.call_function')).toBe(false);
    expect(nodes.find((n) => n.data.kindId === 'function_define')?.data.properties?.symbolId).toBe(
      func.id
    );
  });

  it('catalog bound event_member_define inserts Declare for that event', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const event = { id: 'evt-1', name: 'calculate', parameters: [], classId: cls.id };
    const documents = { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } };
    const next = insertBoundDefineFromCatalogTemplate(
      documents,
      {
        type: 'event_member_define',
        properties: { symbolId: event.id, name: event.name, eventId: event.id },
      },
      { cls, functions: [], events: [event] }
    );
    expect(next).not.toBeNull();
    const node = next![MAIN_GRAPH_CONTAINER_ID]!.nodes.find((n) => n.data.kindId === 'event_member_define');
    expect(node?.data.properties?.symbolId).toBe(event.id);
  });

  it('catalog unbound define kinds return null so raw add can stay honest', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const documents = { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } };
    expect(
      insertBoundDefineFromCatalogTemplate(
        documents,
        { type: 'function_define' },
        { cls, functions: [], events: [] }
      )
    ).toBeNull();
    expect(
      insertBoundDefineFromCatalogTemplate(
        documents,
        { type: 'vvs.project.call_function', graphBinding: { symbolId: 'fn-1' } },
        { cls, functions: [], events: [] }
      )
    ).toBeNull();
  });

  it('removeDefineNodesForSymbol drops function_define and function_implement', () => {
    const cls = createClassSymbol('Calc', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const func = {
      id: 'fn-add',
      name: 'Add',
      classId: cls.id,
      visibility: 'public' as const,
      binding: 'instance' as const,
      overloads: [{ id: 'ov-add', parameters: [], returnType: 'void' }],
    };
    const other = {
      id: 'fn-other',
      name: 'Other',
      classId: cls.id,
      visibility: 'public' as const,
      binding: 'instance' as const,
      overloads: [{ id: 'ov-other', parameters: [], returnType: 'void' }],
    };
    let documents = { [MAIN_GRAPH_CONTAINER_ID]: { nodes: [], edges: [] } };
    documents = insertDefineNodeForFunction(documents, cls, func);
    documents = insertImplementNodeForFunction(documents, cls, func);
    documents = insertDefineNodeForFunction(documents, cls, other);
    documents = insertImplementNodeForFunction(documents, cls, other);

    const next = removeDefineNodesForSymbol(documents, 'function', func.id);
    const nodes = next[MAIN_GRAPH_CONTAINER_ID]!.nodes;
    expect(nodes.some((n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === func.id)).toBe(
      false
    );
    expect(nodes.some((n) => n.data.kindId === 'function_implement' && n.data.properties?.symbolId === func.id)).toBe(
      false
    );
    expect(nodes.some((n) => n.data.kindId === 'function_define' && n.data.properties?.symbolId === other.id)).toBe(
      true
    );
    expect(nodes.some((n) => n.data.kindId === 'function_implement' && n.data.properties?.symbolId === other.id)).toBe(
      true
    );
  });
});
