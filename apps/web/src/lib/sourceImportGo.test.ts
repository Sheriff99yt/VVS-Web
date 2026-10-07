import { normalizeNodeData } from './nodeKind';
import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, applyFunctionImplementBinding, applyFunctionEntryBinding } from '@vvs/graph-types';
import { previewGoImport, normalizedGoSyntax } from '@vvs/source-import';
import { reviewSourceImportGraph } from '@vvs/source-import/validation';
import { GO_UNIT_FIXTURES, GO_WORD_FIXTURES } from '../../../../packages/source-import/src/goUnitCorpus';
import { configureGoTestRuntime } from '../../../../packages/source-import/test/goRuntime';
import { loadGoParser } from '../../../../packages/source-import/src/nativeParser';
import fixture from '../../../../packages/source-import/test/native-go.fixture.json';
import constantFixture from '../../../../packages/source-import/test/native-go-constant.fixture.json';
import { emitProjectLikeCodePanel } from './emitProjectCode';
import { transpileGraph } from './codegen';
import { createSourceImportWorkerService } from './sourceImportWorkerService';
import type { WorkerGraphReview } from './sourceImportWorkerProtocol';

configureGoTestRuntime();
test('Go saved constant declarations retain exact edits and reject dynamic initializers, cycles and damaged readonly bindings', async () => {
  await loadGoParser();
  const source = 'package sample\nfunc exact() float64 { const tenth float32 = .1; const copy = tenth; return float64(copy) }';
  const original = normalizeProjectSnapshot(structuredClone(constantFixture))!;
  const bodyId = original.functions[0].id;
  const constant = original.documents[bodyId].nodes.find(node => node.data.kindId === 'var_define')!;
  const output = emitProjectLikeCodePanel(original);
  expect(normalizedGoSyntax(output.files[0].content)).toBe(normalizedGoSyntax(source));
  expect(output.files[0].content).toContain('const tenth float32 = .1');
  expect(output.files[0].content).toContain('const copy = tenth');
  expect(output.sourceMap[constant.id]?.length).toBeGreaterThan(0);
  for (const mode of ['type', 'readonly', 'declaration', 'cycle', 'nonconstant']) {
    const changed = structuredClone(original), doc = changed.documents[bodyId];
    const owner = doc.nodes.find(node => node.id === constant.id)!;
    if (mode === 'type') owner.data.properties.nativeType = 'int8';
    if (mode === 'readonly') changed.variables.find(variable => variable.id === owner.data.properties.symbolId)!.flags!.readonly = false;
    if (mode === 'declaration') owner.data.properties.declarationKind = 'var';
    if (mode === 'cycle') {
      const get = doc.nodes.find(node => node.data.kindId === 'variable_get' && node.data.graphBinding?.symbolId === owner.data.properties.symbolId)!;
      doc.edges = doc.edges.filter(edge => !(edge.target === owner.id && edge.targetHandle === 'value'));
      doc.edges.push({ id: 'constant-cycle', source: get.id, sourceHandle: 'val', target: owner.id, targetHandle: 'value', data: { pinType: 'data_number' } });
    }
    if (mode === 'nonconstant') { owner.data.properties.nativeLocalStyle = 'go-var'; owner.data.properties.declarationKind = 'var'; changed.variables.find(variable => variable.id === owner.data.properties.symbolId)!.flags!.readonly = false; }
    expect(() => emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(changed)))!), mode).toThrow('NATIVE_');
  }
  const edited = structuredClone(original);
  edited.documents[bodyId].nodes.find(node => node.data.kindId === 'expr_native_literal')!.data.properties.payload = '.2';
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(edited)))!;
  expect(emitProjectLikeCodePanel(loaded).files[0].content).toContain('const tenth float32 = .2');
  const reordered = structuredClone(original), doc = reordered.documents[bodyId];
  for (const node of doc.nodes) delete node.data.properties.sourceOrigin;
  const entry = doc.nodes.find(node => node.data.kindId === 'function_entry')!;
  const declarations = doc.nodes.filter(node => node.data.kindId === 'var_define');
  const returned = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
  doc.edges = doc.edges.filter(edge => edge.data?.pinType !== 'execution');
  for (const [from, to] of [[entry, declarations[1]], [declarations[1], declarations[0]], [declarations[0], returned]]) doc.edges.push({ id: `reorder-${from.id}`, source: from.id, sourceHandle: 'exec_out', target: to.id, targetHandle: 'exec_in', data: { pinType: 'execution' } });
  expect(() => emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(reordered)))!)).toThrow('LOCAL_NOT_INITIALIZED');
});
for (const nativeType of ['int32', 'float32', 'float64', 'void']) test(`Go function-tab Code preview retains visible ${nativeType} signature after reload`, async () => {
  const source = nativeType === 'void' ? 'package sample\nfunc convert(value float64) { return }' : `package sample\nfunc convert(value float64) ${nativeType} { return ${nativeType}(value) }`;
  const preview = await previewGoImport(source, 64);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const fn = loaded.functions[0];
  const tabId = fn.overloads[0].graphTabId ?? fn.id;
  const doc = loaded.documents[tabId];
  const result = transpileGraph({ moduleName: fn.name, extendsType: '', targetLanguage: 'go', variables: loaded.variables, projectEvents: loaded.events, functions: loaded.functions, nodes: doc.nodes, edges: doc.edges, documents: loaded.documents, classes: loaded.classes, tabId });
  expect(result.files[0].content.replace(/\s+/g, ' ')).toContain(`func convert(value float64)${nativeType === 'void' ? '' : ` ${nativeType}`} {`);
  const definition = Object.values(loaded.documents).flatMap(document => document.nodes).find(node => node.data.kindId === 'function_implement')!;
  expect(result.sourceMap[definition.id]?.length).toBeGreaterThan(0);
  if (nativeType !== 'void') {
    const cast = doc.nodes.find(node => node.data.properties?.nativeForm === 'conversion')!;
    expect(result.sourceMap[cast.id]?.length).toBeGreaterThan(0);
    if (nativeType === 'int32') {
      const owner = Object.values(loaded.documents).flatMap(document => document.nodes).find(node => node.data.kindId === 'function_implement')!;
      owner.data.properties.nativeReturnType = 'rune';
      cast.data.properties.nativeTargetType = 'rune';
      const edited = normalizeProjectSnapshot(JSON.parse(JSON.stringify(loaded)))!;
      const changed = transpileGraph({ moduleName: fn.name, extendsType: '', targetLanguage: 'go', variables: edited.variables, projectEvents: edited.events, functions: edited.functions, nodes: edited.documents[tabId].nodes, edges: edited.documents[tabId].edges, documents: edited.documents, classes: edited.classes, tabId });
      expect(changed.files[0].content).toContain('func convert(value float64) rune {');
      expect(changed.files[0].content).toContain('return rune(value)');
    }
  }
});
for (const { source, wordBits } of [...GO_UNIT_FIXTURES.map(source => ({ source, wordBits: 64 as const })), ...GO_WORD_FIXTURES]) test(`Go Code panel owns every mapped construct: ${source}`, async () => {
  const preview = await previewGoImport(source, wordBits);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const output = emitProjectLikeCodePanel(loaded);
  expect(output.files).toHaveLength(1);
  expect(normalizedGoSyntax(output.files[0].content)).toBe(normalizedGoSyntax(source));
  for (const node of Object.values(loaded.documents).flatMap(doc => doc.nodes)) {
    if (['function_define', 'function_entry'].includes(node.data.kindId!)) continue;
    expect(output.sourceMap[node.id]?.length, node.data.kindId).toBeGreaterThan(0);
  }
});

