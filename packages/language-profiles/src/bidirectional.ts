/** Certification contracts are separate from the generator's portability policy. */
export type EvidenceState = 'planned' | 'blocked' | 'implemented-unvalidated' | 'validated' | 'not-applicable' | 'unsupported';
export type EvidenceGate = 'forward' | 'reverse' | 'syntax' | 'types' | 'behavior' | 'persistence' | 'fidelity' | 'translation';
export const EVIDENCE_GATES: readonly EvidenceGate[] = Object.freeze(['forward', 'reverse', 'syntax', 'types', 'behavior', 'persistence', 'fidelity', 'translation']);
export interface LanguageAdapterProfile {
  id: string; version: number; language: string; grammar: string;
  extensions: readonly string[]; sourceModes: readonly string[]; environments: readonly string[];
  compilationUnits: readonly string[]; parser: { id: string; version: string } | null;
  toolchain: { id: string; version: string } | null;
  spanEncoding: 'utf16' | 'utf8' | 'codepoint';
  requiredGates: readonly EvidenceGate[];
  blocker: string;
}

/** Registry admission is explicit; extensions never select grammar semantics. */
export class LanguageAdapterRegistry {
  private readonly profiles = new Map<string, Readonly<LanguageAdapterProfile>>();
  register(profile: LanguageAdapterProfile): void {
    if (!profile.id.trim() || !profile.language.trim() || !profile.grammar.trim() || !Number.isSafeInteger(profile.version) || profile.version < 1)
      throw new Error('PROFILE_INVALID');
    if (this.profiles.has(profile.id)) throw new Error('PROFILE_DUPLICATE');
    for (const values of [profile.extensions, profile.sourceModes, profile.environments, profile.compilationUnits, profile.requiredGates]) {
      if (!values.length || new Set(values).size !== values.length || values.some(value => !value.trim())) throw new Error('PROFILE_INVALID');
    }
    if (profile.requiredGates.some(gate => !EVIDENCE_GATES.includes(gate))) throw new Error('PROFILE_GATE_INVALID');
    for (const tool of [profile.parser, profile.toolchain]) if (tool && (!tool.id.trim() || !tool.version.trim())) throw new Error('PROFILE_PIN_INVALID');
    this.profiles.set(profile.id, Object.freeze({ ...profile,
      extensions: Object.freeze([...profile.extensions]), sourceModes: Object.freeze([...profile.sourceModes]),
      environments: Object.freeze([...profile.environments]), compilationUnits: Object.freeze([...profile.compilationUnits]),
      requiredGates: Object.freeze([...profile.requiredGates]),
      parser: profile.parser && Object.freeze({ ...profile.parser }), toolchain: profile.toolchain && Object.freeze({ ...profile.toolchain }),
    }));
  }
  get(id: string): Readonly<LanguageAdapterProfile> | undefined { return this.profiles.get(id); }
  list(): readonly Readonly<LanguageAdapterProfile>[] { return Object.freeze([...this.profiles.values()]); }
}

const proposed = (language: string, grammar: string, extensions: string[], sourceModes: string[], compilationUnits: string[], tool: string): LanguageAdapterProfile => ({
  id: `${language}.${grammar}`, version: 1, language, grammar, extensions, sourceModes,
  compilationUnits, environments: ['none'], parser: null, toolchain: null, spanEncoding: 'utf16',
  requiredGates: EVIDENCE_GATES, blocker: `Reverse adapter and pinned ${tool} evidence have not been admitted`,
});
export const LANGUAGE_ADAPTER_REGISTRY = new LanguageAdapterRegistry();
[
  { ...proposed('javascript', 'es2022', ['.js', '.mjs'], ['script', 'module'], ['file', 'class', 'function'], 'Acorn'),
    parser: { id: '@babel/parser', version: '7.29.9' }, blocker: 'Only the existing reviewed script/class subset is implemented; behavior and translation certification remain open' },
  { ...proposed('python', '3.11', ['.py'], ['module'], ['file', 'function'], 'CPython'), parser: { id: '@lezer/python', version: '1.1.18' }, toolchain: { id: 'CPython', version: '3.11.9' }, blocker: 'Only the bounded standalone Library-function pilot has parse/compile and persistence evidence; general import, behavior and translation certification remain open' },
  proposed('cpp', 'c++20', ['.cpp', '.h'], ['translation-unit'], ['file', 'class', 'function'], 'compiler frontend'),
  proposed('verse', 'environment-defined', ['.verse'], ['module'], ['module', 'class', 'function'], 'official Verse toolchain/environment'),
  proposed('gdscript', '4', ['.gd'], ['script'], ['file', 'class', 'function'], 'Godot'),
  proposed('rust', '2021', ['.rs'], ['crate', 'module'], ['crate', 'file', 'function'], 'rustc/cargo'),
  proposed('csharp', '12', ['.cs'], ['compilation-unit'], ['file', 'namespace', 'class', 'function'], 'Roslyn/references'),
  proposed('go', '1.22', ['.go'], ['package'], ['package', 'file', 'function'], 'Go parser/type checker'),
].forEach(profile => LANGUAGE_ADAPTER_REGISTRY.register(profile));

