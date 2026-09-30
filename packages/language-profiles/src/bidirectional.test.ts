import { expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { BIDIRECTIONAL_CAPABILITY_LEDGER, EVIDENCE_GATES, LANGUAGE_ADAPTER_REGISTRY, LanguageAdapterRegistry, capabilityKey, missingCapabilityEvidence, type CapabilityRecord, type EvidenceCertificate } from './bidirectional';
import { assessTranslation } from './translationCompatibility';

function certified(profileId: string): CapabilityRecord {
  const key = { construct: 'return', variant: 'boolean.literal', profileId, profileVersion: 1, sourceMode: 'module', environment: 'none', graphSchemaVersion: 3, mappingVersion: 1 };
  const certificate: EvidenceCertificate = { positiveFixtures: ['positive'], negativeFixtures: ['negative'], expectations: ['handwritten'],
    toolchain: { id: 'test-only', version: '1', configuration: 'bounded trusted fixture' }, revision: 'a'.repeat(40), profileVersion: 1, graphSchemaVersion: 3, mappingVersion: 1 };
  return { key, gates: Object.fromEntries(EVIDENCE_GATES.map(gate => [gate, { state: 'validated', reason: 'test-only evidence', certificate }])) as CapabilityRecord['gates'] };
}
test('all eight targets are registered without claiming uncertified import coverage', () => {
  const languages = LANGUAGE_ADAPTER_REGISTRY.list().map(profile => profile.language).sort();
  expect(languages).toEqual(['cpp', 'csharp', 'gdscript', 'go', 'javascript', 'python', 'rust', 'verse']);
  expect(BIDIRECTIONAL_CAPABILITY_LEDGER).toHaveLength(112);
  expect(new Set(BIDIRECTIONAL_CAPABILITY_LEDGER.map(record => capabilityKey(record.key))).size).toBe(112);
  const seeds = readdirSync(new URL('../../syntax-packs/rosetta/', import.meta.url)).filter(name => name.endsWith('.fixture.json')).map(name => name.replace('.fixture.json', '')).sort();
  for (const profile of LANGUAGE_ADAPTER_REGISTRY.list()) {
    const records = BIDIRECTIONAL_CAPABILITY_LEDGER.filter(record => record.key.profileId === profile.id);
    expect(records.map(record => record.key.construct).sort()).toEqual(seeds);
    for (const record of records) expect(missingCapabilityEvidence(record)).toEqual(EVIDENCE_GATES);
  }
});
test('a future language registers without central dispatch and duplicate/invalid admission fails', () => {
  const registry = new LanguageAdapterRegistry();
  const profile = { ...LANGUAGE_ADAPTER_REGISTRY.list()[0], id: 'future.v1', language: 'future' };
  registry.register(profile);
  expect(registry.get('future.v1')?.language).toBe('future');
  expect(() => registry.register(profile)).toThrow('PROFILE_DUPLICATE');
  expect(() => registry.register({ ...profile, id: 'bad', sourceModes: [] })).toThrow('PROFILE_INVALID');
  expect(Object.isFrozen(registry.get('future.v1')?.sourceModes)).toBe(true);
});
test('validated labels require complete evidence and invalidate on semantic versions', () => {
  const record = certified('javascript.es2022');
  expect(missingCapabilityEvidence(record)).toEqual([]);
  for (const field of ['profileVersion', 'graphSchemaVersion', 'mappingVersion'] as const) {
    expect(missingCapabilityEvidence({ ...record, key: { ...record.key, [field]: 2 } })).toEqual(EVIDENCE_GATES);
  }
  record.gates.syntax = { state: 'validated', reason: 'a label is insufficient' };
  expect(missingCapabilityEvidence(record)).toEqual(['syntax']);
  record.gates.syntax = { state: 'not-applicable', reason: 'skip is not evidence' };
  expect(missingCapabilityEvidence(record)).toEqual(['syntax']);
});
test('all 56 ordered pairs fail closed with the real uncertified inventory', () => {
  let pairs = 0;
  for (const source of LANGUAGE_ADAPTER_REGISTRY.list()) for (const target of LANGUAGE_ADAPTER_REGISTRY.list()) {
    if (source.id === target.id) continue;
    const from = BIDIRECTIONAL_CAPABILITY_LEDGER.find(record => record.key.profileId === source.id)!;
    const to = BIDIRECTIONAL_CAPABILITY_LEDGER.find(record => record.key.profileId === target.id)!;
    expect(assessTranslation([{ source: from, destination: to, sourceSemantics: 'host.console.v1', destinationSemantics: 'host.console.v1', nodeIds: ['print'], spans: [{ start: 0, end: 1 }] }]).status).toBe('blocked');
    pairs++;
  }
  expect(pairs).toBe(56);
});
test('semantic mismatch, missing evidence and dependencies cannot yield compatibility', () => {
  const source = certified('javascript.es2022'), destination = certified('python.3.12');
  const requirement = { source, destination, sourceSemantics: 'boolean.literal.v1', destinationSemantics: 'boolean.literal.v1', nodeIds: ['return'], spans: [{ start: 0, end: 4 }] };
  expect(assessTranslation([requirement]).status).toBe('compatible');
  expect(assessTranslation([{ ...requirement, destinationSemantics: 'integer.unbounded.v1' }]).status).toBe('blocked');
  expect(assessTranslation([{ ...requirement, destinationSemantics: 'other', visibleAdaptation: { id: 'convert', graphNodeIds: [], evidence: certified('adaptation') } }]).status).toBe('blocked');
  expect(assessTranslation([{ ...requirement, destinationSemantics: 'other', visibleAdaptation: { id: 'convert', graphNodeIds: ['conversion'], evidence: certified('adaptation') } }]).status).toBe('requires-visible-adaptation');
  expect(assessTranslation([requirement, { ...requirement, destination: undefined, nodeIds: ['import'] }]).status).toBe('blocked');
  destination.gates.behavior = { state: 'implemented-unvalidated', reason: 'native validator unavailable' };
  expect(assessTranslation([requirement]).status).toBe('unvalidated');
  expect(assessTranslation([]).status).toBe('unvalidated');
});
test('certification infrastructure does not import parsing or generation implementations', () => {
  for (const name of ['bidirectional.ts', 'translationCompatibility.ts']) {
    expect(readFileSync(new URL(name, import.meta.url), 'utf8')).not.toMatch(/from ['"].*(source-import|transpiler|syntax-packs|react|next)/);
  }
});