test('fixed Go graph retains authored scalar edits and signature renames through binding refresh and reload', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(fixture))!;
  const fn = snapshot.functions[0];
  fn.overloads[0].parameters[0].label = 'renamed';
  const owner = Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === fn.id)!;
  owner.data = applyFunctionImplementBinding(owner.data, fn, 'o1');
  const entry = snapshot.documents[fn.overloads[0].graphTabId!].nodes.find(node => node.data.kindId === 'function_entry')!;
  entry.data = applyFunctionEntryBinding(entry.data, fn, 'o1');
  const math = snapshot.documents[fn.overloads[0].graphTabId!].nodes.find(node => node.data.kindId === 'math_multiply')!;
  const literalPin = Object.keys(math.data.inlineValues)[0];
  math.data.inlineValues[literalPin] = 3;
  const output = emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!);
  expect(output.files[0].content).toContain('func scale(renamed float64) float64');
  expect(output.files[0].content).toContain('renamed * 3');
});

test('Go Code panel blocks malformed package clauses, signatures and typed authored operands', () => {
  for (const mode of ['package-body', 'package-name', 'package-missing', 'package-duplicate', 'package-position', 'native-type', 'return-type', 'operand-type']) {
    const snapshot = normalizeProjectSnapshot(structuredClone(fixture))!;
    const home = Object.values(snapshot.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'source_package'))!;
    const clause = home.nodes.find(node => node.data.kindId === 'source_package')!;
    const owner = home.nodes.find(node => node.data.kindId === 'function_implement')!;
    if (mode === 'package-body') Object.values(snapshot.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'function_entry'))!.nodes.push({ ...structuredClone(clause), id: 'misplaced-package' });
    if (mode === 'package-name') clause.data.properties!.packageName = 'for';
    if (mode === 'package-missing') { home.nodes = home.nodes.filter(node => node !== clause); home.edges = home.edges.filter(edge => edge.source !== clause.id && edge.target !== clause.id); }
    if (mode === 'package-duplicate') home.nodes.push({ ...structuredClone(clause), id: 'duplicate-package' });
    if (mode === 'package-position') home.edges.push({ id: 'misplaced-clause', source: owner.id, sourceHandle: 'exec_out', target: clause.id, targetHandle: 'exec_in' });
    if (mode === 'native-type') (owner.data.properties!.nativeParameters as { nativeType: string }[])[0].nativeType = 'int64';
    if (mode === 'return-type') owner.data.properties!.nativeReturnType = 'bool';
    if (mode === 'operand-type') {
      const math = Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'math_multiply')!;
      math.data.inlineValues[Object.keys(math.data.inlineValues)[0]] = 'wrong';
    }
    expect(() => emitProjectLikeCodePanel(snapshot), mode).toThrow('NATIVE_');
  }
});

