import { planGoFile, normalizedGoSyntax, previewGoImport } from './go';
import { planCSharpIntegralClass } from './csharpPlan';
import { normalizedCSharpSyntax, normalizedCSharpReimportSyntax } from './csharpSyntax';
import { planPythonFunction, planPythonClass, normalizedPythonSyntax } from './python';
import { analyzeProject, normalizeProjectSnapshot, resolveCodegenTarget, MAIN_GRAPH_CONTAINER_ID, type ProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from '@vvs/transpiler';
import { resolve } from '@vvs/syntax-registry';
import { getSyntaxPack } from '@vvs/syntax-packs';
import { ImportFailure, IMPORT_LIMITS, MAX_SOURCE_IMPORT_BYTES, type ClassImportPlan, type ImportDiagnostic } from './contracts';
import { parseJavaScript, previewJavaScriptImport, type ImportRegion, type SourceImportPreview } from './parser';
import { planJavaScriptClass, planJavaScriptFunction, planJavaScriptFunctionFile } from './javascriptMappings';
import { materializeImportPlan } from './materialize';
import { previewNativeScalarSourceGraphs } from './nativeScalarSourceGraphs';
import { normalizedNativeScalarSyntax } from './nativeScalarSyntax';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';
export { MAX_SOURCE_IMPORT_BYTES };
export interface SourceImportGraphReview {
  snapshot?: ProjectSnapshot; generated: string; diagnostics: string[]; nodeCount: number;
  issues?: ImportDiagnostic[];
}
/** Deliberately conservative AST comparison, not general semantic equivalence. */
export function normalizedImportSyntax(source: string): string {
  const ast = parseJavaScript(source, 'module');
  const ignored = new Set(['start', 'end', 'loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens', 'errors']);
  // Raw string/directive spelling is only trivia for strings, never directives/strictness.
  return JSON.stringify(ast.program, (key, value) => ignored.has(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
}

/** Re-import must account for supported comments as well as executable syntax. */
function normalizedReimportSyntax(source: string): string {
  return JSON.stringify([normalizedImportSyntax(source), (parseJavaScript(source, 'module').comments ?? []).map(comment => comment.value.trim())]);
}

/** Public coordinator: analyzer, registry schema, fidelity ownership, full-file parse and persistence gates. */
export function validateImportSnapshot(snapshot: ProjectSnapshot, selectedSource: string): { snapshot: ProjectSnapshot; generated: string } {
  const persisted = normalizeProjectSnapshot(snapshot);
  if (!persisted) throw new ImportFailure('PERSISTENCE', 'Imported project cannot be normalized for persistence.');
  for (const doc of Object.values(persisted.documents)) for (const node of doc.nodes) {
    const definition = resolve(node.data.kindId ?? '');
    if (node.type === 'vvs_comment_node') continue;
    if (!definition || definition.kindVersion !== node.data.kindVersion) throw new ImportFailure('GRAPH_SCHEMA', 'Imported node kind/version must resolve in the registry.');
  }
  const errors = analyzeProject(persisted).diagnostics.filter(d => d.level === 'error');
  if (errors.length) throw new ImportFailure('GRAPH_ANALYSIS', errors.map(d => `${d.code}: ${d.message}`).join('\n'));
  const result = transpileProject({ ...persisted, projectEvents: persisted.events });
  const generated = result.files.map(file => file.content).join('\n');
  const normalize = ['cpp', 'rust', 'gdscript'].includes(persisted.targetLanguage) ? (text: string) => normalizedNativeScalarSyntax(text, persisted.targetLanguage as NativeInventoryLanguage) : persisted.targetLanguage === 'csharp' ? normalizedCSharpSyntax : persisted.targetLanguage === 'go' ? normalizedGoSyntax : persisted.targetLanguage === 'python' ? normalizedPythonSyntax : normalizedImportSyntax;
  if (result.files.length !== 1 || normalize(generated) !== normalize(selectedSource)) throw new ImportFailure('STRUCTURAL_DRIFT', 'Generated code differs structurally from the selected source. Acceptance is blocked.');
  // Executable constructs must be source-linked and own visible generated ranges.
  for (const doc of Object.values(persisted.documents)) for (const node of doc.nodes) {
    if (!node.data.properties?.sourceOrigin) throw new ImportFailure('FIDELITY_OWNERSHIP', 'Imported nodes must retain exact source provenance.');
    if (node.data.kindId === 'function_entry' || node.data.kindId === 'function_define') continue; // Body signature belongs to Function Define; JS Declare is a non-executable index marker.
    if (!result.sourceMap[node.id]?.length) throw new ImportFailure('FIDELITY_OWNERSHIP', `Imported ${node.data.kindId} must own source provenance and generated text.`);
  }
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(persisted)));
  if (!loaded) throw new ImportFailure('PERSISTENCE', 'Saved import cannot be loaded.');
  const meaning = (project: ProjectSnapshot) => JSON.stringify({ classes: project.classes, functions: project.functions, events: project.events, variables: project.variables, documents: Object.fromEntries(Object.entries(project.documents).map(([id, doc]) => [id, { nodes: doc.nodes.map(node => ({ id: node.id, data: node.data })), edges: doc.edges }])) });
  if (meaning(persisted) !== meaning(loaded)) throw new ImportFailure('PERSISTENCE', 'Save/load changed bindings, options, pins or edges.');
  const reloaded = transpileProject({ ...loaded, projectEvents: loaded.events });
  if (analyzeProject(loaded).diagnostics.some(d => d.level === 'error') || reloaded.files.length !== 1 || normalize(reloaded.files[0]!.content) !== normalize(generated)) throw new ImportFailure('PERSISTENCE', 'Save/load changed imported graph meaning.');
  const originals = Object.values(persisted.documents).flatMap(d => d.nodes).map(n => n.data.properties?.sourceImport).filter(Boolean);
  const copies = Object.values(loaded.documents).flatMap(d => d.nodes).map(n => n.data.properties?.sourceImport).filter(Boolean);
  if (JSON.stringify(originals) !== JSON.stringify(copies)) throw new ImportFailure('PROVENANCE_DRIFT', 'Save/load changed immutable original source.');
  return { snapshot: loaded, generated };
}
interface ReviewSeal { source: string; fileName: string; mapStart: boolean; entryPolicy: 'program' | 'library'; snapshot: string; hash: string; selectedSource: string }
const reviews = new WeakMap<SourceImportGraphReview, ReviewSeal>();
/** Native scalar admission uses the same registry, graph, fidelity, persistence
 * and immutable acceptance seal as the existing source adapters.
 */
export async function reviewNativeScalarImportGraph(source: string, language: NativeInventoryLanguage, fileName: string, mapStart = false, entryPolicy: 'program' | 'library' = 'library'): Promise<SourceImportGraphReview> {
  let nodeCount = 0;
  const started = performance.now();
  try {
    if (mapStart || entryPolicy !== 'library') throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'Native ordinary function modules require Library mode without a Start entry.');
    const preview = await previewNativeScalarSourceGraphs(source, language, { fileName, entryPolicy, runtimeExpressions: true, localStatements: true, groupedDeclarations: true });
    if (!preview.snapshot) return { generated: '', diagnostics: preview.diagnostics.map(item => item.message), issues: [...preview.diagnostics], nodeCount };
    nodeCount = Object.values(preview.snapshot.documents).reduce((count, doc) => count + doc.nodes.length, 0);
    const validated = validateImportSnapshot(preview.snapshot, source);
    if (performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('TIME_BUDGET', 'Native module review exceeded its analysis time budget.');
    const review: SourceImportGraphReview = { ...validated, diagnostics: [], issues: [], nodeCount };
    reviews.set(review, { source, fileName, mapStart, entryPolicy, snapshot: JSON.stringify(validated.snapshot), hash: preview.sourceSha256, selectedSource: source });
    return review;
  } catch (error) {
    const failure = error instanceof ImportFailure ? error : new ImportFailure('IMPORT_REJECTED', error instanceof Error ? error.message : String(error));
    return { generated: '', diagnostics: [failure.message], issues: [{ ...failure.span, code: failure.code, message: failure.message }], nodeCount };
  }
}
/** Async C# entry point: independently rebuild the whole source plan before
 * issuing the same sealed transaction used by other import adapters.
 * Browser admission is separately controlled by the worker/UI integration.
 */
export async function reviewCSharpImportGraph(source: string, fileName: string, mapStartAsEntry = false, entryPolicy: 'program' | 'library' = 'library'): Promise<SourceImportGraphReview> {
  let nodeCount = 0;
  const started = performance.now();
  try {
    if (entryPolicy !== 'library' || mapStartAsEntry) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'C# class imports require Library mode without a Start entry.');
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*\.cs$/.test(fileName)) throw new ImportFailure('CSHARP_FILE_PATH', 'Choose a flat .cs file name without traversal.');
    const plan = await planCSharpIntegralClass(source, fileName);
    const snapshot = materializeImportPlan(plan);
    nodeCount = Object.values(snapshot.documents).reduce((sum, doc) => sum + doc.nodes.length, 0);
    const validated = validateImportSnapshot(snapshot, plan.selectedSource);
    if (performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('TIME_BUDGET', 'Import review exceeded its analysis time budget.');
    const review: SourceImportGraphReview = { ...validated, diagnostics: [], issues: [], nodeCount };
    reviews.set(review, { source, fileName, mapStart: mapStartAsEntry, entryPolicy, snapshot: JSON.stringify(validated.snapshot), hash: plan.sourceSha256, selectedSource: plan.selectedSource });
    return review;
  } catch (error) {
    const failure = error instanceof ImportFailure ? error : new ImportFailure('IMPORT_REJECTED', error instanceof Error ? error.message : String(error));
    return { generated: '', nodeCount, diagnostics: [failure.message], issues: [{ ...failure.span, code: failure.code, message: failure.message }] };
  }
}
function materializeClassFile(preview: SourceImportPreview, region: ImportRegion, fileName: string): ProjectSnapshot {
  const ast = parseJavaScript(region.text);
  const plans = new Map<string, ClassImportPlan>();
  let merged: ProjectSnapshot | undefined;
  ast.program.body.forEach((declaration, index) => {
    if (declaration.type !== 'ClassDeclaration' || !declaration.id) throw new ImportFailure('CLASS_FILE', 'A class file contains only reviewed named classes.');
    const parent = declaration.superClass?.type === 'Identifier' ? plans.get(declaration.superClass.name) : undefined;
    if (declaration.superClass && !parent) throw new ImportFailure('PARENT_BINDING', 'Declare the resolved parent before its subclass in this file.');
    const plan = planJavaScriptClass(preview, region, fileName, false, 'library', { declarationIndex: index, idPrefix: `class-${index}-`, parent });
    plans.set(plan.name, plan);
    const snapshot = materializeImportPlan(plan, { classId: `import-class-${index}`, functions: merged?.functions, variables: merged?.variables });
    if (!merged) { merged = snapshot; return; }
    const home = merged.documents[MAIN_GRAPH_CONTAINER_ID], nextHome = snapshot.documents[MAIN_GRAPH_CONTAINER_ID];
    const last = home.nodes.filter(node => ['class_define', 'var_define', 'function_define', 'function_implement'].includes(node.data.kindId ?? '') && !home.edges.some(edge => edge.source === node.id && edge.data?.pinType === 'execution')).at(-1);
    const first = nextHome.nodes.find(node => node.data.kindId === 'class_define')!;
    // IDs are namespaced by owning class, including node/edge and loop scope identities.
    const ids = new Map(Object.values(snapshot.documents).flatMap(doc => doc.nodes).map(node => [node.id, `class-${index}-${node.id}`]));
    for (const doc of Object.values(snapshot.documents)) {
      doc.nodes.forEach(node => { node.id = ids.get(node.id)!; if (typeof node.data.properties?.loopTargetId === 'string') node.data.properties.loopTargetId = ids.get(node.data.properties.loopTargetId); });
      doc.edges.forEach(edge => { edge.id = `class-${index}-${edge.id}`; edge.source = ids.get(edge.source)!; edge.target = ids.get(edge.target)!; });
    }
    snapshot.variables.forEach(variable => { if (variable.scopedNodeId) variable.scopedNodeId = ids.get(variable.scopedNodeId); });
    if (last) home.edges.push({ id: `class-link-${index}`, source: last.id, sourceHandle: 'exec_out', target: first.id, targetHandle: 'exec_in', type: 'vvs_standard_edge', data: { pinType: 'execution' } });
    home.nodes.push(...nextHome.nodes); home.edges.push(...nextHome.edges);
    for (const [id, doc] of Object.entries(snapshot.documents)) if (id !== MAIN_GRAPH_CONTAINER_ID) merged.documents[id] = doc;
    merged.classes.push(...snapshot.classes); merged.functions.push(...snapshot.functions); merged.variables.push(...snapshot.variables);
    merged.openTabs.push(...snapshot.openTabs.filter(tab => tab.id !== MAIN_GRAPH_CONTAINER_ID));
  });
  if (!merged) throw new ImportFailure('CLASS_FILE', 'No class was selected.');
  return merged;
}
export function reviewSourceImportGraph(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry = false, entryPolicy: 'program' | 'library' = 'program'): SourceImportGraphReview {
  let generated = ''; let nodeCount = 0;
  const started = performance.now();
  try {
    if (!['javascript', 'python', 'go'].includes(preview.language)) throw new ImportFailure('IMPORT_LANGUAGE_UNSUPPORTED', 'This language has no reviewed visual mapping yet.');
    const planner = ['function-file', 'module-file'].includes(region.proposedKind ?? '') ? planJavaScriptFunctionFile : region.proposedKind === 'standalone-function' ? planJavaScriptFunction : planJavaScriptClass;
    if (region.proposedKind === 'class-file' && (entryPolicy !== 'library' || mapStartAsEntry)) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'Complete class files currently require Library mode.');
    const plan: ClassImportPlan | undefined = preview.language === 'go' ? planGoFile(preview, fileName, entryPolicy, mapStartAsEntry) : region.proposedKind === 'class-file' ? undefined : preview.language === 'python' ? (region.proposedKind === 'class' ? planPythonClass : planPythonFunction)(preview, fileName, entryPolicy, mapStartAsEntry) : planner(preview, region, fileName, mapStartAsEntry, entryPolicy);
    const snapshot = plan ? materializeImportPlan(plan) : materializeClassFile(preview, region, fileName);
    nodeCount = Object.values(snapshot.documents).reduce((sum, doc) => sum + doc.nodes.length, 0);
    const selectedSource = plan?.selectedSource ?? region.text;
    const validated = validateImportSnapshot(snapshot, selectedSource); generated = validated.generated;
    if (performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('TIME_BUDGET', 'Import review exceeded its analysis time budget.');
    const review = { ...validated, diagnostics: [], issues: [], nodeCount };
    reviews.set(review, { source: preview.source, fileName, mapStart: mapStartAsEntry, entryPolicy, snapshot: JSON.stringify(validated.snapshot), hash: preview.sourceSha256, selectedSource });
    return review;
  } catch (error) {
    const failure = error instanceof ImportFailure ? error : new ImportFailure('IMPORT_REJECTED', error instanceof Error ? error.message : String(error));
    return { generated, nodeCount, diagnostics: [failure.message], issues: [{ ...failure.span, code: failure.code, message: failure.message }] };
  }
}
/** Acceptance returns a fresh exact reviewed transaction; callers cannot accept stale source/config/graph. */
export async function acceptSourceImportReview(review: SourceImportGraphReview, source: string, fileName: string, mapStart: boolean, entryPolicy: 'program' | 'library' = 'program'): Promise<ProjectSnapshot> {
  const seal = reviews.get(review);
  if (!seal || !review.snapshot || seal.source !== source || seal.fileName !== fileName || seal.mapStart !== mapStart || seal.entryPolicy !== entryPolicy || JSON.stringify(review.snapshot) !== seal.snapshot) throw new ImportFailure('STALE_REVIEW', 'Source, mapping options or reviewed graph changed. Build a fresh preview.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  if (hash !== seal.hash) throw new ImportFailure('SOURCE_HASH', 'Original source hash changed.');
  // Parse the sealed snapshot, not mutable UI state, after async hashing.
  return JSON.parse(seal.snapshot) as ProjectSnapshot;
}

export interface SourceFileInput { fileName: string; source: string }
export interface SourceFileSetReview extends SourceImportGraphReview {
  files: { fileName: string; generated: string }[];
}
const fileSetReviews = new WeakMap<SourceFileSetReview, { inputs: string; snapshot: string }>();

/** Closed ES module set. Dependency signatures precede planning every body. */
export async function reviewSourceFileSet(files: readonly SourceFileInput[]): Promise<SourceFileSetReview> {
  try {
    if (!files.length || files.length > 16) throw new ImportFailure('MODULE_FILE_BUDGET', 'Choose 1–16 JavaScript files.');
    const names = new Set<string>();
    const exports = new Map<string, Map<string, { id: string; arity: number }>>();
    files.forEach((file, index) => {
      if (!/^[A-Za-z_][A-Za-z0-9_.-]*\.(js|mjs)$/.test(file.fileName) || names.has(file.fileName.toLowerCase())) throw new ImportFailure('MODULE_PATH', 'Choose unique flat .js/.mjs paths without traversal or case collisions.');
      names.add(file.fileName.toLowerCase());
      const ast = parseJavaScript(file.source, 'module');
      const signatures = new Map<string, { id: string; arity: number }>();
      let serial = 0;
      for (const statement of ast.program.body) {
        if (statement.type === 'ImportDeclaration') continue;
        const fn = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
        if (fn?.type !== 'FunctionDeclaration' || !fn.id) throw new ImportFailure('MODULE_CONSTRUCT', 'The closed module subset supports imports and named function definitions/exports.');
        if (statement.type === 'ExportNamedDeclaration') signatures.set(fn.id.name, { id: `file-${index}-import-function-${serial}`, arity: fn.params.length });
        serial++;
      }
      exports.set(file.fileName, signatures);
    });
    const plans: ClassImportPlan[] = [];
    for (const [index, file] of files.entries()) {
      const ast = parseJavaScript(file.source, 'module');
      const imports = new Map<string, { id: string; arity: number }>();
      for (const statement of ast.program.body) if (statement.type === 'ImportDeclaration') {
        if (!statement.source.value.startsWith('./')) throw new ImportFailure('MODULE_EXTERNAL', 'External dependencies need reviewed signature evidence.');
        const dependency = exports.get(statement.source.value.slice(2));
        if (!dependency) throw new ImportFailure('MODULE_DEPENDENCY_REQUIRED', `Include ${statement.source.value} in this file set.`);
        for (const specifier of statement.specifiers) {
          if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') throw new ImportFailure('MODULE_IMPORT_VARIANT', 'Only named function imports are supported.');
          const signature = dependency.get(specifier.imported.name);
          if (!signature || imports.has(specifier.local.name)) throw new ImportFailure('MODULE_EXPORT_BINDING', 'Every imported name must resolve to one exported function.');
          imports.set(specifier.local.name, signature);
        }
      }
      const preview = await previewJavaScriptImport(file.source);
      const candidate = preview.regions.find(region => region.kind === 'candidate');
      if (!candidate) throw new ImportFailure('MODULE_PREVIEW', preview.diagnostics.join('\n') || 'This file contains unsupported source.');
      // Plain single functions use their normal planner, then receive file identity.
      const plan = candidate.proposedKind === 'standalone-function'
        ? planJavaScriptFunction(preview, candidate, file.fileName, false, 'library')
        : planJavaScriptFunctionFile(preview, candidate, file.fileName, false, 'library', imports, `file-${index}-`);
      if (candidate.proposedKind === 'standalone-function') {
        const rename = (value: unknown): unknown => Array.isArray(value) ? value.map(rename) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, ['id', 'scopeId', 'functionId', 'localId', 'parameterId'].includes(key) && typeof child === 'string' ? `file-${index}-${child}` : rename(child)])) : value;
        Object.assign(plan, rename(plan));
      }
      plan.name = file.fileName.replace(/\.[^.]+$/, '');
      plans.push(plan);
    }
    const catalog = plans.flatMap((plan, index) => plan.methods.map(method => ({ kind: 'function' as const, id: method.id, name: method.name, classId: `global-${index === 0 ? 'main-graph' : `import-file-${index}`}`, binding: 'module' as const, visibility: 'public' as const, overloads: [{ id: 'o1', parameters: method.parameters.map(parameter => ({ id: parameter.id, label: parameter.name, type: 'data_any' as const })), returnType: 'data_any' as const, graphTabId: method.id }] })));
    const snapshots = plans.map((plan, index) => {
      const snapshot = materializeImportPlan(plan, { containerId: index === 0 ? 'main-graph' : `import-file-${index}`, functions: catalog });
      snapshot.documents[snapshot.activeGraphTab].metadata!.sourceFileName = files[index].fileName;
      return snapshot;
    });
    const snapshot = snapshots[0];
    for (const next of snapshots.slice(1)) {
      snapshot.classes.push(...next.classes); snapshot.functions.push(...next.functions); snapshot.variables.push(...next.variables); snapshot.events.push(...next.events);
      snapshot.graphContainers!.push(...next.graphContainers!); snapshot.openTabs.push(...next.openTabs); Object.assign(snapshot.documents, next.documents);
    }
    const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)));
    if (!loaded) throw new ImportFailure('PERSISTENCE', 'Module set could not be persisted.');
    const errors = analyzeProject(loaded).diagnostics.filter(diagnostic => diagnostic.level === 'error');
    if (errors.length) throw new ImportFailure('GRAPH_ANALYSIS', errors.map(error => `${error.code}: ${error.message}`).join('\n'));
    const result = transpileProject({ ...loaded, projectEvents: loaded.events });
    if (result.files.length !== files.length) throw new ImportFailure('MODULE_FILE_COUNT', 'Each reviewed file must retain its own container and output.');
    for (const file of files) {
      const generated = result.files.find(output => output.path === file.fileName);
      if (!generated || normalizedImportSyntax(generated.content) !== normalizedImportSyntax(file.source)) throw new ImportFailure('STRUCTURAL_DRIFT', `Regenerated ${file.fileName} differs from the reviewed source.`);
    }
    for (const doc of Object.values(loaded.documents)) for (const node of doc.nodes) if (!['function_entry', 'function_define'].includes(node.data.kindId ?? '') && !result.sourceMap[node.id]?.length) throw new ImportFailure('FIDELITY_OWNERSHIP', `Module node ${node.id} has no generated span.`);
    const review: SourceFileSetReview = { snapshot: loaded, generated: result.files.map(file => file.content).join('\n'), files: result.files.map(file => ({ fileName: file.path, generated: file.content })), diagnostics: [], nodeCount: Object.values(loaded.documents).reduce((sum, doc) => sum + doc.nodes.length, 0) };
    fileSetReviews.set(review, { inputs: JSON.stringify(files), snapshot: JSON.stringify(loaded) });
    return review;
  } catch (error) { return { generated: '', files: [], diagnostics: [error instanceof Error ? error.message : String(error)], nodeCount: 0 }; }
}

