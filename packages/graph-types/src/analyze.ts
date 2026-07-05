import type { AnalysisResult, Diagnostic } from './diagnostic';
import type {
  GraphDocument,
  FunctionSymbol,
  VariableSymbol,
  TargetLanguage,
  CrossOverArchitectureMode,
} from './symbols';
import { collectPortabilityFeatures, portabilityFeaturesForVariable } from './symbols';
import {
  buildProjectSymbolIndex,
  isUnresolvedSymbolRef,
  type ResolvedSymbolRef,
} from './symbolRefs';
import { edgePinTypes, pinsAreCompatible } from './pinCompatibility';

export interface AnalyzeProjectInput {
  documents: Record<string, GraphDocument>;
  functions: FunctionSymbol[];
  events: { id: string; name: string }[];
  variables?: VariableSymbol[];
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

function validateDocument(tabId: string, doc: GraphDocument): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const { nodes, edges } = doc;

  for (const node of nodes) {
    if (!isGraphNode(node)) continue;

    const execInputs = node.data.inputs?.filter((pin) => pin.type === 'execution') ?? [];
    for (const pin of execInputs) {
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

  if (tabId === 'main') {
    const standardNodes = nodes.filter((n) => n.type === 'vvs_standard_node');
    const hasEntry = standardNodes.some(
      (n) =>
        n.data.kindId === 'event_on_start' ||
        n.data.label === 'On Start' ||
        n.data.category === 'Events'
    );
    if (standardNodes.length > 0 && !hasEntry) {
      messages.push({
        level: 'warning',
        message: 'Main graph has no event entry node (On Start / Events)',
        tabId: 'main',
        source: 'structural',
      });
    }
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target || !isGraphNode(source) || !isGraphNode(target)) continue;

    const types = edgePinTypes(source, target, edge.sourceHandle, edge.targetHandle);
    if (!types) {
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

    if (!pinsAreCompatible(types.sourceType, types.targetType)) {
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
        level: 'warning',
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

function resolveNodeKindId(data: GraphDocument['nodes'][number]['data']): string {
  if (typeof data.kindId === 'string' && data.kindId) return data.kindId;
  if (data.label.startsWith('Dispatch ')) return 'event_dispatch';
  if (data.label.startsWith('Emit ')) return 'event_emit';
  if (data.label.startsWith('Subscribe ')) return 'event_subscribe';
  if (data.label === 'Wait') return 'action_wait';
  if (data.label === 'Await Wait') return 'action_await_wait';
  return data.kindId ?? '';
}

function functionIsAsync(func: FunctionSymbol, doc: GraphDocument): boolean {
  if (func.flags?.async) return true;
  return doc.nodes.some(
    (n) => n.type === 'vvs_standard_node' && resolveNodeKindId(n.data) === 'action_await_wait'
  );
}

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
        messages.push({
          level: 'warning',
          message: `Blocking wait may not behave correctly on target "${input.targetLanguage}"`,
          tabId,
          nodeId: node.id,
          source: 'semantic',
          code: 'BLOCKING_WAIT_ON_TARGET',
        });
        if (inFunctionContext && inAsyncFunction) {
          messages.push({
            level: 'error',
            message: 'Blocking wait cannot be used inside an async function',
            tabId,
            nodeId: node.id,
            source: 'semantic',
            code: 'WAIT_IN_SYNC_FUNCTION',
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
  events: { id: string; name: string }[]
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
        level: 'warning',
        message: `Multiple handlers for the same event require a Subscribe node (event: ${eventId})`,
        tabId: info.tabId,
        nodeId: info.nodeId,
        source: 'semantic',
        code: 'MULTICAST_REQUIRES_SUBSCRIBE',
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

export function analyzeProject(input: AnalyzeProjectInput): AnalysisResult {
  const diagnostics: Diagnostic[] = [];

  for (const [tabId, doc] of Object.entries(input.documents)) {
    diagnostics.push(...validateDocument(tabId, doc));
  }

  diagnostics.push(...validateSemantics(input));
  diagnostics.push(...validateVariableSemantics(input));
  diagnostics.push(...validateTextShapedFidelity(input));
  diagnostics.push(...validateUnresolvedSymbolRefs(input));
  diagnostics.push(...validateWaitAndAsyncNodes(input));
  diagnostics.push(...validateMulticastEvents(input));
  diagnostics.push(...validateEnvironmentSemantics(input));

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
