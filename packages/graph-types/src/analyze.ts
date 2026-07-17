import type { AnalysisResult, Diagnostic } from './diagnostic';
import type {
  GraphDocument,
  FunctionSymbol,
  VariableSymbol,
  TargetLanguage,
  CrossOverArchitectureMode,
  ClassSymbol,
  ProjectEventDefinition,
} from './symbols';
import { collectPortabilityFeatures, portabilityFeaturesForVariable } from './symbols';
import {
  buildProjectSymbolIndex,
  isUnresolvedSymbolRef,
  type ResolvedSymbolRef,
} from './symbolRefs';
import { edgePinTypes, pinsAreCompatible } from './pinCompatibility';
import {
  classDefineMatchesClass,
  classGraphHasClassDefine,
  classGraphHasDefineNodes,
  classRequiresClassDefine,
  defineNodeSymbolId,
  findDefineNodesForSymbol,
  isMemberDefineKind,
  isMemberDefineNode,
  resolveNodeKindId,
} from './defineNodes';
import { analyzeClassMembers } from './classMembers';
import { validateCanvasOrderYHints } from './canvasOrderY';
import { MAIN_CLASS_ID, classHomeGraphId, classForHomeGraphId, findProgramEntryEvent } from './symbols';

export interface AnalyzeProjectInput {
  documents: Record<string, GraphDocument>;
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  variables?: VariableSymbol[];
  classes?: ClassSymbol[];
  activeClassId?: string;
  openTabs?: { id: string; type: string; name: string }[];
  projectDetails: { extendsType: string };
  targetLanguage: TargetLanguage;
  portabilityDiagnostics?: Diagnostic[];
  crossOver?: CrossOverArchitectureMode;
  crossOverDiagnostics?: Diagnostic[];
  environmentId?: string;
  environmentMethodIds?: string[];
  environmentEventIds?: string[];
  environmentNativeMethodIds?: string[];
}

function isGraphNode(node: { type: string }): boolean {
  return node.type !== 'vvs_comment_node' && node.type !== 'vvs_reroute_node';
}

function hasIncomingExecution(
  edges: GraphDocument['edges'],
  nodeId: string,
  pinId: string
): boolean {
  return edges.some(
    (e) =>
      e.target === nodeId &&
      e.data?.pinType === 'execution' &&
      (e.targetHandle === pinId || e.targetHandle == null)
  );
}

function isExecChainHead(doc: GraphDocument, nodeId: string, kindId: string): boolean {
  if (kindId === 'event_on_start' || kindId === 'event_on_update' || kindId === 'class_define') {
    return true;
  }
  if (!isMemberDefineKind(kindId)) return false;
  return !hasIncomingExecution(doc.edges, nodeId, 'exec_in');
}

function validateDocument(tabId: string, doc: GraphDocument): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const { nodes, edges } = doc;

  for (const node of nodes) {
    if (!isGraphNode(node)) continue;

    const kindId = resolveNodeKindId(node.data);
    const execInputs = node.data.inputs?.filter((pin) => pin.type === 'execution') ?? [];
    for (const pin of execInputs) {
      if (isExecChainHead(doc, node.id, kindId)) continue;
      if (!hasIncomingExecution(edges, node.id, pin.id)) {
        messages.push({
          level: 'error',
          message: `Unconnected execution pin on "${node.data.label}"`,
          tabId,
          nodeId: node.id,
          source: 'structural',
        });
      }
    }
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target || !isGraphNode(source) || !isGraphNode(target)) continue;

    const types = edgePinTypes(source, target, edge.sourceHandle, edge.targetHandle);
    if (!types) {
      // Exec / legacy wires often lack resolvable pin metadata — not a user fidelity issue.
      // Real type honesty is PIN_TYPE_MISMATCH when both sides resolve.
      if (isLikelyExecutionEdge(edge)) continue;
      messages.push({
        level: 'warning',
        message: `Could not resolve pin types for wire ${edge.source} → ${edge.target}`,
        tabId,
        edgeId: edge.id,
        source: 'structural',
        code: 'WIRE_PIN_UNRESOLVED',
      });
      continue;
    }

    if (!pinsAreCompatible(types.sourceType, types.targetType, types.sourceTypeRef, types.targetTypeRef)) {
      messages.push({
        level: 'error',
        message: `Pin type mismatch (${types.sourceType} → ${types.targetType}) on wire to "${target.data.label}"`,
        tabId,
        edgeId: edge.id,
        nodeId: target.id,
        source: 'structural',
        code: 'PIN_TYPE_MISMATCH',
      });
    }
  }

  return messages;
}