test('Go worker acceptance binds language and one-use receipt to its reviewed graph', async () => {
  const source = GO_UNIT_FIXTURES[0];
  await previewGoImport(source);
  const service = createSourceImportWorkerService();
  const result = await service({ id: 1, kind: 'review', language: 'go', source, regionIndex: 0, fileName: 'sample.go', mapStart: false, entryPolicy: 'library' });
  expect(result.ok).toBe(true);
  const review = (result as { result: WorkerGraphReview }).result;
  expect(review.diagnostics).toEqual([]);
  const accept = { id: 2, kind: 'accept' as const, language: 'go' as const, source, fileName: 'sample.go', mapStart: false, entryPolicy: 'library' as const, receipt: review.receipt!, snapshotJson: JSON.stringify(review.snapshot) };
  expect((await service({ ...accept, language: 'javascript' })).ok).toBe(false);
  expect((await service(accept)).ok).toBe(true);
  expect((await service({ ...accept, id: 3 })).ok).toBe(false);
});

test('Go local editing keeps explicit declarations and rejects inference/type drift after reload', async () => {
  const source = 'package sample\nfunc sum(start float64, limit float64) float64 { var total float64 = 0; for index := start; index < limit; index++ { total += index }; return total }';
  const preview = await previewGoImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sum.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  for (const mode of ['style', 'missing-style', 'type', 'inference', 'prefix', 'header-style', 'local-name', 'operand']) {
    const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
    const nodes = Object.values(snapshot.documents).flatMap(doc => doc.nodes);
    const declaration = nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.nativeLocalStyle === 'go-var')!;
    if (mode === 'style') declaration.data.properties!.nativeLocalStyle = 'opaque-source';
    if (mode === 'missing-style') delete declaration.data.properties!.nativeLocalStyle;
    if (mode === 'type') declaration.data.properties!.nativeType = 'bool';
    if (mode === 'inference') declaration.data.properties!.nativeLocalStyle = 'go-short';
    if (mode === 'prefix') nodes.find(node => node.data.kindId === 'variable_set' && node.data.properties?.assignmentOperator === '++')!.data.properties!.prefix = true;
    if (mode === 'header-style') nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.nativeLocalStyle === 'go-short')!.data.properties!.nativeLocalStyle = 'go-var';
    if (mode === 'local-name') { declaration.data.properties!.name = 'for'; snapshot.variables.find(variable => variable.id === declaration.data.properties!.symbolId)!.name = 'for'; }
    if (mode === 'operand') nodes.find(node => node.data.kindId === 'expr_native_literal' && node.data.properties?.payload === '0')!.data.properties!.payload = 'wrong type';
    expect(() => emitProjectLikeCodePanel(snapshot)).toThrow();
  }
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const declaration = Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define' && node.data.properties?.nativeLocalStyle === 'go-var')!;
  const valueEdge = Object.values(snapshot.documents).flatMap(doc => doc.edges).find(edge => edge.target === declaration.id && edge.targetHandle === 'value')!;
  Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.id === valueEdge.source)!.data.properties!.payload = '3';
  expect(emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!).files[0].content).toContain('var total float64 = 3');
});

