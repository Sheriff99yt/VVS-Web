import { analyzeProject, normalizeProjectSnapshot, type ProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from '@vvs/transpiler';
import { resolve } from '@vvs/syntax-registry';
import { ImportFailure, IMPORT_LIMITS, MAX_SOURCE_IMPORT_BYTES, type ClassImportPlan, type ImportDiagnostic } from './contracts';
import { parseJavaScript, type ImportRegion, type SourceImportPreview } from './parser';
import { planJavaScriptClass, planJavaScriptFunction } from './javascriptMappings';
import { materializeImportPlan } from './materialize';
export { MAX_SOURCE_IMPORT_BYTES };
export interface SourceImportGraphReview {
  snapshot?: ProjectSnapshot; generated: string; diagnostics: string[]; nodeCount: number;
  issues?: ImportDiagnostic[];
}
/** Deliberately conservative AST comparison, not general semantic equivalence. */
export function normalizedImportSyntax(source: string): string {
  const ast = parseJavaScript(source);
  const ignored = new Set(['start', 'end', 'loc', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens', 'errors']);
  // Raw string/directive spelling is only trivia for strings, never directives/strictness.
  return JSON.stringify(ast.program, (key, value) => ignored.has(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
}

/** Public coordinator: analyzer, registry schema, fidelity ownership, full-file parse and persistence gates. */
export function validateImportSnapshot(snapshot: ProjectSnapshot, selectedSource: string): { snapshot: ProjectSnapshot; generated: string } {
  const persisted = normalizeProjectSnapshot(snapshot);
  if (!persisted) throw new ImportFailure('PERSISTENCE', 'Imported project cannot be normalized for persistence.');
  for (const doc of Object.values(persisted.documents)) for (const node of doc.nodes) {
    const definition = resolve(node.data.kindId ?? '');
    if (!definition || definition.kindVersion !== node.data.kindVersion) throw new ImportFailure('GRAPH_SCHEMA', 'Imported node kind/version must resolve in the registry.');
  }
  const errors = analyzeProject(persisted).diagnostics.filter(d => d.level === 'error');
  if (errors.length) throw new ImportFailure('GRAPH_ANALYSIS', errors.map(d => `${d.code}: ${d.message}`).join('\n'));
  const result = transpileProject({ ...persisted, projectEvents: persisted.events });
  const generated = result.files.map(file => file.content).join('\n');
  if (result.files.length !== 1 || normalizedImportSyntax(generated) !== normalizedImportSyntax(selectedSource)) throw new ImportFailure('STRUCTURAL_DRIFT', 'Generated code differs structurally from the selected source. Acceptance is blocked.');
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
  if (analyzeProject(loaded).diagnostics.some(d => d.level === 'error') || reloaded.files.length !== 1 || normalizedImportSyntax(reloaded.files[0]!.content) !== normalizedImportSyntax(generated)) throw new ImportFailure('PERSISTENCE', 'Save/load changed imported graph meaning.');
  const originals = Object.values(persisted.documents).flatMap(d => d.nodes).map(n => n.data.properties?.sourceImport).filter(Boolean);
  const copies = Object.values(loaded.documents).flatMap(d => d.nodes).map(n => n.data.properties?.sourceImport).filter(Boolean);
  if (JSON.stringify(originals) !== JSON.stringify(copies)) throw new ImportFailure('PROVENANCE_DRIFT', 'Save/load changed immutable original source.');
  return { snapshot: loaded, generated };
}
interface ReviewSeal { source: string; fileName: string; mapStart: boolean; entryPolicy: 'program' | 'library'; snapshot: string; hash: string; selectedSource: string }
const reviews = new WeakMap<SourceImportGraphReview, ReviewSeal>();
export function reviewSourceImportGraph(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry = false, entryPolicy: 'program' | 'library' = 'program'): SourceImportGraphReview {
  let generated = ''; let nodeCount = 0;
  const started = performance.now();
  try {
    const planner = region.proposedKind === 'standalone-function' ? planJavaScriptFunction : planJavaScriptClass;
    const plan: ClassImportPlan = planner(preview, region, fileName, mapStartAsEntry, entryPolicy);
    const snapshot = materializeImportPlan(plan);
    nodeCount = Object.values(snapshot.documents).reduce((sum, doc) => sum + doc.nodes.length, 0);
    const validated = validateImportSnapshot(snapshot, plan.selectedSource); generated = validated.generated;
    if (performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('TIME_BUDGET', 'Import review exceeded its analysis time budget.');
    const review = { ...validated, diagnostics: [], issues: [], nodeCount };
    reviews.set(review, { source: preview.source, fileName, mapStart: mapStartAsEntry, entryPolicy, snapshot: JSON.stringify(validated.snapshot), hash: preview.sourceSha256, selectedSource: plan.selectedSource });
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
