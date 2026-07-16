import type {
  ClassSymbol,
  FunctionSymbol,
  GraphDocument,
  ProjectEventDefinition,
  TargetLanguage,
  VariableSymbol,
  CodegenTarget,
} from '@vvs/graph-types';

/** Structured IR schema version (semver major). */
export const IR_VERSION = 3;

export type IrStmtKind =
  | 'DeclareLocal'
  | 'CallFunction'
  | 'AssignVariable'
  | 'IfBranch'
  | 'ForLoop'
  | 'ForEach'
  | 'WhileLoop'
  | 'Switch'
  | 'Sequence'
  | 'Print'
  | 'EventHandler'
  | 'DispatchEvent'
  | 'ModuleImport'
  | 'ImportClass'
  | 'AwaitWait'
  | 'SubscribeEvent'
  | 'EmitEvent'
  | 'CallNative'
  | 'ArrayPush'
  | 'CommentFallback';

export interface IrBase {
  kind: IrStmtKind;
  sourceGraphNodeId: string;
}

// ── Expression IR (language-neutral) ────────────────────────────────────────

export type IrExprKind =
  | 'Literal'
  | 'InstanceRef'
  | 'LocalRef'
  | 'BinaryOp'
  | 'ConvertToString'
  | 'ConvertToNumber'
  | 'GetInputTemp'
  | 'EnumMember';

export interface IrExprBase {
  kind: IrExprKind;
  sourceGraphNodeId: string;
}

export interface IrLiteral extends IrExprBase {
  kind: 'Literal';
  value: string | number | boolean;
  literalType: 'string' | 'number' | 'boolean' | 'null' | 'raw';
}

export interface IrInstanceRef extends IrExprBase {
  kind: 'InstanceRef';
  name: string;
}

export interface IrLocalRef extends IrExprBase {
  kind: 'LocalRef';
  name: string;
}

export interface IrBinaryOp extends IrExprBase {
  kind: 'BinaryOp';
  op: '+' | '-' | '*' | '/';
  left: IrExpr;
  right: IrExpr;
}

export interface IrConvertToString extends IrExprBase {
  kind: 'ConvertToString';
  value: IrExpr;
}

export interface IrConvertToNumber extends IrExprBase {
  kind: 'ConvertToNumber';
  value: IrExpr;
}

export interface IrGetInputTemp extends IrExprBase {
  kind: 'GetInputTemp';
  tempName: string;
}

/** Canvas `expr_enum_member` — pack formats `Enum.Member` / `Enum::Member`. */
export interface IrEnumMember extends IrExprBase {
  kind: 'EnumMember';
  enumName: string;
  member: string;
}

export type IrExpr =
  | IrLiteral
  | IrInstanceRef
  | IrLocalRef
  | IrBinaryOp
  | IrConvertToString
  | IrConvertToNumber
  | IrGetInputTemp
  | IrEnumMember;

// ── Structured statement IR ─────────────────────────────────────────────────

export interface IrCallFunction extends IrBase {
  kind: 'CallFunction';
  calleeName: string;
  /** When true, emit as instance method call (self/this receiver). */
  instanceCall: boolean;
  /** Owning class module name when calling across class boundaries. */
  targetClassName?: string;
  crossClass?: boolean;
}

export interface IrPrint extends IrBase {
  kind: 'Print';
  value: IrExpr;
}

export interface IrDeclareLocal extends IrBase {
  kind: 'DeclareLocal';
  name: string;
  variableType: string;
  defaultValue?: unknown;
}

export type AssignKind = 'variable_set' | 'get_input';

export interface IrAssignVariable extends IrBase {
  kind: 'AssignVariable';
  assignKind: AssignKind;
  targetName: string;
  targetBinding: 'instance' | 'local';
  value?: IrExpr;
  inputKind?: 'text' | 'number';
  prompt?: IrExpr;
}

export interface IrIfBranch extends IrBase {
  kind: 'IfBranch';
  condition: IrExpr;
  trueBody: IrStatement[];
  falseBody: IrStatement[];
}

export interface IrForLoop extends IrBase {
  kind: 'ForLoop';
  indexVar: string;
  first: IrExpr;
  last: IrExpr;
  body: IrStatement[];
}

export interface IrForEach extends IrBase {
  kind: 'ForEach';
  elementVar: string;
  /** Element pin / inferred collection element type — pack slot `{elementType}`. */
  elementType?: import('@vvs/graph-types').PinType | string;
  collection: IrExpr;
  body: IrStatement[];
}

export interface IrArrayPush extends IrBase {
  kind: 'ArrayPush';
  array: IrExpr;
  value: IrExpr;
}

export interface IrWhileLoop extends IrBase {
  kind: 'WhileLoop';
  condition: IrExpr;
  body: IrStatement[];
}

export interface IrSwitchCase {
  /** Display / fallback label (member name, number, or legacy `Enum::Member`). */
  label: string;
  /** When set with `member`, emit via pack `EnumMemberAccess`. */
  enumName?: string;
  member?: string;
  body: IrStatement[];
}

export interface IrSwitch extends IrBase {
  kind: 'Switch';
  selector: IrExpr;
  cases: IrSwitchCase[];
  defaultBody: IrStatement[];
}

export interface IrSequence extends IrBase {
  kind: 'Sequence';
  steps: IrStatement[][];
}

