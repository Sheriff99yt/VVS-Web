import { describe, expect, test } from 'bun:test';
import {
  findNodeIdAtSourceLocation,
  findGraphTabContainingNodeId,
  findNodeIdsInSourceRange,
} from './sourceMapReverse';
import type { SourceRange } from '@vvs/graph-types';

describe('findNodeIdAtSourceLocation', () => {
  const sourceMap: Record<string, SourceRange[]> = {
    'node-wide': [
      {
        filePath: 'main.py',
        startLine: 1,
        startCol: 1,
        endLine: 20,
        endCol: 1,
      },
    ],
    'node-tight': [
      {
        filePath: 'main.py',
        startLine: 5,
        startCol: 1,
        endLine: 5,
        endCol: 40,
      },
    ],
    'other-file': [
      {
        filePath: 'other.py',
        startLine: 5,
        startCol: 1,
        endLine: 5,
        endCol: 10,
      },
    ],
  };

  test('prefers tightest covering range', () => {
    expect(
      findNodeIdAtSourceLocation(sourceMap, { filePath: 'main.py', line: 5, col: 10 })
    ).toBe('node-tight');
  });

  test('falls back to wider range on uncovered columns of same line', () => {
    expect(
      findNodeIdAtSourceLocation(sourceMap, { filePath: 'main.py', line: 5, col: 99 })
    ).toBe('node-wide');
  });

  test('returns null when no range covers the line', () => {
    expect(
      findNodeIdAtSourceLocation(sourceMap, { filePath: 'main.py', line: 99 })
    ).toBeNull();
  });

  test('ignores other files', () => {
    expect(
      findNodeIdAtSourceLocation(sourceMap, { filePath: 'other.py', line: 5 })
    ).toBe('other-file');
  });
});

describe('findGraphTabContainingNodeId', () => {
  test('returns the document tab that owns the node', () => {
    const documents = {
      'class-home': { nodes: [{ id: 'define-fn' }] },
      'fn-boot': { nodes: [{ id: 'lab-boot-print' }, { id: 'entry' }] },
    };
    expect(findGraphTabContainingNodeId(documents, 'lab-boot-print')).toBe('fn-boot');
    expect(findGraphTabContainingNodeId(documents, 'define-fn')).toBe('class-home');
  });

  test('prefers preferredTabId when that document owns the node', () => {
    const documents = {
      'class-home': { nodes: [{ id: 'shared-id' }] },
      'fn-boot': { nodes: [{ id: 'shared-id' }] },
    };
    expect(findGraphTabContainingNodeId(documents, 'shared-id', 'fn-boot')).toBe('fn-boot');
    expect(findGraphTabContainingNodeId(documents, 'shared-id', 'class-home')).toBe(
      'class-home'
    );
  });

  test('returns null when the node is missing', () => {
    expect(findGraphTabContainingNodeId({ a: { nodes: [] } }, 'missing')).toBeNull();
    expect(findGraphTabContainingNodeId(null, 'x')).toBeNull();
  });
});

describe('findNodeIdsInSourceRange', () => {
  const sourceMap: Record<string, SourceRange[]> = {
    'node-1': [{ filePath: 'main.py', startLine: 5, startCol: 1, endLine: 5, endCol: 40 }],
    'node-2': [{ filePath: 'main.py', startLine: 7, startCol: 1, endLine: 12, endCol: 1 }],
    'node-3': [{ filePath: 'main.py', startLine: 12, startCol: 4, endLine: 20, endCol: 1 }],
    'other-file': [{ filePath: 'other.py', startLine: 5, startCol: 1, endLine: 5, endCol: 10 }],
  };

  test('collects every node whose emit range intersects the drag', () => {
    const ids = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 6,
      startCol: 1,
      endLine: 8,
      endCol: 1,
    });
    expect(ids).toEqual(['node-2']);
  });

  test('returns multiple ids when the drag spans multiple statements', () => {
    const ids = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 5,
      startCol: 1,
      endLine: 13,
      endCol: 1,
    });
    expect(new Set(ids)).toEqual(new Set(['node-1', 'node-2', 'node-3']));
  });

  test('normalizes reversed drag direction (anchor after head)', () => {
    const forward = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 5,
      startCol: 1,
      endLine: 8,
      endCol: 1,
    });
    const backward = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 8,
      startCol: 1,
      endLine: 5,
      endCol: 1,
    });
    expect(new Set(backward)).toEqual(new Set(forward));
  });

  test('touch-only selection at a boundary line still matches', () => {
    const ids = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 7,
      startCol: 1,
      endLine: 7,
      endCol: 1,
    });
    expect(ids).toEqual(['node-2']);
  });

  test('global sweeping range with col endpoint after the line length still picks up nodes', () => {
    const ids = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 1,
      startCol: 1,
      endLine: 100,
      endCol: 1,
    });
    expect(new Set(ids)).toEqual(new Set(['node-1', 'node-2', 'node-3']));
  });

  test('ignores ranges on other files in the same source map', () => {
    const ids = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 5,
      startCol: 1,
      endLine: 5,
      endCol: 5,
    });
    expect(ids).toEqual(['node-1']);
  });

  test('returns empty when nothing matches', () => {
    const ids = findNodeIdsInSourceRange(sourceMap, {
      filePath: 'main.py',
      startLine: 100,
      startCol: 1,
      endLine: 110,
      endCol: 1,
    });
    expect(ids).toEqual([]);
  });
});
