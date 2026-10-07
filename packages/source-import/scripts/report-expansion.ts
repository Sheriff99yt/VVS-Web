import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IMPORT_EXPANSION_CORPUS } from '../src/expansionCorpus';
import { previewJavaScriptImport } from '../src/parser';
import { previewPythonImport } from '../src/python';
import { reviewSourceImportGraph } from '../src/validation';

const rows = [];
const followThrough: Record<string, { reusable: string; prerequisite: string }> = {
  'u93-scoped-locals': { reusable: 'var_define, variable_get, var_set, scoped symbols', prerequisite: 'Lexical scope/definite assignment and language-specific dynamic numeric/value contracts' },
  'u93-resolved-calls': { reusable: 'function declarations, ordinary calls, explicit conversion nodes, exec ordering', prerequisite: 'External/receiver signature inventory, default/rest and optional-call contracts' },
  'u93-control-flow': { reusable: 'flow_branch, flow_for, flow_while and structured lowering', prerequisite: 'Dynamic truthiness, Python definite assignment at joins, richer short-circuit/effect ownership and alternate loop syntax' },
  'u93-class-semantics': { reusable: 'class/field/function declarations and existing inheritance emitter', prerequisite: 'Effectful field initializers, accessor/private/computed members, external parent closure and Python inheritance' },
  'u93-module-projects': { reusable: 'file-owned function containers and project folder transactions', prerequisite: 'External signatures, nested paths, default/namespace/re-exports and additional language adapters' },
  'u93-trivia-reimport': { reusable: 'comment nodes, provenance hashes and source spans', prerequisite: 'Trailing/expression comments, mixed authored-unit transactions and per-construct conflict merge' },
};
for (const example of IMPORT_EXPANSION_CORPUS) {
  const preview = await (example.language === 'python' ? previewPythonImport : previewJavaScriptImport)(example.source);
  const candidate = preview.regions.find(region => region.kind === 'candidate');
  const review = candidate && reviewSourceImportGraph(preview, candidate, `${example.id}.${example.language === 'python' ? 'py' : 'js'}`, false, 'library');
  const status = review?.snapshot ? 'supported' : 'gap';
  const diagnostic = [...preview.diagnostics, ...preview.regions.flatMap(region => region.reason ? [region.reason] : []), ...review?.diagnostics ?? []].join('; ');
  if (status !== example.expected) throw new Error(`Corpus classification changed: ${example.id}: ${diagnostic}`);
  rows.push({ id: example.id, language: example.language, status, roadmapId: example.roadmapId, source: example.source, reason: example.reason, diagnostic,
    readiness: status === 'supported' ? 'implemented-and-round-trip-tested' : 'requires-reviewed-semantic-contract',
    ...followThrough[example.roadmapId] });
}
const report = { version: 1, corpus: 'handwritten; no source execution', rows };
if (process.argv.includes('--write')) {
  writeFileSync(join(import.meta.dir, '../../../docs/design/reverse_import_feedback.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ supported: rows.filter(row => row.status === 'supported').length, gaps: rows.filter(row => row.status === 'gap').length, examples: rows.length }));
