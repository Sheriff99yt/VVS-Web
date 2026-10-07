import coveragePlan from '../planning/coverage-plan.json';
import { IMPORT_EXPANSION_CORPUS, type ImportExample } from './expansionCorpus';

export const COVERAGE_LANGUAGES = ['javascript', 'python', 'csharp', 'go', 'gdscript', 'rust', 'cpp', 'verse'] as const;
export type CoveragePlan = typeof coveragePlan;
export interface CoverageFeedback {
  id: string; language: string; status: string; source: string; diagnostic: string;
}

/** Planning/evidence inventory only. It cannot enable a source adapter or relax acceptance. */
export function validateCoveragePlan(plan: CoveragePlan, examples: readonly ImportExample[]): void {
  const fail = (message: string): never => { throw new Error(`COVERAGE_LEDGER: ${message}`); };
  if (plan.version !== 1) fail('Unsupported ledger version');
  const unique = (values: string[], label: string) => {
    if (values.some(value => !value.trim()) || new Set(values).size !== values.length) fail(`Duplicate or empty ${label}`);
  };
  unique(plan.profiles.map(profile => profile.language), 'language');
  unique(plan.profiles.map(profile => profile.profileId), 'profile');
  if (plan.profiles.length !== COVERAGE_LANGUAGES.length || COVERAGE_LANGUAGES.some(language => !plan.profiles.some(profile => profile.language === language))) fail('All eight language profiles are required');
  for (const profile of plan.profiles) {
    if (!['implemented-subset', 'researched', 'deferred'].includes(profile.adapterStatus)) fail('Invalid adapter status');
    const verifiedGoSubset = profile.language === 'go' && profile.verification === 'native-go-unit-tests' && profile.parserCandidate.includes('0.25.0') && profile.parserCandidate.includes('0.27.0') && profile.validatorCandidate.includes('1.26.4');
    const verifiedCSharpSubset = profile.language === 'csharp' && profile.languageVersion === '12' && profile.parserCandidate.includes('0.23.5') && profile.parserCandidate.includes('0.27.0') && profile.validatorCandidate.includes('9.0.310') && profile.verification.includes('production-and-Pages-browser-import-acceptance-and-reimport');
    const scalarPins = {
      cpp: { version: 'C++17', grammar: '0.23.4', compiler: '19.1.5' },
      rust: { version: 'edition-2021', grammar: '0.24.0', compiler: '1.99.0' },
      gdscript: { version: 'Godot 4.5.2', grammar: '6.1.0', compiler: '4.5.2' },
    };
    const scalarPin = scalarPins[profile.language as keyof typeof scalarPins];
    const verifiedScalarSubset = scalarPin && profile.languageVersion === scalarPin.version
      && profile.parserCandidate.includes(scalarPin.grammar) && profile.parserCandidate.includes('0.27.0')
      && profile.validatorCandidate.includes(scalarPin.compiler)
      && profile.verification === 'native-scalar-library-source-graphs21; sealed-acceptance; production-and-Pages-browser-import-acceptance-and-reimport';
    if (profile.adapterStatus === 'implemented-subset' && !['javascript', 'python'].includes(profile.language) && !verifiedGoSubset && !verifiedCSharpSubset && !verifiedScalarSubset) fail('New language cannot claim an implemented adapter from research');
    if (!profile.languageVersion || !profile.parserCandidate || !profile.validatorCandidate || !profile.researchSources.length || !profile.pinRequirements.length || !profile.blockers.length) fail(`Incomplete research profile ${profile.language}`);
    if (profile.researchSources.some(source => !source.startsWith('https://'))) fail('Research sources must be HTTPS');
  }
  const byExample = new Map(examples.map(example => [example.id, example]));
  unique(examples.map(example => example.id), 'corpus example');
  unique(plan.features.map(feature => feature.id), 'feature');
  unique(plan.batches.map(batch => batch.id), 'batch');
  const batchIds = new Set(plan.batches.map(batch => batch.id));
  const features = new Set(plan.features.map(feature => feature.id));
  for (const feature of plan.features) {
    if (!batchIds.has(feature.batch) && feature.batch !== 'MP-14') fail(`Unknown feature batch ${feature.batch}`);
    if (!feature.roadmapId.startsWith('u93-') || !feature.irContract || !feature.bindingRules || !feature.prerequisites.length) fail(`Incomplete feature contract ${feature.id}`);
    for (const id of feature.exampleIds) if (byExample.get(id)?.expected !== 'supported') fail(`Feature evidence must reference a supported corpus example: ${id}`);
  }
  unique(plan.gapInventory.map(gap => gap.exampleId), 'gap example');
  const gaps = new Map(plan.gapInventory.map(gap => [gap.exampleId, gap]));
  for (const example of examples) if ((example.expected === 'gap') !== gaps.has(example.id)) fail(`Gap inventory drift: ${example.id}`);
  for (const gap of plan.gapInventory) {
    if (!features.has(gap.featureId) || !gap.resolution) fail(`Missing gap contract ${gap.exampleId}`);
    if (!['safety-guard', 'context-dependency', 'feature-gap'].includes(gap.kind)) fail(`Invalid gap category ${gap.exampleId}`);
    if (gap.kind === 'safety-guard' && gap.readiness !== 'retain-guard') fail('Safety guards cannot be counted as implementation-ready features');
  }
  const complete = new Set<string>(), active = new Set<string>();
  const visit = (id: string): void => {
    if (active.has(id)) fail(`Batch dependency cycle: ${id}`);
    if (complete.has(id)) return;
    const batch = plan.batches.find(batch => batch.id === id);
    if (!batch) fail(`Unknown batch dependency ${id}`);
    active.add(id);
    for (const dependency of batch!.dependsOn) visit(dependency);
    active.delete(id); complete.add(id);
  };
  for (const batch of plan.batches) {
    if (!batch.fixturePlans.length || !batch.acceptance) fail(`Missing batch acceptance ${batch.id}`);
    visit(batch.id);
  }
  unique(plan.boundaries.map(boundary => boundary.id), 'boundary');
  for (const boundary of plan.boundaries) if (!features.has(boundary.featureId) || !boundary.evidence || !boundary.reproducer || !boundary.acceptance) fail(`Incomplete boundary ${boundary.id}`);
}

