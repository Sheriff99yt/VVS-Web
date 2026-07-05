import type { AnalysisResult, Diagnostic } from './diagnostic';
import type { GraphDocument, FunctionSymbol, GraphVariable, TargetLanguage } from './symbols';
import { collectPortabilityFeatures } from './symbols';

export interface AnalyzeProjectInput {
  documents: Record<string, GraphDocument>;
  functions: FunctionSymbol[];
  events: { id: string; name: string }[];
  variables?: GraphVariable[];
  projectDetails: { extendsType: string };
  targetLanguage: TargetLanguage;
  portabilityDiagnostics?: Diagnostic[];
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

function validateVariableSemantics(input: AnalyzeProjectInput): Diagnostic[] {
  const messages: Diagnostic[] = [];
  const variables = input.variables ?? [];
  const readonlyNames = new Set(variables.filter((v) => v.readonly).map((v) => v.name));

  if (readonlyNames.size === 0) return messages;

  for (const [tabId, doc] of Object.entries(input.documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      const kindId = node.data.kindId ?? '';
      const isSet =
        kindId === 'variable_set' ||
        (node.data.label.startsWith('Set ') && node.data.category === 'Variables');
      if (!isSet) continue;

      const varName =
        (typeof node.data.properties?.variableName === 'string'
          ? node.data.properties.variableName
          : undefined) ??
        (node.data.label.startsWith('Set ') ? node.data.label.slice(4).trim() : '');
      if (varName && readonlyNames.has(varName)) {
        messages.push({
          level: 'warning',
          message: `Set node writes to readonly variable "${varName}"`,
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

export function analyzeProject(input: AnalyzeProjectInput): AnalysisResult {
  const diagnostics: Diagnostic[] = [];

  for (const [tabId, doc] of Object.entries(input.documents)) {
    diagnostics.push(...validateDocument(tabId, doc));
  }

  diagnostics.push(...validateSemantics(input));
  diagnostics.push(...validateVariableSemantics(input));

  if (input.portabilityDiagnostics) {
    diagnostics.push(...input.portabilityDiagnostics);
  }

  return {
    ok: !diagnostics.some((d) => d.level === 'error'),
    diagnostics,
  };
}

export function snapshotFeaturesForPortability(snapshot: {
  projectDetails: { extendsType: string };
  functions: FunctionSymbol[];
}): ReturnType<typeof collectPortabilityFeatures> {
  return collectPortabilityFeatures(snapshot);
}
