import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../../../tools/native_binding_cases.json';
import syntaxCases from '../../../tools/native_readiness_cases.json';
import { analyzeNativeLocalBindings } from '../src/nativeLocalBindings';
import { toReviewSpan } from '../src/sourceOffsets';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';

configureNativeInventoryRuntime();
const root = join(import.meta.dir, '../../..');
type Location = { offset: number; tokLen: number };
type NativeCase = { language: string; id: string; sourceSha256: string; expectedValid: boolean; exitCode: number;
  declarations?: { id: string; name: string; location: Location }[];
  references?: { targetId: string; name: string; range: { begin: Location; end: Location } }[] };
const native: { cases: NativeCase[]; failures: string[] } = JSON.parse(readFileSync(join(root, 'scratch/native-readiness/results.json'), 'utf8'));
if (native.failures.length || native.cases.length !== 66) throw new Error('Fresh complete 66-case native readiness evidence is required');
const hash = async (source: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))), byte => byte.toString(16).padStart(2, '0')).join('');
let verified = 0, references = 0;
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  for (const fixture of [...syntaxCases[language], ...cases[language]]) {
    const observed = native.cases.find(item => item.language === language && item.id === fixture.id);
    if (!observed || observed.sourceSha256 !== await hash(fixture.source) || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error(`Native source/acceptance drift: ${language}/${fixture.id}`);
  }
  for (const fixture of cases[language]) {
    const report = await analyzeNativeLocalBindings(fixture.source, language);
    const targets = report.references.map(reference => report.bindings.findIndex(binding => binding.id === reference.bindingId));
    if (JSON.stringify(targets) !== JSON.stringify(fixture.targets)) throw new Error(`Binding identity drift: ${language}/${fixture.id}: ${targets}`);
    if (language === 'cpp' && fixture.valid) {
      const observed = native.cases.find(item => item.language === language && item.id === fixture.id)!;
      for (const reference of report.references) {
        const original = observed.references!.find(item => {
          const span = toReviewSpan(fixture.source, { start: item.range.begin.offset, end: item.range.end.offset + item.range.end.tokLen }, 'utf8');
          return span.start === reference.start && span.end === reference.end;
        });
        if (!original) throw new Error(`Missing independent Clang reference: ${fixture.id}/${reference.start}`);
        const declaration = observed.declarations!.find(item => item.id === original.targetId)!;
        const span = toReviewSpan(fixture.source, { start: declaration.location.offset, end: declaration.location.offset + declaration.location.tokLen }, 'utf8');
        const binding = report.bindings.find(item => item.id === reference.bindingId)!;
        if (span.start !== binding.start || span.end !== binding.end || declaration.name !== binding.name) throw new Error(`Clang declaration identity differs: ${fixture.id}/${reference.start}`);
        references++;
      }
    }
    verified++;
  }
}
console.log(`Native source identity: 66 exact UTF-8 hashes; ${verified} lexical cases; ${references} direct Clang declaration/reference matches. Rust/GDScript use compiler contrast probes; value/effect/graph admission stays unvalidated.`);
