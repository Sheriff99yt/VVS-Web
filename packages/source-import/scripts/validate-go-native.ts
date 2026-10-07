import { GO_CONVERSION_PROBES, expectedGoConversionProbe } from '../test/goConversionCases';
import { GO_CONSTANT_PROBES, expectedGoConstantProbe } from '../test/goConstantCases';
import { GO_RATIONAL_PROBES, expectedGoRationalProbe } from '../test/goRationalCases';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { configureGoTestRuntime } from '../test/goRuntime';
import { GO_UNIT_FIXTURES, GO_UNIT_GAPS, GO_WORD_FIXTURES } from '../src/goUnitCorpus';
import { previewGoImport } from '../src/go';
import { reviewSourceImportGraph } from '../src/validation';
import { GO_INTEGER_PROBES, expectedGoIntegerProbe } from '../test/goIntegerCases';
const root = join(import.meta.dir, '../../..');
configureGoTestRuntime();
const version = Bun.spawnSync(['go', 'version']);
if (version.exitCode || !version.stdout.toString().includes('go1.26.4 ')) throw new Error('Pinned native Go validator 1.26.4 is required.');
mkdirSync(join(root, 'scratch'), { recursive: true });
const executable = join(root, 'scratch', process.platform === 'win32' ? 'go-fixture-validator.exe' : 'go-fixture-validator');
const build = Bun.spawn(['go', 'build', '-o', executable, join(root, 'packages/source-import/test/native-go/main.go')], { stdout: 'inherit', stderr: 'inherit' });
if (await build.exited !== 0) throw new Error('Trusted native Go validator failed to build.');
const pairs: [string, string][] = [];
for (const source of GO_UNIT_FIXTURES) {
  const preview = await previewGoImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  if (review.diagnostics.length) throw new Error(review.diagnostics.join('\n'));
  pairs.push([source, review.generated]);
}
const result = Bun.spawnSync([executable], { stdin: Buffer.from(JSON.stringify(pairs)) });
if (result.exitCode) throw new Error(result.stderr.toString());
console.log(result.stdout.toString().trim());
for (const source of ['package p\nfunc wrong(a float64) bool { return a }', 'package p\nfunc wrong(a string) string { return missing }', 'package p\nfunc f(a bool) bool { return a }\nfunc wrong() bool { return f(1) }']) {
  if (Bun.spawnSync([executable], { stdin: Buffer.from(JSON.stringify([[source, source]])) }).exitCode === 0) throw new Error('Native validator accepted a deliberately invalid source fixture.');
}
console.log('Native invalid return, unresolved binding and call-type cases rejected');
const integerResult = Bun.spawnSync([executable, '--integer-facts'], { stdin: Buffer.from(JSON.stringify(GO_INTEGER_PROBES.map(probe => ({ source: probe.source, wordBits: probe.wordBits })))) });
if (integerResult.exitCode) throw new Error(integerResult.stderr.toString());
const observations = JSON.parse(integerResult.stdout.toString()) as { ok: boolean; type?: string; constant?: string; error?: string }[];
if (observations.length !== GO_INTEGER_PROBES.length) throw new Error('Native integer observation count drift');
for (const [index, probe] of GO_INTEGER_PROBES.entries()) {
  const expected = expectedGoIntegerProbe(probe), actual = observations[index];
  if (expected.ok !== actual.ok || (expected.ok && (expected.type !== (actual.type === 'byte' ? 'uint8' : actual.type === 'rune' ? 'int32' : actual.type) || expected.constant !== actual.constant))) throw new Error(`Native integer contract drift: ${probe.id}: ${JSON.stringify({ expected, actual })}`);
}
console.log(`Go native integer type/constant observations: ${observations.length} verified across 32/64-bit contexts`);

