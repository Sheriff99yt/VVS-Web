import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../../../tools/native_constant_cases.json';
import { evaluateNativeConstant, type NativeConstantExpression } from '../src/nativeConstantExpressions';
import { ImportFailure } from '../src/contracts';

const root=join(import.meta.dir,'../../..');
if (!process.argv.includes('--reuse-native')) {
  const retry=process.argv.find(arg=>arg.startsWith('--retry-native='))?.slice('--retry-native='.length);
  const compiler=Bun.spawn(['python','tools/validate_native_constants.py',...(retry?[`--only=${retry}`]:[])],{cwd:root,stdout:'inherit',stderr:'inherit'});
  if (await compiler.exited!==0) throw new Error('Native constant assertions failed');
}
type Case={language:string;id:string;sourceSha256:string;expectedValid:boolean;exitCode:number};
const native:{cases:Case[];failures:string[]}=JSON.parse(readFileSync(join(root,'scratch/native-constants/results.json'),'utf8'));
if (native.failures.length || native.cases.length!==Object.values(cases).reduce((sum,items)=>sum+items.length,0)) throw new Error('Complete native constant evidence required');
let checked=0,calibrated=0;
for (const language of ['cpp','rust','gdscript'] as const) for (const fixture of cases[language]) {
  const observed=native.cases.find(item=>item.language===language && item.id===fixture.id);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fixture.source))),byte=>byte.toString(16).padStart(2,'0')).join('');
  if (!observed || observed.sourceSha256!==digest || observed.expectedValid!==fixture.valid || (observed.exitCode===0)!==fixture.valid) throw new Error(`Native constant input/acceptance drift:${language}/${fixture.id}`);
  if (fixture.calibration) { calibrated++;continue; }
  try {
    const fact=evaluateNativeConstant(fixture.tree as NativeConstantExpression,language);
    if (fixture.modelDiagnostic || fact.nativeType!==fixture.nativeType || String(fact.payload)!==fixture.payload) throw new Error(`Constant type/value drift:${language}/${fixture.id}`);
  } catch(error) {
    if (!(error instanceof ImportFailure) || error.code!==`${language.toUpperCase()}_${fixture.modelDiagnostic}`) throw error;
  }
  checked++;
}
console.log(`Native constant operators/conversions:${checked} exact-source comparisons,${calibrated} false native assertion calibrations; dynamic effects and graph admission remain required.`);
