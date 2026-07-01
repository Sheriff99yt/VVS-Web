import { VVSNode, VVSEdge } from '@/types/graph';
import { GraphVariable } from '@/types/graph';
import { TargetLanguage } from '@/contexts/ProjectContext';
import { buildExecutionOrder, findSimulationStartNode } from './executionOrder';

export interface CodegenContext {
  moduleName: string;
  extendsType: string;
  targetLanguage: TargetLanguage;
  variables: GraphVariable[];
  functions: { id: string; name: string }[];
  nodes: VVSNode[];
  edges: VVSEdge[];
  tabLabel?: string;
}

function isCodegenNode(node: VVSNode): boolean {
  return node.type === 'vvs_standard_node';
}

function getDataEdgeToPin(
  edges: VVSEdge[],
  nodeId: string,
  pinId: string
): VVSEdge | undefined {
  return edges.find(
    (e) =>
      e.target === nodeId &&
      e.targetHandle === pinId &&
      e.data?.pinType !== 'execution'
  );
}

function resolveNodeOutput(
  node: VVSNode,
  pinId: string,
  nodes: VVSNode[],
  edges: VVSEdge[],
  lang: TargetLanguage,
  depth: number
): string {
  const label = node.data.label;

  if (label.startsWith('Get ')) {
    const varName = label.slice(4).trim();
    if (lang === 'python') return `self.${varName}`;
    if (lang === 'javascript') return `this.${varName}`;
    return varName;
  }

  if (label.startsWith('Math ')) {
    const op = label.replace('Math ', '').toLowerCase();
    const a = resolvePinValue(node, 'a', nodes, edges, lang, depth);
    const b = resolvePinValue(node, 'b', nodes, edges, lang, depth);
    if (op === 'add') return `(${a} + ${b})`;
    if (op === 'subtract') return `(${a} - ${b})`;
    if (op === 'multiply') return `(${a} * ${b})`;
    if (op === 'divide') return `(${a} / ${b})`;
    return `/* ${label} */`;
  }

  if (node.data.category === 'Events') {
    const pin = node.data.outputs?.find((p) => p.id === pinId);
    return pin?.label ? pin.label.replace(/\s+/g, '_').toLowerCase() : 'event_value';
  }

  return `/* ${label}.${pinId} */`;
}

function resolvePinValue(
  node: VVSNode,
  pinId: string,
  nodes: VVSNode[],
  edges: VVSEdge[],
  lang: TargetLanguage,
  depth = 0
): string {
  if (depth > 8) return '/* cycle */';

  const edge = getDataEdgeToPin(edges, node.id, pinId);
  if (edge) {
    const source = nodes.find((n) => n.id === edge.source);
    if (!source || source.type !== 'vvs_standard_node') {
      return lang === 'python' ? 'None' : lang === 'verse' ? '""' : 'null';
    }
    return resolveNodeOutput(source, edge.sourceHandle ?? '', nodes, edges, lang, depth + 1);
  }

  const inline = node.data.inlineValues?.[pinId];
  if (inline !== undefined) {
    if (typeof inline === 'string') return `"${inline}"`;
    return String(inline);
  }

  return lang === 'python' ? 'None' : 'null';
}

function moduleSlugFromImportNode(node: VVSNode): string {
  const label = node.data.label.replace(/^Import\s+/, '').trim();
  return label.replace(/\s+/g, '_').toLowerCase() || 'module';
}

