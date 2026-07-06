import { describe, expect, it } from 'vitest';
import {
  createClassSymbol,
  createVariableSymbol,
  MAIN_GRAPH_CONTAINER_ID,
} from '@vvs/graph-types';
import { insertDefineNodeForVariable } from './defineNodeSync';

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
              id: 'start',
              type: 'vvs_standard_node',
              position: { x: 0, y: 120 },
              data: {
                label: 'On Start',
                category: 'Events',
                kindId: 'event_on_start',
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
    expect(doc.edges.some((e) => e.source === defineNode!.id && e.target === 'start')).toBe(true);
  });
});