function isLikelyExecutionEdge(edge: GraphDocument['edges'][number]): boolean {
  if (edge.data?.pinType === 'execution') return true;
  const src = edge.sourceHandle ?? '';
  const tgt = edge.targetHandle ?? '';
  return src.includes('exec') || tgt.includes('exec');
}

function validateSemantics(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const names = new Map<string, string>();

  for (const fn of input.functions) {
    const existing = names.get(fn.name);
    if (existing && existing !== fn.id) {
      messages.push({
        level: 'error',
        message: `Duplicate function name "${fn.name}"`,
        symbolId: fn.id,
        source: 'semantic',
        code: 'DUPLICATE_FUNCTION_NAME',
      });
    }
    names.set(fn.name, fn.id);
  }

  return messages;
}

function resolveVariableNameFromNode(
  node: GraphDocument['nodes'][number],
  variablesById: Map<string, VariableSymbol>
): string | undefined {
  const binding = node.data.graphBinding;
  if (binding?.kind === 'variable_ref' && binding.symbolId) {
    return variablesById.get(binding.symbolId)?.name;
  }
  const fromProps = node.data.properties?.variableName;
  if (typeof fromProps === 'string' && fromProps.length > 0) return fromProps;
  if (node.data.label.startsWith('Get ')) return node.data.label.slice(4).trim();
  if (node.data.label.startsWith('Set ')) return node.data.label.slice(4).trim();
  return undefined;
}

function validateVariableSemantics(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const variables = input.variables ?? [];
  const variablesById = new Map(variables.map((v) => [v.id, v]));
  const readonlyNames = new Set(
    variables.filter((v) => v.flags?.readonly).map((v) => v.name)
  );
  const names = new Map<string, string>();

  for (const variable of variables) {
    const existing = names.get(variable.name);
    if (existing && existing !== variable.id) {
      messages.push({
        level: 'error',
        message: `Duplicate variable name "${variable.name}"`,
        symbolId: variable.id,
        source: 'semantic',
        code: 'DUPLICATE_VARIABLE_NAME',
      });
    }
    names.set(variable.name, variable.id);
  }

  if (readonlyNames.size === 0) return messages;

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = node.data.kindId ?? '';
      const isSet =
        kindId === 'variable_set' ||
        (node.data.label.startsWith('Set ') && node.data.category === 'Variables');
      if (!isSet) continue;

      const varName = resolveVariableNameFromNode(node, variablesById);
      if (varName && readonlyNames.has(varName)) {
        messages.push({
          level: 'error',
          message: `Set node writes to read-only variable "${varName}"`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'READONLY_VARIABLE_WRITE',
        });
      }
    }
  }

  return messages;
}

function isDeprecatedMacroNode(node: GraphDocument['nodes'][number]): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  const d = node.data;
  return (
    d.kindId === 'vvs.project.use_macro' ||
    d.linkKind === 'use_macro' ||
    d.graphBinding?.kind === 'use_macro' ||
    (typeof d.kindId === 'string' && d.kindId.startsWith('use_macro_'))
  );
}

function validateTextShapedFidelity(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const functionIds = new Set(input.functions.map((f) => f.id));

  for (const tab of input.openTabs ?? []) {
    if (tab.type === 'macro') {
      messages.push({
        level: 'warning',
        message: `Macro tab "${tab.name}" is deprecated — save/load to migrate to a function`,
        tabId: tab.id,
        source: 'semantic',
        code: 'DEPRECATED_MACRO_TAB',
      });
    }
  }

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (isDeprecatedMacroNode(node)) {
        messages.push({
          level: 'error',
          message: `Macro node "${node.data.label}" is deprecated — use Call Function`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'DEPRECATED_MACRO_NODE',
        });
      }

      const isCall =
        node.data.kindId === 'vvs.project.call_function' ||
        node.data.linkKind === 'call_function' ||
        node.data.graphBinding?.kind === 'call_function';
      if (isCall && node.type === 'vvs_standard_node') {
        const targetId =
          node.data.graphBinding?.symbolId ?? node.data.linkedGraphId ?? '';
        if (targetId && !functionIds.has(targetId)) {
          messages.push({
            level: 'error',
            message: `Call references unknown function (id: ${targetId})`,
            tabId,
            nodeId: node.id,
            source: 'semantic',
            code: 'UNREGISTERED_FUNCTION_CALL',
          });
        }
      }
    }
  }

  return messages;
}