export interface CapabilityKey {
  construct: string; variant: string; profileId: string; profileVersion: number;
  sourceMode: string; environment: string; graphSchemaVersion: number; mappingVersion: number;
}
export interface EvidenceCertificate {
  positiveFixtures: readonly string[]; negativeFixtures: readonly string[]; expectations: readonly string[];
  toolchain: { id: string; version: string; configuration: string };
  revision: string; profileVersion: number; graphSchemaVersion: number; mappingVersion: number;
}
export interface GateEvidence { state: EvidenceState; reason: string; certificate?: EvidenceCertificate }
export interface CapabilityRecord { key: CapabilityKey; gates: Record<EvidenceGate, GateEvidence> }
export function capabilityKey(key: CapabilityKey): string {
  return JSON.stringify([key.construct, key.variant, key.profileId, key.profileVersion, key.sourceMode, key.environment, key.graphSchemaVersion, key.mappingVersion]);
}
export function certificateIsCurrent(key: CapabilityKey, certificate?: EvidenceCertificate): boolean {
  return !!certificate && certificate.profileVersion === key.profileVersion && certificate.graphSchemaVersion === key.graphSchemaVersion && certificate.mappingVersion === key.mappingVersion &&
    /^[0-9a-f]{40}$/.test(certificate.revision) && [certificate.positiveFixtures, certificate.negativeFixtures, certificate.expectations].every(values => values.length > 0 && values.every(value => value.trim().length > 0)) &&
    [certificate.toolchain.id, certificate.toolchain.version, certificate.toolchain.configuration].every(value => value.trim().length > 0);
}
export function gateIsValidated(record: CapabilityRecord, gate: EvidenceGate): boolean {
  return record.gates[gate].state === 'validated' && certificateIsCurrent(record.key, record.gates[gate].certificate);
}
/** Missing/stale evidence blocks certification. Generation support alone never admits import. */
export function missingCapabilityEvidence(record: CapabilityRecord, required: readonly EvidenceGate[] = EVIDENCE_GATES): EvidenceGate[] {
  return required.filter(gate => !gateIsValidated(record, gate));
}

export const ROSETTA_SEMANTIC_SEEDS = Object.freeze(['print', 'branch', 'assign', 'call', 'convert', 'dispatch', 'wait', 'for', 'while', 'switch', 'sequence', 'import_module', 'await_wait', 'call_native']);
/** Audit inventory, deliberately uncertified; body goldens do not establish full-file semantics. */
export const BIDIRECTIONAL_CAPABILITY_LEDGER: readonly CapabilityRecord[] = LANGUAGE_ADAPTER_REGISTRY.list().flatMap(profile =>
  ROSETTA_SEMANTIC_SEEDS.map(construct => ({
    key: { construct, variant: 'seed-requires-semantic-review', profileId: profile.id, profileVersion: profile.version,
      sourceMode: profile.sourceModes[0], environment: 'none', graphSchemaVersion: 3, mappingVersion: 1 },
    gates: Object.fromEntries(EVIDENCE_GATES.map(gate => [gate, {
      state: gate === 'forward' ? 'implemented-unvalidated' : 'blocked',
      reason: gate === 'forward' ? 'Existing body golden; complete compilation-unit evidence is required' : profile.blocker,
    }])) as Record<EvidenceGate, GateEvidence>,
  })));
