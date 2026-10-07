import cases from './native-inference-edit-cases.json';
export const nativeInferenceEditFixtures = cases;
export const nativeInferenceGroupEdits = {
  chain: 'int grouped(int a) { auto first = a, second = first; return second; }\n',
  mixed: 'int grouped(int a) { auto first = a, second = 1; return second; }\n',
};