export function acceptSourceFileSetReview(review: SourceFileSetReview, files: readonly SourceFileInput[]): ProjectSnapshot {
  const seal = fileSetReviews.get(review);
  if (!seal || JSON.stringify(files) !== seal.inputs || JSON.stringify(review.snapshot) !== seal.snapshot) throw new ImportFailure('STALE_REVIEW', 'Module source or reviewed graph changed. Review the complete file set again.');
  return JSON.parse(seal.snapshot);
}

export interface SourceReimportReview {
  baseline: string; current: string; incoming: string;
  conflicts: string[]; diagnostics: string[]; nodeCount: number;
}
const reimportReviews = new WeakMap<SourceReimportReview, { current: string; source: string; incoming: string; defaultKeep: boolean; conflict: boolean; review: string }>();

/** Use the same saved target options as the editor's Code panel. */
function emitReimportProject(project: ProjectSnapshot) {
  const codegenTarget = resolveCodegenTarget(project.targetLanguage, { capabilities: project.codegenCapabilities, syntaxPackLock: project.syntaxPackLock });
  return transpileProject({ ...project, projectEvents: project.events, ...(codegenTarget ? { codegenTarget } : {}) });
}

/** Source owns declarations; replacement must not reset the surrounding project. */
function retainReimportContext(current: ProjectSnapshot, replacement: ProjectSnapshot): ProjectSnapshot {
  const candidate = structuredClone({ ...current, classes: replacement.classes, variables: replacement.variables, events: replacement.events, functions: replacement.functions, documents: replacement.documents });
  for (const [id, doc] of Object.entries(candidate.documents)) {
    const previous = current.documents[id];
    if (previous?.metadata) doc.metadata = { ...doc.metadata!, ...structuredClone(previous.metadata) };
  }
  candidate.graphContainers = replacement.graphContainers.map(container => structuredClone(current.graphContainers.find(previous => previous.id === container.id) ?? container));
  candidate.openTabs = [
    ...current.openTabs.filter(tab => candidate.documents[tab.id]).map(tab => structuredClone(tab)),
    ...replacement.openTabs.filter(tab => !current.openTabs.some(previous => previous.id === tab.id)),
  ];
  candidate.activeGraphTab = candidate.documents[current.activeGraphTab] ? current.activeGraphTab : replacement.activeGraphTab;
  candidate.activeClassId = candidate.classes.some(cls => cls.id === current.activeClassId) ? current.activeClassId : replacement.activeClassId;
  return candidate;
}

