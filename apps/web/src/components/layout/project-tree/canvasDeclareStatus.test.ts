import { describe, expect, test } from 'bun:test';
import { createClassSymbol, createVariableSymbol } from '@vvs/graph-types';
import { countMissingDeclaresForClass } from '@/components/layout/project-tree/canvasDeclareStatus';
import type { GraphDocument } from '@/lib/graphDefaults';

describe('canvasDeclareStatus', () => {
  test('counts missing class declare when member chain exists without class_define', () => {
    const cls = createClassSymbol('App', { id: 'cls-1', containerId: 'calc-graph' });
    const variable = createVariableSymbol('Score', { id: 'var-1', classId: cls.id });
    const documents: Record<string, GraphDocument> = {
      'calc-graph': {
        nodes: [
          {
            id: 'vd',
            type: 'vvs_standard_node',
            position: { x: 0, y: 0 },
            data: {
              kindId: 'var_define',
              label: 'Declare Score',
              category: 'Variables',
              properties: { symbolId: variable.id },
            },
          },
        ],
        edges: [],
      },
    };

    expect(
      countMissingDeclaresForClass(documents, cls, [variable], [], [])
    ).toBe(1);
  });
});
