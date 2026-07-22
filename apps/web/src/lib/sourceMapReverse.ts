import type { SourceRange } from '@vvs/graph-types';

export interface SourceLocationQuery {
  filePath: string;
  /** 1-based line */
  line: number;
  /** 1-based column; when omitted, any range covering the line matches */
  col?: number;
}

export interface SourceRangeQuery {
  filePath: string;
  /** 1-based. */
  startLine: number;
  startCol: number;
  /** 1-based. */
  endLine: number;
  endCol: number;
}

function pathMatches(a: string, b: string): boolean {
  const na = a.replace(/\\/g, '/');
  const nb = b.replace(/\\/g, '/');
  return na === nb || na.endsWith('/' + nb) || nb.endsWith('/' + na);
}

/** Normalize an editor selection so `from` ≤ `to` regardless of drag direction. */
function normalizeSelectionRange(query: SourceRangeQuery): SourceRangeQuery {
  const after = (aL: number, aC: number, bL: number, bC: number) =>
    aL > bL || (aL === bL && aC > bC);
  if (after(query.startLine, query.startCol, query.endLine, query.endCol)) {
    return {
      filePath: query.filePath,
      startLine: query.endLine,
      startCol: query.endCol,
      endLine: query.startLine,
      endCol: query.startCol,
    };
  }
  return query;
}

function coversLocation(range: SourceRange, query: SourceLocationQuery): boolean {
  if (!pathMatches(range.filePath, query.filePath)) return false;
  if (query.line < range.startLine || query.line > range.endLine) return false;
  if (query.col == null) return true;
  if (query.line === range.startLine && query.col < range.startCol) return false;
  if (query.line === range.endLine && query.col > range.endCol) return false;
  return true;
}

/**
 * Two 1-based ranges (file-local line/col) overlap when each starts on or before
 * the other ends. `endCol` is treated as inclusive (matches `coversLocation`).
 */
function rangesIntersect(a: SourceRange, b: SourceRangeQuery): boolean {
  if (!pathMatches(a.filePath, b.filePath)) return false;
  const beforeOrAt = (aL: number, aC: number, bL: number, bC: number) =>
    aL < bL || (aL === bL && aC <= bC);
  // No overlap when a's start is strictly after b's end, or vice versa.
  if (!beforeOrAt(a.startLine, a.startCol, b.endLine, b.endCol)) return false;
  if (!beforeOrAt(b.startLine, b.startCol, a.endLine, a.endCol)) return false;
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
 * Reverse lookup: every canvas node that emits text intersecting a Code panel
 * text selection (drag or shift-click over multiple lines). Direction-agnostic
 * — input is normalized internally. Used to ring yellow / set canvas multi-select
 * on drag-select in the Code panel (U71 follow-on). The order of returned ids is
 * canonical (first-appearance order of the source map); callers may re-sort.
 */
export function findNodeIdsInSourceRange(
  sourceMap: Record<string, SourceRange[]>,
  query: SourceRangeQuery
): string[] {
  const normalized = normalizeSelectionRange(query);
  const result = new Set<string>();
  // Preserve first-appearance order in the source map for stable canvas highlight.
  for (const [nodeId, ranges] of Object.entries(sourceMap)) {
    for (const range of ranges) {
      if (!rangesIntersect(range, normalized)) continue;
      result.add(nodeId);
      break;
    }
  }
  return [...result];
}

/**
 * Which graph document owns a node id (class home, function body, event handler, …).
 * Used by Code→graph reverse select / hover so body hits target the function tab.
 * When `preferredTabId` contains the node, that tab wins (stable vs Object.entries order).
 */
export function findGraphTabContainingNodeId(
  documents: Record<string, { nodes?: ReadonlyArray<{ id: string }> }> | null | undefined,
  nodeId: string,
  preferredTabId?: string | null
): string | null {
  if (!documents) return null;
  if (
    preferredTabId &&
    documents[preferredTabId]?.nodes?.some((n) => n.id === nodeId)
  ) {
    return preferredTabId;
  }
  for (const [tabId, doc] of Object.entries(documents)) {
    if (doc?.nodes?.some((n) => n.id === nodeId)) return tabId;
  }
  return null;
}