test('disconnected Go Get nodes do not disguise an unused native local', async () => {
  const source = 'package sample\nfunc copied(value float64) float64 { copy := value; return copy }';
  const preview = await previewGoImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'copy.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const doc = Object.values(snapshot.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'flow_return'))!;
  const ret = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
  doc.edges = doc.edges.filter(edge => !(edge.target === ret.id && edge.data?.pinType !== 'execution'));
  ret.data.inlineValues[ret.data.inputs.find(pin => pin.type !== 'execution')!.id] = 1;
  expect(() => emitProjectLikeCodePanel(snapshot)).toThrow('NATIVE_GO_UNUSED_LOCAL');
});


test('Go integer bindings retain authored aliases and widths; mutations cannot hide behind number pins', async () => {
  const source = 'package sample\nfunc identity(value int64) int64 { copy := value; return copy }\nfunc pipeline(value int64) int64 { return identity(value) }';
  const preview = await previewGoImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const original = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const fn = original.functions.find(fn => fn.name === 'identity')!;
  const owner = Object.values(original.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId === fn.id)!;
  fn.overloads[0].parameters[0].label = 'renamed';
  owner.data = applyFunctionImplementBinding(owner.data, fn);
  const entry = original.documents[fn.overloads[0].graphTabId!].nodes.find(node => node.data.kindId === 'function_entry')!;
  entry.data = applyFunctionEntryBinding(entry.data, fn);
  const output = emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(original)))!);
  expect(output.files[0].content).toContain('identity(renamed int64) int64');
  for (const mode of ['parameter-width', 'return-sign', 'local-width', 'untyped-initializer', 'callee-width']) {
    const snapshot = structuredClone(original);
    const allNodes = Object.values(snapshot.documents).flatMap(doc => doc.nodes);
    const define = allNodes.find(node => node.id === owner.id)!;
    if (mode === 'parameter-width') (define.data.properties!.nativeParameters as { nativeType: string }[])[0].nativeType = 'int8';
    if (mode === 'return-sign') define.data.properties!.nativeReturnType = 'uint64';
    const body = snapshot.documents[fn.overloads[0].graphTabId!];
    const local = body.nodes.find(node => node.data.kindId === 'var_define')!;
    if (mode === 'local-width') local.data.properties!.nativeType = 'int32';
    if (mode === 'untyped-initializer') { body.edges = body.edges.filter(edge => !(edge.target === local.id && edge.targetHandle === 'value')); local.data.inlineValues.value = 1; }
    if (mode === 'callee-width') { const callee = allNodes.find(node => node.data.kindId === 'function_implement' && node.data.graphBinding?.symbolId !== fn.id)!; (callee.data.properties!.nativeParameters as { nativeType: string }[])[0].nativeType = 'uint64'; }
    expect(() => emitProjectLikeCodePanel(snapshot), mode).toThrow('NATIVE_');
  }
});

