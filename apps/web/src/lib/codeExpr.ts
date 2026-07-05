/** Character span within a single generated source line (0-based, end exclusive). */
export interface ExprSpan {
  nodeId: string;
  start: number;
  end: number;
}

export interface ResolvedExpr {
  text: string;
  spans: ExprSpan[];
}

export function literalExpr(text: string): ResolvedExpr {
  return { text, spans: [] };
}

export function ownExpr(nodeId: string, text: string): ResolvedExpr {
  return { text, spans: text ? [{ nodeId, start: 0, end: text.length }] : [] };
}

export function offsetSpans(spans: ExprSpan[], delta: number): ExprSpan[] {
  if (delta === 0) return spans;
  return spans.map((s) => ({ nodeId: s.nodeId, start: s.start + delta, end: s.end + delta }));
}

export function mergeExpr(text: string, parts: ResolvedExpr[]): ResolvedExpr {
  const spans: ExprSpan[] = [];
  let cursor = 0;
  for (const part of parts) {
    spans.push(...offsetSpans(part.spans, cursor));
    cursor += part.text.length;
  }
  return { text, spans };
}

export function wrapExpr(
  nodeId: string,
  open: string,
  inner: ResolvedExpr,
  close: string
): ResolvedExpr {
  const text = `${open}${inner.text}${close}`;
  return {
    text,
    spans: [
      { nodeId, start: 0, end: text.length },
      ...offsetSpans(inner.spans, open.length),
    ],
  };
}