function validateReimportContext(project: ProjectSnapshot, language: string) {
  if (project.targetLanguage !== language || Object.values(project.documents).some(doc => doc.metadata?.targetLanguage && doc.metadata.targetLanguage !== language)) {
    throw new ImportFailure('REIMPORT_TARGET', 'Re-import requires the original source language in the retained project and graph targets.');
  }
  const target = resolveCodegenTarget(project.targetLanguage, { capabilities: project.codegenCapabilities, syntaxPackLock: project.syntaxPackLock });
  if (target?.packLock) for (const ref of [target.packLock.base, ...target.packLock.overlays]) {
    const pack = getSyntaxPack(ref);
    if (!pack || pack.family !== target.family) throw new ImportFailure('REIMPORT_PACK', `Retained syntax pack ${ref} is unavailable or belongs to a different language.`);
  }
}

/** Seal only snapshots whose complete outputs survive the real persistence normalizer. */
function validateReimportPersistence(candidate: ProjectSnapshot, expectedPaths: string[]) {
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(candidate)));
  if (!loaded || !analyzeProject(loaded).ok) throw new ImportFailure('REIMPORT_BINDING', 'Source changes conflict with retained graph bindings or project settings.');
  const output = emitReimportProject(candidate);
  if (JSON.stringify(output.files.map(file => file.path).sort()) !== JSON.stringify([...expectedPaths].sort())) throw new ImportFailure('REIMPORT_PATH', 'Retained project settings changed output ownership or added files.');
  if (JSON.stringify(emitReimportProject(loaded).files) !== JSON.stringify(output.files)) throw new ImportFailure('REIMPORT_PERSISTENCE', 'Save/load changed the reviewed output under retained project settings.');
  return output;
}

