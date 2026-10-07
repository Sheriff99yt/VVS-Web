import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import plan from '../planning/coverage-plan.json';
import { buildCoverageLedger, validateCoveragePlan } from './coverageLedger';
import { IMPORT_EXPANSION_CORPUS } from './expansionCorpus';

const feedback = JSON.parse(readFileSync(join(import.meta.dir, '../../../docs/design/reverse_import_feedback.json'), 'utf8')).rows;

test('coverage includes every language and corpus case without promoting research or guards', () => {
  const report = buildCoverageLedger(feedback);
  expect(report.summary.languages).toBe(8);
  expect(report.summary.coverageRows).toBe(report.summary.languages * report.summary.featureFamilies);
  expect(report.cases.map(row => row.id)).toEqual(IMPORT_EXPANSION_CORPUS.map(row => row.id));
  expect(report.summary.supportedExamples + report.summary.featureGaps + report.summary.safetyGuards + report.summary.contextDependencies).toBe(report.summary.examples);
  expect(report.completionPercentage).toBeNull();
  for (const row of report.rows.filter(row => !['javascript', 'python'].includes(row.language))) {
    expect(['unimplemented', 'deferred']).toContain(row.status);
    expect(row.checks.sameLanguageRoundTrip).toBe('unverified');
  }
  expect(report.cases.find(row => row.id === 'js-early-return')!.featureIds).toContain('dynamic-operators'); // This rejection is truthiness, not missing early return.
  expect(report.cases.find(row => row.id === 'js-module')!.status).toBe('context-dependency');
});

test('stale source, unsupported feature evidence and incomplete inventories block reports', () => {
  const stale = structuredClone(feedback); stale[0].source += 'changed';
  expect(() => buildCoverageLedger(stale)).toThrow('Stale feedback');
  const missing = structuredClone(plan); missing.gapInventory.pop();
  expect(() => validateCoveragePlan(missing, IMPORT_EXPANSION_CORPUS)).toThrow('Gap inventory drift');
  const unsupported = structuredClone(plan); unsupported.features[0].exampleIds.push('js-dynamic-condition');
  expect(() => validateCoveragePlan(unsupported, IMPORT_EXPANSION_CORPUS)).toThrow('supported corpus example');
  const profiles = structuredClone(plan); profiles.profiles.pop();
  expect(() => validateCoveragePlan(profiles, IMPORT_EXPANSION_CORPUS)).toThrow('eight language profiles');
});

test('forged adapter claims, weakened guards and cyclic batch dependencies are rejected', () => {
  const adapter = structuredClone(plan); const csharp = adapter.profiles.find(profile => profile.language === 'csharp')!; csharp.adapterStatus = 'implemented-subset'; csharp.verification = 'native-csharp-preflight';
  expect(() => validateCoveragePlan(adapter, IMPORT_EXPANSION_CORPUS)).toThrow('research');
  const guards = structuredClone(plan); guards.gapInventory.find(gap => gap.kind === 'safety-guard')!.readiness = 'implementation-ready';
  expect(() => validateCoveragePlan(guards, IMPORT_EXPANSION_CORPUS)).toThrow('Safety guards');
  const cycle = structuredClone(plan); cycle.batches[0].dependsOn.push('MP-07');
  expect(() => validateCoveragePlan(cycle, IMPORT_EXPANSION_CORPUS)).toThrow('dependency cycle');
});

test('native scalar adapter claims require the verified profile and lifecycle packet', () => {
  for (const language of ['cpp', 'rust', 'gdscript']) {
    const missing = structuredClone(plan);
    const profile = missing.profiles.find(item => item.language === language)!;
    expect(profile.adapterStatus).toBe('implemented-subset');
    profile.verification = 'native-syntax-inventory-only';
    expect(() => validateCoveragePlan(missing, IMPORT_EXPANSION_CORPUS)).toThrow('research');
    const wrongVersion = structuredClone(plan);
    wrongVersion.profiles.find(item => item.language === language)!.languageVersion = 'unverified-version';
    expect(() => validateCoveragePlan(wrongVersion, IMPORT_EXPANSION_CORPUS)).toThrow('research');
  }
});
