import { describe, expect, test } from 'bun:test';
import {
  collectSymbolUsages,
  isUnresolvedSymbolRef,
  removeNodesAndEdges,
  removeSymbolReferencesFromDocuments,
  resolveNodeSymbolRef,
  buildProjectSymbolIndex,
} from './symbolRefs';
import { analyzeProject } from './analyze';
import { createVariableSymbol } from './symbols';

const emptyIndex = buildProjectSymbolIndex({
  variables: [],
  functions: [],
  events: [],
});

describe('resolveNodeSymbolRef', () => {
  test('resolves variable get by graphBinding', () => {
    const node = {
      id: 'n1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'Get Score',
        category: 'Variables',
        kindId: 'variable_get',
        graphBinding: { kind: 'variable_ref' as const, symbolId: 'var-1' },
        inputs: [],
        outputs: [],
        inlineValues: {},
      },
    };
    expect(resolveNodeSymbolRef(node)).toEqual({ kind: 'variable', symbolId: 'var-1' });
  });

  test('resolves call function by linkedGraphId', () => {
    const node = {
      id: 'n2',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'Call attack',
        category: 'Project',
        kindId: 'vvs.project.call_function',
        linkKind: 'call_function' as const,
        linkedGraphId: 'fn-1',
        inputs: [],
        outputs: [],
        inlineValues: {},
      },
    };
    expect(resolveNodeSymbolRef(node)).toEqual({
      kind: 'function',
      symbolId: 'fn-1',
      displayName: 'attack',
    });
  });

  test('resolves event dispatch by eventId', () => {
    const node = {
      id: 'n3',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'Dispatch damage',
        category: 'Events',
        kindId: 'event_dispatch',
        properties: { eventId: 'evt-1', eventName: 'damage' },
        inputs: [],
        outputs: [],
        inlineValues: {},
      },
    };
    expect(resolveNodeSymbolRef(node)).toEqual({
      kind: 'event',
      symbolId: 'evt-1',
      displayName: 'damage',
    });
  });
});

describe('isUnresolvedSymbolRef', () => {
  test('returns ref when variable missing', () => {
    const node = {
      id: 'n1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'Get Score',
        category: 'Variables',
        kindId: 'variable_get',
        graphBinding: { kind: 'variable_ref' as const, symbolId: 'missing-var' },
        inputs: [],
        outputs: [],
        inlineValues: {},
      },
    };
    const ref = isUnresolvedSymbolRef(node, emptyIndex);
    expect(ref?.kind).toBe('variable');
    expect(ref?.symbolId).toBe('missing-var');
  });

  test('returns null when variable exists', () => {
    const variable = createVariableSymbol('Score', { id: 'var-1' });
    const node = {
      id: 'n1',
      type: 'vvs_standard_node' as const,
      position: { x: 0, y: 0 },
      data: {
        label: 'Get Score',
        category: 'Variables',
        kindId: 'variable_get',
        graphBinding: { kind: 'variable_ref' as const, symbolId: variable.id },
        inputs: [],
        outputs: [],
        inlineValues: {},
      },
    };
    const index = buildProjectSymbolIndex({ variables: [variable], functions: [], events: [] });
    expect(isUnresolvedSymbolRef(node, index)).toBeNull();
  });
});

describe('removeSymbolReferencesFromDocuments', () => {
  test('removes bound nodes and incident edges', () => {
    const documents = {
      main: {
        nodes: [
          {
            id: 'get-1',
            type: 'vvs_standard_node' as const,
            position: { x: 0, y: 0 },
            data: {
              label: 'Get X',
              category: 'Variables',
              kindId: 'variable_get',
              graphBinding: { kind: 'variable_ref' as const, symbolId: 'var-1' },
              inputs: [],
              outputs: [],
              inlineValues: {},
            },
          },
          {
            id: 'other',
            type: 'vvs_standard_node' as const,
            position: { x: 0, y: 0 },
            data: {
              label: 'Add',
              category: 'Math',
              inputs: [],
              outputs: [],
              inlineValues: {},
            },
          },
        ],
        edges: [{ id: 'e1', source: 'get-1', target: 'other' }],
      },
    };
    const next = removeSymbolReferencesFromDocuments(documents, 'variable', 'var-1');
    expect(next.main.nodes).toHaveLength(1);
    expect(next.main.nodes[0]?.id).toBe('other');
    expect(next.main.edges).toHaveLength(0);
  });
});

describe('collectSymbolUsages', () => {
  test('finds nodes across tabs', () => {
    const documents = {
      main: {
        nodes: [
          {
            id: 'c1',
            type: 'vvs_standard_node' as const,
            position: { x: 0, y: 0 },
            data: {
              label: 'Call foo',
              category: 'Project',
              kindId: 'vvs.project.call_function',
              linkedGraphId: 'fn-1',
              linkKind: 'call_function' as const,
              inputs: [],
              outputs: [],
              inlineValues: {},
            },
          },
        ],
        edges: [],
      },
      other: { nodes: [], edges: [] },
    };
    const usages = collectSymbolUsages(documents, 'function', 'fn-1');
    expect(usages).toEqual([{ tabId: 'main', nodeId: 'c1' }]);
  });
});

describe('removeNodesAndEdges', () => {
  test('drops edges connected to removed nodes', () => {
    const doc = {
      nodes: [
        { id: 'a', type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { label: 'A', category: '', inputs: [], outputs: [], inlineValues: {} } },
        { id: 'b', type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { label: 'B', category: '', inputs: [], outputs: [], inlineValues: {} } },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b' }],
    };
    const next = removeNodesAndEdges(doc, ['a']);
    expect(next.nodes).toHaveLength(1);
    expect(next.edges).toHaveLength(0);
  });
});

describe('analyzeProject unresolved refs', () => {
  test('emits UNRESOLVED_SYMBOL_REF warning', () => {
    const result = analyzeProject({
      documents: {
        main: {
          nodes: [
            {
              id: 'get-1',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Get Missing',
                category: 'Variables',
                kindId: 'variable_get',
                graphBinding: { kind: 'variable_ref', symbolId: 'gone' },
                inputs: [],
                outputs: [],
                inlineValues: {},
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    expect(result.diagnostics.some((d) => d.code === 'UNRESOLVED_SYMBOL_REF')).toBe(true);
  });
});
