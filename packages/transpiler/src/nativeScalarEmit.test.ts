import { expect, test } from 'bun:test';
import { nativeScalarProjectFixture } from '../test/nativeScalarFixtures';
import { transpileProject } from './generate';
import { analyzeProject, type ProjectSnapshot } from '@vvs/graph-types';

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`native scalar graph emission ${language}`, () => {
  const project = nativeScalarProjectFixture(language);
  const input = { ...project, projectEvents: project.events };
  const result = transpileProject(input);
  expect(result.files[0].content).toContain('return Value');
  const definition = project.documents['main-graph'].nodes[0];
  definition.data.properties!.nativeReturnType = language === 'rust' ? 'i8' : 'int';
  definition.data.properties!.nativeAuthoredReturnType = definition.data.properties!.nativeReturnType;
  expect(() => transpileProject(input)).toThrow('NATIVE_SCALAR_FUNCTION_BODY');
});

const mutations: [string, (project: ProjectSnapshot) => void, string][] = [
  ['unsupported return style', p => { p.documents['identity-0'].nodes[1].data.properties = { nativeReturnStyle: 'unknown' }; }, 'NATIVE_SCALAR_FUNCTION_BODY'],
  ['missing body', p => { delete p.documents['identity-0']; }, 'NATIVE_SCALAR_FUNCTION_OWNER'],
  ['unknown overload', p => { p.documents['main-graph'].nodes[0].data.graphBinding!.overloadId = 'missing'; }, 'NATIVE_SCALAR_FUNCTION_OWNER'],
  ['duplicate definition', p => { const n = structuredClone(p.documents['main-graph'].nodes[0]); n.id = 'duplicate'; p.documents['main-graph'].nodes.push(n); }, 'NATIVE_SCALAR_FUNCTION_OWNER'],
  ['wrong module owner', p => { p.classes![0].containerId = 'other-home'; }, 'NATIVE_SCALAR_FUNCTION_OWNER'],
  ['symbol parameter mismatch', p => { p.functions[0].overloads[0].parameters[0].label = 'Other'; }, 'NATIVE_SCALAR_FUNCTION_BODY'],
  ['body target mismatch', p => { p.documents['identity-0'].metadata = { targetLanguage: 'python' }; }, 'NATIVE_SCALAR_FUNCTION_BODY'],
  ['orphan expression', p => { const n = structuredClone(p.documents['identity-0'].nodes[1]); n.id = 'orphan'; p.documents['identity-0'].nodes.push(n); }, 'NATIVE_SCALAR_FUNCTION_BODY'],
  ['unknown flow', p => { p.documents['identity-0'].nodes[1].data.kindId = 'flow_while'; }, 'NATIVE_SCALAR_FUNCTION_BODY'],
  ['hidden inline', p => { p.documents['identity-0'].nodes[1].data.inlineValues = { val: true }; }, 'NATIVE_SCALAR_FUNCTION_BODY'],
];
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const [name, mutate, diagnostic] of mutations) test(`${language} native graph blocks ${name}`, () => {
  const project = nativeScalarProjectFixture(language);
  mutate(project);
  expect(analyzeProject(project).diagnostics.some(item => item.level === 'error' && item.code === diagnostic)).toBe(true);
  expect(() => transpileProject({ ...project, projectEvents: project.events })).toThrow(diagnostic);
});
