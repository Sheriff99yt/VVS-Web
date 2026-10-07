import cases from './native-inferred-local-cases.json';
export const nativeInferredGraphFixtures = {
  cpp: [...cases.cpp.filter(fixture => 'types' in fixture), { id: 'auto-group', source: 'int probe(int a) { auto first = a, second = first + 1; second = second + a; return second; }\n' }, { id: 'promotion', source: 'int probe(unsigned char a) { auto first = a + 1; return first; }\n' }],
  rust: cases.rust.filter(fixture => 'types' in fixture),
  gdscript: cases.gdscript.filter(fixture => 'types' in fixture),
};
