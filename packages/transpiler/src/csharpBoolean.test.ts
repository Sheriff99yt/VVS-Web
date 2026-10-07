import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from './generate';
import saved from '../test/csharp-boolean.fixture.json';
test('fixed saved Boolean method prints exact source and spans through the canonical project path', () => {
  const snapshot = normalizeProjectSnapshot(structuredClone(saved))!;
  const result = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  expect(result.files[0].content).toBe('class BooleanGraph {\n    public static bool Test(uint Input, long Other) {\n        return (Input < Other);\n    }\n}');
  const doc = snapshot.documents[snapshot.functions[0].id], comparison = doc.nodes.find(node => node.data.properties?.operator === '<')!;
  expect(comparison.data.outputs[0].type).toBe('data_boolean');
  expect(result.sourceMap[comparison.id]?.length).toBeGreaterThan(0);
  comparison.data.properties!.operator = '&&';
  expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow();
  comparison.data.properties!.operator = '>=';
  expect(transpileProject({ ...snapshot, projectEvents: snapshot.events }).files[0].content).toContain('return (Input >= Other);');
});
