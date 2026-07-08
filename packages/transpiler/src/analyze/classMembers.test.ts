import { describe, expect, it } from 'vitest';
import { createClassSymbol, createVariableSymbol, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { analyzeClassMembers } from './classMembers';

describe('analyzeClassMembers', () => {
  it('returns ordered members from class graph exec chain', () => {
    const cls = createClassSymbol('Calculator', {
      id: 'main-class',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    });
    const variable = createVariableSymbol('A', { id: 'var-a', classId: cls.id });

    const result = analyzeClassMembers(
      {
        classes: [cls],
        variables: [variable],
        functions: [],
        events: [],
        documents: {
          [MAIN_GRAPH_CONTAINER_ID]: {
            nodes: [
              {
                id: 'vd',
                type: 'vvs_standard_node',
                position: { x: 0, y: 0 },
                data: {
                  label: 'Define A',
                  category: 'Variables',
                  kindId: 'var_define',
                  inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                  outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                  inlineValues: {},
                  properties: { symbolId: variable.id },
                },
              },
            ],
            edges: [],
          },
        },
      },
      cls.id
    );

    expect(result?.orderedNodeIds).toEqual(['vd']);
    expect(result?.members).toEqual([
      { kind: 'variable', nodeId: 'vd', symbolId: variable.id },
    ]);
  });
});
