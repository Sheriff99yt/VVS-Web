import { expect,test } from 'bun:test';
import cases from '../../../tools/native_constant_cases.json';
import { analyzeNativeConstantSource } from './nativeSourceExpressions';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
configureNativeInventoryRuntime();

for(const language of ['cpp','rust','gdscript'] as const) for(const fixture of cases[language]) {
  test(`source-owned constant ${language}/${fixture.id}`,async()=>{
    const report=await analyzeNativeConstantSource(fixture.source,language);
    const record=report.records.find(item=>item.owner.name==='VALUE')!;
    expect(record).toBeDefined();expect(fixture.source.slice(record.start,record.end)).toBe(fixture.expression);
    if(fixture.modelDiagnostic) {expect(record.diagnostic).toBeDefined();expect(record.diagnostic!.start).toBeGreaterThanOrEqual(record.start);expect(record.diagnostic!.end).toBeLessThanOrEqual(record.end);}
    else { expect(record.diagnostic).toBeUndefined();expect(record.fact?.nativeType).toBe(fixture.nativeType);expect(String(record.fact?.payload)).toBe(fixture.payload); }
    expect(report.inventory.regions.map(item=>item.text).join('')).toBe(fixture.source);
    expect(report.graphAdmission).toBe('blocked');expect(Object.isFrozen(record.owner)).toBe(true);
    if('sourceFunction' in fixture) {
      const method=report.records.find(item=>item.owner.kind==='return'&&item.owner.name===fixture.sourceFunction);
      expect(method?.fact?.nativeType).toBe(fixture.nativeType);expect(String(method?.fact?.payload)).toBe(fixture.payload);
    }
    expect(Object.isFrozen(report.records)).toBe(true);
  });
}
test('source-native context, casts, grouping and unsupported references are retained',async()=>{
  const rust=await analyzeNativeConstantSource('const VALUE:i8 = 1 + 2;\nconst COMPARE:bool = 1i8 < 2;\nfn sample()->i8 { return -(128i8); }','rust');
  expect(rust.records.map(item=>item.fact?.payload)).toEqual(['3',true,'-128']);
  expect(rust.records[0].fact?.nativeType).toBe('i8');
  const cpp=await analyzeNativeConstantSource('int sample() { int value = static_cast<unsigned char>(257); return 2 + 3; }','cpp');
  expect(cpp.records.map(item=>item.fact?.payload)).toEqual(['1','5']);
  const godot=await analyzeNativeConstantSource('extends RefCounted\nfunc sample()->int:\n\tvar value:int = unknown()\n\treturn value\n','gdscript');
  expect(godot.records.every(item=>item.diagnostic?.status==='unsupported')).toBe(true);
});
test('nested source trees retain immutable grouping and UTF16 spans after parser deletion',async()=>{
  const source='// λ🧭\nint sample() { return ((2 + 3) * 4); }';
  const report=await analyzeNativeConstantSource(source,'cpp');
  const record=report.records[0];expect(record.fact?.payload).toBe('20');
  expect(record.expression?.kind).toBe('group');expect(source.slice(record.start,record.end)).toBe('((2 + 3) * 4)');
  expect(JSON.parse(JSON.stringify(report)).records[0].fact.payload).toBe('20');
  const commented=await analyzeNativeConstantSource('int sample() { return (2 /* left */ + /* right */ 3); }','cpp');
  expect(commented.records[0].fact?.payload).toBe('5');
});
test('closure returns do not acquire enclosing method ownership',async()=>{
  const cpp=await analyzeNativeConstantSource('int outer() { ([]() { return 2; }); return 1; }','cpp');
  expect(cpp.records.filter(item=>item.owner.kind==='return').map(item=>item.fact?.payload)).toEqual(['1']);
  const rust=await analyzeNativeConstantSource('fn outer()->i32 { let closure = || { return 2; }; return 1; }','rust');
  expect(rust.records.filter(item=>item.owner.kind==='return').map(item=>item.fact?.payload)).toEqual(['1']);
});