function validateUnresolvedSymbolRefs(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const index = buildProjectSymbolIndex({
    variables: input.variables ?? [],
    functions: input.functions,
    events: input.events,
  });

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      const ref = isUnresolvedSymbolRef(node, index);
      if (!ref) continue;
      const label = unresolvedRefLabel(ref);
      messages.push({
        level: 'error',
        message: `Unresolved ${ref.kind} reference: ${label}`,
        code: 'UNRESOLVED_SYMBOL_REF',
        tabId,
        nodeId: node.id,
        symbolId: ref.symbolId.startsWith('name:') ? undefined : ref.symbolId,
        source: 'semantic',
      });
    }
  }

  return messages;
}

function unresolvedRefLabel(ref: ResolvedSymbolRef): string {
  if (ref.displayName) return ref.displayName;
  if (ref.symbolId.startsWith('name:')) return ref.symbolId.slice(5);
  return ref.symbolId;
}

function functionIsAsync(func: FunctionSymbol, doc: GraphDocument): boolean {
  if (func.flags?.async) return true;
  return doc.nodes.some(
    (n) => n.type === 'vvs_standard_node' && resolveNodeKindId(n.data) === 'action_await_wait'
  );
}

/**
 * Sync Wait emits a real delay on most targets. On these languages the template is a
 * comment/stub — warn so the graph→code promise stays honest.
 */
const BLOCKING_WAIT_STUB_TARGETS = new Set<TargetLanguage>(['javascript', 'verse', 'json']);

function validateWaitAndAsyncNodes(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const functionById = new Map(input.functions.map((f) => [f.id, f]));

  for (const [tabId, doc] of Object.entries(input.documents)) {
    const func = functionById.get(tabId);
    const inAsyncFunction = func ? functionIsAsync(func, doc) : false;
    const inFunctionContext = Boolean(func);

    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);

      if (kindId === 'action_wait') {
        if (BLOCKING_WAIT_STUB_TARGETS.has(input.targetLanguage)) {
          messages.push({
            level: 'warning',
            message: `Blocking Wait does not emit a real delay for "${input.targetLanguage}" — use Await Wait in an async function`,
            tabId,
            nodeId: node.id,
            source: 'semantic',
            code: 'BLOCKING_WAIT_ON_TARGET',
          });
        }
        if (inFunctionContext && inAsyncFunction) {
          messages.push({
            level: 'error',
            message: 'Blocking Wait cannot be used inside an async function — use Await Wait',
            tabId,
            nodeId: node.id,
            source: 'semantic',
            code: 'WAIT_IN_ASYNC_FUNCTION',
          });
        }
      }

      if (kindId === 'action_await_wait') {
        if (inFunctionContext && !inAsyncFunction) {
          messages.push({
            level: 'error',
            message: 'Await wait requires an async function',
            tabId,
            nodeId: node.id,
            source: 'semantic',
            code: 'AWAIT_OUTSIDE_ASYNC',
          });
        } else if (!inFunctionContext) {
          messages.push({
            level: 'error',
            message: 'Await wait is only valid inside an async function',
            tabId,
            nodeId: node.id,
            source: 'semantic',
            code: 'AWAIT_OUTSIDE_ASYNC',
          });
        }
      }
    }
  }

  return messages;
}

function resolveEventIdFromNode(
  node: GraphDocument['nodes'][number],
  events: ProjectEventDefinition[]
): string | undefined {
  const eventId = node.data.properties?.eventId;
  if (typeof eventId === 'string' && eventId) return eventId;
  const eventName = node.data.properties?.eventName;
  if (typeof eventName === 'string' && eventName) {
    const match = events.find((e) => e.name.toLowerCase() === eventName.toLowerCase());
    return match?.id ?? `name:${eventName.toLowerCase()}`;
  }
  if (node.data.label.startsWith('On ')) {
    const name = node.data.label.replace(/^On\s+/i, '').trim();
    const match = events.find((e) => e.name.toLowerCase() === name.toLowerCase());
    return match?.id ?? `name:${name.toLowerCase()}`;
  }
  return undefined;
}

