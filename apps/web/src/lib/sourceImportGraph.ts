import { parse } from '@babel/parser';
import {
  analyzeProject, normalizeProjectSnapshot, createClassSymbol, createEmptyProjectSnapshot,
  MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID,
  type FunctionSymbol, type GraphDocument, type GraphNode, type PinType, type ProjectSnapshot,
} from '@vvs/graph-types';
import { resolve } from '@vvs/syntax-registry';
import { transpileProject } from '@vvs/transpiler';
import { applyFunctionDefineBinding, applyFunctionEntryBinding, applyFunctionImplementBinding, applyFunctionReturnBinding } from './functionHelpers';
import { applyEventDefineBinding } from './eventHelpers';
import type { ImportRegion, SourceImportPreview } from './sourceImportPreview';

export const MAX_SOURCE_IMPORT_BYTES = 128 * 1024;
export interface SourceImportGraphReview {
  snapshot?: ProjectSnapshot;
  generated: string;
  diagnostics: string[];
  nodeCount: number;
}

type Statement = ReturnType<typeof parse>['program']['body'][number];
type ClassDeclaration = Extract<Statement, { type: 'ClassDeclaration' }>;
type Method = Extract<ClassDeclaration['body']['body'][number], { type: 'ClassMethod' }>;
type Expression = unknown;
const mathKinds: Record<string, string> = { '+': 'math_add', '-': 'math_subtract', '*': 'math_multiply', '/': 'math_divide' };

