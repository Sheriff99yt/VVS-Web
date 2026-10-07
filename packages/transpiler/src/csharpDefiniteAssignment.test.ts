import { expect, test } from 'bun:test';
import { editCSharpLocalInitializer, normalizeProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from './generate';
import saved from '../test/csharp-definite.fixture.json';
import replacement from '../test/csharp-group.fixture.json';

test('mixed group saves an absent initializer and native plain assignment initializes its visible binding', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(saved))!;
  for (const doc of Object.values(snapshot.documents)) for (const node of doc.nodes) { delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport; }
  const result = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  expect(result.files[0].content).toBe('class Assignment {\n    public static int Test(int Input) {\n        int First, Second = Input;\n        First = Second;\n        Second += First;\n        return Second;\n    }\n}');
  const doc = snapshot.documents[snapshot.functions[0].id];
  const first = doc.nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'First')!;
  expect(first.data.properties?.hasInitializer).toBe(false);
  expect(first.data.inputs.some(pin => pin.id === 'value')).toBe(false);
  expect(doc.edges.some(edge => edge.target === first.id && edge.targetHandle === 'value')).toBe(false);
  expect(result.sourceMap[first.id]?.length).toBeGreaterThan(0);
  const setter = doc.nodes.find(node => node.data.kindId === 'variable_set' && node.data.properties?.assignmentOperator === '=')!;
  setter.data.properties!.assignmentOperator = '+=';
  expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow();
  setter.data.properties!.assignmentOperator = '=';
  expect(transpileProject({ ...snapshot, projectEvents: snapshot.events }).files).toEqual(result.files);
});

test('uninitialized declarations reject hidden operands and assignment self-reads', () => {
  for (const change of [
    (snapshot: NonNullable<ReturnType<typeof normalizeProjectSnapshot>>) => {
      const doc = snapshot.documents[snapshot.functions[0].id], first = doc.nodes.find(node => node.data.properties?.name === 'First' && node.data.kindId === 'var_define')!;
      first.data.inlineValues = { value: 0 };
    },
    (snapshot: NonNullable<ReturnType<typeof normalizeProjectSnapshot>>) => {
      const doc = snapshot.documents[snapshot.functions[0].id], setter = doc.nodes.find(node => node.data.kindId === 'variable_set' && node.data.properties?.assignmentOperator === '=')!;
      const read = doc.nodes.find(node => node.data.kindId === 'variable_get' && node.data.properties?.variableName === 'First')!;
      const edge = doc.edges.find(edge => edge.target === setter.id && edge.targetHandle === 'val')!;
      edge.source = read.id; edge.sourceHandle = 'val';
    },
  ]) { const snapshot = normalizeProjectSnapshot(structuredClone(saved))!; change(snapshot); expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow(); }
});

test('initializer projection creates no default value and prunes only unshared initializer nodes', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(replacement))!;
  const doc = snapshot.documents[snapshot.functions[0].id], declarations = doc.nodes.filter(node => node.data.kindId === 'var_define');
  const first = declarations[0], before = JSON.stringify(doc);
  const disabled = editCSharpLocalInitializer(doc, first.id, false);
  expect(disabled.nodes.find(node => node.id === first.id)?.data.properties?.hasInitializer).toBe(false);
  // Parameter entry feeds the initializer and remains an authored shared owner.
  expect(disabled.nodes.some(node => node.data.kindId === 'function_entry')).toBe(true);
  expect(disabled.edges.some(edge => edge.target === first.id && edge.targetHandle === 'value')).toBe(false);
  const enabled = editCSharpLocalInitializer(disabled, first.id, true);
  expect(enabled.nodes.find(node => node.id === first.id)?.data.inputs.find(pin => pin.id === 'value')).toMatchObject({ type: 'data_number', required: true });
  expect(enabled.edges.some(edge => edge.target === first.id && edge.targetHandle === 'value')).toBe(false);
  expect(enabled.nodes.find(node => node.id === first.id)?.data.inlineValues).toEqual({});
  expect(JSON.stringify(doc)).toBe(before);
});
