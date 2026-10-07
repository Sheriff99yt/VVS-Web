import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan, type ImportDiagnostic } from './contracts';
import { checkSourceBudget } from './parser';
import { loadNativeParser, parseNativeTree } from './nativeParser';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';

export interface NativeLocalBinding extends SourceSpan {
  id: string; methodId: string; scopeId: string; name: string;
  kind: 'parameter' | 'local'; declaredType?: string; mutable: boolean;
}
export interface NativeLocalScope extends SourceSpan {
  id: string; methodId: string; parentId?: string; bindingIds: readonly string[];
}
export interface NativeLocalReference extends SourceSpan {
  bindingId: string; scopeId: string; access: 'read' | 'write' | 'read-write';
}
export interface NativeLocalBindingReport {
  analysisOnly: true; language: NativeInventoryLanguage; domain: 'ordinary-function-block-local-names';
  nativeValueStatus: 'unvalidated'; graphAdmission: 'blocked';
  bindings: readonly Readonly<NativeLocalBinding>[]; scopes: readonly Readonly<NativeLocalScope>[]; references: readonly Readonly<NativeLocalReference>[];
  diagnostics: readonly Readonly<ImportDiagnostic & { status: 'invalid' | 'unsupported' }>[];
}
type MutableScope = Omit<NativeLocalScope, 'bindingIds'> & { bindingIds: string[] };
type MutableReport = Omit<NativeLocalBindingReport, 'bindings' | 'scopes' | 'references' | 'diagnostics'> & {
  bindings: NativeLocalBinding[]; scopes: MutableScope[]; references: NativeLocalReference[];
  diagnostics: (ImportDiagnostic & { status: 'invalid' | 'unsupported' })[];
};
type Environment = { scope: MutableScope; parent?: Environment; names: Map<string, NativeLocalBinding> };
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });
const field = (node: SyntaxNode, name: string) => node.childForFieldName(name);
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !['comment', 'line_comment', 'block_comment'].includes(child.type));
const visible = (environment: Environment | undefined, name: string): NativeLocalBinding | undefined => environment && (environment.names.get(name) ?? visible(environment.parent, name));
function parameterMutable(node: SyntaxNode, language: NativeInventoryLanguage): boolean {
  if (language === 'rust') return children(node).some(child => child.type === 'mutable_specifier');
  if (language === 'cpp') return !children(node).some(child => child.type === 'type_qualifier' && child.text === 'const');
  return true;
}