/** Read-only three-way review. No current node or saved source is modified here. */
export async function reviewSourceReimport(current: ProjectSnapshot, source: string, fileName: string): Promise<SourceReimportReview> {
  const failed = (message: string): SourceReimportReview => ({ baseline: '', current: '', incoming: '', conflicts: [], diagnostics: [message], nodeCount: 0 });
  try {
    const units = Object.values(current.documents).flatMap(doc => doc.nodes).filter(node => node.data.properties?.sourceImport);
    const origins = new Map<string, { source: string; fileName: string; language: string; start: number; end: number }>();
    for (const node of units) {
      const origin = node.data.properties!.sourceImport as { source: string; fileName: string; language: string; start: number; end: number };
      origins.set(origin.fileName, origin);
    }
    const original = origins.get(fileName);
    if (!original) throw new ImportFailure('REIMPORT_SCOPE', 'Choose a file present in this project’s imported provenance.');
    validateReimportContext(current, original.language);
    if (Object.values(current.documents).flatMap(doc => doc.nodes).some(node => ['class_define', 'function_implement'].includes(node.data.kindId ?? '') && !node.data.properties?.sourceOrigin)) throw new ImportFailure('REIMPORT_SCOPE', 'Additional authored units need a targeted merge; whole-file replacement is blocked.');
    if (origins.size > 1) {
      if ([...origins.values()].some(origin => origin.language !== 'javascript')) throw new ImportFailure('REIMPORT_SCOPE', 'Mixed-language module re-import needs reviewed adapters for every dependency.');
      const files = [...origins.values()].map(origin => ({ fileName: origin.fileName, source: origin.source }));
      const base = await reviewSourceFileSet(files);
      const incomingFiles = files.map(file => file.fileName === fileName ? { ...file, source } : file);
      const incoming = await reviewSourceFileSet(incomingFiles);
      if (!base.snapshot || !incoming.snapshot) throw new ImportFailure('REIMPORT_INCOMING', [...base.diagnostics, ...incoming.diagnostics].join('\n'));
      const output = emitReimportProject(current);
      if (!analyzeProject(current).ok || output.files.length !== files.length) throw new ImportFailure('REIMPORT_SCOPE', 'Resolve current graph diagnostics and additional units before module re-import.');
      const conflicts: string[] = [];
      let anyGraphChange = false, anySourceChange = false;
      const candidate = retainReimportContext(current, incoming.snapshot);
      const baselineOutput = emitReimportProject(retainReimportContext(current, base.snapshot));
      const nextOutput = emitReimportProject(candidate);
      for (const file of files) {
        const baseline = baselineOutput.files.find(output => output.path === file.fileName)?.content;
        const next = nextOutput.files.find(output => output.path === file.fileName)?.content;
        const graph = output.files.find(output => output.path === file.fileName)?.content;
        if (!baseline || !next || !graph) throw new ImportFailure('REIMPORT_PATH', 'Every original file must retain its reviewed output path.');
        if (normalizedReimportSyntax(baseline) !== normalizedReimportSyntax(base.files.find(output => output.fileName === file.fileName)!.generated) || normalizedReimportSyntax(next) !== normalizedReimportSyntax(incoming.files.find(output => output.fileName === file.fileName)!.generated)) throw new ImportFailure('REIMPORT_CONTEXT', 'Retained project settings change imported source meaning.');
        const graphChanged = normalizedReimportSyntax(graph) !== normalizedReimportSyntax(baseline);
        const sourceChanged = normalizedReimportSyntax(next) !== normalizedReimportSyntax(baseline);
        anyGraphChange ||= graphChanged; anySourceChange ||= sourceChanged;
        if (graphChanged && sourceChanged && normalizedReimportSyntax(graph) !== normalizedReimportSyntax(next)) conflicts.push(`${file.fileName}: source and graph both changed from the imported baseline`);
        if (!sourceChanged) {
          const container = Object.entries(current.documents).find(([, doc]) => doc.metadata?.sourceFileName === file.fileName)?.[0];
          if (!container) throw new ImportFailure('REIMPORT_PATH', 'Graph-only edits need their original file container.');
          const owners = new Set(current.classes.filter(cls => cls.containerId === container).map(cls => cls.id));
          const functions = current.functions.filter(fn => owners.has(fn.classId!));
          const bodyTabs = new Set(functions.flatMap(fn => fn.overloads.map(overload => overload.graphTabId ?? fn.id)));
          candidate.documents[container] = structuredClone(current.documents[container]);
          for (const id of bodyTabs) candidate.documents[id] = structuredClone(current.documents[id]);
          candidate.functions = [...candidate.functions.filter(fn => !owners.has(fn.classId!)), ...structuredClone(functions)];
          candidate.variables = [...candidate.variables.filter(variable => !owners.has(variable.classId!)), ...structuredClone(current.variables.filter(variable => owners.has(variable.classId!)))];
          candidate.classes = candidate.classes.map(cls => owners.has(cls.id) ? structuredClone(current.classes.find(previous => previous.id === cls.id)!) : cls);
        }
      }
      if (!analyzeProject(candidate).ok) throw new ImportFailure('REIMPORT_BINDING', 'Source changes conflict with retained graph bindings. Resolve signatures before re-import.');
      const candidateOutput = validateReimportPersistence(candidate, output.files.map(file => file.path));
      const review: SourceReimportReview = { baseline: baselineOutput.files.map(file => file.content).join('\n'), current: output.files.map(file => file.content).join('\n'), incoming: candidateOutput.files.map(file => file.content).join('\n'), conflicts, diagnostics: [], nodeCount: Object.values(candidate.documents).reduce((sum, doc) => sum + doc.nodes.length, 0) };
      reimportReviews.set(review, { current: JSON.stringify(current), source, incoming: JSON.stringify(candidate), defaultKeep: anyGraphChange && !anySourceChange, conflict: conflicts.length > 0, review: JSON.stringify(review) });
      return review;
    }
    const language = original.language;
    if (!['javascript', 'python', 'go', 'csharp', 'cpp', 'rust', 'gdscript'].includes(language)) throw new ImportFailure('REIMPORT_LANGUAGE', 'The original language needs a reviewed re-import adapter.');
    const entryPolicy = Object.values(current.documents).some(doc => doc.metadata?.compilationUnit?.entryPolicy === 'library') ? 'library' : 'program';
    const goWordBits = Number(Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'source_package')?.data.properties?.goWordBits ?? 64) as 32 | 64;
    const reviewSingleSource = async (text: string, baseline: boolean): Promise<SourceImportGraphReview> => {
      if (['cpp', 'rust', 'gdscript'].includes(language)) return reviewNativeScalarImportGraph(text, language as NativeInventoryLanguage, fileName, entryPolicy === 'program', entryPolicy);
      if (language === 'csharp') return reviewCSharpImportGraph(text, fileName, entryPolicy === 'program', entryPolicy);
      const preview = await (language === 'go' ? (text: string) => previewGoImport(text, goWordBits) : language === 'python' ? (await import('./python')).previewPythonImport : previewJavaScriptImport)(text);
      const region = baseline ? preview.regions.find(region => region.kind === 'candidate' && region.start === original.start && region.end === original.end) ?? preview.regions.find(region => region.kind === 'candidate') : preview.regions.find(region => region.kind === 'candidate');
      if (!region) throw new ImportFailure(baseline ? 'REIMPORT_BASELINE' : 'REIMPORT_INCOMING', 'Choose supported replacement source.');
      if (!baseline && preview.regions.some(region => region.kind === 'unresolved')) throw new ImportFailure('REIMPORT_COVERAGE', 'Re-import must review the complete incoming file, including all changed declarations.');
      return reviewSourceImportGraph(preview, region, fileName, entryPolicy === 'program', entryPolicy);
    };
    const base = await reviewSingleSource(original.source, true);
    if (!base.snapshot) throw new ImportFailure('REIMPORT_BASELINE', base.diagnostics.join('\n'));
    const next = await reviewSingleSource(source, false);
    if (!next.snapshot) throw new ImportFailure('REIMPORT_INCOMING', next.diagnostics.join('\n'));
    const errors = analyzeProject(current).diagnostics.filter(diagnostic => diagnostic.level === 'error');
    if (errors.length) throw new ImportFailure('REIMPORT_GRAPH', 'Resolve current graph diagnostics before comparing its edits.');
    const output = emitReimportProject(current);
    if (output.files.length !== 1) throw new ImportFailure('REIMPORT_SCOPE', 'Current project has more than one output file.');
    const currentCode = output.files[0].content;
    const incomingSnapshot = retainReimportContext(current, next.snapshot);
    const baseOutput = validateReimportPersistence(retainReimportContext(current, base.snapshot), [output.files[0].path]);
    const incomingOutput = validateReimportPersistence(incomingSnapshot, [output.files[0].path]);
    const baselineCode = baseOutput.files[0].content;
    const incomingCode = incomingOutput.files[0].content;
    const normalize = ['cpp', 'rust', 'gdscript'].includes(language) ? (text: string) => normalizedNativeScalarSyntax(text, language as NativeInventoryLanguage) : language === 'csharp' ? normalizedCSharpReimportSyntax : language === 'go' ? normalizedGoSyntax : language === 'python' ? normalizedPythonSyntax : normalizedReimportSyntax;
    if (normalize(incomingCode) !== normalize(next.generated) || normalize(baselineCode) !== normalize(base.generated)) throw new ImportFailure('REIMPORT_CONTEXT', 'Retained project settings change imported source meaning.');
    const graphChanged = normalize(currentCode) !== normalize(baselineCode);
    const sourceChanged = normalize(incomingCode) !== normalize(baselineCode);
    const conflict = graphChanged && sourceChanged && normalize(currentCode) !== normalize(incomingCode);
    const review: SourceReimportReview = { baseline: baselineCode, current: currentCode, incoming: incomingCode, conflicts: conflict ? [`${fileName}: source and graph both changed from the imported baseline`] : [], diagnostics: [], nodeCount: next.nodeCount };
    reimportReviews.set(review, { current: JSON.stringify(current), source, incoming: JSON.stringify(incomingSnapshot), defaultKeep: graphChanged && !sourceChanged, conflict, review: JSON.stringify(review) });
    return review;
  } catch (error) { return failed(error instanceof Error ? error.message : String(error)); }
}

export function acceptSourceReimport(review: SourceReimportReview, current: ProjectSnapshot, source: string, resolution?: 'keep-graph' | 'use-source'): ProjectSnapshot {
  const seal = reimportReviews.get(review);
  if (!seal || seal.current !== JSON.stringify(current) || seal.source !== source || seal.review !== JSON.stringify(review)) throw new ImportFailure('STALE_REIMPORT', 'Source, current graph or conflict review changed. Compare again.');
  if (resolution !== undefined && !['keep-graph', 'use-source'].includes(resolution)) throw new ImportFailure('REIMPORT_CONFLICT', 'Choose a valid reviewed version.');
  if (seal.conflict && !resolution) throw new ImportFailure('REIMPORT_CONFLICT', 'Choose which reviewed version to keep before replacing the graph.');
  return JSON.parse(resolution === 'keep-graph' || (!resolution && seal.defaultKeep) ? seal.current : seal.incoming);
}