test('Go exact integer payloads preserve magnitude and block overflow, injection and target changes after reload', async () => {
  for (const source of ['package sample\nfunc maximum() uint64 { return 18446744073709551615 }', 'package sample\nfunc boundary() int { copy := 2147483648; return copy }']) {
    const preview = await previewGoImport(source, 64);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.diagnostics).toEqual([]);
    const original = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
    expect(normalizedGoSyntax(emitProjectLikeCodePanel(original).files[0].content)).toBe(normalizedGoSyntax(source));
    for (const mode of ['overflow', 'injection', 'word-size', 'missing-context']) {
      const snapshot = structuredClone(original);
      const nodes = Object.values(snapshot.documents).flatMap(doc => doc.nodes);
      const literal = nodes.find(node => node.data.kindId === 'expr_native_literal')!;
      const clause = nodes.find(node => node.data.kindId === 'source_package')!;
      if (mode === 'overflow') literal.data.properties!.payload = '18446744073709551616';
      if (mode === 'injection') literal.data.properties!.payload = '1; return 2';
      if (mode === 'word-size') { clause.data.properties!.goWordBits = source.includes('boundary') ? '32' : '16'; }
      if (mode === 'missing-context') delete clause.data.properties!.goWordBits;
      expect(() => emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!), mode).toThrow('NATIVE_');
    }
  }
});
test('Go worker seals target word size and re-import retains it while rejecting stale context receipts', async () => {
  const worker = createSourceImportWorkerService();
  const source = 'package sample\nfunc count() int { return 1 }';
  const reviewed = await worker({ id: 1, kind: 'review', language: 'go', goWordBits: 32, source, fileName: 'sample.go', mapStart: false, entryPolicy: 'library', regionIndex: 0 });
  expect(reviewed.ok).toBe(true); if (!reviewed.ok) return;
  const review = reviewed.result as WorkerGraphReview;
  expect(review.diagnostics).toEqual([]);
  const request = { kind: 'accept' as const, language: 'go' as const, source, fileName: 'sample.go', mapStart: false, entryPolicy: 'library' as const, receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot) };
  const wrong = await worker({ id: 2, ...request, goWordBits: 64 });
  expect(wrong.ok).toBe(false); if (!wrong.ok) expect(wrong.error).toBe('STALE_GO_WORD_SIZE');
  const accepted = await worker({ id: 3, ...request, goWordBits: 32 });
  expect(accepted.ok).toBe(true); if (!accepted.ok) return;
  const snapshot = accepted.result as import('@vvs/graph-types').ProjectSnapshot;
  const replacement = source.replace('return 1', 'return 2');
  const reimported = await worker({ id: 4, kind: 'review_reimport', snapshot, source: replacement, fileName: 'sample.go' });
  expect(reimported.ok).toBe(true); if (!reimported.ok) return;
  const next = reimported.result as import('./sourceImportWorkerProtocol').WorkerReimportReview;
  expect(next.diagnostics).toEqual([]);
  const changed = structuredClone(snapshot);
  Object.values(changed.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'source_package')!.data.properties!.goWordBits = '64';
  const stale = await worker({ id: 5, kind: 'accept_reimport', snapshot: changed, source: replacement, receipt: next.receipt });
  expect(stale.ok).toBe(false);
  const fresh = await worker({ id: 6, kind: 'review_reimport', snapshot, source: replacement, fileName: 'sample.go' });
  expect(fresh.ok).toBe(true); if (!fresh.ok) return;
  const result = await worker({ id: 7, kind: 'accept_reimport', snapshot, source: replacement, receipt: (fresh.result as import('./sourceImportWorkerProtocol').WorkerReimportReview).receipt });
  expect(result.ok).toBe(true); if (!result.ok) return;
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(result.result)))!;
  expect(Object.values(loaded.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'source_package')!.data.properties!.goWordBits).toBe('32');
  expect(emitProjectLikeCodePanel(loaded).files[0].content).toContain('return 2');
});

