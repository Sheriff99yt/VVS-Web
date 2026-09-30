import { parse } from '@babel/parser';
import { ImportFailure, IMPORT_LIMITS } from './contracts';

const trustedPreviews = new WeakSet<SourceImportPreview>();
export const isTrustedPreview = (preview: SourceImportPreview) => trustedPreviews.has(preview);
function sealPreview(preview: SourceImportPreview): SourceImportPreview {
  preview.regions.forEach(Object.freeze); Object.freeze(preview.regions); Object.freeze(preview.diagnostics);
  trustedPreviews.add(preview); return Object.freeze(preview);
}

export function checkSourceBudget(source: string): void {
  if (new TextEncoder().encode(source).length > IMPORT_LIMITS.sourceBytes) throw new ImportFailure('SOURCE_BUDGET', 'Source exceeds the 128 KiB import limit.');
}
/** Iterative AST budget check runs before recursive mapping/comparison. */
export function checkAstBudget(root: unknown): void {
  const queue: { value: unknown; depth: number }[] = [{ value: root, depth: 0 }];
  let count = 0; const started = performance.now();
  while (queue.length) {
    const { value, depth } = queue.pop()!;
    if (!value || typeof value !== 'object') continue;
    if (depth > IMPORT_LIMITS.depth || ++count > IMPORT_LIMITS.astNodes || performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('AST_BUDGET', 'Source exceeds import depth, size or analysis time limits.');
    for (const [key, child] of Object.entries(value)) {
      if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(value => queue.push({ value, depth: depth + 1 }));
      else if (child && typeof child === 'object') queue.push({ value: child, depth: depth + 1 });
    }
  }
}

export function parseJavaScript(source: string, sourceMode: 'script' | 'module' = 'script') {
  checkSourceBudget(source);
  const ast = parse(source, { sourceType: sourceMode, errorRecovery: false });
  checkAstBudget(ast.program);
  return ast;
}

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
    case 'EmptyStatement':
      return true; // Existing round-trip policy allows harmless empty semicolons.
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
  checkSourceBudget(source);
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sourceSha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const regions: ImportRegion[] = [];
  const diagnostics: string[] = [];
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(source, { sourceType: 'unambiguous', errorRecovery: true });
    checkAstBudget(parsed.program);
  } catch (error) {
    diagnostics.push(`Parse failed: ${error instanceof Error ? error.message : String(error)}`);
    return sealPreview({ language: 'javascript', source, sourceSha256, diagnostics, regions: source.length ? [
      { kind: 'unresolved', start: 0, end: source.length, text: source, reason: 'Parse failed' },
    ] : [] });
  }
  for (const error of (parsed.errors ?? []).slice(0, IMPORT_LIMITS.diagnostics)) diagnostics.push(`Parse error: ${error.message}`);
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
      parsed.program.sourceType !== 'script' ? 'Module source needs explicit module-scope support' :
      parsed.program.directives.length ? 'File directives need an explicit preservation rule' :
      candidateReason(statement, source, parsed.comments ?? []);
    add(reason ? 'unresolved' : 'candidate', start, end, reason ?? undefined, statement.type === 'ClassDeclaration' ? 'class' : 'standalone-function');
    cursor = end;
  }
  if (cursor < source.length) {
    const tail = source.slice(cursor);
    add(tail.trim() ? 'unresolved' : 'trivia', cursor, source.length,
      tail.trim() ? 'Source outside a candidate function' : undefined);
  }
  return sealPreview({ language: 'javascript', source, sourceSha256, diagnostics, regions });
}

/** Exhaustive exact UTF-16 coverage; no gaps, overlaps or recovered parser acceptance. */
export function validateSourceCoverage(preview: SourceImportPreview): void {
  if (!isTrustedPreview(preview)) throw new ImportFailure('STALE_SOURCE', 'Preview must come from the current parser adapter.');
  let cursor = 0;
  for (const region of preview.regions) {
    if (region.start !== cursor || region.end <= cursor || region.end > preview.source.length || region.text !== preview.source.slice(region.start, region.end)) throw new ImportFailure('SOURCE_COVERAGE', 'Source ranges must cover the exact original file once.');
    cursor = region.end;
  }
  if (cursor !== preview.source.length) throw new ImportFailure('SOURCE_COVERAGE', 'Source ranges do not cover the original file.');
  if (preview.diagnostics.length) throw new ImportFailure('PARSE_ERRORS', 'Resolve the file’s parse errors before importing.');
}
