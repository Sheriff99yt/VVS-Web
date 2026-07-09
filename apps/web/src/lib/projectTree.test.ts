import { describe, expect, test } from 'bun:test';
import { listEventDispatchers } from '@/lib/projectTree';
import type { ClassSymbol } from '@vvs/graph-types';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { ProjectEventDefinition } from '@/types/graph';

const classes: ClassSymbol[] = [
  { kind: 'class', id: 'cls-1', name: 'Calculator', containerId: 'calc' },
];

const symbolEvent: ProjectEventDefinition = {
  kind: 'event',
  id: 'evt-calc',
  name: 'Calculate',
  classId: 'cls-1',
};

const documents: Record<string, GraphDocument> = {
  'class-cls-1': {
    nodes: [
      {
        id: 'legacy-dispatch',
        type: 'vvs_standard_node',
        position: { x: 0, y: 0 },
        data: {
          category: 'Events',
          label: 'LegacyOnly',
          kindId: 'event_dispatch',
        },
      },
    ],
    edges: [],
    metadata: {},
  },
};

describe('listEventDispatchers', () => {
  test('merges symbol events with unmatched legacy graph labels', () => {
    const entries = listEventDispatchers([symbolEvent], documents, classes);
    const labels = entries.map((entry) => entry.label);
    expect(labels).toContain('Calculate');
    expect(labels).toContain('LegacyOnly');
  });

  test('prefers symbol events over legacy labels with the same name', () => {
    const docs: Record<string, GraphDocument> = {
      'class-cls-1': {
        nodes: [
          {
            id: 'dup',
            type: 'vvs_standard_node',
            position: { x: 0, y: 0 },
            data: { category: 'Events', label: 'Calculate' },
          },
        ],
        edges: [],
        metadata: {},
      },
    };
    const entries = listEventDispatchers([symbolEvent], docs, classes);
    expect(entries.filter((entry) => entry.label === 'Calculate')).toHaveLength(1);
    expect(entries[0]?.id).toBe('evt-calc');
  });
});
