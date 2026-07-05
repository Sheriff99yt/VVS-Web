import type { GraphNode, GraphEdge, GraphVariable, FunctionSymbol, ProjectEventDefinition, TargetLanguage, GraphDocument, TranspileResult } from '@vvs/graph-types';
import { buildExecutionOrder, findSimulationStartNode } from './analyze/graphOrder';
import { CodeSink, type TaggedStatement } from './codeSink';
import { generatedFileName } from './graphTabs';
import type { GraphTab } from '@vvs/graph-types';
import { getNodeKindDefinition, getVariableName, normalizeNodeData, resolveNodeKindId, eventHandlerName, parameterCodegenName, resolveEventForNode } from './nodeHelpers';
import {
  literalExpr,
  offsetSpans,
  ownExpr,
  type ExprSpan,
  type ResolvedExpr,
} from './codeExpr';

interface EmittedStatement {
  text: string;
  expressionSpans: ExprSpan[];
}

export interface CodegenContext {
  moduleName: string;
  extendsType: string;
  targetLanguage: TargetLanguage;
  variables: GraphVariable[];
  projectEvents: ProjectEventDefinition[];
  functions: FunctionSymbol[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  tabLabel?: string;
  tabId?: string;
  documents?: Record<string, GraphDocument>;
}

function isCodegenNode(node: GraphNode): boolean {
  return node.type === 'vvs_standard_node';
}

function getDataEdgeToPin(
  edges: GraphEdge[],
  nodeId: string,
  pinId: string
): GraphEdge | undefined {
  return edges.find(
    (e) =>
      e.target === nodeId &&
      e.targetHandle === pinId &&
      e.data?.pinType !== 'execution'
  );
}

function firstInputPinId(node: GraphNode, candidates: string[]): string | undefined {
  const inputs = node.data.inputs ?? [];
  for (const id of candidates) {
    if (inputs.some((p) => p.id === id)) return id;
  }
  return inputs.find((p) => p.type !== 'execution')?.id;
}

function overloadParamNames(func: FunctionSymbol): string[] {
  return func.overloads[0]?.parameters.map((p) => parameterCodegenName(p)) ?? [];
}

function formatFunctionDefHeader(func: FunctionSymbol, targetLanguage: TargetLanguage): string {
  const params = overloadParamNames(func);
  const binding = func.binding ?? 'instance';
  if (targetLanguage === 'python') {
    const args = binding === 'instance' ? ['self', ...params].join(', ') : params.join(', ');
    const prefix = binding === 'static' ? '    @staticmethod\n    ' : '    ';
    return `${prefix}def ${func.name}(${args}):`;
  }
  if (targetLanguage === 'javascript') {
    const prefix = binding === 'static' ? '  static ' : '  ';
    const args = params.join(', ');
    return `${prefix}${func.name}(${args}) {`;
  }
  if (targetLanguage === 'cpp') {
    const prefix = binding === 'static' ? '    static ' : '    ';
    const args = params.join(', ');
    return `${prefix}void ${func.name}(${args}) {`;
  }
  if (targetLanguage === 'verse') {
    const args = params.map((p, i) => {
      const param = func.overloads[0]!.parameters[i]!;
      const t = param.type === 'data_number' ? 'float' : param.type === 'data_string' ? 'string' : 'logic';
      return `${p} : ${t}`;
    }).join(', ');
    return `    ${func.name}<override>(${args}) : void =`;
  }
  return `    // ${func.name}`;
}

function resolveFunctionName(
  linkedGraphId: string,
  functions: { id: string; name: string }[]
): string {
  return functions.find((f) => f.id === linkedGraphId)?.name ?? linkedGraphId;
}

function mathOpFromKindId(kindId: string): string | null {
  const def = getNodeKindDefinition(kindId);
  return def?.mathOp ?? null;
}

function mathBinaryExpr(
  nodeId: string,
  op: string,
  a: ResolvedExpr,
  b: ResolvedExpr
): ResolvedExpr {
  const inner = `${a.text} ${op} ${b.text}`;
  const open = '(';
  const text = `${open}${inner})`;
  return {
    text,
    spans: [
      { nodeId, start: 0, end: text.length },
      ...offsetSpans(a.spans, open.length),
      ...offsetSpans(b.spans, open.length + a.text.length + op.length + 2),
    ],
  };
}

function resolveNodeOutputExpr(
  node: GraphNode,
  pinId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  depth: number
): ResolvedExpr {
  const kindId = resolveNodeKindId(node.data);
  const varName = getVariableName(node.data);

  if (kindId === 'variable_get' && varName) {
    const text =
      lang === 'python' ? `self.${varName}` : lang === 'javascript' ? `this.${varName}` : varName;
    return ownExpr(node.id, text);
  }

  const mathOp = mathOpFromKindId(kindId);
  if (mathOp) {
    const aPin = firstInputPinId(node, ['a', 'in_a']) ?? 'a';
    const bPin = firstInputPinId(node, ['b', 'in_b']) ?? 'b';
    const a = resolvePinValueExpr(node, aPin, nodes, edges, lang, depth);
    const b = resolvePinValueExpr(node, bPin, nodes, edges, lang, depth);
    const op =
      mathOp === 'add' ? '+' : mathOp === 'subtract' ? '-' : mathOp === 'multiply' ? '*' : '/';
    return mathBinaryExpr(node.id, op, a, b);
  }

  if (node.data.category === 'Events') {
    const pin = node.data.outputs?.find((p) => p.id === pinId);
    const text = pin?.label ? pin.label.replace(/\s+/g, '_').toLowerCase() : 'event_value';
    return literalExpr(text);
  }

  return literalExpr(`/* ${node.data.label}.${pinId} */`);
}

function resolvePinValueExpr(
  node: GraphNode,
  pinId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  depth = 0
): ResolvedExpr {
  if (depth > 8) return literalExpr('/* cycle */');

  const edge = getDataEdgeToPin(edges, node.id, pinId);
  if (edge) {
    const source = nodes.find((n) => n.id === edge.source);
    if (!source || source.type !== 'vvs_standard_node') {
      const text = lang === 'python' ? 'None' : lang === 'verse' ? '""' : 'null';
      return literalExpr(text);
    }
    return resolveNodeOutputExpr(source, edge.sourceHandle ?? '', nodes, edges, lang, depth + 1);
  }

  const inline = node.data.inlineValues?.[pinId];
  if (inline !== undefined) {
    if (typeof inline === 'string') return literalExpr(`"${inline}"`);
    if (typeof inline === 'boolean') {
      const text = lang === 'python' ? (inline ? 'True' : 'False') : String(inline);
      return literalExpr(text);
    }
    return literalExpr(String(inline));
  }

  const text = lang === 'python' ? 'None' : 'null';
  return literalExpr(text);
}

/** @deprecated String-only — prefer resolvePinValueExpr for source maps. */
function resolveNodeOutput(
  node: GraphNode,
  pinId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  depth: number
): string {
  return resolveNodeOutputExpr(node, pinId, nodes, edges, lang, depth).text;
}

function resolvePinValue(
  node: GraphNode,
  pinId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  depth = 0
): string {
  return resolvePinValueExpr(node, pinId, nodes, edges, lang, depth).text;
}

function resolveSetValuePinExpr(
  node: GraphNode,
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage
): ResolvedExpr {
  const pinId = firstInputPinId(node, ['val', 'in_val', 'value']);
  return pinId ? resolvePinValueExpr(node, pinId, nodes, edges, lang, 0) : literalExpr('null');
}

function moduleSlugFromImportNode(node: GraphNode): string {
  const label = node.data.label.replace(/^Import\s+/, '').trim();
  return label.replace(/\s+/g, '_').toLowerCase() || 'module';
}

function followExecFromHandle(
  nodeId: string,
  sourceHandle: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): string[] {
  const edge = edges.find(
    (e) =>
      e.source === nodeId &&
      e.sourceHandle === sourceHandle &&
      e.data?.pinType === 'execution'
  );
  if (!edge) return [];
  return buildExecutionOrder(edge.target, nodes, edges);
}

function collectBranchDescendantIds(branchNodeId: string, nodes: GraphNode[], edges: GraphEdge[]): Set<string> {
  const ids = new Set<string>();
  for (const handle of ['true_exec', 'false_exec']) {
    followExecFromHandle(branchNodeId, handle, nodes, edges).forEach((id) => ids.add(id));
  }
  return ids;
}

function emitIfElse(
  cond: string,
  trueStmts: string[],
  falseStmts: string[],
  lang: TargetLanguage,
  indent: string
): string {
  const inner = indent + '    ';
  if (lang === 'python') {
    const elseClause =
      falseStmts.length > 0 ? `\n${indent}else:\n${falseStmts.join('\n')}` : '';
    return `${indent}if ${cond}:\n${trueStmts.join('\n') || inner + 'pass'}${elseClause}`;
  }
  if (lang === 'javascript') {
    const elseClause =
      falseStmts.length > 0 ? ` else {\n${falseStmts.join('\n')}\n${indent}}` : '';
    return `${indent}if (${cond}) {\n${trueStmts.join('\n') || inner + '// empty'}\n${indent}}${elseClause};`;
  }
  if (lang === 'cpp') {
    const elseClause =
      falseStmts.length > 0 ? ` else {\n${falseStmts.join('\n')}\n${indent}}` : '';
    return `${indent}if (${cond}) {\n${trueStmts.join('\n') || inner + '// empty'}\n${indent}}${elseClause}`;
  }
  if (lang === 'verse') {
    const elseClause =
      falseStmts.length > 0 ? `\n${indent}else:\n${falseStmts.join('\n')}` : '';
    return `${indent}if (${cond}):\n${trueStmts.join('\n') || inner + '# empty'}${elseClause}`;
  }
  return `${indent}// if (${cond})`;
}

function emitStatement(
  node: GraphNode,
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  indent: string,
  functions: { id: string; name: string }[],
  projectEvents: ProjectEventDefinition[]
): EmittedStatement | null {
  const kindId = resolveNodeKindId(node.data);

  if (kindId.startsWith('import_module_') || node.data.linkKind === 'import_module') {
    const mod = moduleSlugFromImportNode(node);
    if (lang === 'python') return { text: `${indent}from ${mod} import *  # import at exec position`, expressionSpans: [] };
    if (lang === 'javascript') return { text: `${indent}import * as ${mod} from './${mod}';`, expressionSpans: [] };
    if (lang === 'cpp') return { text: `${indent}#include "${mod}.h"`, expressionSpans: [] };
    if (lang === 'verse') return { text: `${indent}using { ${mod} }`, expressionSpans: [] };
    return { text: `${indent}// import ${mod}`, expressionSpans: [] };
  }

  if (kindId.startsWith('call_function_') || node.data.linkKind === 'call_function') {
    if (!node.data.linkedGraphId) return { text: `${indent}// call (unlinked)`, expressionSpans: [] };
    const name = resolveFunctionName(node.data.linkedGraphId, functions);
    if (lang === 'python') return { text: `${indent}self.${name}()`, expressionSpans: [] };
    if (lang === 'javascript') return { text: `${indent}this.${name}();`, expressionSpans: [] };
    if (lang === 'cpp') return { text: `${indent}${name}();`, expressionSpans: [] };
    if (lang === 'verse') return { text: `${indent}${name}()`, expressionSpans: [] };
    return { text: `${indent}// call ${name}()`, expressionSpans: [] };
  }

  if (kindId.startsWith('use_macro_') || node.data.linkKind === 'use_macro') {
    if (!node.data.linkedGraphId) return { text: `${indent}// macro (unlinked)`, expressionSpans: [] };
    const name = resolveFunctionName(node.data.linkedGraphId, functions);
    if (lang === 'python') return { text: `${indent}self.${name}()  # macro`, expressionSpans: [] };
    if (lang === 'javascript') return { text: `${indent}this.${name}();  // macro`, expressionSpans: [] };
    return { text: `${indent}// macro ${name}()`, expressionSpans: [] };
  }

  if (kindId === 'event_dispatch') {
    const eventDef = resolveEventForNode(node.data, projectEvents);
    const handler = eventDef
      ? eventHandlerName(eventDef.name)
      : handlerNameFromEventNode(node, projectEvents);
    const paramIds =
      eventDef?.parameters.map((p) => p.id) ??
      node.data.inputs.filter((p) => p.type !== 'execution').map((p) => p.id);
    const argExprs = paramIds.map((pinId) =>
      resolvePinValueExpr(node, pinId, nodes, edges, lang, 0)
    );
    const argText = argExprs.map((a) => a.text).join(', ');
    const argSpans: ExprSpan[] = [];
    let cursor = 0;
    for (let i = 0; i < argExprs.length; i++) {
      const part = argExprs[i]!;
      argSpans.push(...offsetSpans(part.spans, cursor));
      cursor += part.text.length;
      if (i < argExprs.length - 1) cursor += 2;
    }

    if (lang === 'python') {
      const prefix = `${indent}self.on_${handler}(`;
      return {
        text: `${prefix}${argText})`,
        expressionSpans: offsetSpans(argSpans, prefix.length),
      };
    }
    if (lang === 'javascript') {
      const prefix = `${indent}this.on_${handler}(`;
      return {
        text: `${prefix}${argText});`,
        expressionSpans: offsetSpans(argSpans, prefix.length),
      };
    }
    if (lang === 'cpp') {
      const prefix = `${indent}on_${handler}(`;
      return {
        text: `${prefix}${argText});`,
        expressionSpans: offsetSpans(argSpans, prefix.length),
      };
    }
    if (lang === 'verse') {
      const prefix = `${indent}on_${handler}(`;
      return {
        text: `${prefix}${argText})`,
        expressionSpans: offsetSpans(argSpans, prefix.length),
      };
    }
    return { text: `${indent}// dispatch ${handler}`, expressionSpans: [] };
  }

  if (
    kindId === 'event_on_start' ||
    kindId === 'event_on_update' ||
    kindId === 'event_define' ||
    kindId === 'event_custom'
  ) {
    return null;
  }

  if (kindId === 'variable_get' || kindId.startsWith('math_')) return null;

  if (kindId === 'flow_branch') {
    const cond = resolvePinValue(node, 'condition', nodes, edges, lang, 0);
    const trueOrder = followExecFromHandle(node.id, 'true_exec', nodes, edges);
    const falseOrder = followExecFromHandle(node.id, 'false_exec', nodes, edges);
    const trueStmts = buildTaggedStatements(
      trueOrder,
      nodes,
      edges,
      lang,
      indent + '    ',
      functions,
      new Set(),
      projectEvents
    );
    const falseStmts = buildTaggedStatements(
      falseOrder,
      nodes,
      edges,
      lang,
      indent + '    ',
      functions,
      new Set(),
      projectEvents
    );
    return {
      text: emitIfElse(
        cond,
        trueStmts.map((t) => t.text),
        falseStmts.map((t) => t.text),
        lang,
        indent
      ),
      expressionSpans: [],
    };
  }

  if (kindId === 'action_print') {
    const pinId = firstInputPinId(node, ['in_str', 'in_msg', 'in_string']) ?? 'in_str';
    const msg = resolvePinValueExpr(node, pinId, nodes, edges, lang, 0);
    if (lang === 'python') {
      const prefix = `${indent}print(`;
      return { text: `${prefix}${msg.text})`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
    }
    if (lang === 'javascript') {
      const prefix = `${indent}console.log(`;
      return { text: `${prefix}${msg.text});`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
    }
    if (lang === 'cpp') {
      const prefix = `${indent}std::cout << `;
      const suffix = ' << std::endl;';
      return {
        text: `${prefix}${msg.text}${suffix}`,
        expressionSpans: offsetSpans(msg.spans, prefix.length),
      };
    }
    if (lang === 'verse') {
      const prefix = `${indent}Print(`;
      return { text: `${prefix}${msg.text})`, expressionSpans: offsetSpans(msg.spans, prefix.length) };
    }
    return { text: `${indent}// print(${msg.text})`, expressionSpans: offsetSpans(msg.spans, 0) };
  }

  if (kindId === 'variable_set') {
    const varName = getVariableName(node.data);
    if (!varName) return { text: `${indent}# set (no variable)`, expressionSpans: [] };
    const val = resolveSetValuePinExpr(node, nodes, edges, lang);
    if (lang === 'python') {
      const prefix = `${indent}self.${varName} = `;
      return { text: `${prefix}${val.text}`, expressionSpans: offsetSpans(val.spans, prefix.length) };
    }
    if (lang === 'javascript') {
      const prefix = `${indent}this.${varName} = `;
      return { text: `${prefix}${val.text};`, expressionSpans: offsetSpans(val.spans, prefix.length) };
    }
    if (lang === 'cpp') {
      const prefix = `${indent}${varName} = `;
      return { text: `${prefix}${val.text};`, expressionSpans: offsetSpans(val.spans, prefix.length) };
    }
    if (lang === 'verse') {
      const prefix = `${indent}set ${varName} = `;
      return { text: `${prefix}${val.text}`, expressionSpans: offsetSpans(val.spans, prefix.length) };
    }
    return { text: `${indent}// set ${varName}`, expressionSpans: [] };
  }

  if (lang === 'python') return { text: `${indent}# ${node.data.label}`, expressionSpans: [] };
  if (lang === 'javascript') return { text: `${indent}// ${node.data.label}`, expressionSpans: [] };
  if (lang === 'cpp') return { text: `${indent}// ${node.data.label}`, expressionSpans: [] };
  if (lang === 'verse') return { text: `${indent}# ${node.data.label}`, expressionSpans: [] };
  return { text: `${indent}// ${node.data.label}`, expressionSpans: [] };
}

function buildTaggedStatements(
  order: string[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  indent: string,
  functions: { id: string; name: string }[],
  skipIds: Set<string>,
  projectEvents: ProjectEventDefinition[]
): TaggedStatement[] {
  const statements: TaggedStatement[] = [];
  for (const nodeId of order) {
    if (skipIds.has(nodeId)) continue;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !isCodegenNode(node)) continue;

    if (resolveNodeKindId(node.data) === 'flow_branch') {
      const branchDescendants = collectBranchDescendantIds(node.id, nodes, edges);
      branchDescendants.forEach((id) => skipIds.add(id));
    }

    const emitted = emitStatement(node, nodes, edges, lang, indent, functions, projectEvents);
    if (emitted) {
      statements.push({
        nodeId: node.id,
        text: emitted.text,
        expressionSpans: emitted.expressionSpans,
      });
    }
  }
  return statements;
}

function indentFor(lang: TargetLanguage): string {
  if (lang === 'cpp' || lang === 'verse') return '        ';
  if (lang === 'python') return '        ';
  return '    ';
}

function auxiliaryEventNodes(nodes: GraphNode[], mainOrder: string[]): GraphNode[] {
  return nodes.filter((n) => {
    if (!isCodegenNode(n)) return false;
    const kindId = resolveNodeKindId(n.data);
    if (kindId === 'event_on_start') return false;
    if (
      kindId !== 'event_on_update' &&
      kindId !== 'event_define' &&
      kindId !== 'event_custom'
    ) {
      return false;
    }
    return !mainOrder.includes(n.id) && !n.data.linkedGraphId;
  });
}

function eventLabelToHandlerName(label: string): string {
  return label.replace(/^On\s+/i, '').toLowerCase().replace(/\s+/g, '_');
}

function handlerNameFromEventNode(node: GraphNode, projectEvents: ProjectEventDefinition[]): string {
  const kindId = resolveNodeKindId(node.data);
  if (kindId === 'event_on_update') return 'update';
  const eventDef = resolveEventForNode(node.data, projectEvents);
  if (eventDef) return eventHandlerName(eventDef.name);
  const eventName = node.data.properties?.eventName;
  if (typeof eventName === 'string' && eventName.trim()) {
    return eventHandlerName(eventName);
  }
  return eventLabelToHandlerName(node.data.label);
}

function handlerParamNames(
  eventNode: GraphNode,
  projectEvents: ProjectEventDefinition[]
): string[] {
  const eventDef = resolveEventForNode(eventNode.data, projectEvents);
  if (eventDef) return eventDef.parameters.map(parameterCodegenName);
  return (eventNode.data.outputs ?? [])
    .filter((p) => p.type !== 'execution')
    .map((p) => parameterCodegenName({ id: p.id, label: p.label, type: p.type }));
}

function appendPythonStartHandler(
  sink: CodeSink,
  startNode: GraphNode,
  bodyTags: TaggedStatement[]
): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n    def on_start(self):');
  if (bodyTags.length === 0) sink.appendRaw('        pass');
  else sink.appendTaggedMany(bodyTags);
  sink.tagRange(startNode.id, startLine, sink.lineCount, 'def on_start(self):');
}

function appendJsStartHandler(
  sink: CodeSink,
  startNode: GraphNode,
  bodyTags: TaggedStatement[]
): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n  on_start() {');
  if (bodyTags.length === 0) sink.appendRaw('    // empty');
  else sink.appendTaggedMany(bodyTags);
  sink.appendRaw('  }');
  sink.tagRange(startNode.id, startLine, sink.lineCount, 'on_start() {');
}

function appendCppStartHandler(
  sink: CodeSink,
  startNode: GraphNode,
  bodyTags: TaggedStatement[]
): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n    void on_start() {');
  if (bodyTags.length === 0) sink.appendRaw('        // empty');
  else sink.appendTaggedMany(bodyTags);
  sink.appendRaw('    }');
  sink.tagRange(startNode.id, startLine, sink.lineCount, 'void on_start()');
}

function appendVerseStartHandler(
  sink: CodeSink,
  startNode: GraphNode,
  bodyTags: TaggedStatement[]
): void {
  const startLine = sink.lineCount + 1;
  sink.appendRaw('\n    on_start<override>() : void =');
  if (bodyTags.length === 0) sink.appendRaw('        # empty');
  else sink.appendTaggedMany(bodyTags);
  sink.tagRange(startNode.id, startLine, sink.lineCount, 'on_start()');
}

function appendPythonEventHandler(
  sink: CodeSink,
  eventNode: GraphNode,
  subTags: TaggedStatement[],
  handlerName: string,
  paramNames: string[]
): void {
  const params = paramNames.length > 0 ? `self, ${paramNames.join(', ')}` : 'self';
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    def on_${handlerName}(${params}):`);
  if (subTags.length === 0) sink.appendRaw('        pass');
  else sink.appendTaggedMany(subTags);
  sink.tagRange(eventNode.id, startLine, sink.lineCount, `def on_${handlerName}(`);
}

function appendJsEventHandler(
  sink: CodeSink,
  eventNode: GraphNode,
  subTags: TaggedStatement[],
  handlerName: string,
  paramNames: string[]
): void {
  const params = paramNames.join(', ');
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n  on_${handlerName}(${params}) {`);
  if (subTags.length === 0) sink.appendRaw('    // empty');
  else sink.appendTaggedMany(subTags);
  sink.appendRaw('  }');
  sink.tagRange(eventNode.id, startLine, sink.lineCount, `on_${handlerName}(`);
}

function appendCppEventHandler(
  sink: CodeSink,
  eventNode: GraphNode,
  subTags: TaggedStatement[],
  handlerName: string,
  paramNames: string[]
): void {
  const params = paramNames.map((p) => `float ${p}`).join(', ');
  const signature = params ? `void on_${handlerName}(${params})` : `void on_${handlerName}()`;
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    ${signature} {`);
  if (subTags.length === 0) sink.appendRaw('        // empty');
  else sink.appendTaggedMany(subTags);
  sink.appendRaw('    }');
  sink.tagRange(eventNode.id, startLine, sink.lineCount, signature);
}

function appendVerseEventHandler(
  sink: CodeSink,
  eventNode: GraphNode,
  subTags: TaggedStatement[],
  handlerName: string,
  paramNames: string[]
): void {
  const params = paramNames.map((p) => `${p} : float`).join(', ');
  const signature = params
    ? `on_${handlerName}<override>(${params}) : void =`
    : `on_${handlerName}<override>() : void =`;
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`\n    ${signature}`);
  if (subTags.length === 0) sink.appendRaw('        # empty');
  else sink.appendTaggedMany(subTags);
  sink.tagRange(eventNode.id, startLine, sink.lineCount, `on_${handlerName}`);
}

function taggedStatementsForGraph(
  graphNodes: GraphNode[],
  edges: GraphEdge[],
  lang: TargetLanguage,
  functions: { id: string; name: string }[],
  projectEvents: ProjectEventDefinition[]
): TaggedStatement[] {
  const start = findSimulationStartNode(graphNodes);
  const execOrder = start ? buildExecutionOrder(start.id, graphNodes, edges) : [];
  const indent = indentFor(lang);
  const skipIds = new Set<string>();
  return buildTaggedStatements(execOrder, graphNodes, edges, lang, indent, functions, skipIds, projectEvents);
}

function appendBodyFromDocument(
  sink: CodeSink,
  funcId: string,
  documents: Record<string, GraphDocument> | undefined,
  lang: TargetLanguage,
  functions: { id: string; name: string }[],
  emptyLine: string,
  projectEvents: ProjectEventDefinition[]
): void {
  const doc = documents?.[funcId];
  if (!doc) {
    sink.appendRaw(emptyLine);
    return;
  }
  const graphNodes = doc.nodes.filter(isCodegenNode);
  const tags = taggedStatementsForGraph(graphNodes, doc.edges, lang, functions, projectEvents);
  if (tags.length === 0) {
    sink.appendRaw(emptyLine);
    return;
  }
  sink.appendTaggedMany(tags);
}

export function generateMockTranspileResult(ctx: CodegenContext): TranspileResult {
  const {
    nodes,
    edges,
    targetLanguage,
    variables,
    projectEvents = [],
    functions,
    moduleName,
    extendsType,
    tabLabel,
    tabId,
    documents,
  } = ctx;

  const activeTabId = tabId ?? 'main';
  const tabType: GraphTab['type'] =
    activeTabId === 'main'
      ? 'main'
      : functions.some((f) => f.id === activeTabId)
        ? 'function'
        : 'macro';
  const filePath = generatedFileName(
    { id: activeTabId, type: tabType, name: tabLabel ?? 'Graph' },
    moduleName,
    targetLanguage
  );

  const graphNodes = nodes
    .filter(isCodegenNode)
    .map((n) => ({ ...n, data: normalizeNodeData(n.data) }));
  const start = findSimulationStartNode(graphNodes);
  const execOrder = start ? buildExecutionOrder(start.id, graphNodes, edges) : [];
  const indent = indentFor(targetLanguage);
  const skipIds = new Set<string>();
  const runStatements = buildTaggedStatements(
    execOrder,
    graphNodes,
    edges,
    targetLanguage,
    indent,
    functions,
    skipIds,
    projectEvents
  );
  const handlerNodes = auxiliaryEventNodes(graphNodes, execOrder);

  if (targetLanguage === 'json') {
    const content = JSON.stringify(
      {
        metadata: { moduleName, extendsType, tab: tabLabel, tabId },
        variables,
        functions,
        executionOrder: execOrder,
        eventHandlers: handlerNodes.map((e) => e.data.label),
        graph: { nodes, edges },
      },
      null,
      2
    );
    return {
      language: targetLanguage,
      files: [{ path: filePath, content }],
      sourceMap: {},
    };
  }

  const sink = new CodeSink(filePath);
  const isFunctionTab = activeTabId !== 'main' && functions.some((f) => f.id === activeTabId);

  if (isFunctionTab) {
    const func = functions.find((f) => f.id === activeTabId)!;
    const empty =
      targetLanguage === 'python'
        ? '        pass'
        : targetLanguage === 'verse'
          ? '        # empty'
          : '    // empty';
    if (targetLanguage === 'python') {
      sink.appendRaw(formatFunctionDefHeader(func, targetLanguage));
      appendBodyFromDocument(sink, activeTabId, documents, targetLanguage, functions, empty, projectEvents);
    } else if (targetLanguage === 'javascript') {
      sink.appendRaw(formatFunctionDefHeader(func, targetLanguage));
      appendBodyFromDocument(sink, activeTabId, documents, targetLanguage, functions, empty, projectEvents);
      sink.appendRaw('  }');
    } else if (targetLanguage === 'cpp') {
      sink.appendRaw(formatFunctionDefHeader(func, targetLanguage));
      appendBodyFromDocument(sink, activeTabId, documents, targetLanguage, functions, empty, projectEvents);
      sink.appendRaw('    }');
    } else if (targetLanguage === 'verse') {
      sink.appendRaw(formatFunctionDefHeader(func, targetLanguage));
      appendBodyFromDocument(sink, activeTabId, documents, targetLanguage, functions, empty, projectEvents);
    }
    return {
      language: targetLanguage,
      files: [{ path: filePath, content: sink.content }],
      sourceMap: sink.sourceMap,
      fragments: sink.fragments,
    };
  }

  if (targetLanguage === 'python') {
    const bases = extendsType ? `(${extendsType})` : '';
    sink.appendRaw(`class ${moduleName}${bases}:`);
    if (variables.length > 0) {
      sink.appendRaw('    # Variables');
      for (const v of variables) {
        const val =
          typeof v.defaultValue === 'string'
            ? `"${v.defaultValue}"`
            : typeof v.defaultValue === 'boolean'
              ? v.defaultValue
                ? 'True'
                : 'False'
              : v.defaultValue;
        sink.appendRaw(`        self.${v.name} = ${val}`);
      }
    }
    for (const f of functions) {
      sink.appendRaw(`\n${formatFunctionDefHeader(f, targetLanguage)}`);
      appendBodyFromDocument(sink, f.id, documents, targetLanguage, functions, '        pass', projectEvents);
    }
    if (start && resolveNodeKindId(start.data) === 'event_on_start') {
      appendPythonStartHandler(sink, start, runStatements);
    } else {
      sink.appendRaw('\n    def on_start(self):');
      if (runStatements.length === 0) sink.appendRaw('        pass');
      else sink.appendTaggedMany(runStatements);
    }
    for (const e of handlerNodes) {
      const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
      const subSkip = new Set<string>([e.id]);
      const subTags = buildTaggedStatements(
        subOrder,
        graphNodes,
        edges,
        targetLanguage,
        '            ',
        functions,
        subSkip,
        projectEvents
      );
      const name = handlerNameFromEventNode(e, projectEvents);
      const params = handlerParamNames(e, projectEvents);
      appendPythonEventHandler(sink, e, subTags, name, params);
    }
  } else if (targetLanguage === 'javascript') {
    const extendsClause = extendsType ? ` extends ${extendsType}` : '';
    sink.appendRaw(`class ${moduleName}${extendsClause} {`);
    for (const v of variables) {
      const val = typeof v.defaultValue === 'string' ? `"${v.defaultValue}"` : v.defaultValue;
      sink.appendRaw(`    this.${v.name} = ${val};`);
    }
    for (const f of functions) {
      sink.appendRaw(`\n${formatFunctionDefHeader(f, targetLanguage)}`);
      appendBodyFromDocument(sink, f.id, documents, targetLanguage, functions, '    // empty', projectEvents);
      sink.appendRaw('  }');
    }
    if (start && resolveNodeKindId(start.data) === 'event_on_start') {
      appendJsStartHandler(sink, start, runStatements);
    } else {
      sink.appendRaw('\n  on_start() {');
      if (runStatements.length === 0) sink.appendRaw('    // empty');
      else sink.appendTaggedMany(runStatements);
      sink.appendRaw('  }');
    }
    for (const e of handlerNodes) {
      const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
      const subSkip = new Set<string>([e.id]);
      const subTags = buildTaggedStatements(
        subOrder,
        graphNodes,
        edges,
        targetLanguage,
        '      ',
        functions,
        subSkip,
        projectEvents
      );
      const name = handlerNameFromEventNode(e, projectEvents);
      const params = handlerParamNames(e, projectEvents);
      appendJsEventHandler(sink, e, subTags, name, params);
    }
    sink.appendRaw('}');
  } else if (targetLanguage === 'cpp') {
    const base = extendsType ? ` : public ${extendsType}` : '';
    sink.appendRaw(`class ${moduleName}${base} {`);
    sink.appendRaw('public:');
    for (const v of variables) {
      const type = v.type === 'number' ? 'float' : v.type === 'string' ? 'std::string' : 'bool';
      sink.appendRaw(`    ${type} ${v.name};`);
    }
    for (const f of functions) {
      sink.appendRaw(`\n${formatFunctionDefHeader(f, targetLanguage)}`);
      appendBodyFromDocument(sink, f.id, documents, targetLanguage, functions, '        // empty', projectEvents);
      sink.appendRaw('    }');
    }
    if (start && resolveNodeKindId(start.data) === 'event_on_start') {
      appendCppStartHandler(sink, start, runStatements);
    } else {
      sink.appendRaw('\n    void on_start() {');
      if (runStatements.length === 0) sink.appendRaw('        // empty');
      else sink.appendTaggedMany(runStatements);
      sink.appendRaw('    }');
    }
    for (const e of handlerNodes) {
      const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
      const subSkip = new Set<string>([e.id]);
      const subTags = buildTaggedStatements(
        subOrder,
        graphNodes,
        edges,
        targetLanguage,
        '        ',
        functions,
        subSkip,
        projectEvents
      );
      const name = handlerNameFromEventNode(e, projectEvents);
      const params = handlerParamNames(e, projectEvents);
      appendCppEventHandler(sink, e, subTags, name, params);
    }
    sink.appendRaw('};');
  } else if (targetLanguage === 'verse') {
    const verseType = (t: string) =>
      t === 'number' ? 'float' : t === 'string' ? 'string' : 'logic';
    const base = extendsType ? `(${extendsType})` : '';
    sink.appendRaw(`${moduleName} := class${base}:`);
    for (const v of variables) {
      const val = typeof v.defaultValue === 'string' ? `"${v.defaultValue}"` : v.defaultValue;
      sink.appendRaw(`    var ${v.name} : ${verseType(v.type)} = ${val}`);
    }
    for (const f of functions) {
      sink.appendRaw(`\n${formatFunctionDefHeader(f, targetLanguage)}`);
      appendBodyFromDocument(sink, f.id, documents, targetLanguage, functions, '        # empty', projectEvents);
    }
    if (start && resolveNodeKindId(start.data) === 'event_on_start') {
      appendVerseStartHandler(sink, start, runStatements);
    } else {
      sink.appendRaw('\n    on_start<override>() : void =');
      if (runStatements.length === 0) sink.appendRaw('        # empty');
      else sink.appendTaggedMany(runStatements);
    }
    for (const e of handlerNodes) {
      const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
      const subSkip = new Set<string>([e.id]);
      const subTags = buildTaggedStatements(
        subOrder,
        graphNodes,
        edges,
        targetLanguage,
        '        ',
        functions,
        subSkip,
        projectEvents
      );
      const name = handlerNameFromEventNode(e, projectEvents);
      const params = handlerParamNames(e, projectEvents);
      appendVerseEventHandler(sink, e, subTags, name, params);
    }
  } else {
    sink.appendRaw('// Unsupported language');
  }

  return {
    language: targetLanguage,
    files: [{ path: filePath, content: sink.content }],
    sourceMap: sink.sourceMap,
    fragments: sink.fragments,
  };
}

export function generateMockCode(ctx: CodegenContext): string {
  return generateMockTranspileResult(ctx).files[0]?.content ?? '';
}
