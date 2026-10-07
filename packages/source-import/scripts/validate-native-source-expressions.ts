import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import cases from '../../../tools/native_constant_cases.json';
import {analyzeNativeConstantSource} from '../src/nativeSourceExpressions';
import {configureNativeInventoryRuntime} from '../test/nativeInventoryRuntime';
configureNativeInventoryRuntime();
const root=join(import.meta.dir,'../../..');
type Case={language:string;id:string;sourceSha256:string;expectedValid:boolean;exitCode:number};
const native:{cases:Case[];failures:string[]}=JSON.parse(readFileSync(join(root,'scratch/native-constants/results.json'),'utf8'));
if(native.failures.length||native.cases.length!==Object.values(cases).reduce((total,items)=>total+items.length,0))throw new Error('Complete native constant compiler evidence required');
let checked=0,blockedCalibrations=0;
for(const language of ['cpp','rust','gdscript'] as const)for(const fixture of cases[language]) {
  const report=await analyzeNativeConstantSource(fixture.source,language),observed=native.cases.find(item=>item.language===language&&item.id===fixture.id);
  if(!observed||observed.sourceSha256!==report.sourceSha256||observed.expectedValid!==fixture.valid||(observed.exitCode===0)!==fixture.valid)throw new Error(`Native source identity/acceptance differs:${language}/${fixture.id}`);
  const selected=report.records.filter(item=>item.owner.name==='VALUE');
  if(selected.length!==1)throw new Error(`Source VALUE ownership differs:${language}/${fixture.id}`);
  const record=selected[0];
  if(report.source.slice(record.start,record.end)!==fixture.expression)throw new Error(`Source expression span differs:${language}/${fixture.id}`);
  if(fixture.modelDiagnostic) {if(!record.diagnostic||record.fact)throw new Error(`Invalid native source expression promoted:${language}/${fixture.id}`);}
  else if(record.diagnostic||record.fact?.nativeType!==fixture.nativeType||String(record.fact?.payload)!==fixture.payload)throw new Error(`Source-owned type/value differs:${language}/${fixture.id}`);
  if(report.graphAdmission!=='blocked'||report.inventory.regions.map(item=>item.text).join('')!==fixture.source)throw new Error('Source retention/admission boundary differs');
  if('sourceFunction' in fixture) {
    const returned=report.records.find(item=>item.owner.kind==='return'&&item.owner.name===fixture.sourceFunction);
    if(returned?.fact?.nativeType!==fixture.nativeType||String(returned?.fact?.payload)!==fixture.payload)throw new Error(`Native source method return differs:${language}/${fixture.id}`);
  }
  if(fixture.calibration)blockedCalibrations++;
  checked++;
}
console.log(`Native source expressions:${checked} exact-input compiler comparisons/spans;${blockedCalibrations} compiler-invalid assertion files cannot gain graph admission from partial constant facts. Dynamic bindings/effects/graphs remain required.`);
