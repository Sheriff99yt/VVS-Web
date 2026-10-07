import { analyzeProject, applyFunctionEntryBinding, applyFunctionImplementBinding, buildNativeConstantGraph, nativeScalarSignaturePin, type GraphNode, type NativeConstantExpression, type ProjectSnapshot, type VVSNodeData } from '@vvs/graph-types';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, IMPORT_LIMITS, type ImportDiagnostic, type SourceSpan } from './contracts';
import { analyzeNativeSourceSignatures } from './nativeSourceSignatures';
import { analyzeNativeConstantSource } from './nativeSourceExpressions';
import { analyzeNativeLocalBindings } from './nativeLocalBindings';
import { parseNativeTree } from './nativeParser';
import type { NativeInventoryLanguage, NativeSyntaxInventory } from './nativeSyntaxInventory';
import { resolve } from '@vvs/syntax-registry';
import { analyzeNativeRuntimeSource } from './nativeRuntimeSource';
import { materializeNativeRuntimeExpression } from './nativeRuntimeMaterialize';
import { analyzeNativeLocalSourceBodies } from './nativeLocalSourceBodies';
import { materializeNativeLocalBody } from './nativeLocalMaterialize';

export interface NativeScalarSourceGraphPreview {
  readonly source: string;
  readonly sourceSha256: string;
  readonly inventory: NativeSyntaxInventory;
  readonly diagnostics: readonly ImportDiagnostic[];
  /** Worker receipts and browser lifecycle acceptance are separate required gates. */
  readonly graphAdmission: 'blocked';
  readonly status: 'mapped' | 'unsupported';
  readonly snapshot?: ProjectSnapshot;
}
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });
const comments = new Set(['comment', 'line_comment', 'block_comment']);
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !comments.has(child.type));
const nodeData = (kindId: string): VVSNodeData => ({ kindId, label: kindId, category: 'Project', inputs: [], outputs: [], inlineValues: {}, properties: {} });
const digest = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), byte => byte.toString(16).padStart(2, '0')).join('');

