import { parse } from '@babel/parser';

export type ImportRegionKind = 'candidate' | 'unresolved' | 'trivia';

export interface ImportRegion {
  kind: ImportRegionKind;
  start: number;
  end: number;
  text: string;
  reason?: string;
  /** Candidate status means eligible for a mapper, never safe to import yet. */
  proposedKind?: 'standalone-function' | 'class';
}

export interface SourceImportPreview {
  language: 'javascript';
  source: string;
  sourceSha256: string;
  regions: ImportRegion[];
  diagnostics: string[];
}

type ProgramStatement = ReturnType<typeof parse>['program']['body'][number];
type FunctionStatement = Extract<ProgramStatement, { type: 'FunctionDeclaration' }>['body']['body'][number];

function supportedExpression(expression: unknown): boolean {
  if (!expression || typeof expression !== 'object' || !('type' in expression)) return false;
  const node = expression as { type: string; [key: string]: unknown };
  switch (node.type) {
    case 'Identifier':
    case 'NumericLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
      return true;
    case 'BinaryExpression':
      return ['+', '-', '*', '/'].includes(String(node.operator)) &&
        supportedExpression(node.left) && supportedExpression(node.right);
    case 'CallExpression':
      return (node.callee as { type?: string })?.type === 'Identifier' &&
        Array.isArray(node.arguments) && node.arguments.every(supportedExpression);
    default:
      return false;
  }
}

function supportedStatement(statement: FunctionStatement): boolean {
  switch (statement.type) {
    case 'VariableDeclaration':
      return (statement.kind === 'let' || statement.kind === 'const') &&
        statement.declarations.length === 1 &&
        statement.declarations[0]?.id.type === 'Identifier' &&
        supportedExpression(statement.declarations[0]?.init);
    case 'ExpressionStatement': {
      const expression = statement.expression;
      if (expression.type === 'CallExpression') return supportedExpression(expression);
      return expression.type === 'AssignmentExpression' && expression.operator === '=' &&
        expression.left.type === 'Identifier' && supportedExpression(expression.right);
    }
    case 'IfStatement':
      return supportedExpression(statement.test) && statement.consequent.type === 'BlockStatement' &&
        statement.consequent.body.every(supportedStatement) &&
        (!statement.alternate || (statement.alternate.type === 'BlockStatement' &&
          statement.alternate.body.every(supportedStatement)));
    case 'ReturnStatement':
      return statement.argument === null || supportedExpression(statement.argument);
    default:
      return false;
  }
}

function candidateReason(statement: ProgramStatement, source: string, comments: { start?: number | null; end?: number | null }[]): string | null {
  if (statement.type === 'ClassDeclaration') {
    if (!statement.id || statement.superClass || statement.decorators?.length) return 'Class inheritance or decorators need a mapping review';
    if (comments.some(c => typeof c.start === 'number' && typeof c.end === 'number' && c.start >= (statement.start ?? 0) && c.end <= (statement.end ?? 0))) return 'Comments inside the class need a placement rule';
    if (!statement.body.body.length) return 'Empty class needs an explicit body rule';
    if (!statement.body.body.every(member => member.type === 'ClassMethod' && member.kind === 'method' && !member.computed && !member.async && !member.generator && member.key.type === 'Identifier' && member.params.every(p => p.type === 'Identifier'))) return 'Class contains an unsupported member or signature';
    return null;
  }
  if (statement.type !== 'FunctionDeclaration') return 'Unsupported top-level construct';
  if (statement.start == null || statement.end == null) return 'Function has no reliable source span';
  const functionStart = statement.start;
  const functionEnd = statement.end;
  if (!statement.id || statement.async || statement.generator || statement.params.some(p => p.type !== 'Identifier')) {
    return 'Function signature needs a mapping review';
  }
  if (comments.some(c => typeof c.start === 'number' && typeof c.end === 'number' && c.start >= functionStart && c.end <= functionEnd)) {
    return 'Comments inside the function need a placement rule';
  }
  if (!statement.body.body.length) return 'Empty function needs an explicit body rule';
  if (!statement.body.body.every(supportedStatement)) return 'Function contains unsupported syntax or expression';
  if (source.slice(statement.start, statement.end).includes('\r')) return 'Line endings need a preservation check';
  return null;
}

/** Read-only, exhaustive source classification. Does not create or mutate VVS graphs. */
export async function previewJavaScriptImport(source: string): Promise<SourceImportPreview> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sourceSha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const regions: ImportRegion[] = [];
  const diagnostics: string[] = [];
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(source, { sourceType: 'unambiguous', errorRecovery: true });
  } catch (error) {
    diagnostics.push(`Parse failed: ${error instanceof Error ? error.message : String(error)}`);
    return { language: 'javascript', source, sourceSha256, diagnostics, regions: source.length ? [
      { kind: 'unresolved', start: 0, end: source.length, text: source, reason: 'Parse failed' },
    ] : [] };
  }
  for (const error of parsed.errors ?? []) diagnostics.push(`Parse error: ${error.message}`);
  let cursor = 0;
  const add = (kind: ImportRegionKind, start: number, end: number, reason?: string, proposedKind: ImportRegion['proposedKind'] = 'standalone-function') => {
    if (end <= start) return;
    regions.push({ kind, start, end, text: source.slice(start, end), ...(reason ? { reason } : {}),
      ...(kind === 'candidate' ? { proposedKind } : {}) });
  };
  for (const statement of parsed.program.body) {
    const start = statement.start ?? cursor;
    const end = statement.end ?? source.length;
    if (start > cursor) {
      const gap = source.slice(cursor, start);
      add(gap.trim() ? 'unresolved' : 'trivia', cursor, start,
        gap.trim() ? 'Source outside a candidate function' : undefined);
    }
    const reason = statement.start == null || statement.end == null ? 'Unreliable source span' :
      diagnostics.length ? 'File has parse errors' :
      candidateReason(statement, source, parsed.comments ?? []);
    add(reason ? 'unresolved' : 'candidate', start, end, reason ?? undefined, statement.type === 'ClassDeclaration' ? 'class' : 'standalone-function');
    cursor = end;
  }
  if (cursor < source.length) {
    const tail = source.slice(cursor);
    add(tail.trim() ? 'unresolved' : 'trivia', cursor, source.length,
      tail.trim() ? 'Source outside a candidate function' : undefined);
  }
  return { language: 'javascript', source, sourceSha256, diagnostics, regions };
}
