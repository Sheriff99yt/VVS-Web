import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../../../tools/native_scalar_cases.json';
import { nativeScalarLiteral } from '../src/nativeScalarLiterals';
import { ImportFailure } from '../src/contracts';

const root = join(import.meta.dir,'../../..');
if (!process.argv.includes('--reuse-native')) {
  const compiler = Bun.spawn(['python','tools/validate_native_scalars.py'], { cwd:root,stdout:'inherit',stderr:'inherit' });
  if (await compiler.exited !== 0) throw new Error('Independent native scalar assertions failed');
}
type NativeCase = { language:string; id:string; sourceSha256:string; expectedValid:boolean; exitCode:number };
const native: { cases:NativeCase[]; failures:string[] } = JSON.parse(readFileSync(join(root,'scratch/native-scalars/results.json'),'utf8'));
if (native.failures.length || native.cases.length !== Object.values(cases).reduce((total,items)=>total+items.length,0)) throw new Error('Complete independent native scalar evidence required');
let checked=0, calibrations=0;
for (const language of ['cpp','rust','gdscript'] as const) for (const fixture of cases[language]) {
  const observed=native.cases.find(item=>item.language===language && item.id===fixture.id);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fixture.source))),byte=>byte.toString(16).padStart(2,'0')).join('');
  if (!observed || observed.sourceSha256!==digest || observed.expectedValid!==fixture.valid || (observed.exitCode===0)!==fixture.valid) throw new Error(`Native scalar input/acceptance drift:${language}/${fixture.id}`);
  if (fixture.calibration) { calibrations++; continue; }
  try {
    const fact=nativeScalarLiteral(fixture.token,language,{ expectedType:fixture.context??undefined,negated:fixture.negated });
    if (fixture.modelDiagnostic || fact.nativeType!==fixture.nativeType || String(fact.payload)!==fixture.payload) throw new Error(`Scalar value/type differs:${language}/${fixture.id}`);
  } catch(error) {
    if (!(error instanceof ImportFailure) || error.code!==`${language.toUpperCase()}_${fixture.modelDiagnostic}`) throw error;
  }
  checked++;
}
console.log(`Native scalars:${checked} exact-input type/value/rejection comparisons;${calibrations} deliberately false native assertion calibrations. Operators/conversions/effects/graph admission remain required.`);
