/** Transient import contracts. Accepted ProjectSnapshot is the sole editable authority. */
export interface SourceSpan { start: number; end: number }
export interface ImportContext {
  language: 'javascript' | 'python' | 'go' | 'csharp'; version: 'es2022' | '3.11' | '1.26' | '12'; sourceMode: 'script' | 'module'; environment: 'none';
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
  { kind: 'native'; language: 'javascript' | 'python' | 'go' | 'csharp'; form: import('@vvs/graph-types').NativeExpressionSettings['form']; domain?: string; payload?: string; name?: string; operator?: string; targetType?: string; operands: ExpressionPlan[]; valueType: ValueType } |
  { kind: 'literal'; value: string | number | boolean; valueType: ValueType } |
  { kind: 'parameter'; parameterId: string; scopeId: string; valueType: ValueType } |
  { kind: 'field'; fieldId: string; valueType: ValueType } |
  { kind: 'local'; localId: string; scopeId: string; valueType: ValueType } |
  { kind: 'call'; isSuper?: boolean; isSuperConstructor?: boolean; functionId: string; args: ExpressionPlan[]; nativeArgumentNames?: string[]; nativeArguments?: boolean; valueType: ValueType } |
  { kind: 'convert'; nodeKind: 'convert_to_string' | 'convert_to_number'; value: ExpressionPlan; strategy?: 'number' | 'parseFloat'; valueType: 'number' | 'string' } |
  { kind: 'compare'; operator: '===' | '!==' | '==' | '!=' | '<' | '<=' | '>' | '>='; mode: 'js-strict' | 'number' | 'string' | 'boolean'; left: ExpressionPlan; right: ExpressionPlan; valueType: 'boolean' } |
  { kind: 'binary'; numberDomain?: 'python-integer'; nodeKind: string; operator: '+' | '-' | '*' | '/'; left: ExpressionPlan; right: ExpressionPlan; valueType: 'number' }
);
export type StatementPlan = MappingEvidence & (
  { kind: 'directive'; value: string } |
  { kind: 'sequence'; statements: StatementPlan[] } |
  { kind: 'scope'; overflowContext: 'default' | 'checked' | 'unchecked'; body: StatementPlan } |
  { kind: 'declaration-group'; nativeType: import('@vvs/graph-types').CSharpIntegerType; groupStyle: 'typed' | 'const'; declarations: (MappingEvidence & ({ kind: 'declare'; local: LocalPlan; value: ExpressionPlan } | { kind: 'declare-uninitialized'; local: LocalPlan }))[] } |
  { kind: 'break'; loopStart: number } |
  { kind: 'continue'; loopStart: number } |
  { kind: 'declare'; local: LocalPlan; value: ExpressionPlan } |
  { kind: 'declare-uninitialized'; local: LocalPlan } |
  { kind: 'assign-parameter'; parameterId: string; scopeId: string; value?: ExpressionPlan; operator: import('@vvs/graph-types').CSharpAssignmentOperator; prefix?: boolean } |
  { kind: 'assign'; localId: string; value?: ExpressionPlan; operator?: '=' | '+=' | '-=' | '*=' | '/=' | '++' | '--' | '%=' | '&=' | '|=' | '^=' | '&^=' | '<<=' | '>>=' | '>>>='; prefix?: boolean } |
  { kind: 'call'; call: ExpressionPlan & { kind: 'call' } } |
  { kind: 'return'; value?: ExpressionPlan } |
  { kind: 'branch'; condition: ExpressionPlan; consequent: StatementPlan; alternate?: StatementPlan } |
  { kind: 'while'; condition: ExpressionPlan; body: StatementPlan } |
  { kind: 'range'; local: LocalPlan; args: ExpressionPlan[]; body: StatementPlan } |
  { kind: 'for'; initializer: StatementPlan & { kind: 'declare' }; condition: ExpressionPlan; update: StatementPlan & { kind: 'assign' }; body: StatementPlan }
);
export interface LocalPlan extends MappingEvidence {
  id: string; name: string; scopeId: string; valueType: ValueType; declarationKind: 'let' | 'const' | 'var' | 'assignment'; numberDomain?: 'python-integer'; nestedScope?: boolean; nativeLocalStyle?: 'go-short' | 'go-var' | 'go-const' | 'csharp-typed' | 'csharp-var' | 'csharp-const'; nativeType?: import('@vvs/graph-types').GoScalarType | import('@vvs/graph-types').CSharpIntegerType | 'untyped' | 'var';
}
export interface ParameterPlan extends SourceSpan { id: string; name: string; scopeId: string; mode?: 'positional' | 'rest'; default?: ExpressionPlan; type?: import('@vvs/graph-types').PinType; nativeType?: import('@vvs/graph-types').NativeParameter['nativeType'] }
export interface MethodPlan extends MappingEvidence {
  id: string; name: string; scopeId: string; isStatic: boolean; role: 'entry' | 'method' | 'constructor';
    parameters: ParameterPlan[]; body: StatementPlan; isExported?: boolean; returnType?: import('@vvs/graph-types').PinType | 'void'; nativeReturnType?: import('@vvs/graph-types').NativeParameter['nativeType'] | 'bool' | 'void';
}
export interface DependencyObligation extends SourceSpan {
  kind: 'parameter-read'; scopeId: string; symbolId: string; resolved: true;
}
export interface ClassImportPlan extends MappingEvidence {
  version: 1; context: ImportContext; name: string; fileName: string;
  source: string; sourceSha256: string; selectedSource: string;
  extendsType?: string;
  classVisibility?: 'public' | '';
  packageClause?: MappingEvidence & { name: string; wordBits?: import('@vvs/graph-types').GoWordBits };
  imports?: (MappingEvidence & { modulePath: string; names: string[]; bindings: { local: string; functionId: string; arity: number }[] })[];
  directives?: (MappingEvidence & { value: string })[];
  comments?: (MappingEvidence & { text: string })[];
  fields?: (MappingEvidence & { id: string; name: string; isStatic: boolean; value?: ExpressionPlan; valueType: ValueType })[];
  methods: MethodPlan[]; dependencies: DependencyObligation[];
  entryPolicy?: 'program' | 'library';
  /** File-owned functions use organizational Global scope, never a source class. */
  unitKind?: 'standalone-function';
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