/** Compare syntax structure, discarding spelling/layout metadata only. Never executes source. */
export function normalizedImportSyntax(source: string): string {
  const ast = parse(source, { sourceType: 'script' });
  const ignored = new Set(['start', 'end', 'loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens', 'errors']);
  return JSON.stringify(ast.program, (key, value) => ignored.has(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
}

/** Build in isolation. A snapshot is returned only after analyzer + exact structural round trip. */
export function reviewSourceImportGraph(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry = false): SourceImportGraphReview {
  const diagnostics: string[] = [];
  let generated = '';
  let nodeCount = 0;
  try {
    if (new TextEncoder().encode(preview.source).length > MAX_SOURCE_IMPORT_BYTES) throw new Error('Source exceeds the 128 KiB import limit.');
    if (preview.diagnostics.length) throw new Error('Resolve the file’s parse errors before importing.');
    if (!preview.regions.includes(region) || region.kind !== 'candidate' || region.text !== preview.source.slice(region.start, region.end)) throw new Error('Select a candidate from the current source preview.');
    if (region.proposedKind !== 'class') throw new Error('Standalone functions need module-scope generation support. This importer currently accepts plain classes.');
    const declaration = parse(region.text, { sourceType: 'script' }).program.body[0];
    if (declaration?.type !== 'ClassDeclaration' || !declaration.id || declaration.superClass) throw new Error('Expected a plain named class.');
    if (!mapStartAsEntry) throw new Error('Confirm the explicit mapping of on_start to the VVS program entry event.');
    if (!declaration.body.body.some(m => m.type === 'ClassMethod' && m.key.type === 'Identifier' && m.key.name === 'on_start' && !m.static)) throw new Error('The class needs an ordinary on_start method for the required VVS program entry. No entry method will be invented.');
    if (declaration.body.body.length > 32) throw new Error('Import at most 32 methods in one class.');
    const snapshot = createEmptyProjectSnapshot();
    const cls = createClassSymbol(declaration.id.name, { id: MAIN_CLASS_ID, containerId: MAIN_GRAPH_CONTAINER_ID });
    snapshot.classes = [cls];
    snapshot.activeClassId = cls.id;
    snapshot.projectDetails = { moduleName: cls.name, extendsType: '', description: `Imported from ${fileName}` };
    snapshot.targetLanguage = 'javascript';
    snapshot.events = [];
    snapshot.variables = [];
    snapshot.functions = [];
    snapshot.documents = {};
    const home: GraphDocument = { nodes: [], edges: [], metadata: { moduleName: cls.name, extendsType: '', description: '', targetLanguage: 'javascript' } };
    snapshot.documents[MAIN_GRAPH_CONTAINER_ID] = home;
    let serial = 0;
    function spawn(doc: GraphDocument, kindId: string, x: number, y: number): GraphNode {
      const definition = resolve(kindId);
      if (!definition) throw new Error(`Missing registry kind: ${kindId}`);
      if (++serial > 512) throw new Error('Import at most 512 nodes in one class.');
      const node: GraphNode = {
        id: `import-node-${serial}`, type: 'vvs_standard_node', position: { x, y },
        data: { kindId, kindVersion: definition.kindVersion, label: definition.title, category: definition.category,
          inputs: structuredClone(definition.inputs), outputs: structuredClone(definition.outputs), inlineValues: {} },
      };
      doc.nodes.push(node);
      return node;
    }
    function wire(doc: GraphDocument, from: GraphNode, output: string, to: GraphNode, input: string, type: PinType) {
      doc.edges.push({ id: `import-edge-${doc.edges.length}-${from.id}-${to.id}`, source: from.id, target: to.id,
        sourceHandle: output, targetHandle: input, type: 'vvs_standard_edge', data: { pinType: type } });
    }
    const classNode = spawn(home, 'class_define', 0, 0);
    classNode.data.label = `Declare ${cls.name}`;
    classNode.data.properties = { symbolId: cls.id, classId: cls.id, name: cls.name, extendsType: '', visibility: 'public',
      sourceImport: { version: 1, language: 'javascript', fileName, source: preview.source, sourceSha256: preview.sourceSha256,
        start: region.start, end: region.end, importedAt: new Date().toISOString() } };
    let previousMember = classNode;
    const names = new Set<string>();
    for (const [methodIndex, member] of declaration.body.body.entries()) {
      if (member.type !== 'ClassMethod' || member.kind !== 'method' || member.computed || member.async || member.generator || member.key.type !== 'Identifier' || member.params.some(p => p.type !== 'Identifier')) throw new Error('Only ordinary methods with named parameters are supported.');
      const method = member as Method;
      const name = member.key.name;
      if (names.has(name)) throw new Error('Duplicate method names need an explicit mapping.');
      names.add(name);
      const parameters = member.params.map((p, i) => ({ id: `param-${i}`, label: (p as { name: string }).name, type: 'data_any' as PinType }));
      const func: FunctionSymbol = { kind: 'function', id: `import-function-${methodIndex}`, name, classId: cls.id,
        binding: method.static ? 'static' : 'instance', visibility: 'public',
        overloads: [{ id: 'o1', parameters, returnType: 'data_any', graphTabId: `import-function-${methodIndex}` }] };
      const isEntry = name === 'on_start' && !method.static;
      const body: GraphDocument = isEntry ? home : { nodes: [], edges: [], metadata: { moduleName: name, extendsType: '', description: '' } };
      let entry: GraphNode;
      if (isEntry) {
        const event = { id: 'import-entry', name: 'start', role: 'entry' as const, parameters, classId: cls.id };
        snapshot.events.push(event);
        const declarationNode = spawn(home, 'event_member_define', (methodIndex + 1) * 520, 0);
        declarationNode.data.properties = { symbolId: event.id, eventId: event.id, name: event.name, role: 'entry' };
        declarationNode.data.label = 'Declare start';
        wire(home, previousMember, 'exec_out', declarationNode, 'exec_in', 'execution');
        previousMember = declarationNode;
        entry = spawn(home, 'event_define', 0, 400);
        entry.data = applyEventDefineBinding(entry.data, event);
      } else {
        snapshot.functions.push(func);
        const declarationNode = spawn(home, 'function_define', (methodIndex + 1) * 520, 0);
        declarationNode.data = applyFunctionDefineBinding(declarationNode.data, func, 'o1');
        const define = spawn(home, 'function_implement', (methodIndex + 1) * 520 + 240, 0);
        define.data = applyFunctionImplementBinding(define.data, func, 'o1');
        define.data.properties = { ...define.data.properties, isStatic: method.static };
        wire(home, previousMember, 'exec_out', declarationNode, 'exec_in', 'execution');
        wire(home, declarationNode, 'exec_out', define, 'exec_in', 'execution');
        previousMember = define;
        snapshot.documents[func.id] = body;
        snapshot.openTabs.push({ id: func.id, type: 'function', name: `Function: ${name}` });
        entry = spawn(body, 'function_entry', 0, 0);
        entry.data = applyFunctionEntryBinding(entry.data, func, 'o1');
      }
      let column = 0;
      function expression(value: Expression, target: GraphNode, pin: string, row: number): void {
        if (!value || typeof value !== 'object' || !('type' in value)) throw new Error('Unsupported expression.');
        const expr = value as { type: string; name?: string; value?: string | number | boolean; operator?: string; left?: unknown; right?: unknown };
        if (['NumericLiteral', 'StringLiteral', 'BooleanLiteral'].includes(expr.type)) {
          if (typeof expr.value === 'number' && !Number.isFinite(expr.value)) throw new Error('Non-finite numeric literal.');
          target.data.inlineValues[pin] = expr.value!;
          return;
        }
        if (expr.type === 'Identifier') {
          const parameter = parameters.find(p => p.label === expr.name);
          if (!parameter) throw new Error(`Unresolved identifier: ${expr.name}. Only method parameters are supported.`);
          wire(body, entry, parameter.id, target, pin, 'data_any');
          return;
        }
        if (expr.type === 'BinaryExpression' && expr.operator && mathKinds[expr.operator]) {
          const math = spawn(body, mathKinds[expr.operator]!, (++column) * 240, row + 160);
          expression(expr.left, math, 'a', row + 160);
          expression(expr.right, math, 'b', row + 160);
          wire(body, math, 'result', target, pin, 'data_number');
          return;
        }
        throw new Error(`Unsupported expression: ${expr.type}. Calls, captures and receiver access need a mapping review.`);
      }
      function statements(list: Method['body']['body'], from: GraphNode, output: string, row: number): void {
        // Terminal branches avoid inventing joins or changing return/control-flow structure.
        if (list.length !== 1) throw new Error('Each method or branch must contain one return, or one if/else with terminal returns.');
        const statement = list[0]!;
        if (statement.type === 'ReturnStatement' && statement.argument) {
          const ret = spawn(body, 'flow_return', (++column) * 240, row);
          if (!isEntry) ret.data = applyFunctionReturnBinding(ret.data, func, 'o1');
          wire(body, from, output, ret, 'exec_in', 'execution');
          expression(statement.argument, ret, ret.data.inputs.find(p => p.type !== 'execution')!.id, row);
          return;
        }
        if (statement.type === 'IfStatement' && statement.consequent.type === 'BlockStatement' && statement.alternate?.type === 'BlockStatement') {
          const branch = spawn(body, 'flow_branch', (++column) * 240, row);
          wire(body, from, output, branch, 'exec_in', 'execution');
          expression(statement.test, branch, 'condition', row);
          statements(statement.consequent.body, branch, 'true_exec', row);
          statements(statement.alternate.body, branch, 'false_exec', row + 340);
          return;
        }
        throw new Error(`Unsupported statement: ${statement.type}. Use return or a complete if/else.`);
      }
      statements(method.body.body, entry, 'exec_out', isEntry ? 400 : 0);
    }
    nodeCount = serial;
    const persisted = normalizeProjectSnapshot(snapshot);
    if (!persisted) throw new Error('Imported project cannot be normalized for persistence.');
    const analysis = analyzeProject(persisted);
    const errors = analysis.diagnostics.filter(d => d.level === 'error');
    if (errors.length) throw new Error(errors.map(d => `${d.code}: ${d.message}`).join('\n'));
    const result = transpileProject({ ...persisted, projectEvents: persisted.events });
    generated = result.files.map(file => file.content).join('\n');
    if (result.files.length !== 1 || normalizedImportSyntax(generated) !== normalizedImportSyntax(region.text)) throw new Error('Generated code differs structurally from the selected source. Acceptance is blocked.');
    return { snapshot: persisted, generated, diagnostics, nodeCount };
  } catch (error) {
    diagnostics.push(error instanceof Error ? error.message : String(error));
    return { generated, diagnostics, nodeCount };
  }
}
