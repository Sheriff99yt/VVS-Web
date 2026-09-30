import type { SourceSpan } from './contracts';

/** Convert exact parser boundaries to review UTF-16 offsets. Reject interior byte/surrogate positions. */
export function toReviewSpan(source: string, span: SourceSpan, encoding: 'utf16' | 'utf8' | 'codepoint'): SourceSpan {
  if (![span.start, span.end].every(value => Number.isSafeInteger(value) && value >= 0) || span.end < span.start) throw new Error('SOURCE_SPAN_INVALID');
  const boundaries = new Map<number, number>([[0, 0]]);
  let native = 0, utf16 = 0;
  const encoder = new TextEncoder();
  for (const point of source) {
    native += encoding === 'utf8' ? encoder.encode(point).length : encoding === 'codepoint' ? 1 : point.length;
    utf16 += point.length;
    boundaries.set(native, utf16);
  }
  const start = boundaries.get(span.start), end = boundaries.get(span.end);
  if (start === undefined || end === undefined) throw new Error('SOURCE_SPAN_BOUNDARY_INVALID');
  return { start, end };
}
