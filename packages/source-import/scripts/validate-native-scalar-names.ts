import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NATIVE_SCALAR_KEYWORD_CANDIDATES, nativeScalarFunctionSignatureProblem } from '@vvs/graph-types';
const root = join(import.meta.dir, '../../..'), directory = join(root, 'scratch/native-scalar-names');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = {};
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  fixtures[language] = [];
  const allowed = ['value', 'Value', '_value', 'Value_2', ...(language === 'rust' ? ['union', 'macro_rules', 'raw', 'safe', 'gen'] : [])];
  for (const [index, name] of [...NATIVE_SCALAR_KEYWORD_CANDIDATES[language], ...allowed].entries()) for (const role of ['function', 'parameter']) {
    const functionName = role === 'function' ? name : 'sample', parameterName = role === 'parameter' ? name : 'value';
    const source = language === 'cpp' ? `bool ${functionName}(bool ${parameterName}) { return ${parameterName}; }\n` : language === 'rust' ? `fn ${functionName}(${parameterName}:bool)->bool { ${parameterName} }\n` : `func ${functionName}(${parameterName}:bool)->bool:\n    return ${parameterName}\n`;
    const valid = !nativeScalarFunctionSignatureProblem({ language, name: functionName, authoredReturnType: 'bool', nativeReturnType: 'bool', parameters: [{ name: parameterName, authoredType: 'bool', nativeType: 'bool', mutable: true }] });
    fixtures[language].push({ id: `${role}-${index}-${name}`, source, valid });
  }
  if (language === 'gdscript') {
    for (const name of ['bool', 'int']) for (const type of ['bool', 'int']) {
      const header = { language, name: 'sample', authoredReturnType: type, nativeReturnType: type, parameters: [{ name, authoredType: type, nativeType: type, mutable: true }] };
      fixtures[language].push({ id: `type-shadow-${name}-${type}`, source: `func sample(${name}:${type})->${type}:\n    return ${name}\n`, valid: !nativeScalarFunctionSignatureProblem(header) });
    }
    for (const type of ['bool', 'int']) fixtures[language].push({ id: `function-conversion-${type}`, source: `func ${type}()->${type}:\n    return ${type}(0)\n`, valid: true });
  }
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const previous = process.argv.includes('--retry-failed-native') ? JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8')) : undefined;
const retry = previous?.cases.filter((row: { errors: string[] }) => row.errors.length).map((row: { language: string; id: string }) => `${row.language}/${row.id}`);
const child = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_scalar_names.py', ...(retry?.length ? [`--retry-native=${retry.join(',')}`] : [])], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await child.exited) throw new Error('Native keyword binding contrasts failed');
console.log('Native keyword function/parameter compiler contrasts passed; Unicode, raw identifiers and implementation-reserved C++ names remain separate contracts.');