const wordCompilerPairs: { bits: 32 | 64; pairs: [string, string][] }[] = [];
for (const bits of [32, 64] as const) {
  const wordPairs: [string, string][] = [];
  for (const fixture of GO_WORD_FIXTURES.filter(fixture => fixture.wordBits === bits)) {
    const preview = await previewGoImport(fixture.source, bits);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    if (!review.snapshot || review.diagnostics.length) throw new Error(review.diagnostics.join('\n'));
    wordPairs.push([fixture.source, review.generated]);
  }
  wordCompilerPairs.push({ bits, pairs: wordPairs });
  const checked = Bun.spawnSync(bits === 32 ? [executable, '--word32'] : [executable], { stdin: Buffer.from(JSON.stringify(wordPairs)) });
  if (checked.exitCode) throw new Error(checked.stderr.toString());
  console.log(`${bits}-bit target: ${checked.stdout.toString().trim()}`);
}

// Only this curated, reviewed corpus reaches the pinned compiler. No imported
// user source, generated programs, or resulting archives are executed.
let compiledPairs = 0;
for (const { bits: wordBits, pairs: fixtures } of [{ bits: 64, pairs }, ...wordCompilerPairs, { bits: 32, pairs: pairs.filter(pair => /func (?:count\(|signedCount\(|wideCount\()/.test(pair[0])) }]) {
  for (const [index, pair] of fixtures.entries()) for (const [side, source] of pair.entries()) {
    const path = join(root, 'scratch', 'trusted-go-compile.go');
    writeFileSync(path, source, 'utf8');
    const result = Bun.spawnSync(['go', 'tool', 'compile', '-o', join(root, 'scratch', 'trusted-go-compile.a'), path], { env: { ...Bun.env, GOARCH: wordBits === 32 ? '386' : 'amd64' } });
    if (result.exitCode) throw new Error(`Trusted compiler fixture ${wordBits}/${index}/${side}: ${result.stdout.toString()}${result.stderr.toString()}`);
  }
  compiledPairs += fixtures.length;
}
console.log(`Pinned native compiler: ${compiledPairs} trusted source/generated pairs verified without execution`);

// go/types accepts these unresolved counts, but the pinned compiler rejects
// their literal storage. Preserve this divergence as evidence, not a weakened
// expected-validity comparison or acceptance claim.
for (const token of ['18446744073709551616', '-9223372036854775809']) for (const bits of [32, 64] as const) {
  const source = `package sample\nfunc count(left uint64, count uint8) uint64 { return left << (${token} << count) }`;
  const typed = Bun.spawnSync(bits === 32 ? [executable, '--word32'] : [executable], { stdin: Buffer.from(JSON.stringify([[source, source]])) });
  if (typed.exitCode !== 0) throw new Error('Expected unresolved-count typechecker observation changed');
  const path = join(root, 'scratch', 'trusted-go-compile.go');
  writeFileSync(path, source, 'utf8');
  const compiled = Bun.spawnSync(['go', 'tool', 'compile', '-o', join(root, 'scratch', 'trusted-go-compile.a'), path], { env: { ...Bun.env, GOARCH: bits === 32 ? '386' : 'amd64' } });
  if (compiled.exitCode === 0) throw new Error('Pinned compiler count-storage rejection changed');
  const preview = await previewGoImport(source, bits);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  if (review.snapshot || !review.diagnostics.length) throw new Error('Importer accepted a compiler-rejected unresolved shift count');
}
console.log('Four unresolved-count typechecker/compiler divergences retained with importer guards');

const rationalResult = Bun.spawnSync([executable, '--integer-facts'], { stdin: Buffer.from(JSON.stringify(GO_RATIONAL_PROBES.map(probe => ({ source: probe.source, wordBits: 64 })))) });
if (rationalResult.exitCode) throw new Error(rationalResult.stderr.toString());
const rationalObservations = JSON.parse(rationalResult.stdout.toString()) as { ok: boolean; type?: string; constant?: string }[];
if (rationalObservations.length !== GO_RATIONAL_PROBES.length) throw new Error('Native rational observation count drift');
for (const [index, probe] of GO_RATIONAL_PROBES.entries()) {
  const expected = expectedGoRationalProbe(probe), actual = rationalObservations[index];
  if (expected.ok !== actual.ok || (expected.ok && (expected.type !== actual.type || expected.constant !== actual.constant))) throw new Error(`Native rational contract drift: ${probe.id}: ${JSON.stringify({ expected, actual })}`);
}
console.log(`Go native rational type/constant observations: ${rationalObservations.length} verified`);

const conversionResult = Bun.spawnSync([executable, '--integer-facts'], { stdin: Buffer.from(JSON.stringify(GO_CONVERSION_PROBES.map(probe => ({ source: probe.source, wordBits: probe.wordBits })))) });
if (conversionResult.exitCode) throw new Error(conversionResult.stderr.toString());
const conversionObservations = JSON.parse(conversionResult.stdout.toString()) as { ok: boolean; type?: string; constant?: string }[];
if (conversionObservations.length !== GO_CONVERSION_PROBES.length) throw new Error('Native conversion observation count drift');
for (const [index, probe] of GO_CONVERSION_PROBES.entries()) {
  const expected = expectedGoConversionProbe(probe), actual = conversionObservations[index];
  const nativeType = actual.type === 'byte' ? 'uint8' : actual.type === 'rune' ? 'int32' : actual.type;
  if (expected.ok !== actual.ok || (expected.ok && (expected.type !== nativeType || expected.constant !== actual.constant))) throw new Error(`Native conversion contract drift: ${probe.id}: ${JSON.stringify({ expected, actual })}`);
}
console.log(`Go native numeric conversion observations: ${conversionObservations.length} verified across 32/64-bit contexts`);

const constantResult = Bun.spawnSync([executable, '--integer-facts'], { stdin: Buffer.from(JSON.stringify(GO_CONSTANT_PROBES.map(probe => ({ source: probe.source, wordBits: probe.wordBits })))) });
if (constantResult.exitCode) throw new Error(constantResult.stderr.toString());
const constantObservations = JSON.parse(constantResult.stdout.toString()) as { ok: boolean; type?: string; constant?: string }[];
if (constantObservations.length !== GO_CONSTANT_PROBES.length) throw new Error('Native constant binding observation count drift');
for (const [index, probe] of GO_CONSTANT_PROBES.entries()) {
  const expected = expectedGoConstantProbe(probe), actual = constantObservations[index];
  if (expected.ok !== actual.ok || (expected.ok && (expected.type !== actual.type || expected.constant !== actual.constant))) throw new Error(`Native constant binding contract drift: ${probe.id}: ${JSON.stringify({ expected, actual })}`);
}
console.log(`Go native constant binding/comparison observations: ${constantObservations.length} verified`);

const constantGaps = GO_UNIT_GAPS.filter(gap => ['go-package-constants', 'go-constant-groups-iota', 'go-defined-numeric-type', 'go-type-alias', 'go-short-circuit-call', 'go-byte-string'].includes(gap.id));
const gapResult = Bun.spawnSync([executable], { stdin: Buffer.from(JSON.stringify(constantGaps.map(gap => [gap.source, gap.source]))) });
if (gapResult.exitCode) throw new Error(gapResult.stderr.toString());
for (const gap of constantGaps) {
  const path = join(root, 'scratch', 'trusted-go-compile.go');
  writeFileSync(path, gap.source, 'utf8');
  const compiled = Bun.spawnSync(['go', 'tool', 'compile', '-o', join(root, 'scratch', 'trusted-go-compile.a'), path], { env: { ...Bun.env, GOARCH: 'amd64' } });
  if (compiled.exitCode) throw new Error(`Native-valid gap changed: ${gap.id}/${compiled.stderr.toString()}`);
}
console.log(`Native Go compiler validates ${constantGaps.length} retained constant/type/evaluation gaps; these remain unsupported by the importer`);
