import { EVIDENCE_GATES, gateIsValidated, type CapabilityRecord, type EvidenceGate } from './bidirectional';

export interface TranslationRequirement {
  source: CapabilityRecord; destination?: CapabilityRecord;
  nodeIds: readonly string[]; spans: readonly { start: number; end: number }[];
  /** Versioned semantic contract, e.g. numeric.binary64.add.v1, never a node title. */
  sourceSemantics: string; destinationSemantics?: string;
  visibleAdaptation?: { id: string; graphNodeIds: readonly string[]; evidence: CapabilityRecord };
}
export interface TranslationDecision {
  status: 'compatible' | 'requires-visible-adaptation' | 'blocked' | 'unvalidated';
  reasons: readonly { code: string; nodeIds: readonly string[]; spans: readonly { start: number; end: number }[] }[];
}
/** Whole-unit requirements include dependency/environment records, not just expression nodes. */
export function assessTranslation(requirements: readonly TranslationRequirement[]): TranslationDecision {
  const reasons: TranslationDecision['reasons'][number][] = [];
  let blocked = false, unvalidated = false, adaptation = false;
  if (!requirements.length) return { status: 'unvalidated', reasons: [{ code: 'UNIT_REQUIREMENTS_MISSING', nodeIds: [], spans: [] }] };
  for (const requirement of requirements) {
    const { source, destination } = requirement;
    const reason = (code: string) => reasons.push({ code, nodeIds: requirement.nodeIds, spans: requirement.spans });
    if (!destination || ['forward', 'translation'].some(gate => ['blocked', 'unsupported'].includes(destination.gates[gate as 'forward' | 'translation'].state))) {
      blocked = true; reason('DESTINATION_CAPABILITY_BLOCKED'); continue;
    }
    if (source.key.construct !== destination.key.construct || source.key.variant !== destination.key.variant || source.key.graphSchemaVersion !== destination.key.graphSchemaVersion || source.key.environment !== destination.key.environment) {
      blocked = true; reason('CAPABILITY_CONTEXT_MISMATCH'); continue;
    }
    if (!requirement.sourceSemantics || requirement.sourceSemantics !== requirement.destinationSemantics) {
      const change = requirement.visibleAdaptation;
      if (!change || !change.id.trim() || !change.graphNodeIds.length || change.evidence.key.graphSchemaVersion !== source.key.graphSchemaVersion || !EVIDENCE_GATES.every(gate => gateIsValidated(change.evidence, gate))) {
        blocked = true; reason('SEMANTIC_ADAPTATION_REQUIRED'); continue;
      }
      adaptation = true; reason('VISIBLE_ADAPTATION_REQUIRES_REVIEW');
    }
    const sourceGates: EvidenceGate[] = ['reverse', 'syntax', 'types', 'behavior', 'persistence', 'fidelity'];
    const destinationGates: EvidenceGate[] = ['forward', 'syntax', 'types', 'behavior', 'persistence', 'fidelity', 'translation'];
    if (!sourceGates.every(gate => gateIsValidated(source, gate)) || !destinationGates.every(gate => gateIsValidated(destination, gate))) {
      unvalidated = true; reason('INDEPENDENT_EVIDENCE_MISSING_OR_STALE');
    }
  }
  return { status: blocked ? 'blocked' : unvalidated ? 'unvalidated' : adaptation ? 'requires-visible-adaptation' : 'compatible', reasons };
}
