import type { GraphDocument, TargetLanguage } from '@vvs/graph-types';
import { gateIsValidated, type CapabilityRecord } from './bidirectional';

export interface ExportRequirement { nodeId: string; tabId: string; construct: string; variant: string }
export interface ExportTargetDecision {
  target: TargetLanguage; profileId: string; environment: string;
  status: 'validated' | 'blocked' | 'unvalidated';
  blockers: { nodeId: string; tabId: string; construct: string; variant: string; code: string }[];
}
/** Every emitting node and semantic property contributes; absent inventory never passes. */
export function collectExportRequirements(documents: Record<string, GraphDocument>): ExportRequirement[] {
  const requirements: ExportRequirement[] = [];
  for (const [tabId, doc] of Object.entries(documents)) for (const node of doc.nodes) {
    if (['vvs_comment_node', 'vvs_reroute_node'].includes(node.type) || node.data.kindId === 'function_entry') continue;
    const kind = node.data.kindId ?? 'unknown';
    if (kind === 'function_define' && node.data.properties?.symbolId && !node.data.properties?.isAbstract && Object.values(documents).some(document => document.nodes.some(other => other.data.kindId === 'function_implement' && other.data.properties?.symbolId === node.data.properties?.symbolId && other.data.properties?.overloadId === node.data.properties?.overloadId))) continue;
    requirements.push({ tabId, nodeId: node.id, construct: kind, variant: 'base' });
    for (const [pin, value] of Object.entries(node.data.inlineValues ?? {})) {
      requirements.push({ tabId, nodeId: node.id, construct: `${kind}.literal.${pin}`, variant: JSON.stringify(value) });
    }
    for (const pin of [...node.data.inputs, ...node.data.outputs]) {
      if (pin.type !== 'execution') requirements.push({ tabId, nodeId: node.id, construct: `${kind}.pin.${pin.id}`, variant: JSON.stringify({ type: pin.type, typeRef: pin.typeRef }) });
    }
    for (const [key, value] of Object.entries(node.data.properties ?? {})) {
      if (['sourceOrigin', 'sourceImport', 'symbolId', 'classId', 'functionId', 'overloadId', 'name'].includes(key) || value === false || value === '' || value == null) continue;
      requirements.push({ tabId, nodeId: node.id, construct: `${kind}.${key}`, variant: JSON.stringify(value) });
    }
  }
  return requirements;
}
/** Diagnostic-only preflight: the COA export flag remains off until an exporter consumes this. */
export function preflightExport(documents: Record<string, GraphDocument>, targets: readonly { target: TargetLanguage; profileId: string; profileVersion: number; sourceMode: string; environment: string }[], evidence: readonly CapabilityRecord[]): { portable: boolean; decisions: ExportTargetDecision[] } {
  const requirements = collectExportRequirements(documents);
  const decisions = targets.map(context => {
    const blockers: ExportTargetDecision['blockers'] = [];
    let blocked = false;
    if (!requirements.length) blockers.push({ nodeId: '', tabId: '', construct: 'unit', variant: 'empty', code: 'UNIT_REQUIREMENTS_MISSING' });
    for (const requirement of requirements) {
      if (context.target === 'verse' && requirement.construct === 'action_get_input') {
        blocked = true; blockers.push({ ...requirement, code: 'INPUT_PLACEHOLDER_UNSUPPORTED' }); continue;
      }
      const records = evidence.filter(record => record.key.construct === requirement.construct && record.key.variant === requirement.variant && record.key.profileId === context.profileId && record.key.profileVersion === context.profileVersion && record.key.sourceMode === context.sourceMode && record.key.environment === context.environment && record.key.graphSchemaVersion === 3);
      if (records.length !== 1) { blockers.push({ ...requirement, code: records.length ? 'EVIDENCE_AMBIGUOUS' : 'CAPABILITY_UNVALIDATED' }); continue; }
      const record = records[0];
      if (['unsupported', 'blocked'].includes(record.gates.forward.state)) { blocked = true; blockers.push({ ...requirement, code: 'CAPABILITY_UNSUPPORTED' }); }
      else if (!(['forward', 'syntax', 'types', 'behavior', 'fidelity', 'persistence'] as const).every(gate => gateIsValidated(record, gate))) blockers.push({ ...requirement, code: 'EVIDENCE_MISSING_OR_STALE' });
    }
    return { target: context.target, profileId: context.profileId, environment: context.environment, status: blocked ? 'blocked' as const : blockers.length ? 'unvalidated' as const : 'validated' as const, blockers };
  });
  return { portable: decisions.length > 0 && decisions.every(decision => decision.status === 'validated'), decisions };
}
