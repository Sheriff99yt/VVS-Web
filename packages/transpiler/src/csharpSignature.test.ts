import { expect, test } from 'bun:test';
import fixture from '../test/csharp-signature.fixture.json';
import { transpileGraph, type CodegenContext } from './generate';
import { applyFunctionImplementBinding, nativeSignatureProblem, CSHARP_INTEGRAL_PINS } from '@vvs/graph-types';

const context = () => structuredClone(fixture) as CodegenContext;
test('saved C# integral signatures emit exact native types and map definition/body ownership', () => {
  const ctx = context(); const result = transpileGraph(ctx); const code = result.files[0].content;
  for (const type of Object.keys(CSHARP_INTEGRAL_PINS)) {
    expect(code).toContain(`public static ${type} Identity_${type}(${type} value)`);
    expect(result.sourceMap[`identity-${type}-define`]?.length).toBeGreaterThan(0);
    expect(result.sourceMap[`identity-${type}-return`]?.length).toBeGreaterThan(0);
    ctx.documents!['main-graph'] = { nodes: ctx.nodes, edges: ctx.edges };
    const tab = ctx.documents![`identity-${type}`];
    const preview = transpileGraph({ ...ctx, tabId: `identity-${type}`, nodes: tab.nodes, edges: tab.edges }).files[0].content;
    expect(preview).toContain(`${type} Identity_${type}(${type} value)`);
    expect(preview).toContain('return value;');
  }
  expect(code).not.toContain('float');
  expect(transpileGraph(JSON.parse(JSON.stringify(ctx))).files[0].content).toBe(code);
});
test('C# signature refresh retains exact integral identity and invalid edits block generation', () => {
  const ctx = context(); const fn = ctx.functions.find(fn => fn.id === 'identity-byte')!;
  const definition = ctx.nodes.find(node => node.id === 'identity-byte-define')!;
  fn.overloads[0].parameters[0].label = 'renamed';
  definition.data = applyFunctionImplementBinding(definition.data, fn);
  expect(definition.data.properties!.nativeReturnType).toBe('byte');
  expect((definition.data.properties!.nativeParameters as { name: string; nativeType: string }[])[0]).toMatchObject({ name: 'renamed', nativeType: 'byte' });
  definition.data.properties!.nativeReturnType = 'sbyte';
  expect(() => transpileGraph(ctx)).toThrow('NATIVE_CSHARP_RETURN_TYPE');
  definition.data.properties!.nativeReturnType = 'byte';
  expect(() => transpileGraph(ctx)).not.toThrow();
  fn.overloads[0].parameters[0].type = 'data_string';
  definition.data = applyFunctionImplementBinding(definition.data, fn);
  expect(nativeSignatureProblem(definition.data, 'csharp')).toBeDefined();
  expect(() => transpileGraph(ctx)).toThrow('NATIVE_SIGNATURE_INVALID');
});
test('C# signatures reject native defaults, rest, wrong class ownership, async and duplicate escaped identifiers', () => {
  for (const mutate of [
    (ctx: CodegenContext) => { ctx.functions[0].binding = 'module'; },
    (ctx: CodegenContext) => { ctx.functions[0].flags = { async: true }; },
    (ctx: CodegenContext) => { ctx.nodes.find(n => n.id === 'identity-sbyte-define')!.data.properties!.nativeReturnType = 'float64'; },
    (ctx: CodegenContext) => { (ctx.nodes.find(n => n.id === 'identity-sbyte-define')!.data.properties!.nativeParameters as { mode: string }[])[0].mode = 'rest'; },
  ]) { const ctx = context(); mutate(ctx); expect(() => transpileGraph(ctx)).toThrow('NATIVE_'); }
  const definition = context().nodes.find(n => n.id === 'identity-int-define')!.data;
  definition.properties!.nativeParameters = [{ id: 'a', name: 'value', mode: 'positional', nativeType: 'int' }, { id: 'b', name: '@value', mode: 'positional', nativeType: 'int' }];
  expect(nativeSignatureProblem(definition, 'csharp')).toContain('duplicate');
});

test('native C# parameter reads retain case and escaped spelling from the declaration', () => {
  for (const name of ['Value', '@int']) {
    const ctx = context(); const fn = ctx.functions.find(fn => fn.id === 'identity-int')!;
    fn.overloads[0].parameters[0].label = name;
    const definition = ctx.nodes.find(n => n.id === 'identity-int-define')!;
    definition.data = applyFunctionImplementBinding(definition.data, fn);
    const code = transpileGraph(ctx).files[0].content;
    expect(code).toContain(`int Identity_int(int ${name})`);
    expect(code).toContain(`return ${name};`);
  }
});

test('native C# graph mutations cannot bypass entry, body or return ownership', () => {
  for (const mutate of [
    (ctx: CodegenContext) => { ctx.documents!['identity-int'].nodes[0].data.graphBinding!.symbolId = 'identity-byte'; },
    (ctx: CodegenContext) => { ctx.documents!['identity-int'].nodes[1].data.inputs.push({ id: 'hidden', label: 'Hidden', type: 'data_number' }); },
    (ctx: CodegenContext) => { ctx.documents!['identity-int'].edges.pop(); },
    (ctx: CodegenContext) => { ctx.documents!['identity-int'].nodes[0].data.properties!.nativeSignatureLanguage = 'go'; },
    (ctx: CodegenContext) => { ctx.nodes.find(n => n.id === 'identity-int-define')!.data.properties!.isVirtual = true; },
  ]) { const ctx = context(); mutate(ctx); expect(() => transpileGraph(ctx)).toThrow('NATIVE_'); }
});