function validateMulticastEvents(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const defineCountByEvent = new Map<string, { count: number; tabId: string; nodeId: string }>();
  const subscribeEventIds = new Set<string>();

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);

      if (kindId === 'event_define' || kindId === 'event_custom') {
        const eventId = resolveEventIdFromNode(node, input.events);
        if (!eventId) continue;
        const existing = defineCountByEvent.get(eventId);
        defineCountByEvent.set(eventId, {
          count: (existing?.count ?? 0) + 1,
          tabId,
          nodeId: node.id,
        });
      }

      if (kindId === 'event_subscribe') {
        const eventId = resolveEventIdFromNode(node, input.events);
        if (eventId) subscribeEventIds.add(eventId);
      }
    }
  }

  for (const [eventId, info] of defineCountByEvent) {
    if (info.count > 1 && !subscribeEventIds.has(eventId)) {
      messages.push({
        level: 'error',
        message: `Multiple handlers for the same event cannot be dispatched without a hidden runtime helper (event: ${eventId}) — use a single event_define handler per event.`,
        tabId: info.tabId,
        nodeId: info.nodeId,
        source: 'semantic',
        code: 'MULTICAST_REQUIRES_SUBSCRIBE',
      });
    }
  }

  return messages;
}

const HIDDEN_EVENT_RUNTIME_KINDS = new Set(['event_emit', 'event_subscribe']);

function validateHiddenEventRuntimeNodes(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);
      if (!HIDDEN_EVENT_RUNTIME_KINDS.has(kindId)) continue;

      const action = kindId === 'event_subscribe' ? 'Subscribe' : 'Emit';

      messages.push({
        level: 'error',
        message: `${action} event nodes rely on a hidden runtime helper and are not supported for code generation — use event_define handlers and direct calls instead.`,
        tabId,
        nodeId: node.id,
        source: 'semantic',
        code: 'HIDDEN_EVENT_RUNTIME_UNSUPPORTED',
      });
    }
  }

  return messages;
}

function validateEnvironmentSemantics(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const methodIds = new Set(input.environmentMethodIds ?? []);
  const eventIds = new Set(input.environmentEventIds ?? []);
  const nativeIds = new Set(input.environmentNativeMethodIds ?? []);

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);
      const binding = node.data.graphBinding;
      const manifestMethodId =
        binding?.manifestMethodId ??
        (typeof node.data.properties?.manifestMethodId === 'string'
          ? node.data.properties.manifestMethodId
          : undefined);
      const manifestEventId =
        binding?.manifestEventId ??
        (typeof node.data.properties?.manifestEventId === 'string'
          ? node.data.properties.manifestEventId
          : undefined);

      const referencesManifest =
        kindId === 'env.call_native' ||
        kindId === 'env.event_handler' ||
        binding?.kind === 'env_native' ||
        binding?.kind === 'env_event' ||
        manifestMethodId ||
        manifestEventId;

      if (!referencesManifest) continue;

      if (!input.environmentId) {
        messages.push({
          level: 'error',
          message: `Environment node "${node.data.label}" requires a linked project environment`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'ENV_MANIFEST_MISSING',
        });
        continue;
      }

      if (manifestMethodId && methodIds.size > 0 && !methodIds.has(manifestMethodId)) {
        messages.push({
          level: 'error',
          message: `Unknown environment method "${manifestMethodId}" (template may have changed)`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'ENV_METHOD_UNKNOWN',
        });
      }

      if (manifestEventId && eventIds.size > 0 && !eventIds.has(manifestEventId)) {
        messages.push({
          level: 'error',
          message: `Unknown environment event "${manifestEventId}" (template may have changed)`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'ENV_METHOD_UNKNOWN',
        });
      }

      if (
        (kindId === 'env.call_native' || binding?.kind === 'env_native') &&
        manifestMethodId &&
        nativeIds.size > 0 &&
        !nativeIds.has(manifestMethodId)
      ) {
        messages.push({
          level: 'warning',
          message: `Native "${manifestMethodId}" is not available for ${input.targetLanguage}`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'ENV_NATIVE_UNSUPPORTED',
        });
      }
    }
  }

  return messages;
}

function symbolClassId(item: { classId?: string }): string {
  return item.classId ?? MAIN_CLASS_ID;
}