function emitStatement(
  node: VVSNode,
  nodes: VVSNode[],
  edges: VVSEdge[],
  lang: TargetLanguage,
  indent: string
): string | null {
  const label = node.data.label;

  if (node.data.linkKind === 'import_module') {
    const mod = moduleSlugFromImportNode(node);
    if (lang === 'python') return `${indent}from ${mod} import *  # import at exec position`;
    if (lang === 'javascript') return `${indent}import * as ${mod} from './${mod}';`;
    if (lang === 'cpp') return `${indent}#include "${mod}.h"`;
    if (lang === 'verse') return `${indent}using { ${mod} }`;
    return `${indent}// import ${mod}`;
  }

  if (label === 'On Start' || label === 'On Update') return null;
  if (label.startsWith('Get ') || label.startsWith('Math ')) return null;

  if (label === 'Print String') {
    const msg = resolvePinValue(node, 'in_str', nodes, edges, lang, 0);
    if (lang === 'python') return `${indent}print(${msg})`;
    if (lang === 'javascript') return `${indent}console.log(${msg});`;
    if (lang === 'cpp') return `${indent}std::cout << ${msg} << std::endl;`;
    if (lang === 'verse') return `${indent}Print(${msg})`;
    return `${indent}// print(${msg})`;
  }

  if (label.startsWith('Set ')) {
    const varName = label.slice(4).trim();
    const val = resolvePinValue(node, 'val', nodes, edges, lang, 0);
    if (lang === 'python') return `${indent}self.${varName} = ${val}`;
    if (lang === 'javascript') return `${indent}this.${varName} = ${val};`;
    if (lang === 'cpp') return `${indent}${varName} = ${val};`;
    if (lang === 'verse') return `${indent}set ${varName} = ${val}`;
    return `${indent}// set ${varName}`;
  }

  if (lang === 'python') return `${indent}# ${label}`;
  if (lang === 'javascript') return `${indent}// ${label}`;
  if (lang === 'cpp') return `${indent}// ${label}`;
  if (lang === 'verse') return `${indent}# ${label}`;
  return `${indent}// ${label}`;
}

function buildStatements(
  order: string[],
  nodes: VVSNode[],
  edges: VVSEdge[],
  lang: TargetLanguage,
  indent: string
): string[] {
  const statements: string[] = [];
  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !isCodegenNode(node)) continue;
    const stmt = emitStatement(node, nodes, edges, lang, indent);
    if (stmt) statements.push(stmt);
  }
  return statements;
}

function indentFor(lang: TargetLanguage): string {
  if (lang === 'cpp' || lang === 'verse') return '        ';
  if (lang === 'python') return '        ';
  return '    ';
}

function orphanEventNodes(nodes: VVSNode[], mainOrder: string[]): VVSNode[] {
  return nodes.filter(
    (n) =>
      isCodegenNode(n) &&
      n.data.category === 'Events' &&
      n.data.label !== 'On Start' &&
      n.data.label !== 'On Update' &&
      !mainOrder.includes(n.id)
  );
}

function handlerNameFromEvent(label: string): string {
  return label.replace(/^On\s+/i, '').toLowerCase().replace(/\s+/g, '_');
}