/** Lexical facts only: no inferred native values, initialization/effects or graph receipts. */
export async function analyzeNativeLocalBindings(source: string, language: NativeInventoryLanguage): Promise<NativeLocalBindingReport> {
  if (!['cpp', 'rust', 'gdscript'].includes(language)) throw new ImportFailure('IMPORT_LANGUAGE_UNSUPPORTED', 'No local binding profile is configured.');
  checkSourceBudget(source); await loadNativeParser(language);
  const tree = parseNativeTree(source, language);
  const started = performance.now();
  const report: MutableReport = { analysisOnly: true, language, domain: 'ordinary-function-block-local-names',
    nativeValueStatus: 'unvalidated', graphAdmission: 'blocked', bindings: [], scopes: [], references: [], diagnostics: [] };
  const fail = (node: SyntaxNode, code: string): never => { throw new ImportFailure(`${language.toUpperCase()}_${code}`, 'This construct needs its native binding contract.', span(node)); };
  const budget = (node: SyntaxNode) => { if (performance.now() - started > IMPORT_LIMITS.elapsedMs) fail(node, 'UNSUPPORTED_ANALYSIS_BUDGET'); };
  const name = (node: SyntaxNode | null): string => {
    if (!node || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(node.text)) return fail(node ?? tree.rootNode, 'UNSUPPORTED_NAME');
    return node.text;
  };
  const scope = (node: SyntaxNode, methodId: string, parent?: Environment): Environment => {
    const item: MutableScope = { ...span(node), id: `${methodId}:scope:${report.scopes.filter(scope => scope.methodId === methodId).length}`, methodId,
      ...(parent ? { parentId: parent.scope.id } : {}), bindingIds: [] };
    report.scopes.push(item); return { scope: item, parent, names: new Map() };
  };
  const addBinding = (node: SyntaxNode, environment: Environment, kind: NativeLocalBinding['kind'], declaredType: string | undefined, mutable: boolean) => {
    const identifier = name(node);
    const duplicate = language === 'rust' && kind === 'local' ? undefined : language === 'gdscript' ? visible(environment, identifier) : environment.names.get(identifier);
    if (duplicate) return fail(node, 'DUPLICATE_LOCAL');
    const binding: NativeLocalBinding = { ...span(node), id: `${environment.scope.id}:binding:${environment.scope.bindingIds.length}`, methodId: environment.scope.methodId,
      scopeId: environment.scope.id, name: identifier, kind, ...(declaredType ? { declaredType } : {}), mutable };
    report.bindings.push(binding); environment.scope.bindingIds.push(binding.id); environment.names.set(identifier, binding);
    return binding;
  };
  const reference = (node: SyntaxNode, environment: Environment, access: NativeLocalReference['access']) => {
    const binding = visible(environment, name(node));
    if (!binding) return fail(node, 'UNSUPPORTED_UNRESOLVED_NAME');
    report.references.push({ ...span(node), bindingId: binding.id, scopeId: environment.scope.id, access });
  };
  const literals = new Set(['integer_literal', 'float_literal', 'number_literal', 'string_literal', 'char_literal', 'boolean_literal', 'true', 'false', 'integer', 'float', 'string']);
  const expressions = new Set(['binary_expression', 'binary_operator', 'unary_expression', 'unary_operator', 'parenthesized_expression', 'cast_expression', 'condition_clause']);
  const expression = (node: SyntaxNode, environment: Environment, access: NativeLocalReference['access'] = 'read'): void => {
    budget(node);
    if (node.type === 'identifier') { reference(node, environment, access); return; }
    if (literals.has(node.type)) return;
    if (language === 'rust' && node.type === 'type_cast_expression') {
      const operand = field(node, 'value');
      if (!operand) return fail(node, 'UNSUPPORTED_NATIVE_CAST');
      expression(operand, environment); return;
    }
    if (language === 'cpp' && node.type === 'call_expression') {
      const callee = field(node, 'function'), argumentsNode = field(node, 'arguments'), types = callee && field(callee, 'arguments');
      if (callee?.type !== 'template_function' || field(callee, 'name')?.text !== 'static_cast' || !argumentsNode || !types || children(argumentsNode).length !== 1 || children(types).length !== 1) return fail(node, 'UNSUPPORTED_EXPRESSION');
      expression(children(argumentsNode)[0], environment); return;
    }
    if (language === 'gdscript' && node.type === 'call') {
      const callee = children(node).find(child => child.type === 'identifier'), argumentsNode = field(node, 'arguments');
      if (!callee || !['int', 'bool'].includes(callee.text) || !argumentsNode || children(argumentsNode).length !== 1) return fail(node, 'UNSUPPORTED_EXPRESSION');
      if (visible(environment, callee.text)) return fail(callee, 'UNSUPPORTED_NATIVE_CAST_SHADOW');
      expression(children(argumentsNode)[0], environment); return;
    }
    if (['assignment_expression', 'compound_assignment_expr', 'assignment', 'augmented_assignment'].includes(node.type)) {
      const left = field(node, 'left'), right = field(node, 'right');
      if (!left || !right || left.type !== 'identifier') return fail(node, 'UNSUPPORTED_ASSIGNMENT_TARGET');
      const operator = source.slice(left.endIndex, right.startIndex).trim();
      expression(left, environment, operator === '=' ? 'write' : 'read-write'); expression(right, environment); return;
    }
    if (node.type === 'update_expression') {
      const operand = children(node)[0]; if (!operand || operand.type !== 'identifier') return fail(node, 'UNSUPPORTED_UPDATE');
      expression(operand, environment, 'read-write'); return;
    }
    if (expressions.has(node.type)) {
      for (const child of children(node)) if (!['type', 'primitive_type', 'type_identifier'].includes(child.type)) expression(child, environment);
      return;
    }
    if (language === 'rust' && node.type === 'block') { block(node, scope(node, environment.scope.methodId, environment)); return; }
    return fail(node, 'UNSUPPORTED_EXPRESSION');
  };
  const local = (node: SyntaxNode, environment: Environment): void => {
    if (language === 'cpp') {
      const type = field(node, 'type');
      if (!type || !['primitive_type', 'sized_type_specifier', 'placeholder_type_specifier'].includes(type.type)) return fail(node, 'UNSUPPORTED_TYPE');
      if (children(node).some(child => child.type === 'storage_class_specifier')) return fail(node, 'UNSUPPORTED_STORAGE');
      const immutable = children(node).some(child => child.type === 'type_qualifier' && child.text === 'const');
      for (const declarator of node.childrenForFieldName('declarator')) {
        const identifier = declarator.type === 'init_declarator' ? field(declarator, 'declarator') : declarator;
        if (!identifier || identifier.type !== 'identifier') return fail(declarator, 'UNSUPPORTED_DECLARATOR');
        addBinding(identifier, environment, 'local', type.text, !immutable);
        const initializer = field(declarator, 'value'); if (initializer) expression(initializer, environment);
      }
      return;
    }
    const identifier = field(node, language === 'rust' ? 'pattern' : 'name');
    if (!identifier || !['identifier', 'name'].includes(identifier.type)) return fail(node, 'UNSUPPORTED_PATTERN');
    // Rust/GDScript initializers do not see the newly introduced local.
    const initializer = field(node, 'value'); if (initializer) expression(initializer, environment);
    const mutable = language === 'rust' ? children(node).some(child => child.type === 'mutable_specifier') : node.type !== 'const_statement';
    addBinding(identifier, environment, 'local', field(node, 'type')?.text, mutable);
  };
  const statement = (node: SyntaxNode, environment: Environment): void => {
    budget(node);
    if (['declaration', 'let_declaration', 'variable_statement', 'const_statement'].includes(node.type)) { local(node, environment); return; }
    if (['compound_statement', 'block', 'body'].includes(node.type)) { block(node, scope(node, environment.scope.methodId, environment)); return; }
    if (['expression_statement', 'return_statement', 'return_expression'].includes(node.type)) {
      for (const child of children(node)) {
        if (node.type === 'expression_statement' && ['if_expression', 'return_expression'].includes(child.type)) statement(child, environment);
        else expression(child, environment);
      }
      return;
    }
    if (['if_statement', 'if_expression'].includes(node.type)) {
      const condition = field(node, 'condition'); if (!condition) return fail(node, 'UNSUPPORTED_CONDITION');
      expression(condition, environment);
      for (const child of children(node)) if (child.id !== condition.id) {
        if (['compound_statement', 'block', 'body', 'if_statement', 'if_expression'].includes(child.type)) statement(child, environment);
        else if (['else_clause', 'elif_clause'].includes(child.type)) for (const nested of children(child)) statement(nested, environment);
        else return fail(child, 'UNSUPPORTED_EMBEDDED_STATEMENT');
      }
      return;
    }
    if (node.type === 'empty_statement') return;
    expression(node, environment);
  };
  const block = (node: SyntaxNode, environment: Environment): void => { for (const child of children(node)) statement(child, environment); };
  try {
    const functions = tree.rootNode.namedChildren.filter(node => node.type === (language === 'rust' ? 'function_item' : 'function_definition'));
    if (functions.length > IMPORT_LIMITS.methods) fail(tree.rootNode, 'UNSUPPORTED_METHOD_BUDGET');
    for (const [ordinal, fn] of functions.entries()) {
      try {
        const methodId = `${language}:method:${ordinal}`, body = field(fn, 'body');
        if (!body || field(fn, 'type_parameters')) return fail(fn, 'UNSUPPORTED_FUNCTION');
        const environment = scope(body, methodId);
        const declarator = language === 'cpp' ? field(fn, 'declarator') : fn;
        if (!declarator || (language === 'cpp' && declarator.type !== 'function_declarator')) return fail(fn, 'UNSUPPORTED_FUNCTION');
        const parameters = field(declarator, 'parameters');
        for (const parameter of parameters ? children(parameters) : []) {
          const identifier = language === 'cpp' ? field(parameter, 'declarator') : language === 'rust' ? field(parameter, 'pattern') : children(parameter).find(child => child.type === 'identifier') ?? parameter;
          if (!identifier || !['identifier', 'name'].includes(identifier.type)) return fail(parameter, 'UNSUPPORTED_PARAMETER');
          if (language === 'cpp' && parameter.type !== 'parameter_declaration') return fail(parameter, 'UNSUPPORTED_PARAMETER');
          if (language === 'gdscript' && !['identifier', 'typed_parameter'].includes(parameter.type)) return fail(parameter, 'UNSUPPORTED_PARAMETER');
          if (field(parameter, 'value')) return fail(parameter, 'UNSUPPORTED_DEFAULT');
          addBinding(identifier, environment, 'parameter', field(parameter, 'type')?.text, parameterMutable(parameter, language));
        }
        block(body, environment);
      } catch (error) {
        if (!(error instanceof ImportFailure)) throw error;
        if (report.diagnostics.length < IMPORT_LIMITS.diagnostics) report.diagnostics.push({ ...error.span, code: error.code, message: error.message,
          status: error.code.includes('UNSUPPORTED') ? 'unsupported' : 'invalid' });
      }
    }
    return Object.freeze({ ...report, bindings: Object.freeze(report.bindings.map(item => Object.freeze(item))), scopes: Object.freeze(report.scopes.map(item => Object.freeze({ ...item, bindingIds: Object.freeze(item.bindingIds) }))),
      references: Object.freeze(report.references.map(item => Object.freeze(item))), diagnostics: Object.freeze(report.diagnostics.map(item => Object.freeze(item))) });
  } finally { tree.delete(); }
}