function classHasSymbols(
  cls: ClassSymbol,
  variables: VariableSymbol[],
  functions: FunctionSymbol[],
  events: ProjectEventDefinition[]
): boolean {
  return (
    variables.some((v) => symbolClassId(v) === cls.id) ||
    functions.some((f) => symbolClassId(f) === cls.id) ||
    events.some((e) => symbolClassId(e) === cls.id)
  );
}

function validateOrphanDefineNodes(
  tabId: string,
  doc: GraphDocument,
  cls: ClassSymbol,
  allClasses: ClassSymbol[],
  variables: VariableSymbol[],
  functions: FunctionSymbol[],
  events: ProjectEventDefinition[]
): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const variableIds = new Set(
    variables.filter((v) => symbolClassId(v) === cls.id).map((v) => v.id)
  );
  const functionIds = new Set(
    functions.filter((f) => symbolClassId(f) === cls.id).map((f) => f.id)
  );
  const eventIds = new Set(
    events.filter((e) => symbolClassId(e) === cls.id).map((e) => e.id)
  );

  for (const node of doc.nodes) {
    if (!isMemberDefineNode(node)) continue;
    const kindId = resolveNodeKindId(node.data);
    if (kindId === 'class_define') {
      const matchesKnownClass = allClasses.some((c) => classDefineMatchesClass(node, c, doc));
      if (!matchesKnownClass) {
        messages.push({
          level: 'error',
          message: `Define node references unknown class on class graph "${cls.name}".`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'ORPHAN_DEFINE_NODE',
        });
      }
      continue;
    }

    // Enums are canvas-declared only (no symbol-table row yet).
    if (kindId === 'enum_define') continue;

    const symbolId = defineNodeSymbolId(node);
    if (!symbolId) continue;

    const kindLabel =
      kindId === 'var_define'
        ? 'variable'
        : kindId === 'function_define'
          ? 'function'
          : 'event';

    const known =
      kindId === 'var_define'
        ? variableIds.has(symbolId)
        : kindId === 'function_define'
          ? functionIds.has(symbolId)
          : eventIds.has(symbolId);

    if (known) continue;

    // Another class may share this home graph — its define nodes are not orphans for `cls`.
    const ownedBySibling =
      (kindId === 'var_define' &&
        variables.some((v) => v.id === symbolId && symbolClassId(v) !== cls.id)) ||
      (kindId === 'function_define' &&
        functions.some((f) => f.id === symbolId && symbolClassId(f) !== cls.id)) ||
      (kindId === 'event_member_define' &&
        events.some((e) => e.id === symbolId && symbolClassId(e) !== cls.id));
    if (ownedBySibling) continue;

    messages.push({
      level: 'error',
      message: `Define node references unknown ${kindLabel} symbol "${symbolId}" on class graph "${cls.name}".`,
      tabId,
      nodeId: node.id,
      symbolId,
      source: 'semantic',
      code: 'ORPHAN_DEFINE_NODE',
    });
  }

  return messages;
}

function validateDefineNodeSync(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const variables = input.variables ?? [];
  const classes = input.classes ?? [];
  if (classes.length === 0) return messages;

  for (const cls of classes) {
    let tabId = classHomeGraphId(cls);
    let doc = input.documents[tabId];

    if (!doc || !classGraphHasClassDefine(doc, cls)) {
      for (const [id, d] of Object.entries(input.documents)) {
        if (classGraphHasClassDefine(d, cls)) {
          tabId = id;
          doc = d;
          break;
        }
      }
    }

    if (!doc) continue;

    const classVariables = variables.filter((v) => symbolClassId(v) === cls.id);
    const classFunctions = input.functions.filter((f) => symbolClassId(f) === cls.id);
    const classEvents = input.events.filter((e) => symbolClassId(e) === cls.id);

    if (classRequiresClassDefine(doc) && !classGraphHasClassDefine(doc, cls)) {
      messages.push({
        level: 'error',
        message: `Class "${cls.name}" has no Declare Class node on its class graph.`,
        tabId,
        symbolId: cls.id,
        source: 'semantic',
        code: 'DEFINE_NODE_MISSING',
      });
    }

    for (const variable of classVariables) {
      if (findDefineNodesForSymbol(doc, 'variable', variable.id).length > 0) continue;
      messages.push({
        level: 'error',
        message: `Variable "${variable.name}" has no Declare node on class graph "${cls.name}".`,
        tabId,
        symbolId: variable.id,
        source: 'semantic',
        code: 'DEFINE_NODE_MISSING',
      });
    }

    for (const func of classFunctions) {
      if (findDefineNodesForSymbol(doc, 'function', func.id).length > 0) continue;
      messages.push({
        level: 'error',
        message: `Function "${func.name}" has no Declare node on class graph "${cls.name}".`,
        tabId,
        symbolId: func.id,
        source: 'semantic',
        code: 'DEFINE_NODE_MISSING',
      });
    }

    for (const event of classEvents) {
      if (findDefineNodesForSymbol(doc, 'event', event.id).length > 0) continue;
      messages.push({
        level: 'error',
        message: `Event "${event.name}" has no Declare node on class graph "${cls.name}".`,
        tabId,
        symbolId: event.id,
        source: 'semantic',
        code: 'DEFINE_NODE_MISSING',
      });
    }

    messages.push(
      ...validateOrphanDefineNodes(
        tabId,
        doc,
        cls,
        classes,
        variables,
        input.functions,
        input.events
      )
    );
  }

  return messages;
}

