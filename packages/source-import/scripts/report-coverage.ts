import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import coveragePlan from '../planning/coverage-plan.json';
import { buildCoverageLedger } from '../src/coverageLedger';
import { resolve } from '@vvs/syntax-registry';
import { previewJavaScriptImport } from '../src/parser';
import { reviewSourceImportGraph, reviewSourceReimport, acceptSourceReimport, reviewSourceFileSet, acceptSourceFileSetReview, reviewNativeScalarImportGraph, acceptSourceImportReview } from '../src/validation';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { nativeScalarSourceFixtures } from '../test/nativeScalarSourceFixtures';
import { inventoryNativeValues } from '../src/nativeValues';
import { NATIVE_VALUE_CORPUS } from '../src/nativeValueCorpus';
import { GO_UNIT_FIXTURES, GO_UNIT_GAPS, GO_WORD_FIXTURES } from '../src/goUnitCorpus';
import { configureGoTestRuntime } from '../test/goRuntime';
import { previewGoImport } from '../src/go';

const root = join(import.meta.dir, '../../..');
const compilerPath = [join(root, 'apps/web/node_modules/typescript/bin/tsc'), join(root, 'node_modules/typescript/bin/tsc')].find(existsSync);
if (!compilerPath) throw new Error('Workspace TypeScript compiler is required for ledger verification');
const compiler = Bun.spawn(['bun', compilerPath, '--project', join(root, 'packages/source-import/tsconfig.coverage.json')], { stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Coverage ledger type check failed');
const feedback = JSON.parse(readFileSync(join(root, 'docs/design/reverse_import_feedback.json'), 'utf8'));
const report = buildCoverageLedger(feedback.rows);
for (const feature of coveragePlan.features) for (const kindId of feature.visualNodes) {
  if (kindId !== 'vvs_comment_node' && !resolve(kindId)) throw new Error(`Unknown visual evidence: ${feature.id}/${kindId}`);
}
for (const item of [...report.cases.flatMap(row => row.evidence), ...report.boundaries.map(row => row.evidence), ...report.projectEvidence.map(row => row.evidence)]) {
  if (!existsSync(join(root, item))) throw new Error(`Missing coverage evidence: ${item}`);
}
// Read-only probes against trusted handwritten input: generated target source is never executed.
const observations: { context: string; lostFields: string[]; status: string }[] = [];
for (const context of ['single-file', 'module-set']) {
  const source = 'function value() { return 1; }';
  const preview = await previewJavaScriptImport(source);
  const files = [{ fileName: 'main.js', source: 'import { value } from "./value.js"; export function main() { return value(); }' }, { fileName: 'value.js', source: 'export function value() { return 1; }' }];
  const current = context === 'single-file' ? reviewSourceImportGraph(preview, preview.regions[0], 'value.js', false, 'library').snapshot! : acceptSourceFileSetReview(await reviewSourceFileSet(files), files);
  if (!current) throw new Error('Re-import context probe could not establish a baseline');
  current.autoCompile = false;
  current.workspaceFiles = ['docs/README.md'];
  const replacement = context === 'single-file' ? 'function value() { return 2; }' : 'export function value() { return 2; }';
  const review = await reviewSourceReimport(current, replacement, 'value.js');
  if (review.diagnostics.length) throw new Error(`Re-import context probe failed to review: ${review.diagnostics.join('; ')}`);
  const accepted = acceptSourceReimport(review, current, replacement);
  const lostFields = (['autoCompile', 'workspaceFiles'] as const).filter(key => JSON.stringify(accepted[key]) !== JSON.stringify(current[key]));
  if (lostFields.length) throw new Error(`Re-import context retention regressed: ${context}/${lostFields.join(', ')}`);
  observations.push({ context, lostFields, status: 'retained-in-this-probe' });
}
const nativeValueProbes = [];
for (const example of NATIVE_VALUE_CORPUS) {
  const inventory = inventoryNativeValues(example.source, example.profile);
  const preview = await (example.profile === 'python.3.11' ? (await import('../src/python')).previewPythonImport : previewJavaScriptImport)(example.source);
  const candidate = preview.regions.find(region => region.kind === 'candidate');
  const complete = !preview.regions.some(region => region.kind === 'unresolved');
  const review = complete && candidate ? reviewSourceImportGraph(preview, candidate, `${example.id}.${example.profile === 'python.3.11' ? 'py' : 'js'}`, false, 'library') : undefined;
  if (!review?.snapshot || review.diagnostics.length) throw new Error(`Native visual mapping regression: ${example.id}: ${review?.diagnostics.join('; ')}`);
  const diagnostics = [...preview.diagnostics, ...preview.regions.flatMap(region => region.reason ? [region.reason] : []), ...review?.diagnostics ?? []];
  if (diagnostics.length) throw new Error(`Native value probe has unresolved source: ${example.id}`);
  nativeValueProbes.push({ id: example.id, featureIds: example.featureIds, roadmapId: example.featureIds.includes('dynamic-operators') ? 'u93-control-flow' : 'u93-scoped-locals', requirement: example.requirement, inventory, supportedRegions: preview.regions.filter(region => region.kind === 'candidate').map(region => ({ start: region.start, end: region.end })), unresolvedRegions: preview.regions.filter(region => region.kind === 'unresolved').map(region => ({ start: region.start, end: region.end, reason: region.reason })), visualImport: 'same-language-round-trip-tested', diagnostics });
}
// Native adapter stages have their own denominator; do not inflate the JS/Python corpus.
configureGoTestRuntime();
const nativeAdapterProbes = [];
for (const [index, { source, wordBits }] of [...GO_UNIT_FIXTURES.map(source => ({ source, wordBits: 64 as const })), ...GO_WORD_FIXTURES].entries()) {
  const preview = await previewGoImport(source, wordBits);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  if (!review.snapshot || review.diagnostics.length) throw new Error(`Go native unit regression: ${index}/${review.diagnostics.join('; ')}`);
  nativeAdapterProbes.push({ id: `go-native-unit-${index + 1}`, language: 'go', profile: 'go-1.26', wordBits, source, status: 'test-backed-library-unit', diagnostics: [], evidence: ['packages/source-import/src/go.test.ts', 'apps/web/src/lib/sourceImportGo.test.ts', 'packages/source-import/scripts/validate-go-native.ts', 'apps/web/scripts/verify-source-import-browser.py'] });
}
for (const gap of GO_UNIT_GAPS) {
  const preview = await previewGoImport(gap.source);
  const review = preview.regions[0].kind === 'candidate' ? reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library') : undefined;
  const diagnostics = review?.diagnostics ?? preview.diagnostics;
  if (review?.snapshot || !diagnostics.length) throw new Error(`Go gap inventory drift: ${gap.id}`);
  nativeAdapterProbes.push({ ...gap, language: 'go', profile: 'go-1.26', status: 'feature-gap', diagnostics, batch: 'MP-09', evidence: ['packages/source-import/src/go.test.ts'] });
}
const auditedReport = { ...report, contextProbes: observations, nativeValueProbes, nativeAdapterProbes, nativeAdapterSummary: { language: 'go', scope: 'Scalar single-file library units only', supportedFixtures: GO_UNIT_FIXTURES.length, reproducedFeatureGaps: GO_UNIT_GAPS.length, batch: 'MP-09', batchStatus: 'incomplete' }, completedPatch: { batch: 'MP-02b', scope: 'All four planned scope items: exact scalars; ordered collections/access; native operators/effects; round-trip, Code-panel, persistence, mutation and browser evidence', evidence: 'nativeValueProbes; nativeValues tests; target-scoped Rosetta; sourceImportExpansion Code-panel tests; browser-import' }, activePatch: { batch: 'MP-03', scope: 'Callable signatures and dependency closure', status: 'planned' }, readyNextPatch: { batch: 'MP-03', prerequisites: ['MP-02 native values'], scope: 'Callable signatures, default/rest arguments and receiver/dependency closure', evidence: 'nativeValueProbes; orderedBatches', remainingBatches: report.orderedBatches.map(batch => batch.id) } };
configureNativeInventoryRuntime();
const nativeScalarAdapterProbes = [];
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const source = nativeScalarSourceFixtures[language];
  const fileName = `sample.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`;
  const review = await reviewNativeScalarImportGraph(source, language, fileName);
  if (!review.snapshot || review.diagnostics.length) throw new Error(`Native scalar ledger admission failed: ${language}/${review.diagnostics.join('; ')}`);
  const accepted = await acceptSourceImportReview(review, source, fileName, false, 'library');
  const retained = await reviewSourceReimport(JSON.parse(JSON.stringify(accepted)), source, fileName);
  if (retained.diagnostics.length || retained.conflicts.length) throw new Error(`Native scalar ledger reload/reimport failed: ${language}`);
  acceptSourceReimport(retained, accepted, source);
  nativeScalarAdapterProbes.push({ language, fileName, source, scope: 'Ordinary scalar library functions: exact constants, parameter identities and unit returns only', status: 'sealed-review-accept-reload-unchanged-reimport-probe', evidence: ['packages/source-import/src/nativeScalarAdmission.test.ts', 'apps/web/src/lib/nativeScalarSourceCodePanel.test.ts', 'apps/web/scripts/source_import_native_scalar_checks.py', 'tools/validate_native_source_graphs.py', 'docs/design/native_scalar_source_admission_contract.md'] });
}
for (const probe of nativeScalarAdapterProbes) for (const item of probe.evidence) {
  if (!existsSync(join(root, item))) throw new Error(`Missing native scalar evidence: ${item}`);
}
const path = join(root, 'docs/design/code_visual_coverage.json');
const serialized = JSON.stringify({ ...auditedReport, nativeScalarAdapterProbes }, null, 2) + '\n';
if (process.argv.includes('--write')) writeFileSync(path, serialized);
else if (!existsSync(path) || readFileSync(path, 'utf8') !== serialized) throw new Error('Coverage report is stale; run report:coverage');
console.log(JSON.stringify(report.summary));
