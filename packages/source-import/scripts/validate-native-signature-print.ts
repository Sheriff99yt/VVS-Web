import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../../../tools/native_signature_cases.json';
import { analyzeNativeSourceSignatures } from '../src/nativeSourceSignatures';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { printNativeScalarFunctionHeader } from '../../transpiler/src/print/nativeScalarSignature';
configureNativeInventoryRuntime();
const root = join(import.meta.dir, '../../..'), directory = join(root, 'scratch/native-signature-print');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = { cpp: [], rust: [], gdscript: [] };
let checked = 0;
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  if ('unsupported' in fixture && fixture.unsupported) continue;
  const report = await analyzeNativeSourceSignatures(fixture.source, language);
  if (report.signatures.length !== 1 || report.diagnostics.length) throw new Error('Verified ordinary source header required');
  const signature = report.signatures[0];
  const header = printNativeScalarFunctionHeader(signature, 'definition', { modifiers: signature.modifiers, explicitUnitReturn: language === 'rust' && !!signature.returnTypeSpan });
  if (header.spans.length !== 1 || header.spans[0].nodeId !== 'definition' || header.spans[0].start !== 0 || header.spans[0].end !== header.text.length) throw new Error('Function header lost visible definition span');
  // Trusted test composition only: production emit never consumes saved source bodies.
  const replacedEnd = language === 'gdscript' ? fixture.source.indexOf('\n', signature.start) : signature.bodySpan.start + 1;
  if (replacedEnd < 0) throw new Error('Ordinary function body boundary required');
  const source = fixture.source.slice(0, signature.start) + header.text + fixture.source.slice(replacedEnd);
  fixtures[language].push({ id: fixture.id, source, valid: true }); checked++;
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const compiler = Bun.spawn(['python', 'tools/validate_native_signature_print.py'], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Independent generated native header validation failed');
const native: { cases: { language: string; id: string; sourceSha256: string; expectedValid: boolean; exitCode: number }[]; failures: string[] } = JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8'));
if (native.failures.length || native.cases.length !== checked) throw new Error('Complete generated header evidence required');
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of fixtures[language]) {
  const observed = native.cases.find(item => item.language === language && item.id === fixture.id);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fixture.source))), value => value.toString(16).padStart(2, '0')).join('');
  if (!observed || observed.sourceSha256 !== hash || !observed.expectedValid || observed.exitCode !== 0) throw new Error('Generated header native source/acceptance differs');
}
console.log(`Native printed scalar headers:${checked} exact generated inputs compile with pinned profiles;definition spans retained. Trusted source body composition is fixture-only, not saved-graph Code-panel or adapter certification.`);
