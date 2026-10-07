import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { previewJavaScriptImport } from '@vvs/source-import';
import { reviewSourceImportGraph } from '@vvs/source-import/validation';
import { saveProjectSnapshotToPath } from '../../web/src/lib/projectFolder/nodeIo';
const directory = mkdtempSync(join(tmpdir(), 'vvs-native-smoke-'));
const folders = ['one', 'two'].map(name => join(directory, name));
for (const folder of folders) {
  mkdirSync(folder);
  const preview = await previewJavaScriptImport('function answer() { return 1; }');
  const review = reviewSourceImportGraph(preview, preview.regions.find(region => region.kind === 'candidate')!, 'answer.js', false, 'library');
  if (!review.snapshot) throw new Error(review.diagnostics.join('\n'));
  saveProjectSnapshotToPath(folder, review.snapshot);
}
const workspace = join(directory, 'smoke.code-workspace');
writeFileSync(workspace, JSON.stringify({ folders: folders.map(path => ({ path })) }));
console.log(JSON.stringify({ directory, workspace }));
