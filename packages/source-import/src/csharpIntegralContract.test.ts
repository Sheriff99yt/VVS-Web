import { expect, test } from 'bun:test';
import fixtures from '../test/native-csharp/cases.json';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
import { evaluateCSharpIntegralProbe, type CSharpIntegralProbe } from '../test/csharpIntegralProbes';

for (const fixture of fixtures.cases) {
  const probe = (fixture as unknown as { integralProbe?: CSharpIntegralProbe }).integralProbe;
  if (!probe) continue;
  test(`C# integral contract matches independent native facts: ${fixture.id}`, () => {
    const native = evidence.observations.find(row => row.id === fixture.id)!;
    expect(native).toBeDefined();
    if (!native.ok) { expect(() => evaluateCSharpIntegralProbe(probe)).toThrow('NATIVE_CSHARP_INTEGER_'); return; }
    const fact = evaluateCSharpIntegralProbe(probe);
    expect(fact.type).toBe(probe.kind === 'assignment' ? native.convertedType : native.expressionType);
    expect(fact.constant !== undefined).toBe(native.constantAvailable);
    if (fact.constant !== undefined) expect(fact.constant).toBe(native.constant);
  });
}
