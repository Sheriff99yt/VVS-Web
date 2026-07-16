import { describe, expect, test } from 'bun:test';
import { findNodeIdAtSourceLocation } from './sourceMapReverse';
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