function isCallFunctionNode(node: import('./nodes').GraphNode): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  const kindId = resolveNodeKindId(node.data);
  return (
    kindId === 'vvs.project.call_function' ||
    node.data.linkKind === 'call_function' ||
    node.data.graphBinding?.kind === 'call_function' ||
    node.data.graphBinding?.kind === 'call_class_function'
  );
}

function isDispatchEventNode(node: import('./nodes').GraphNode): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  const kindId = resolveNodeKindId(node.data);
  return (
    kindId === 'event_dispatch' ||
    kindId === 'event_emit' ||
    node.data.graphBinding?.kind === 'dispatch_event'
  );
}

function isImportClassNode(node: import('./nodes').GraphNode): boolean {
  if (node.type !== 'vvs_standard_node') return false;
  const kindId = resolveNodeKindId(node.data);
  return kindId === 'import_class' || node.data.graphBinding?.kind === 'import_class';
}

function collectDefinedAndImportedClassIds(
  doc: GraphDocument,
  classes: ClassSymbol[]
): { definedClassIds: Set<string>; importedClassIds: Set<string> } {
  const definedClassIds = new Set<string>();
  for (const cls of classes) {
    if (classGraphHasClassDefine(doc, cls)) {
      definedClassIds.add(cls.id);
    }
  }

  const importedClassIds = new Set<string>();
  for (const node of doc.nodes) {
    if (!isImportClassNode(node)) continue;
    const targetClassId =
      (typeof node.data.properties?.targetClassId === 'string'
        ? node.data.properties.targetClassId
        : undefined) ?? node.data.graphBinding?.targetClassId;
    if (targetClassId) importedClassIds.add(targetClassId);
  }

  return { definedClassIds, importedClassIds };
}

/** Module graph that owns a call/dispatch site (function body → owning class home). */
function resolveCallSiteModuleGraphId(
  tabId: string,
  functions: FunctionSymbol[],
  classes: ClassSymbol[]
): string {
  const func = functions.find((f) => f.id === tabId);
  if (func) {
    const owner = classes.find((c) => c.id === (func.classId ?? MAIN_CLASS_ID));
    return owner ? classHomeGraphId(owner) : tabId;
  }
  return tabId;
}

function classIsInModuleScope(options: {
  targetClassId: string;
  callSiteTabId: string;
  definedClassIds: Set<string>;
  importedClassIds: Set<string>;
  functions: FunctionSymbol[];
  classes: ClassSymbol[];
}): boolean {
  const {
    targetClassId,
    callSiteTabId,
    definedClassIds,
    importedClassIds,
    functions,
    classes,
  } = options;
  if (definedClassIds.has(targetClassId)) return true;
  if (importedClassIds.has(targetClassId)) return true;
  const targetClass = classes.find((c) => c.id === targetClassId);
  if (!targetClass) return false;
  const callSiteModule = resolveCallSiteModuleGraphId(callSiteTabId, functions, classes);
  return callSiteModule === classHomeGraphId(targetClass);
}