export function generateMockCode(ctx: CodegenContext): string {
  const {
    nodes,
    edges,
    targetLanguage,
    variables,
    functions,
    moduleName,
    extendsType,
    tabLabel,
  } = ctx;

  const graphNodes = nodes.filter(isCodegenNode);
  const start = findSimulationStartNode(graphNodes);
  const execOrder = start ? buildExecutionOrder(start.id, graphNodes, edges) : [];
  const indent = indentFor(targetLanguage);
  const statements = buildStatements(execOrder, graphNodes, edges, targetLanguage, indent);
  const events = orphanEventNodes(graphNodes, execOrder);

  if (targetLanguage === 'json') {
    return JSON.stringify(
      {
        metadata: { moduleName, extendsType, tab: tabLabel },
        variables,
        functions,
        executionOrder: execOrder,
        eventHandlers: events.map((e) => e.data.label),
        graph: { nodes, edges },
      },
      null,
      2
    );
  }

  if (targetLanguage === 'python') {
    const vars = variables
      .map((v) => {
        const val = typeof v.defaultValue === 'string' ? `"${v.defaultValue}"` : v.defaultValue;
        return `        self.${v.name} = ${val}`;
      })
      .join('\n');
    const bases = extendsType ? `(${extendsType})` : '';
    const handlers = events
      .map((e) => {
        const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
        const subStmts = buildStatements(subOrder, graphNodes, edges, targetLanguage, '            ');
        const name = handlerNameFromEvent(e.data.label);
        return `\n    def on_${name}(self):\n${subStmts.join('\n') || '        pass'}`;
      })
      .join('');
    const funcDefs = functions
      .map((f) => `\n    def ${f.name}(self):\n        pass`)
      .join('');
    return `class ${moduleName}${bases}:\n${vars ? `    # Variables\n${vars}\n` : ''}${funcDefs}\n\n    def run(self):\n${statements.join('\n') || '        pass'}${handlers}`;
  }

  if (targetLanguage === 'javascript') {
    const vars = variables
      .map((v) => {
        const val = typeof v.defaultValue === 'string' ? `"${v.defaultValue}"` : v.defaultValue;
        return `    this.${v.name} = ${val};`;
      })
      .join('\n');
    const extendsClause = extendsType ? ` extends ${extendsType}` : '';
    const handlers = events
      .map((e) => {
        const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
        const subStmts = buildStatements(subOrder, graphNodes, edges, targetLanguage, '      ');
        const name = handlerNameFromEvent(e.data.label);
        return `\n  on_${name}() {\n${subStmts.join('\n') || '    // empty'}\n  }`;
      })
      .join('');
    const funcDefs = functions
      .map((f) => `\n  ${f.name}() {\n    // ${f.name}\n  }`)
      .join('');
    return `class ${moduleName}${extendsClause} {\n${vars}${funcDefs}\n\n  run() {\n${statements.join('\n') || '    // empty'}\n  }${handlers}\n}`;
  }

  if (targetLanguage === 'cpp') {
    const vars = variables
      .map((v) => {
        const type =
          v.type === 'number' ? 'float' : v.type === 'string' ? 'std::string' : 'bool';
        return `    ${type} ${v.name};`;
      })
      .join('\n');
    const base = extendsType ? ` : public ${extendsType}` : '';
    const handlers = events
      .map((e) => {
        const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
        const subStmts = buildStatements(subOrder, graphNodes, edges, targetLanguage, '        ');
        const name = handlerNameFromEvent(e.data.label);
        return `\n    void on_${name}() {\n${subStmts.join('\n') || '        // empty'}\n    }`;
      })
      .join('');
    return `class ${moduleName}${base} {\npublic:\n${vars}\n\n    void run() {\n${statements.join('\n') || '        // empty'}\n    }${handlers}\n};`;
  }

  if (targetLanguage === 'verse') {
    const verseType = (t: string) =>
      t === 'number' ? 'float' : t === 'string' ? 'string' : 'logic';
    const vars = variables
      .map((v) => {
        const val =
          typeof v.defaultValue === 'string' ? `"${v.defaultValue}"` : v.defaultValue;
        return `    var ${v.name} : ${verseType(v.type)} = ${val}`;
      })
      .join('\n');
    const base = extendsType ? `(${extendsType})` : '';
    const handlers = events
      .map((e) => {
        const subOrder = buildExecutionOrder(e.id, graphNodes, edges);
        const subStmts = buildStatements(subOrder, graphNodes, edges, targetLanguage, '        ');
        const name = handlerNameFromEvent(e.data.label);
        return `\n    on_${name}<override>() : void =\n${subStmts.join('\n') || '        # empty'}`;
      })
      .join('');
    const funcDefs = functions
      .map((f) => `\n    ${f.name}<override>() : void =\n        # ${f.name}`)
      .join('');
    return `${moduleName} := class${base}:\n${vars ? `${vars}\n` : ''}${funcDefs}\n\n    Run<override>() : void =\n${statements.join('\n') || '        # empty'}${handlers}\n`;
  }

  return '// Unsupported language';
}
