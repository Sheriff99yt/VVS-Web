import type { SourceRange } from '@vvs/graph-types';

export interface SourceLocationQuery {
  filePath: string;
  /** 1-based line */
  line: number;
  /** 1-based column; when omitted, any range covering the line matches */
  col?: number;
}

function pathMatches(a: string, b: string): boolean {
  const na = a.replace(/\\/g, '/');
  const nb = b.replace(/\\/g, '/');
  return na === nb || na.endsWith('/' + nb) || nb.endsWith('/' + na);
}

function coversLocation(range: SourceRange, query: SourceLocationQuery): boolean {
  if (!pathMatches(range.filePath, query.filePath)) return false;
  if (query.line < range.startLine || query.line > range.endLine) return false;
  if (query.col == null) return true;
  if (query.line === range.startLine && query.col < range.startCol) return false;
  if (query.line === range.endLine && query.col > range.endCol) return false;
  return true;
}

function rangeSpan(range: SourceRange): number {
  if (range.startLine === range.endLine) {
    return Math.max(1, range.endCol - range.startCol);
  }
  return Math.max(1, (range.endLine - range.startLine) * 1000 + range.endCol);
}

/**
 * Reverse lookup: Code panel line/col → canvas node id via transpile sourceMap.
 * Prefers the tightest covering range when several nodes map to the same area.
 */
export function findNodeIdAtSourceLocation(
  sourceMap: Record<string, SourceRange[]>,
  query: SourceLocationQuery
): string | null {
  let bestNodeId: string | null = null;
  let bestSpan = Number.POSITIVE_INFINITY;

  for (const [nodeId, ranges] of Object.entries(sourceMap)) {
    for (const range of ranges) {
      if (!coversLocation(range, query)) continue;
      const span = rangeSpan(range);
      if (span < bestSpan) {
        bestSpan = span;
        bestNodeId = nodeId;
      }
    }
  }

  return bestNodeId;
}

/**
 * Which graph document owns a node id (class home, function body, event handler, …).
 * Used by Code→graph reverse select so body hits open the function tab.
 */
export function findGraphTabContainingNodeId(
  documents: Record<string, { nodes?: ReadonlyArray<{ id: string }> }> | null | undefined,
  nodeId: string
): string | null {
  if (!documents) return null;
  for (const [tabId, doc] of Object.entries(documents)) {
    if (doc?.nodes?.some((n) => n.id === nodeId)) return tabId;
  }
  return null;
}