function validateCrossClassCalls(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const classes = input.classes ?? [];
  if (classes.length < 2) return messages;

  const functionById = new Map(input.functions.map((f) => [f.id, f]));

  for (const [tabId, doc] of Object.entries(input.documents)) {
    const { definedClassIds, importedClassIds } = collectDefinedAndImportedClassIds(doc, classes);

    for (const node of doc.nodes) {
      if (!isCallFunctionNode(node)) continue;
      const symbolId = node.data.graphBinding?.symbolId ?? node.data.linkedGraphId;
      if (!symbolId) continue;
      const fn = functionById.get(symbolId);
      if (!fn) continue;
      const fnClassId = fn.classId ?? MAIN_CLASS_ID;

      if (
        classIsInModuleScope({
          targetClassId: fnClassId,
          callSiteTabId: tabId,
          definedClassIds,
          importedClassIds,
          functions: input.functions,
          classes,
        })
      ) {
        continue;
      }
      const targetClass = classes.find((c) => c.id === fnClassId);
      messages.push({
        level: 'warning',
        message: `Cross-module call to ${targetClass?.name ?? fn.name} without import_class on this graph`,
        code: 'CROSS_CLASS_CALL_WITHOUT_IMPORT',
        tabId,
        nodeId: node.id,
        source: 'semantic',
      });
    }
  }

  return messages;
}

function validateCrossClassDispatches(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const classes = input.classes ?? [];
  if (classes.length < 2) return messages;

  const eventById = new Map((input.events ?? []).map((e) => [e.id, e]));

  for (const [tabId, doc] of Object.entries(input.documents)) {
    const { definedClassIds, importedClassIds } = collectDefinedAndImportedClassIds(doc, classes);

    for (const node of doc.nodes) {
      if (!isDispatchEventNode(node)) continue;
      const symbolId =
        node.data.graphBinding?.symbolId ??
        (typeof node.data.properties?.eventId === 'string'
          ? node.data.properties.eventId
          : undefined);
      if (!symbolId) continue;
      const event = eventById.get(symbolId);
      if (!event) continue;
      const eventClassId = event.classId ?? MAIN_CLASS_ID;

      if (
        classIsInModuleScope({
          targetClassId: eventClassId,
          callSiteTabId: tabId,
          definedClassIds,
          importedClassIds,
          functions: input.functions,
          classes,
        })
      ) {
        continue;
      }
      const targetClass = classes.find((c) => c.id === eventClassId);
      messages.push({
        level: 'warning',
        message: `Cross-module dispatch to ${targetClass?.name ?? event.name} without import_class on this graph`,
        code: 'CROSS_CLASS_DISPATCH_WITHOUT_IMPORT',
        tabId,
        nodeId: node.id,
        source: 'semantic',
      });
    }
  }

  return messages;
}

function validateVirtualFunctionFlags(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  for (const func of input.functions) {
    if (!func.flags?.virtual) continue;
    if (input.targetLanguage === 'python' || input.targetLanguage === 'javascript') {
      messages.push({
        level: 'warning',
        message: `Virtual flag on "${func.name}" is not emitted for target "${input.targetLanguage}"`,
        code: 'VIRTUAL_NOT_ON_TARGET',
        source: 'semantic',
        symbolId: func.id,
      });
    }
  }
  return messages;
}

function validateCanvasDeclarations(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const variables = input.variables ?? [];
  const classes = input.classes ?? [];
  if (classes.length === 0) return messages;

  const snapshot = {
    classes,
    documents: input.documents,
    variables,
    functions: input.functions,
    events: input.events,
  };

  for (const cls of classes) {
    const tabId = classHomeGraphId(cls);
    const doc = input.documents[tabId];
    const hasSymbols = classHasSymbols(cls, variables, input.functions, input.events);

    if (!hasSymbols) continue;

    if (!classGraphHasDefineNodes(doc)) {
      messages.push({
        level: 'error',
        message: `Class "${cls.name}" has symbols but no Declare nodes on its class graph.`,
        tabId,
        source: 'semantic',
        code: 'DECLARATION_NOT_ON_CANVAS',
      });
      continue;
    }

    const analysis = analyzeClassMembers(snapshot, cls.id);
    if (analysis && analysis.orderedNodeIds.length === 0) {
      messages.push({
        level: 'error',
        message: `Class "${cls.name}" has define nodes but no valid member declaration chain on its class graph.`,
        tabId,
        source: 'semantic',
        code: 'DECLARATION_NOT_ON_CANVAS',
      });
    }
  }

  return messages;
}

