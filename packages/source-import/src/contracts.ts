/** Transient import contracts. Accepted ProjectSnapshot is the sole editable authority. */
export interface SourceSpan { start: number; end: number }
export interface ImportContext {
  language: 'javascript'; version: 'es2022'; sourceMode: 'script'; environment: 'none';
}
export interface ImportDiagnostic extends SourceSpan { code: string; message: string }
export class ImportFailure extends Error {
  constructor(public readonly code: string, message: string, public readonly span: SourceSpan = { start: 0, end: 0 }) {
    super(`${code}: ${message}`);
  }
}
export interface MappingEvidence extends SourceSpan { mappingId: string; mappingVersion: number }
export type ValueType = 'number' | 'string' | 'boolean' | 'unknown';
export type ExpressionPlan = MappingEvidence & (
  { kind: 'literal'; value: string | number | boolean; valueType: ValueType } |
  { kind: 'parameter'; parameterId: string; scopeId: string; valueType: 'unknown' } |
  { kind: 'binary'; nodeKind: string; operator: '+' | '-' | '*' | '/'; left: ExpressionPlan; right: ExpressionPlan; valueType: 'number' }
);
export type StatementPlan = MappingEvidence & (
  { kind: 'return'; value: ExpressionPlan } |
  { kind: 'branch'; condition: ExpressionPlan; consequent: StatementPlan; alternate: StatementPlan }
);
export interface ParameterPlan extends SourceSpan { id: string; name: string; scopeId: string }
export interface MethodPlan extends MappingEvidence {
  id: string; name: string; scopeId: string; isStatic: boolean; role: 'entry' | 'method';
  parameters: ParameterPlan[]; body: StatementPlan;
}
export interface DependencyObligation extends SourceSpan {
  kind: 'parameter-read'; scopeId: string; symbolId: string; resolved: true;
}
export interface ClassImportPlan extends MappingEvidence {
  version: 1; context: ImportContext; name: string; fileName: string;
  source: string; sourceSha256: string; selectedSource: string;
  methods: MethodPlan[]; dependencies: DependencyObligation[];
}
export interface MappingContract {
  id: string; version: number; context: ImportContext;
  astShape: string; preconditions: readonly string[];
  targets: readonly { kindId: string; kindVersion: number; options: string; pinsAndEdges: string }[];
  failures: readonly string[]; dependencies: readonly string[]; evidence: readonly string[];
}
export type MappingResult<T> =
  { status: 'supported'; value: T } |
  { status: 'unsupported'; diagnostic: ImportDiagnostic } |
  { status: 'ambiguous'; diagnostic: ImportDiagnostic; mappingIds: string[] };
export const IMPORT_CONTEXT: ImportContext = Object.freeze({ language: 'javascript', version: 'es2022', sourceMode: 'script', environment: 'none' });
export const IMPORT_LIMITS = { sourceBytes: 128 * 1024, methods: 32, nodes: 512, depth: 64, astNodes: 16384, diagnostics: 32, elapsedMs: 1500 } as const;
export const MAX_SOURCE_IMPORT_BYTES = IMPORT_LIMITS.sourceBytes;