test('Go shift contexts and compound assignments reject incompatible visible edits after reload', async () => {
  for (const source of [
    'package sample\nfunc shift(count uint8) uint8 { return 128 << count }',
    'package sample\nfunc compound(value uint8) uint8 { copy := value; copy %= 3; return copy }',
    'package sample\nfunc shift(value uint8) uint8 { return value << 18446744073709551615 }',
  ]) {
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.diagnostics).toEqual([]);
    const original = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
    expect(normalizedGoSyntax(emitProjectLikeCodePanel(original).files[0].content)).toBe(normalizedGoSyntax(source));
    const changed = structuredClone(original);
    const nodes = Object.values(changed.documents).flatMap(doc => doc.nodes);
    if (source.includes('128')) nodes.find(node => node.data.kindId === 'function_implement')!.data.properties!.nativeReturnType = 'int8';
    else if (source.includes('%=')) nodes.find(node => node.data.kindId === 'expr_native_literal')!.data.properties!.payload = '0';
    else nodes.find(node => node.data.kindId === 'source_package')!.data.properties!.goWordBits = '32';
    expect(() => emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(changed)))!)).toThrow('NATIVE_');
  }
});

test('Go exact floating payload edits and inferred domains remain checked after JSON reload', async () => {
  for (const source of [
    'package sample\nfunc sum() float64 { value := .1 + .2; return value }',
    'package sample\nfunc integral() uint64 { return 18446744073709551615.0 }',
  ]) {
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.diagnostics).toEqual([]);
    const original = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
    expect(normalizedGoSyntax(emitProjectLikeCodePanel(original).files[0].content)).toBe(normalizedGoSyntax(source));
    if (source.includes('sum')) {
      const changed = structuredClone(original);
      const body = Object.values(changed.documents).find(doc => doc.nodes.some(node => node.data.kindId === 'var_define'))!;
      const local = body.nodes.find(node => node.data.kindId === 'var_define')!;
      body.edges = body.edges.filter(edge => !(edge.target === local.id && edge.targetHandle === 'value'));
      local.data.inlineValues.value = 1;
      expect(() => emitProjectLikeCodePanel(changed)).toThrow('NATIVE_');
    }
    for (const token of ['1e309', '1.5', '1.0; return 2']) {
      if (source.includes('sum') && token === '1.5') continue;
      const changed = structuredClone(original);
      Object.values(changed.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'expr_native_literal')!.data.properties!.payload = token;
      expect(() => emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(changed)))!)).toThrow('NATIVE_');
    }
  }
});

test('Go conversion inspector targets retain saved edits and block incompatible or shadowed targets', async () => {
  const source = 'package sample\nfunc convert(value int64) float32 { return float32(value) }';
  const preview = await previewGoImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const original = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const nodes = Object.values(original.documents).flatMap(doc => doc.nodes);
  const cast = nodes.find(node => node.data.properties?.nativeForm === 'conversion')!;
  expect(emitProjectLikeCodePanel(original).sourceMap[cast.id]?.length).toBeGreaterThan(0);
  for (const target of ['float64', 'uint8', 'invalid); evil(']) {
    const changed = structuredClone(original);
    Object.values(changed.documents).flatMap(doc => doc.nodes).find(node => node.id === cast.id)!.data.properties!.nativeTargetType = target;
    expect(() => emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(changed)))!)).toThrow('NATIVE_');
  }
  const changed = structuredClone(original);
  const changedNodes = Object.values(changed.documents).flatMap(doc => doc.nodes);
  changedNodes.find(node => node.id === cast.id)!.data.properties!.nativeTargetType = 'float64';
  changedNodes.find(node => node.data.kindId === 'function_implement')!.data.properties!.nativeReturnType = 'float64';
  const edited = emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(changed)))!);
  expect(edited.files[0].content).toContain('float64(value)');
  expect(edited.files[0].content).toContain(') float64');
  const shadowed = structuredClone(original);
  const owner = Object.values(shadowed.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'function_implement')!;
  (owner.data.properties!.nativeParameters as { name: string }[])[0].name = 'float32';
  expect(() => emitProjectLikeCodePanel(shadowed)).toThrow('NATIVE_GO_CONVERSION_SHADOWED');
});

test('Go saved conversion without a destination cannot acquire a default that changes rounding', async () => {
  const source = 'package sample\nfunc constant() float64 { return float64(float32(.1)) }';
  const preview = await previewGoImport(source);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  const cast = Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.nativeTargetType === 'float32')!;
  delete cast.data.properties!.nativeTargetType;
  cast.data = normalizeNodeData(cast.data);
  expect(() => emitProjectLikeCodePanel(snapshot)).toThrow('NATIVE_');
});