export function buildCoverageLedger(feedback: readonly CoverageFeedback[], plan: CoveragePlan = coveragePlan, examples: readonly ImportExample[] = IMPORT_EXPANSION_CORPUS) {
  validateCoveragePlan(plan, examples);
  const byFeedback = new Map(feedback.map(row => [row.id, row]));
  if (byFeedback.size !== feedback.length || feedback.length !== examples.length) throw new Error('COVERAGE_LEDGER: Feedback inventory mismatch');
  for (const example of examples) {
    const row = byFeedback.get(example.id);
    if (!row || row.status !== example.expected || row.language !== example.language || row.source !== example.source) throw new Error(`COVERAGE_LEDGER: Stale feedback ${example.id}`);
  }
  const cases = examples.map(example => {
    const gap = plan.gapInventory.find(gap => gap.exampleId === example.id);
    const profile = plan.profiles.find(profile => profile.language === example.language)!;
    const fallbackFeature = ({ 'u93-scoped-locals': 'locals', 'u93-resolved-calls': 'callables', 'u93-control-flow': 'branches', 'u93-class-semantics': 'classes', 'u93-module-projects': 'modules', 'u93-trivia-reimport': 'comments' } as Record<string, string>)[example.roadmapId];
    const featureIds = gap ? [gap.featureId] : plan.features.filter(feature => feature.exampleIds.includes(example.id)).map(feature => feature.id);
    if (!featureIds.length && fallbackFeature) featureIds.push(fallbackFeature);
    if (!featureIds.length) throw new Error(`COVERAGE_LEDGER: Unmapped corpus example ${example.id}`);
    return {
      ...example, profileId: profile.profileId, languageVersion: profile.languageVersion,
      context: 'library', status: example.expected === 'supported' ? 'test-backed-example' : gap!.kind,
      featureIds,
      diagnostic: byFeedback.get(example.id)!.diagnostic,
      evidence: ['packages/source-import/src/expansion.test.ts', 'apps/web/src/lib/sourceImportExpansion.test.ts'],
      nativeValidator: profile.validatorCandidate,
      ...(gap ? { readiness: gap.readiness, resolution: gap.resolution } : {}),
    };
  });
  const rows = plan.profiles.flatMap(profile => plan.features.map(feature => {
    const evidence = cases.filter(example => example.language === profile.language && example.expected === 'supported' && example.featureIds.includes(feature.id));
    const projectEvidence = ['javascript', 'python'].includes(profile.language) ? feature.id === 'reimport' ? ['packages/source-import/src/reimportContext.test.ts'] : ['scalar-values', 'numeric-domains', 'collections', 'indexing', 'dynamic-operators'].includes(feature.id) ? ['packages/source-import/src/nativeValues.test.ts'] : [] : [];
    return {
      id: `${profile.profileId}/${feature.id}`, featureId: feature.id, profileId: profile.profileId,
      language: profile.language, languageVersion: profile.languageVersion, versionStatus: profile.versionStatus,
      contexts: projectEvidence.length ? (feature.id === 'reimport' && profile.language === 'javascript' ? ['library-single-file', 'closed-flat-module-set'] : ['library-single-file']) : evidence.length ? ['library'] : ['planned-native-compilation-unit'],
      status: profile.adapterStatus === 'deferred' ? 'deferred' : evidence.length || projectEvidence.length ? 'implemented-subset' : 'unimplemented',
      researchStatus: profile.adapterStatus === 'implemented-subset' ? 'existing-adapter' : profile.adapterStatus,
      grammarConstruct: feature.grammarConstruct, roadmapId: feature.roadmapId, batch: feature.batch,
      visualNodes: feature.visualNodes, irContract: feature.irContract, bindingRules: feature.bindingRules,
      adapterBatch: profile.adapterBatch, adapterPrerequisites: profile.blockers, parser: profile.parserCandidate, validator: profile.validatorCandidate,
      exampleIds: evidence.map(example => example.id), projectEvidence, prerequisites: feature.prerequisites,
      checks: { parseInventory: evidence.length ? 'test-backed-example' : 'unverified', visualEditing: 'unverified-per-feature', sameLanguageRoundTrip: evidence.length || (projectEvidence.length && feature.id !== 'reimport') ? 'test-backed-example' : 'unverified', persistence: evidence.length || (projectEvidence.length && feature.id !== 'reimport') ? 'test-backed-example' : 'unverified', projectIntegration: 'unverified-for-full-profile', reimport: 'unverified-per-feature', crossLanguageTranslation: 'unverified' },
    };
  }));
  return {
    version: 1, researchDate: plan.researchDate,
    claim: 'Seed feature inventory, not exhaustive grammar coverage; examples and broad feature rows are different denominators. Research never enables acceptance.',
    completionPercentage: null,
    summary: { languages: plan.profiles.length, featureFamilies: plan.features.length, coverageRows: rows.length, implementedSubsetRows: rows.filter(row => row.status === 'implemented-subset').length, unimplementedRows: rows.filter(row => row.status === 'unimplemented').length, deferredRows: rows.filter(row => row.status === 'deferred').length, examples: cases.length, supportedExamples: cases.filter(row => row.expected === 'supported').length, featureGaps: cases.filter(row => row.status === 'feature-gap').length, safetyGuards: cases.filter(row => row.status === 'safety-guard').length, contextDependencies: cases.filter(row => row.status === 'context-dependency').length },
    profiles: plan.profiles, rows, cases, boundaries: plan.boundaries, orderedBatches: plan.batches,
    projectEvidence: [
      { featureId: 'modules', language: 'javascript', scope: 'Closed named-import/export flat file sets', evidence: 'packages/source-import/src/followupBatches.test.ts', status: 'test-backed-subset' },
      { featureId: 'reimport', language: 'javascript', scope: 'File-level conflicts, stale settings and retained context through worker/Code-panel/browser save/load, including closed modules', evidence: 'packages/source-import/src/reimportContext.test.ts', status: 'test-backed-subset; broader targeted merges remain open' },
      { featureId: 'reimport', language: 'python', scope: 'Library single-file conflicts, stale settings and retained project context through normalized save/load', evidence: 'packages/source-import/src/reimportContext.test.ts', status: 'test-backed-subset; broader targeted merges remain open' },
    ],
  };
}