export interface IrDispatchEvent extends IrBase {
  kind: 'DispatchEvent';
  handlerName: string;
  args: IrExpr[];
  /** True when dispatching an event owned by another class (not inherited). */
  crossClass?: boolean;
  /** Module/class name for cross-class receiver construction. */
  targetClassName?: string;
}

export interface IrEmitEvent extends IrBase {
  kind: 'EmitEvent';
  eventKey: string;
  args: IrExpr[];
}

export interface IrSubscribeEvent extends IrBase {
  kind: 'SubscribeEvent';
  eventKey: string;
  handlerName: string;
}

export interface IrAwaitWait extends IrBase {
  kind: 'AwaitWait';
  seconds: string;
  async: boolean;
}

export type IrModuleImportStyle = 'module' | 'from' | 'include_system';

export interface IrModuleImport extends IrBase {
  kind: 'ModuleImport';
  moduleSlug: string;
  /** Canvas node label — used for `(x)` unsupported comment lines. */
  displayLabel?: string;
  /** `from` → ModuleImportFrom; `include_system` → ModuleImportIncludeSystem; else ModuleImport. */
  importStyle?: IrModuleImportStyle;
  /** Named imports for `from` style (e.g. `Enum`). */
  importNames?: string[];
  /** When non-empty, emit only for these target languages. */
  targetLanguages?: string[];
  /** When set, emit only for this class module. */
  ownerClassId?: string;
}

export interface IrImportClass extends IrBase {
  kind: 'ImportClass';
  className: string;
  moduleName: string;
  alias?: string;
}

export interface IrCallNative extends IrBase {
  kind: 'CallNative';
  manifestMethodId: string;
  argExprs: Record<string, IrExpr>;
}

export interface IrCommentFallback extends IrBase {
  kind: 'CommentFallback';
  /** Original intended statement kind (diagnostics / fallback labeling). */
  intendedKind: IrStmtKind;
  comment: string;
}

export type IrStructuredStatement =
  | IrCallFunction
  | IrAssignVariable
  | IrIfBranch
  | IrForLoop
  | IrForEach
  | IrWhileLoop
  | IrSwitch
  | IrSequence
  | IrPrint
  | IrDispatchEvent
  | IrModuleImport
  | IrImportClass
  | IrAwaitWait
  | IrSubscribeEvent
  | IrEmitEvent
  | IrCallNative
  | IrArrayPush
  | IrCommentFallback
  | IrDeclareLocal;

export type IrStatement = IrStructuredStatement;

export interface IrEventHandler {
  kind: 'EventHandler';
  sourceGraphNodeId: string;
  handlerName: string;
  paramNames: string[];
  body: IrStatement[];
  isConstructor?: boolean;
  /** Handler-node properties (e.g. isOverride) from canvas. */
  properties?: Record<string, unknown>;
}

export interface IrStartEvent {
  sourceGraphNodeId: string;
  isExplicitStartEvent: boolean;
}

/** Canvas-ordered member declaration from define nodes on the class graph. */
export type IrMemberDecl =
  | {
      kind: 'ClassDecl';
      sourceGraphNodeId: string;
      name: string;
      extendsType?: string;
      properties?: Record<string, unknown>;
    }
  | {
      kind: 'VariableDecl';
      sourceGraphNodeId: string;
      symbol: VariableSymbol;
      properties?: Record<string, unknown>;
    }
  | {
      kind: 'FunctionDecl';
      sourceGraphNodeId: string;
      symbol: FunctionSymbol;
      properties?: Record<string, unknown>;
    }
  | {
      kind: 'EventDecl';
      sourceGraphNodeId: string;
      /** Canvas `event_define` handler node — owns def + body highlight when present. */
      handlerSourceGraphNodeId?: string;
      symbol: ProjectEventDefinition;
      handlerName: string;
      paramNames: string[];
      body: IrStatement[];
      properties?: Record<string, unknown>;
    }
  | {
      kind: 'EnumDecl';
      sourceGraphNodeId: string;
      name: string;
      members: string[];
      properties?: Record<string, unknown>;
    }
  | IrModuleImport
  | IrImportClass;

export interface IrClass {
  classId: string;
  name: string;
  extendsType?: string;
  members: IrMemberDecl[];
  onStartBody: IrStatement[];
  eventHandlers: IrEventHandler[];
  functionBodies: Record<string, IrStatement[]>;
}

export interface IrProject {
  classes: IrClass[];
  targetLanguage: TargetLanguage;
  codegenTarget?: CodegenTarget;
}

export interface IrModule {
  moduleName: string;
  extendsType: string;
  targetLanguage: TargetLanguage;
  codegenTarget?: CodegenTarget;
  filePath: string;
  tabId: string;
  tabLabel?: string;
  isFunctionTab: boolean;
  activeFunction?: FunctionSymbol;
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  projectEvents: ProjectEventDefinition[];
  documents?: Record<string, GraphDocument>;
  startEvent?: IrStartEvent;
  imports: IrStatement[];
  onStartBody: IrStatement[];
  eventHandlers: IrEventHandler[];
  functionBodies: Record<string, IrStatement[]>;
  execOrder: string[];
  handlerNodeLabels: string[];
  environmentManifest?: import('@vvs/environment-templates').ProjectEnvironmentManifest;
  /** Ordered canvas define nodes; empty when the class graph has no define chain. */
  members: IrMemberDecl[];
  activeClass?: ClassSymbol;
  /**
   * When true (default), gated ModuleImport mismatches emit `(x)` comment lines.
   * When false, mismatched imports are omitted (legacy silent skip).
   */
  emitUnsupportedComments?: boolean;
}