/** Atomic source-owned ordinary scalar modules. Never manufacture graphs from trusted fixture bodies. */
export async function previewNativeScalarSourceGraphs(source: string, language: NativeInventoryLanguage, options: { fileName: string; entryPolicy: 'library'; runtimeExpressions?: boolean; localStatements?: boolean; groupedDeclarations?: boolean; inferredLocals?: boolean }): Promise<NativeScalarSourceGraphPreview> {
  const headers = await analyzeNativeSourceSignatures(source, language);
  const base = { source, sourceSha256: headers.sourceSha256, inventory: headers.inventory, graphAdmission: 'blocked' as const };
  const diagnostics: ImportDiagnostic[] = [...headers.diagnostics];
  const reject = (code: string, at: SourceSpan): never => { throw new ImportFailure(`NATIVE_SOURCE_GRAPH_${code}`, 'This source construct requires its visible native mapping before import acceptance.', at); };
  if (options.entryPolicy !== 'library' || !/^[A-Za-z_][A-Za-z0-9_-]*\.(cpp|rs|gd)$/.test(options.fileName) || !options.fileName.endsWith({ cpp: '.cpp', rust: '.rs', gdscript: '.gd' }[language])) {
    reject('MODULE_CONTEXT', { start: 0, end: source.length });
  }
  const tree = parseNativeTree(source, language);
  try {
    if (diagnostics.length) return { ...base, diagnostics, status: 'unsupported' };
    const roots = children(tree.rootNode);
    for (const root of roots) if (root.type === 'constructor_definition') reject('FUNCTION_ROLE_CONTEXT', span(root));
    if (!roots.length || roots.length > IMPORT_LIMITS.methods) reject('FUNCTION_COUNT', span(tree.rootNode));
    for (const root of roots) if (root.type !== (language === 'rust' ? 'function_item' : 'function_definition')) reject('TOP_LEVEL_CONTEXT', span(root));
    // Retain all authored trivia in the inventory. Do not silently erase comments
    // while whole-function ownership still excludes visible comment nodes.
    const checkComments = (node: SyntaxNode): void => {
      if (comments.has(node.type)) reject('COMMENT_MAPPING_REQUIRED', span(node));
      for (const child of node.namedChildren) checkComments(child);
    };
    checkComments(tree.rootNode);
    if (new Set(headers.signatures.map(fn => fn.name)).size !== roots.length) reject('OVERLOAD_OR_HEADER', span(tree.rootNode));
    const constants = await analyzeNativeConstantSource(source, language);
    const bindings = await analyzeNativeLocalBindings(source, language);
    const runtime = options.runtimeExpressions ? await analyzeNativeRuntimeSource(source, language) : undefined;
    const localBodies = options.localStatements ? await analyzeNativeLocalSourceBodies(source, language, { inferredLocals: options.inferredLocals }) : undefined;
    const homeId = 'main-graph', classId = 'global-main-graph', moduleName = options.fileName.replace(/\.[^.]+$/, '');
    const snapshot: ProjectSnapshot = { version: 3, savedAt: '', targetLanguage: language, autoCompile: true, autoSave: false, installedLibrary: [], projectDetails: { moduleName, extendsType: '', description: '' }, variables: [], events: [], functions: [], classes: [{ kind: 'class', id: classId, name: 'Global', containerId: homeId, visibility: 'public', isGlobalScope: true }], activeClassId: classId, graphContainers: [{ id: homeId, name: moduleName }], openTabs: [{ id: homeId, type: 'container', name: moduleName }], activeGraphTab: homeId, documents: { [homeId]: { nodes: [], edges: [], metadata: { moduleName, extendsType: '', description: '', targetLanguage: language, compilationUnit: { version: 1, entryPolicy: 'library' } } } } };
    const origin = (at: SourceSpan) => ({ ...at, mappingId: `${language}.ordinary-scalar`, mappingVersion: 1, sourceSha256: headers.sourceSha256 });
    const home = snapshot.documents[homeId];
    for (const [index, syntax] of roots.entries()) {
      const header = headers.signatures.find(fn => fn.start === syntax.startIndex && fn.end === syntax.endIndex);
      if (!header) reject('HEADER_OWNER', span(syntax));
      const signature = header!;
      const declarator = language === 'cpp' ? syntax.childForFieldName('declarator')! : syntax;
      const allowedHeaderChildren = new Set([syntax.childForFieldName(language === 'cpp' ? 'type' : 'return_type'), syntax.childForFieldName('body'), language === 'cpp' ? declarator : syntax.childForFieldName('name'), language === 'cpp' ? null : syntax.childForFieldName('parameters')].filter(Boolean).map(node => node!.id));
      const modifierKinds = new Set(['type_qualifier', 'storage_class_specifier', 'function_modifiers', 'visibility_modifier', 'static_keyword']);
      for (const child of children(syntax)) if (!allowedHeaderChildren.has(child.id) && !modifierKinds.has(child.type)) reject('HEADER_CONSTRUCT', span(child));
      if (language === 'cpp') {
        const allowedDeclarator = new Set([declarator.childForFieldName('declarator')?.id, declarator.childForFieldName('parameters')?.id]);
        for (const child of children(declarator)) if (!allowedDeclarator.has(child.id)) reject('DECLARATOR_CONTEXT', span(child));
      }
      const id = `native-${(await digest(`${language}\0${options.fileName}\0${signature.name}`)).slice(0, 24)}`;
      const unit = signature.nativeReturnType === (language === 'rust' ? '()' : 'void');
      const parameters = signature.parameters.map((param, slot) => ({ id: `parameter-${slot}`, name: param.name, mode: 'positional', nativeType: param.nativeType, authoredType: param.authoredType, mutable: param.mutable }));
      const pin = nativeScalarSignaturePin(signature.nativeReturnType, language);
      const fn: ProjectSnapshot['functions'][number] = { kind: 'function', id, name: signature.name, classId, visibility: 'public', binding: 'module', overloads: [{ id: 'o1', parameters: parameters.map(param => ({ id: param.id, label: param.name, type: nativeScalarSignaturePin(param.nativeType, language)! })), returnType: unit ? 'void' : pin!, graphTabId: id }] };
      snapshot.functions.push(fn);
      const definition = nodeData('function_implement');
      definition.properties = { nativeSignatureLanguage: language, functionName: signature.name, nativeParameters: parameters, nativeReturnType: signature.nativeReturnType, nativeAuthoredReturnType: signature.authoredReturnType, nativeExplicitUnitReturn: !!signature.returnTypeSpan, nativeModifiers: [...signature.modifiers], sourceOrigin: origin(signature), sourceParameterOrigins: signature.parameters.map(param => ({ id: parameters[signature.parameters.indexOf(param)].id, ...origin(param), typeSpan: param.typeSpan })) };
      const defineId = `${id}-define`;
      home.nodes.push({ id: defineId, type: 'vvs_standard_node', position: { x: index * 260, y: 0 }, data: applyFunctionImplementBinding(definition, fn) });
      if (index) home.edges.push({ id: `${id}-member`, source: home.nodes[index - 1].id, sourceHandle: 'exec_out', target: defineId, targetHandle: 'exec_in', data: { pinType: 'execution' } });
      const entryData = nodeData('function_entry'); entryData.properties = { nativeSignatureLanguage: language, sourceOrigin: origin(signature.bodySpan) };
      const entry: GraphNode = { id: `${id}-entry`, type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: applyFunctionEntryBinding(entryData, fn) };
      const body: ProjectSnapshot['documents'][string] = { nodes: [entry], edges: [] };
      snapshot.documents[id] = body; snapshot.openTabs.push({ id, type: 'function', name: fn.name });
      const syntaxBody = syntax.childForFieldName('body')!;
      const statements = children(syntaxBody);
      if (statements.some(statement => ['declaration', 'let_declaration', 'variable_statement', 'const_statement'].includes(statement.type)) && localBodies) {
        const record = localBodies.records.find(record => record.owner.start === signature.start && record.owner.end === signature.end);
        if (!record?.statements || record.diagnostic) reject('LOCAL_BODY_CONTEXT', record?.diagnostic ?? signature.bodySpan);
        const graph = materializeNativeLocalBody(record!.statements!, language, body, home.nodes.at(-1)!.data, { entryId: entry.id, symbolId: fn.id, parameters, returnType: signature.nativeReturnType }, headers.sourceSha256, classId, options.groupedDeclarations, options.inferredLocals);
        body.nodes = graph.document.nodes; body.edges = graph.document.edges; snapshot.variables.push(...graph.variables);
        continue;
      }
      if (!statements.length || language === 'gdscript' && statements.length === 1 && statements[0].type === 'pass_statement') {
        if (!unit) reject('MISSING_VALUE_RETURN', signature.bodySpan);
        continue;
      }
      if (statements.length !== 1) reject('BODY_CONSTRUCTS', signature.bodySpan);
      let statement = statements[0], tail = false;
      if (language === 'rust' && statement.type === 'expression_statement') {
        const inner = children(statement)[0];
        if (inner?.type === 'return_expression') statement = inner;
        else if (!statement.text.trimEnd().endsWith(';') && inner) { statement = inner; tail = true; }
        else reject('DISCARDED_EXPRESSION', span(statement));
      } else if (language === 'rust' && statement.type !== 'return_expression') tail = true;
      if (!tail && !['return_statement', 'return_expression'].includes(statement.type)) reject('BODY_CONSTRUCTS', span(statement));
      const value = tail ? statement : children(statement)[0];
      if (unit && value || !unit && !value) reject('RETURN_CONTEXT', span(statement));
      const ret: GraphNode = { id: `${id}-return`, type: 'vvs_standard_node', position: { x: 600, y: 0 }, data: { ...nodeData('flow_return'), inputs: [{ id: 'exec_in', label: '', type: 'execution' }, ...(!unit ? [{ id: 'val', label: 'Value', type: pin! }] : [])], properties: { nativeReturnLanguage: language, nativeReturnStyle: tail ? 'rust-tail' : 'explicit', sourceOrigin: origin(span(statement)) } } };
      body.nodes.push(ret); body.edges.push({ id: `${id}-flow`, source: entry.id, sourceHandle: 'exec_out', target: ret.id, targetHandle: 'exec_in', data: { pinType: 'execution' } });
      if (!value) continue;
      let rootId: string, handle: string;
      if (value.type === 'identifier') {
        const ref = bindings.references.find(ref => ref.start === value.startIndex && ref.end === value.endIndex && ref.access === 'read');
        const binding = ref && bindings.bindings.find(binding => binding.id === ref.bindingId && binding.kind === 'parameter');
        const slot = binding && signature.parameters.findIndex(param => param.start === binding.start && param.end === binding.end);
        if (slot === undefined || slot < 0 || signature.parameters[slot].nativeType !== signature.nativeReturnType) reject('PARAMETER_RETURN_CONTEXT', span(value));
        rootId = entry.id; handle = parameters[slot!].id;
        ret.data.properties!.sourceValueOrigin = origin(span(value));
      } else if (runtime?.records.some(record => record.owner.start === signature.start && record.fact && record.expression?.start === value.startIndex && record.expression?.end === value.endIndex)) {
        const record = runtime.records.find(record => record.owner.start === signature.start)!;
        if (record.fact!.nativeType !== signature.nativeReturnType) reject('RUNTIME_RETURN_CONTEXT', span(value));
        const graph = materializeNativeRuntimeExpression(record.expression!, language, body, { entryId: entry.id, symbolId: fn.id, parameters, returnType: signature.nativeReturnType }, headers.sourceSha256, `${id}-value`);
        body.nodes = graph.document.nodes; body.edges = graph.document.edges;
        const mappedReturn = body.nodes.find(node => node.id === ret.id)!;
        mappedReturn.position = { x: (body.nodes.length + 1) * 260, y: 0 };
        rootId = graph.rootId; handle = graph.rootHandle;
      } else {
        const record = constants.records.find(record => record.start === value.startIndex && record.end === value.endIndex && record.owner.name === signature.name && record.owner.kind === 'return');
        if (!record?.expression || !record.fact || record.fact.nativeType !== signature.nativeReturnType) reject('CONSTANT_RETURN_CONTEXT', span(value));
        // The current GDScript printer spells logical negation as `not`.
        // Retain `!` inputs unsupported until a visible spelling option exists.
        if (language === 'gdscript' && /!(?!=)/.test(source.slice(value.startIndex, value.endIndex))) reject('OPERATOR_SPELLING', span(value));
        const graph = buildNativeConstantGraph(record!.expression!, language, `${id}-value`, (node, expression) => {
          const at = expression as NativeConstantExpression & SourceSpan;
          node.data.properties!.sourceOrigin = origin(at);
          // Unsuffixed Rust types derive from the visible function/casts/peers.
          // Source analysis hints are not authoring state and must not freeze
          // that inference when the user edits the visible return signature.
          if (language === 'rust') delete node.data.properties!.nativeLiteralType;
        });
        // Place source-owned expressions below the entry/return flow, in
        // dependency order; the draft builder's depth coordinates overlap
        // literal leaves with the function Return node.
        graph.document.nodes.forEach((node, index) => { node.position = { x: index * 260, y: 180 }; });
        ret.position = { x: (graph.document.nodes.length + 1) * 260, y: 0 };
        body.nodes.push(...graph.document.nodes); body.edges.push(...graph.document.edges); rootId = graph.rootId; handle = 'result';
      }
      body.edges.push({ id: `${id}-value-return`, source: rootId!, sourceHandle: handle!, target: ret.id, targetHandle: 'val', data: { pinType: pin! } });
    }
    if (Object.values(snapshot.documents).reduce((count, doc) => count + doc.nodes.length, 0) > IMPORT_LIMITS.nodes) reject('NODE_BUDGET', span(tree.rootNode));
    for (const doc of Object.values(snapshot.documents)) for (const node of doc.nodes) {
      const kind = resolve(node.data.kindId!);
      if (!kind) reject('REGISTRY_KIND', span(tree.rootNode));
      node.data.kindVersion = kind!.kindVersion;
    }
    home.metadata!.sourceFileName = options.fileName;
    home.nodes[0].data.properties!.sourceImport = { source, sourceSha256: headers.sourceSha256, fileName: options.fileName, language, start: 0, end: source.length, mappingVersion: 1, entryPolicy: 'library' };
    const problems = analyzeProject(snapshot).diagnostics.filter(item => item.level === 'error');
    if (problems.length) reject(`SAVED_GRAPH_${problems[0].code}`, span(tree.rootNode));
    return { ...base, diagnostics: [], status: 'mapped', snapshot };
  } catch (error) {
    if (!(error instanceof ImportFailure)) throw error;
    diagnostics.push({ ...error.span, code: error.code, message: error.message });
    return { ...base, diagnostics, status: 'unsupported' };
  } finally { tree.delete(); }
}
