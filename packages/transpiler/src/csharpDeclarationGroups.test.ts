import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, csharpGroupDeclarations, editCSharpDeclarationGroup } from '@vvs/graph-types';
import { transpileProject } from './generate';
import saved from '../test/csharp-group.fixture.json';

const load = () => normalizeProjectSnapshot(JSON.parse(JSON.stringify(saved)))!;
test('saved declaration group owns one statement and precise declarator/initializer ranges', () => {
  const snapshot = load();
  for (const doc of Object.values(snapshot.documents)) for (const node of doc.nodes) { delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport; }
  const result = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  const code = result.files[0].content;
  expect(code).toBe('class Groups {\n    public static byte Test(byte Input) {\n        byte First = Input, Second = First;\n        Second += First;\n        return Second;\n    }\n}');
  const doc = snapshot.documents[snapshot.functions[0].id];
  const group = doc.nodes.find(node => node.data.kindId === 'csharp_declaration_group')!;
  expect(result.sourceMap[group.id]?.length).toBeGreaterThan(0);
  const members = csharpGroupDeclarations(doc, group.id);
  for (const [index, node] of members.entries()) {
    const range = result.sourceMap[node.id]![0];
    expect(code.split('\n')[range.startLine - 1].slice(range.startCol - 1, range.endCol - 1)).toBe(index ? 'Second = First' : 'First = Input');
  }
  expect(transpileProject({ ...JSON.parse(JSON.stringify(snapshot)), projectEvents: snapshot.events }).files).toEqual(result.files);
});

test('group inspector projection edits every type/readonly binding atomically and supports native recovery', () => {
  const snapshot = load(), tabId = snapshot.functions[0].id, doc = snapshot.documents[tabId];
  const group = doc.nodes.find(node => node.data.kindId === 'csharp_declaration_group')!;
  const before = JSON.stringify(snapshot);
  const update = (nativeType: 'byte' | 'long', style: 'typed' | 'const') => {
    const edit = editCSharpDeclarationGroup(snapshot.documents[tabId], snapshot.variables, group.id, nativeType, style);
    return { ...snapshot, variables: edit.variables, documents: { ...snapshot.documents, [tabId]: edit.document } };
  };
  const readonly = update('byte', 'const');
  expect(readonly.variables.every(variable => variable.flags?.readonly)).toBe(true);
  expect(csharpGroupDeclarations(readonly.documents[tabId], group.id).every(node => node.data.properties?.nativeLocalStyle === 'csharp-const')).toBe(true);
  expect(() => transpileProject({ ...readonly, projectEvents: readonly.events })).toThrow();
  const widened = update('long', 'typed');
  expect(csharpGroupDeclarations(widened.documents[tabId], group.id).every(node => node.data.properties?.nativeType === 'long')).toBe(true);
  expect(() => transpileProject({ ...widened, projectEvents: widened.events })).toThrow();
  const recovered = update('byte', 'typed');
  expect(transpileProject({ ...recovered, projectEvents: recovered.events }).files[0].content).toContain('byte First = Input, Second = First;');
  expect(JSON.stringify(snapshot)).toBe(before);
});

test('group mutation guards reject count, order, ownership and shared-type drift', () => {
  for (const change of [
    (snapshot: ReturnType<typeof load>) => {
      const doc = snapshot.documents[snapshot.functions[0].id], group = doc.nodes.find(node => node.data.kindId === 'csharp_declaration_group')!;
      group.data.properties!.nativeType = 'var';
    },
    (snapshot: ReturnType<typeof load>) => {
      const doc = snapshot.documents[snapshot.functions[0].id], group = doc.nodes.find(node => node.data.kindId === 'csharp_declaration_group')!;
      const members = csharpGroupDeclarations(doc, group.id);
      members[1].data.properties!.nativeType = 'int';
    },
    (snapshot: ReturnType<typeof load>) => {
      const doc = snapshot.documents[snapshot.functions[0].id], group = doc.nodes.find(node => node.data.kindId === 'csharp_declaration_group')!;
      const members = csharpGroupDeclarations(doc, group.id);
      doc.edges = doc.edges.filter(edge => !(edge.source === members[0].id && edge.data?.pinType === 'execution'));
    },
    (snapshot: ReturnType<typeof load>) => {
      const doc = snapshot.documents[snapshot.functions[0].id], group = doc.nodes.find(node => node.data.kindId === 'csharp_declaration_group')!;
      const members = csharpGroupDeclarations(doc, group.id);
      const first = doc.edges.find(edge => edge.source === group.id && edge.sourceHandle === 'declarations_exec')!;
      const next = doc.edges.find(edge => edge.source === members[0].id && edge.data?.pinType === 'execution')!;
      first.target = members[1].id; next.source = members[1].id; next.target = members[0].id;
    },
  ]) {
    const snapshot = load(); change(snapshot);
    expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow();
  }
});