function validateLegacyLifecycleNodes(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = resolveNodeKindId(node.data);
      if (kindId !== 'event_on_start' && node.data.label !== 'On Start') continue;
      messages.push({
        level: 'error',
        message:
          'Lifecycle "On Start" nodes are deprecated — declare a program entry event (role: entry) with event_member_define + event_define on the class graph.',
        tabId,
        nodeId: node.id,
        source: 'semantic',
        code: 'LIFECYCLE_NODE_DEPRECATED',
      });
    }
  }
  return messages;
}

function validateProgramEntry(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const classes = input.classes ?? [];
  const events = input.events ?? [];

  for (const cls of classes) {
    const tabId = classHomeGraphId(cls);
    const doc = input.documents[tabId];
    if (!classHasSymbols(cls, input.variables ?? [], input.functions, events)) {
      continue;
    }
    const entry = findProgramEntryEvent(events, cls.id);
    if (!entry) {
      messages.push({
        level: 'error',
        message: `Class "${cls.name}" has no program entry event — add one from the Events panel (emits on_start for host runners).`,
        tabId,
        source: 'semantic',
        code: 'PROGRAM_ENTRY_MISSING',
      });
      continue;
    }
    const hasMemberDefine =
      doc?.nodes.some(
        (n) =>
          isMemberDefineNode(n) &&
          n.data.kindId === 'event_member_define' &&
          defineNodeSymbolId(n) === entry.id
      ) ?? false;
    if (!hasMemberDefine) {
      messages.push({
        level: 'error',
        message: `Program entry for "${cls.name}" is missing event_member_define on the class graph.`,
        tabId,
        source: 'semantic',
        code: 'PROGRAM_ENTRY_NOT_ON_CANVAS',
      });
    }
  }

  return messages;
}

export function analyzeProject(input: AnalyzeProjectInput): AnalysisResult {
  const diagnostics: Diagnostic[] = [];
  const containerTabIds = new Set(
    (input.openTabs ?? []).filter((tab) => tab.type === 'container').map((tab) => tab.id)
  );

  for (const [tabId, doc] of Object.entries(input.documents)) {
    if (containerTabIds.has(tabId)) {
      continue;
    }
    diagnostics.push(...validateDocument(tabId, doc));
  }

  diagnostics.push(...validateSemantics(input));
  diagnostics.push(...validateVariableSemantics(input));
  diagnostics.push(...validateTextShapedFidelity(input));
  diagnostics.push(...validateUnresolvedSymbolRefs(input));
  diagnostics.push(...validateWaitAndAsyncNodes(input));
  diagnostics.push(...validateMulticastEvents(input));
  diagnostics.push(...validateHiddenEventRuntimeNodes(input));
  diagnostics.push(...validateEnvironmentSemantics(input));
  diagnostics.push(...validateDefineNodeSync(input));
  diagnostics.push(...validateCanvasDeclarations(input));
  diagnostics.push(...validateProgramEntry(input));
  diagnostics.push(...validateLegacyLifecycleNodes(input));
  diagnostics.push(...validateCrossClassCalls(input));
  diagnostics.push(...validateCrossClassDispatches(input));
  diagnostics.push(...validateVirtualFunctionFlags(input));
  diagnostics.push(...validateCanvasOrderYHints(input.documents));

  if (input.portabilityDiagnostics) {
    diagnostics.push(...input.portabilityDiagnostics);
  }

  if (input.crossOverDiagnostics) {
    diagnostics.push(...input.crossOverDiagnostics);
  }

  return {
    ok: !diagnostics.some((d) => d.level === 'error'),
    diagnostics,
  };
}

export function snapshotFeaturesForPortability(snapshot: {
  projectDetails: { extendsType: string };
  functions: FunctionSymbol[];
  variables?: VariableSymbol[];
}): ReturnType<typeof collectPortabilityFeatures> {
  return collectPortabilityFeatures(snapshot);
}

export function variablePortabilityFeatureSets(
  variables: VariableSymbol[]
): Array<{ symbolId: string; name: string; features: ReturnType<typeof portabilityFeaturesForVariable> }> {
  return variables.map((variable) => ({
    symbolId: variable.id,
    name: variable.name,
    features: portabilityFeaturesForVariable(variable),
  }));
}
