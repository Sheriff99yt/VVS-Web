import type { SourceRange } from '@vvs/graph-types';
import type { ExprSpan } from './codeExpr';

export interface TaggedStatement {
  nodeId: string;
  text: string;
  /** Spans for data nodes referenced inside this statement (per output line). */
  expressionSpans?: ExprSpan[];
}

export class CodeSink {
  private readonly lines: string[] = [];
  readonly sourceMap: Record<string, SourceRange[]> = {};
  readonly fragments: Record<string, string> = {};

  constructor(private readonly filePath: string) {}

  get lineCount(): number {
    return this.lines.length;
  }

  get content(): string {
    return this.lines.join('\n');
  }

  appendRaw(text: string): void {
    if (!text) return;
    this.lines.push(...text.split('\n'));
  }

  appendTagged(tag: TaggedStatement): void {
    if (!tag.text) return;
    const parts = tag.text.split('\n');
    const startLine = this.lines.length + 1;
    this.lines.push(...parts);
    const endLine = this.lines.length;
    const lastLine = parts[parts.length - 1] ?? '';
    const range: SourceRange = {
      filePath: this.filePath,
      startLine,
      startCol: 1,
      endLine,
      endCol: Math.max(1, lastLine.length + 1),
    };
    if (!this.sourceMap[tag.nodeId]) this.sourceMap[tag.nodeId] = [];
    this.sourceMap[tag.nodeId].push(range);
    if (!this.fragments[tag.nodeId]) {
      this.fragments[tag.nodeId] = tag.text.split('\n')[0]?.trim() ?? tag.text;
    }
    if (tag.expressionSpans?.length) {
      this.registerExpressionSpans(startLine, parts, tag.expressionSpans);
    }
  }

  /** Map data-node contributions to column ranges on emitted lines. */
  registerExpressionSpans(
    startLine: number,
    parts: string[],
    spans: ExprSpan[]
  ): void {
    for (const span of spans) {
      const mapped = this.spanToRange(startLine, parts, span);
      if (!mapped) continue;
      if (!this.sourceMap[span.nodeId]) this.sourceMap[span.nodeId] = [];
      this.sourceMap[span.nodeId].push(mapped);
      if (!this.fragments[span.nodeId]) {
        const line = parts[mapped.startLine - startLine] ?? '';
        const snippet = line.slice(mapped.startCol - 1, mapped.endCol - 1).trim();
        if (snippet) this.fragments[span.nodeId] = snippet;
      }
    }
  }

  private spanToRange(
    startLine: number,
    parts: string[],
    span: ExprSpan
  ): SourceRange | null {
    let offset = 0;
    for (let i = 0; i < parts.length; i++) {
      const line = parts[i] ?? '';
      const lineStart = offset;
      const lineEnd = offset + line.length;
      if (span.start >= lineStart && span.end <= lineEnd) {
        const localStart = span.start - lineStart;
        const localEnd = span.end - lineStart;
        if (localEnd <= localStart) return null;
        return {
          filePath: this.filePath,
          startLine: startLine + i,
          startCol: localStart + 1,
          endLine: startLine + i,
          endCol: localEnd + 1,
        };
      }
      offset = lineEnd + 1;
    }
    return null;
  }

  appendTaggedMany(tags: TaggedStatement[]): void {
    for (const tag of tags) this.appendTagged(tag);
  }

  /** Map a node to an existing line range (e.g. event handler `def on_*` block). */
  tagRange(nodeId: string, startLine: number, endLine: number, fragment?: string): void {
    if (startLine < 1 || endLine < startLine) return;
    const lastLine = this.lines[endLine - 1] ?? '';
    const range: SourceRange = {
      filePath: this.filePath,
      startLine,
      startCol: 1,
      endLine,
      endCol: Math.max(1, lastLine.length + 1),
    };
    if (!this.sourceMap[nodeId]) this.sourceMap[nodeId] = [];
    this.sourceMap[nodeId].push(range);
    if (fragment && !this.fragments[nodeId]) {
      this.fragments[nodeId] = fragment;
    }
  }
}
