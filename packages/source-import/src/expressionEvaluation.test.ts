import { expect, test } from 'bun:test';
import type { ClassImportPlan, ExpressionPlan } from './contracts';
import { assertEagerExpressionCalls, expressionCallSites } from './expressionEvaluation';
import { materializeImportPlan } from './materialize';

const evidence = { start: 0, end: 1, mappingId: 'evaluation-test', mappingVersion: 1 };
const literal: ExpressionPlan = { ...evidence, kind: 'literal', value: true, valueType: 'boolean' };
const call = (id: string, args: ExpressionPlan[] = []): ExpressionPlan & { kind: 'call' } => ({ ...evidence, kind: 'call', functionId: id, args, valueType: 'boolean' });
const native = (language: 'javascript' | 'python' | 'go', operator: string, ...operands: ExpressionPlan[]): ExpressionPlan & { kind: 'native' } => ({ ...evidence, kind: 'native', language, form: 'binary', domain: language === 'go' ? 'go-bool' : 'unknown', operator, operands, valueType: 'boolean' });

test('ordered nested call sites retain occurrence identity, argument dependencies and the input plan', () => {
  const root = call('outer', [call('same'), call('same', [call('inner')])]);
  const original = JSON.stringify(root);
  const sites = expressionCallSites(root);
  expect(sites.map(site => [site.call.functionId, site.path])).toEqual([
    ['same', [0]], ['inner', [1, 0]], ['same', [1]], ['outer', []],
  ]);
  expect(sites.every(site => site.conditions.length === 0)).toBe(true);
  expect(JSON.stringify(root)).toBe(original);
});

test('native conditional operators carry their own guard rather than hoisting right-hand calls', () => {
  for (const [language, operators] of [
    ['go', ['&&', '||']], ['javascript', ['&&', '||', '??']], ['python', ['and', 'or']],
  ] as const) for (const operator of operators) {
    const owner = native(language, operator, call('left'), call('right'));
    const sites = expressionCallSites(owner);
    expect(sites[0].conditions).toEqual([]);
    expect(sites[1].conditions).toEqual([{ owner, operand: 1, when: ['&&', 'and'].includes(operator) ? 'truthy' : operator === '??' ? 'nullish' : 'falsy' }]);
    expect(() => assertEagerExpressionCalls(owner)).toThrow('CONDITIONAL_CALL_REGION');
  }
});

test('nested guarded call arguments and conversion wrappers keep both enclosing regions', () => {
  const nested = native('go', '||', call('inner-left'), call('outer-call', [call('argument')]));
  const wrapped: ExpressionPlan = { ...evidence, kind: 'convert', nodeKind: 'convert_to_string', value: nested, valueType: 'string' };
  const root = native('go', '&&', call('first'), wrapped);
  const sites = expressionCallSites(root);
  expect(sites.map(site => [site.call.functionId, site.path, site.conditions.length])).toEqual([
    ['first', [0], 0], ['inner-left', [1, 0, 0], 1], ['argument', [1, 0, 1, 0], 2], ['outer-call', [1, 0, 1], 2],
  ]);
  expect(sites[2].conditions.map(condition => condition.owner.operator)).toEqual(['&&', '||']);
});

test('comparison, arithmetic and collection operands do not hide nested call sites', () => {
  const compare: ExpressionPlan = { ...evidence, kind: 'compare', mode: 'boolean', operator: '==', left: call('left'), right: call('right'), valueType: 'boolean' };
  const binary: ExpressionPlan = { ...evidence, kind: 'binary', nodeKind: 'math_add', operator: '+', left: compare, right: literal, valueType: 'number' };
  const collection: ExpressionPlan = { ...evidence, kind: 'native', language: 'python', form: 'list', operands: [binary], valueType: 'unknown' };
  expect(expressionCallSites(collection).map(site => site.call.functionId)).toEqual(['left', 'right']);
  expect(() => assertEagerExpressionCalls(collection)).not.toThrow();
});

test('left-only calls and call-free conditional expressions remain eager-materialization compatible', () => {
  for (const owner of [native('go', '&&', call('left'), literal), native('go', '||', literal, literal)]) {
    expect(() => assertEagerExpressionCalls(owner)).not.toThrow();
  }
});

test('malformed conditional arity and cyclic/over-depth expression ownership fail within a bounded walk', () => {
  expect(() => expressionCallSites(native('go', '&&', literal))).toThrow('EVALUATION_ARITY');
  const cyclic = call('cycle'); cyclic.args.push(cyclic);
  expect(() => expressionCallSites(cyclic)).toThrow('EVALUATION_BUDGET');
});

test('Go materialization gives conditional calls visible expression ownership without eager pins', () => {
  const plan: ClassImportPlan = {
    ...evidence, version: 1, context: { language: 'go', version: '1.26', sourceMode: 'module', environment: 'none' },
    source: 'retained source', selectedSource: 'retained source', sourceSha256: 'test', name: 'sample', fileName: 'sample.go',
    unitKind: 'standalone-function', packageClause: { ...evidence, name: 'sample', wordBits: 64 }, dependencies: [],
    methods: [
      { ...evidence, id: 'check', scopeId: 'check', name: 'check', role: 'method', isStatic: true, parameters: [], returnType: 'data_boolean', nativeReturnType: 'bool', body: { ...evidence, kind: 'return', value: literal } },
      { ...evidence, id: 'conditional', scopeId: 'conditional', name: 'conditional', role: 'method', isStatic: true, parameters: [], returnType: 'data_boolean', nativeReturnType: 'bool', body: { ...evidence, kind: 'return', value: native('go', '&&', literal, call('check')) } },
    ],
  };
  const snapshot = materializeImportPlan(plan);
  const calls = Object.values(snapshot.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'vvs.project.call_function');
  expect(calls).toHaveLength(1);
  expect(calls[0].data.properties?.callPlacement).toBe('expression');
  expect([...calls[0].data.inputs, ...calls[0].data.outputs].some(pin => pin.type === 'execution')).toBe(false);
  expect(plan.source).toBe('retained source');
  const fixed = structuredClone(plan);
  if (fixed.methods[1].body.kind === 'return') fixed.methods[1].body.value = native('go', '&&', call('check'), literal);
  expect(() => materializeImportPlan(fixed)).not.toThrow();
});
