import { describe, expect, test } from 'bun:test';
import {
  eventRowMeta,
  explorerTabOrder,
  extraFunctionOverloads,
  getVariableColor,
  isOutputPathOpenable,
  matchesExplorerFilter,
  outputExplorerEmptyCopy,
  sectionVisible,
} from '@/components/layout/project-tree/explorerUtils';
import { countSymbolCategoryIssues } from '@/components/layout/project-tree/symbolCategoryIssues';
import { listSymbolEventEntries } from '@/lib/projectTree';
import type { ClassSymbol } from '@vvs/graph-types';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { ProjectEventDefinition } from '@/types/graph';

describe('explorerUtils', () => {
  test('matchesExplorerFilter is case-insensitive substring', () => {
    expect(matchesExplorerFilter('Calculator', 'calc')).toBe(true);
    expect(matchesExplorerFilter('Main', 'evt')).toBe(false);
  });

  test('sectionVisible hides empty sections when filtering', () => {
    expect(sectionVisible(0, false, 'q')).toBe(false);
    expect(sectionVisible(0, true, 'q')).toBe(true);
    expect(sectionVisible(0, false, '')).toBe(true);
  });

  test('eventRowMeta formats subscriber counts', () => {
    expect(eventRowMeta({ subscriberCount: 0, dispatchCount: 1 })).toBeUndefined();
    expect(eventRowMeta({ subscriberCount: 1, dispatchCount: 0 })).toBe('1 sub');
    expect(eventRowMeta({ subscriberCount: 2, dispatchCount: 0 })).toBe('2 subs');
  });

  test('getVariableColor maps logical types', () => {
    expect(getVariableColor('data_string')).toBe('#38bdf8');
    expect(getVariableColor('unknown')).toBe('#71717a');
  });

  test('explorerTabOrder shows API only when environment is linked', () => {
    expect(explorerTabOrder(false)).toEqual(['symbols', 'output']);
    expect(explorerTabOrder(true)).toEqual(['symbols', 'output', 'api']);
  });

  test('extraFunctionOverloads omits the primary when more than one exists', () => {
    expect(extraFunctionOverloads([{ id: 'a' }])).toEqual([]);
    expect(extraFunctionOverloads([{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toEqual([
      { id: 'b' },
      { id: 'c' },
    ]);
  });

  test('output rows are openable only when generated', () => {
    expect(isOutputPathOpenable('generated')).toBe(true);
    expect(isOutputPathOpenable('vvs')).toBe(false);
    expect(isOutputPathOpenable('host')).toBe(false);
    expect(outputExplorerEmptyCopy().toLowerCase()).not.toContain('click');
  });
});

describe('listSymbolEventEntries', () => {
  const classes: ClassSymbol[] = [
    { kind: 'class', id: 'cls-1', name: 'Calculator', containerId: 'calc' },
  ];
  const symbolEvent: ProjectEventDefinition = {
    kind: 'event',
    id: 'evt-calc',
    name: 'Calculate',
    classId: 'cls-1',
  };

  test('returns symbol-table rows without legacy-only duplicates', () => {
    const documents: Record<string, GraphDocument> = {
      'class-cls-1': {
        nodes: [
          {
            id: 'legacy',
            type: 'vvs_standard_node',
            position: { x: 0, y: 0 },
            data: { category: 'Events', label: 'LegacyOnly' },
          },
        ],
        edges: [],
        metadata: {},
      },
    };

    const entries = listSymbolEventEntries([symbolEvent], documents, classes);
    expect(entries.map((e) => e.label)).toEqual(['Calculate']);
  });
});

describe('countSymbolCategoryIssues', () => {
  test('returns zeros when documents or active class missing', () => {
    expect(
      countSymbolCategoryIssues(null, undefined, [], [], [], [])
    ).toEqual({ classes: 0, functions: 0, events: 0, variables: 0 });
  });
});
