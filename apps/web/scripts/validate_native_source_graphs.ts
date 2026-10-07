import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { reviewNativeScalarImportGraph, acceptSourceImportReview } from '@vvs/source-import/validation';
import { configureNativeInventoryRuntime } from '../../../packages/source-import/test/nativeInventoryRuntime';
import { nativeScalarSourceFixtures } from '../../../packages/source-import/test/nativeScalarSourceFixtures';
import { nativeRuntimeSourceFixtures } from '../../../packages/source-import/test/nativeRuntimeSourceFixtures';
import { nativeInferredGraphFixtures } from '../../../packages/source-import/test/nativeInferredGraphFixtures';
import { nativeInferenceEditFixtures, nativeInferenceGroupEdits } from '../../../packages/source-import/test/nativeInferenceEditFixtures';
import localCases from '../../../packages/source-import/test/native-local-source-cases.json';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { reconcileNativeScalarInferences, transactNativeScalarExpressionProperty, transactNativeScalarSignature, transactNativeScalarLocal, transactNativeScalarDeclarationMode, transactNativeScalarDeclarationGroup, editNativeScalarParameterType, editNativeScalarReturnType, normalizeProjectSnapshot } from '@vvs/graph-types';
import { emitProjectLikeCodePanel } from '../src/lib/emitProjectCode';
configureNativeInventoryRuntime();
const directory = join(import.meta.dir, '../../../scratch/native-source-graphs');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = {};
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const original = nativeScalarSourceFixtures[language];
  const fileName = `sample.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`;
  const preview = await reviewNativeScalarImportGraph(original, language, fileName);
  if (!preview.snapshot || preview.diagnostics.length) throw new Error(JSON.stringify(preview.diagnostics));
  const accepted = await acceptSourceImportReview(preview, original, fileName, false, 'library');
  const path = join(directory, `${language}.vvs.json`);
  writeFileSync(path, JSON.stringify(accepted, null, 2) + '\n');
  const result = emitProjectLikeCodePanel(JSON.parse(readFileSync(path, 'utf8')));
  if (result.files.length !== 1) throw new Error('One source module must emit one file');
  const generated = result.files[0].content;
  writeFileSync(join(directory, `${language}.code-panel.json`), JSON.stringify(result, null, 2) + '\n');
  fixtures[language] = [{ id: 'original-module', source: original, valid: true }, { id: 'generated-module', source: generated, valid: true }, { id: 'invalid-reference', source: generated.replace(language === 'rust' ? '    value\n' : 'return value', language === 'rust' ? '    MissingValue\n' : 'return MissingValue'), valid: false }];
  if (fixtures[language][2].source === generated) throw new Error('Native rejection mutation missed its source');
  const edited = structuredClone(accepted);
  Object.values(edited.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '5')!.data.properties!.payload = '6';
  fixtures[language].push({ id: 'edited-constant-module', source: emitProjectLikeCodePanel(edited).files[0].content, valid: true });
  const incoming = await reviewNativeScalarImportGraph(original.replace('-(-5)', '-(-7)'), language, fileName);
  if (!incoming.snapshot) throw new Error(JSON.stringify(incoming.diagnostics));
  fixtures[language].push({ id: 'incoming-constant-module', source: incoming.generated, valid: true });
  const definition = accepted.documents['main-graph'].nodes.find(node => node.data.properties?.functionName === 'Value')!;
  const parameterId = (definition.data.properties!.nativeParameters as { id: string }[])[0].id;
  const editedSignature = editNativeScalarReturnType(editNativeScalarParameterType(definition.data, parameterId, 'bool'), 'bool');
  const transaction = transactNativeScalarSignature(accepted, definition.id, editedSignature);
  fixtures[language].push({ id: 'signature-bool-domain-edit', source: emitProjectLikeCodePanel({ ...accepted, ...transaction }).files[0].content, valid: true });
  if (language === 'rust') {
    const definition = edited.documents['main-graph'].nodes.find(node => node.data.properties?.functionName === 'value')!;
    definition.data.properties!.nativeAuthoredReturnType = 'i8'; definition.data.properties!.nativeReturnType = 'i8';
    fixtures[language].push({ id: 'edited-return-context', source: emitProjectLikeCodePanel(edited).files[0].content, valid: true });
  }
}
fixtures.cpp.push({ id: 'ordinary-main-native-valid', source: 'int main() { return 0; }', valid: true }, { id: 'bool-main-native-invalid', source: 'bool main() { return true; }', valid: false });
fixtures.rust.push({ id: 'library-main-ordinary', source: 'fn main() -> bool { true }', valid: true });
fixtures.gdscript.push({ id: 'constructor-native-valid', source: 'func _init() -> void:\n    pass\n', valid: true }, { id: 'constructor-value-native-invalid', source: 'func _init() -> int:\n    return 1\n', valid: false });
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const source = nativeRuntimeSourceFixtures[language];
  const fileName = `runtime.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`;
  const preview = await reviewNativeScalarImportGraph(source, language, fileName, false, 'library');
  if (!preview.snapshot || preview.diagnostics.length) throw new Error(JSON.stringify(preview.diagnostics));
  const accepted = await acceptSourceImportReview(preview, source, fileName, false, 'library');
  const path = join(directory, `${language}.runtime.vvs.json`);
  writeFileSync(path, JSON.stringify(accepted, null, 2) + '\n');
  const project = JSON.parse(readFileSync(path, 'utf8'));
  const output = emitProjectLikeCodePanel(project);
  if (output.files.length !== 1) throw new Error('One runtime module must emit one file');
  writeFileSync(join(directory, `${language}.runtime.code-panel.json`), JSON.stringify(output, null, 2) + '\n');
  fixtures[language].push({ id: 'runtime-original', source, valid: true }, { id: 'runtime-generated', source: output.files[0].content, valid: true });
  const literal = Object.values(project.documents).flatMap((doc) => (doc as { nodes: { data: { properties?: Record<string, unknown> } }[] }).nodes).find(node => node.data.properties?.payload === '2')!;
  literal.data.properties!.payload = '3';
  fixtures[language].push({ id: 'runtime-edited', source: emitProjectLikeCodePanel(project).files[0].content, valid: true });
  const operator = Object.values(project.documents).flatMap((doc) => (doc as { nodes: { data: { properties?: Record<string, unknown> } }[] }).nodes).find(node => node.data.properties?.operator === '*')!;
  operator.data.properties!.operator = '+';
  fixtures[language].push({ id: 'runtime-operator-edited', source: emitProjectLikeCodePanel(project).files[0].content, valid: true });
  const incomingSource = source.replace('* 2', '* 4');
  if (incomingSource === source) throw new Error('Runtime incoming mutation missed its source');
  const incomingReview = await reviewNativeScalarImportGraph(incomingSource, language, fileName, false, 'library');
  const incomingAccepted = await acceptSourceImportReview(incomingReview, incomingSource, fileName, false, 'library');
  fixtures[language].push({ id: 'runtime-incoming', source: emitProjectLikeCodePanel(incomingAccepted).files[0].content, valid: true });
}
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const source = localCases[language][0].source;
  const preview = await previewNativeScalarSourceGraphs(source, language, { fileName: `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, entryPolicy: 'library', localStatements: true });
  if (!preview.snapshot || preview.diagnostics.length) throw new Error(JSON.stringify(preview.diagnostics));
  const path = join(directory, `${language}.locals.vvs.json`);
  const localReview = await reviewNativeScalarImportGraph(source, language, `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`);
  if (localReview.diagnostics.length) throw new Error(JSON.stringify(localReview.diagnostics));
  const localAccepted = await acceptSourceImportReview(localReview, source, `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, false, 'library');
  writeFileSync(path, JSON.stringify(localAccepted, null, 2) + '\n');
  const project = normalizeProjectSnapshot(JSON.parse(readFileSync(path, 'utf8')))!;
  const output = emitProjectLikeCodePanel(project);
  if (output.files.length !== 1) throw new Error('One local module must emit one file');
  writeFileSync(join(directory, `${language}.locals.code-panel.json`), JSON.stringify(output, null, 2) + '\n');
  const localModeBase = structuredClone(project);
  fixtures[language].push({ id: 'local-generated', source: output.files[0].content, valid: true });
  const literal = Object.values(project.documents).flatMap((doc) => (doc as { nodes: { data: { properties?: Record<string, unknown> } }[] }).nodes).find(node => node.data.properties?.payload === '2')!;
  literal.data.properties!.payload = '3';
  fixtures[language].push({ id: 'local-edited', source: emitProjectLikeCodePanel(project).files[0].content, valid: true });
  const declaration = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'result')!;
  const renamed = { ...project, ...transactNativeScalarLocal(project, declaration.id, { name: 'editedResult' }) };
  fixtures[language].push({ id: 'local-renamed', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(renamed)))!).files[0].content, valid: true });
  const inferredMode = { ...localModeBase, ...transactNativeScalarDeclarationMode(localModeBase, declaration.id, { declarationMode: 'inferred' }) };
  fixtures[language].push({ id: 'local-mode-inferred', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(inferredMode)))!).files[0].content, valid: true });

  const incomingLocalSource = source.replace('* 2', '* 4');
  const incomingLocalReview = await reviewNativeScalarImportGraph(incomingLocalSource, language, `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`);
  const incomingLocal = await acceptSourceImportReview(incomingLocalReview, incomingLocalSource, `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, false, 'library');
  fixtures[language].push({ id: 'local-incoming', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(incomingLocal)))!).files[0].content, valid: true });
  if (language !== 'cpp') {
    const special = await previewNativeScalarSourceGraphs(localCases[language][1].source, language, { fileName: `special.${language === 'rust' ? 'rs' : 'gd'}`, entryPolicy: 'library', localStatements: true });
    if (!special.snapshot || special.diagnostics.length) throw new Error(JSON.stringify(special.diagnostics));
    const specialPath = join(directory, `${language}.local-special.vvs.json`);
    writeFileSync(specialPath, JSON.stringify(special.snapshot, null, 2) + '\n');
    fixtures[language].push({ id: language === 'rust' ? 'local-shadow-generated' : 'local-constant-generated', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(readFileSync(specialPath, 'utf8')))!).files[0].content, valid: true });
  }
}
for (const readonly of [false, true]) {
  const source = readonly ? 'int grouped(int a) { const int first = a, second = first + 1; return second; }\n' : localCases.cpp[1].source;
  const preview = await previewNativeScalarSourceGraphs(source, 'cpp', { fileName: 'grouped.cpp', entryPolicy: 'library', localStatements: true, groupedDeclarations: true });
  if (!preview.snapshot || preview.diagnostics.length) throw new Error(JSON.stringify(preview.diagnostics));
  const path = join(directory, `cpp.grouped-${readonly ? 'const' : 'mutable'}.vvs.json`);
  writeFileSync(path, JSON.stringify(preview.snapshot, null, 2) + '\n');
  const project = normalizeProjectSnapshot(JSON.parse(readFileSync(path, 'utf8')))!;
  const output = emitProjectLikeCodePanel(project);
  fixtures.cpp.push({ id: readonly ? 'const-group-generated' : 'grouped-generated', source: output.files[0].content, valid: true });
  if (readonly) fixtures.cpp.push({ id: 'const-group-original', source, valid: true });
  else {
    const literal = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '1')!;
    literal.data.properties!.payload = '2';
    fixtures.cpp.push({ id: 'grouped-edited', source: emitProjectLikeCodePanel(project).files[0].content, valid: true });
  }
}
const groupedBodySource = 'int grouped(int a) { int first = a, second = first + 1; second = second + a; return second; }\n';
const groupedBodyReview = await reviewNativeScalarImportGraph(groupedBodySource, 'cpp', 'grouped.cpp');
if (groupedBodyReview.diagnostics.length) throw new Error(JSON.stringify(groupedBodyReview.diagnostics));
const groupedBodyAccepted = await acceptSourceImportReview(groupedBodyReview, groupedBodySource, 'grouped.cpp', false, 'library');
const groupedBodyPath = join(directory, 'cpp.group-body.vvs.json');
writeFileSync(groupedBodyPath, JSON.stringify(groupedBodyAccepted, null, 2) + '\n');
const groupedBody = normalizeProjectSnapshot(JSON.parse(readFileSync(groupedBodyPath, 'utf8')))!;
fixtures.cpp.push({ id: 'group-body-original', source: groupedBodySource, valid: true }, { id: 'group-body-generated', source: emitProjectLikeCodePanel(groupedBody).files[0].content, valid: true });
const groupedSecond = Object.values(groupedBody.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'second')!;
const groupedRenamed = { ...groupedBody, ...transactNativeScalarLocal(groupedBody, groupedSecond.id, { name: 'editedSecond' }) };
fixtures.cpp.push({ id: 'group-body-renamed', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(groupedRenamed)))!).files[0].content, valid: true });
const groupOwner = Object.values(groupedBody.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'native_declaration_group')!;
const groupAlias = { ...groupedBody, ...transactNativeScalarDeclarationGroup(groupedBody, groupOwner.id, { authoredType: 'signed int' }) };
fixtures.cpp.push({ id: 'group-alias-edited', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(groupAlias)))!).files[0].content, valid: true });
const groupIncomingSource = groupedBodySource.replace('first + 1', 'first + 2');
const groupIncomingReview = await reviewNativeScalarImportGraph(groupIncomingSource, 'cpp', 'grouped.cpp');
const groupIncoming = await acceptSourceImportReview(groupIncomingReview, groupIncomingSource, 'grouped.cpp', false, 'library');
fixtures.cpp.push({ id: 'group-body-incoming', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(groupIncoming)))!).files[0].content, valid: true });
fixtures.cpp.push({ id: 'group-body-readonly-invalid', source: groupedBodySource.replace('int first', 'const int first'), valid: false });
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of nativeInferredGraphFixtures[language]) {
  const preview = await previewNativeScalarSourceGraphs(fixture.source, language, { fileName: 'inferred.' + { cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language], entryPolicy: 'library', runtimeExpressions: true, localStatements: true, groupedDeclarations: true, inferredLocals: true });
  if (!preview.snapshot || preview.diagnostics.length) throw new Error(JSON.stringify(preview.diagnostics));
  const path = join(directory, `${language}.inferred-${fixture.id}.vvs.json`);
  writeFileSync(path, JSON.stringify(preview.snapshot, null, 2) + '\n');
  const project = normalizeProjectSnapshot(JSON.parse(readFileSync(path, 'utf8')))!;
  const output = emitProjectLikeCodePanel(project);
  writeFileSync(join(directory, `${language}.inferred-${fixture.id}.code-panel.json`), JSON.stringify(output, null, 2) + '\n');
  fixtures[language].push({ id: `inferred-${fixture.id}-generated`, source: output.files[0].content, valid: true });
  const first = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'var_define')!;
  const typedMode = { ...project, ...transactNativeScalarDeclarationMode(project, first.id, { declarationMode: 'typed' }) };
  fixtures[language].push({ id: `inferred-${fixture.id}-mode-typed`, source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(typedMode)))!).files[0].content, valid: true });

  const declaration = Object.values(project.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'var_define').at(-1)!;
  const renamed = { ...project, ...transactNativeScalarLocal(project, declaration.id, { name: 'editedLocal' }) };
  fixtures[language].push({ id: `inferred-${fixture.id}-renamed`, source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(renamed)))!).files[0].content, valid: true });
  if (language === 'cpp' && ['auto-group', 'promotion'].includes(fixture.id)) fixtures.cpp.push({ id: `inferred-${fixture.id}-original`, source: fixture.source, valid: true });
}
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const kind of ['chain', 'expression', 'literal'] as const) {
  const fixture = nativeInferenceEditFixtures[language];
  const preview = await previewNativeScalarSourceGraphs(fixture[kind], language, { fileName: `edit-${kind}.${fixture.extension}`, entryPolicy: 'library', localStatements: true, runtimeExpressions: true, inferredLocals: true });
  if (!preview.snapshot || preview.diagnostics.length) throw new Error(JSON.stringify(preview.diagnostics));
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const definition = project.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
  const type = kind === 'chain' ? fixture.changed : kind === 'literal' ? 'bool' : fixture.integer;
  let edited = project;
  if (kind === 'chain') {
    const param = (definition.data.properties!.nativeParameters as { id: string }[])[0];
    const signature = transactNativeScalarSignature(project, definition.id, editNativeScalarReturnType(editNativeScalarParameterType(definition.data, param.id, type), type));
    const inferred = reconcileNativeScalarInferences({ ...project, ...signature }, definition.id);
    if (inferred.diagnostics.length) throw new Error(inferred.diagnostics.join(','));
    edited = { ...project, ...signature, ...inferred };
  } else {
    const expression = Object.values(project.documents).flatMap(doc => doc.nodes).find(node => kind === 'literal' ? node.data.kindId === 'expr_native_literal' : node.data.properties?.operator === '<')!;
    const edit = transactNativeScalarExpressionProperty(project, expression.id, kind === 'literal' ? 'payload' : 'operator', kind === 'literal' ? 'true' : '+');
    if (edit.diagnostics.length) throw new Error(edit.diagnostics.join(','));
    const signature = transactNativeScalarSignature({ ...project, ...edit }, definition.id, editNativeScalarReturnType(definition.data, type));
    const inferred = reconcileNativeScalarInferences({ ...project, ...signature, ...edit, documents: signature.documents }, definition.id);
    if (inferred.diagnostics.length) throw new Error(inferred.diagnostics.join(','));
    edited = { ...project, ...signature, ...inferred };
  }
  const path = join(directory, `${language}.inference-edit-${kind}.vvs.json`);
  writeFileSync(path, JSON.stringify(edited, null, 2) + '\n');
  const output = emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(readFileSync(path, 'utf8')))!);
  writeFileSync(join(directory, `${language}.inference-edit-${kind}.code-panel.json`), JSON.stringify(output, null, 2) + '\n');
  if (output.files.length !== 1) throw new Error('Missing reconciled Code-panel file');
  const generated = output.files[0].content;
  fixtures[language].push({ id: `inference-edit-${kind}-original`, source: fixture[kind], valid: true }, { id: `inference-edit-${kind}-typed-original`, source: fixture[`${kind}Typed`], valid: true }, { id: `inference-edit-${kind}-generated`, source: generated, valid: true });
  const typed = fixture[`${kind}Typed`];
  const incoming = kind === 'chain' ? typed.replaceAll('first', 'incomingFirst') : kind === 'expression' ? typed.replace('< b', '<= b') : language === 'rust' ? typed.replace('1i32', '2i32') : typed.replace('= 1', '= 2');
  if (incoming === typed) throw new Error('Missing browser incoming source witness');
  fixtures[language].push({ id: `inference-edit-${kind}-typed-incoming`, source: incoming, valid: true });
  if (language !== 'gdscript') {
    const names = kind === 'chain' ? ['first', 'second'] : ['result'];
    const assertions = names.map(name => language === 'cpp' ? `static_assert(__is_same(decltype(${name}), ${type}), "deduction");` : `let _: ${type} = ${name};`).join(' ');
    const wrong = names.map(name => language === 'cpp' ? `static_assert(__is_same(decltype(${name}), void), "deduction");` : `let _: () = ${name};`).join(' ');
    const anchor = language === 'cpp' ? 'return ' : `    ${kind === 'chain' ? 'second' : 'result'}\n`;
    if (!generated.includes(anchor)) throw new Error('Missing actual Code-panel proof anchor');
    fixtures[language].push({ id: `inference-edit-${kind}-type-proof`, source: generated.replace(anchor, `${assertions} ${anchor}`), valid: true }, { id: `inference-edit-${kind}-wrong-type`, source: generated.replace(anchor, `${wrong} ${anchor}`), valid: false });
  }
}
for (const kind of ['chain', 'mixed'] as const) {
  const source = nativeInferenceGroupEdits[kind];
  const preview = await previewNativeScalarSourceGraphs(source, 'cpp', { fileName: 'inference-group.cpp', entryPolicy: 'library', localStatements: true, inferredLocals: true, groupedDeclarations: true });
  if (!preview.snapshot) throw new Error(JSON.stringify(preview.diagnostics));
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const definition = project.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
  const param = (definition.data.properties!.nativeParameters as { id: string }[])[0];
  const signature = transactNativeScalarSignature(project, definition.id, editNativeScalarReturnType(editNativeScalarParameterType(definition.data, param.id, 'bool'), 'bool'));
  const inferred = reconcileNativeScalarInferences({ ...project, ...signature }, definition.id);
  fixtures.cpp.push({ id: `inference-edit-group-${kind}-original`, source, valid: true });
  if (kind === 'mixed') {
    if (!inferred.diagnostics.some(code => code.includes('GROUP_DEDUCTION'))) throw new Error('Missing group deduction rejection');
    fixtures.cpp.push({ id: 'inference-edit-group-mixed-invalid', source: source.replace('int grouped(int a)', 'bool grouped(bool a)'), valid: false });
    const literal = signature.documents[project.functions[0].id].nodes.find(node => node.data.kindId === 'expr_native_literal')!;
    const recovered = transactNativeScalarExpressionProperty({ ...project, ...signature }, literal.id, 'payload', 'true');
    if (recovered.diagnostics.length) throw new Error(recovered.diagnostics.join(','));
    fixtures.cpp.push({ id: 'inference-edit-group-mixed-recovered', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify({ ...project, ...signature, ...recovered })))!).files[0].content, valid: true });
  } else {
    if (inferred.diagnostics.length) throw new Error(inferred.diagnostics.join(','));
    fixtures.cpp.push({ id: 'inference-edit-group-chain-generated', source: emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify({ ...project, ...signature, ...inferred })))!).files[0].content, valid: true });
  }
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const retry = process.argv.find(arg => arg.startsWith('--retry-native='));
const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_source_graphs.py', ...(retry ? [retry] : [])], { stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Native source/graph checks failed');
const report = JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8'));
for (const [language, inputs] of Object.entries(fixtures)) for (const fixture of inputs) {
  const observed = report.cases.find((item: { language: string; id: string; sourceSha256: string; expectedValid: boolean; exitCode: number }) => item.language === language && item.id === fixture.id);
  if (!observed || observed.sourceSha256 !== new Bun.CryptoHasher('sha256').update(fixture.source).digest('hex') || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error('Native source/Code-panel evidence mismatch');
}
console.log(`${report.cases.length} native checks: sealed scalar/runtime modules and persisted local/group and opt-in inferred graphs with coordinated edits, Rust shadowing and Godot constants. Browser lifecycle evidence is recorded by separate explicit stages.`);
