/**
 * Validation cycle for StartScreen Test Projects (folder-backed):
 *   1. Clear repo-root `Test Projects/`
 *   2. Materialize First Graph + Coverage Lab as on-disk `.vvs/` projects
 *   3. **Load snapshot back from disk** → emit Code-panel codegen into each folder
 *   4. Compare home-graph preview to `test_project_goldens/`
 *
 * Emit MUST use the loaded-from-disk snapshot — not the in-memory fixture.create()
 * object — so the cycle matches Open Folder / browser reopen.
 *
 * Usage:
 *   bun apps/web/scripts/validate_test_projects_folder.ts
 *   bun apps/web/scripts/validate_test_projects_folder.ts --update-goldens
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  MAIN_GRAPH_CONTAINER_ID,
  type TargetLanguage,
  type ProjectSnapshot,
} from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '../src/lib/emitProjectCode';
import {
  loadProjectSnapshotFromPath,
  saveProjectSnapshotToPath,
} from '../src/lib/projectFolder/nodeIo';
import { USABILITY_EXAMPLE_TESTS } from '../src/lib/usabilityExampleProjects';

const LANGS: TargetLanguage[] = [
  'python',
  'javascript',
  'cpp',
  'csharp',
  'rust',
  'gdscript',
  'verse',
];

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const TEST_PROJECTS_ROOT = join(REPO_ROOT, 'Test Projects');
const GOLDEN_ROOT = join(SCRIPT_DIR, '..', 'test_project_goldens');
const UPDATE_GOLDENS = process.argv.includes('--update-goldens');

function writeText(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function homePreviewText(snapshot: ProjectSnapshot, lang: TargetLanguage): string {
  const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: lang });
  const fileOwners = fileOwnersForEmitResult(
    { ...snapshot, targetLanguage: lang },
    result
  );
  const homePreview = result.files.filter(
    (f) => fileOwners[f.path] === MAIN_GRAPH_CONTAINER_ID
  );
  return homePreview.map((f) => `// ===== ${f.path} =====\n${f.content}`).join('\n\n');
}

function folderSlug(title: string): string {
  return title.replace(/[<>:"/\\|?*]+/g, '').trim() || 'Project';
}

// --- cycle ---
console.log('Validation cycle: clear → seed → load-from-disk → emit → compare');
console.log(`Root: ${TEST_PROJECTS_ROOT}`);

rmSync(TEST_PROJECTS_ROOT, { recursive: true, force: true });
mkdirSync(TEST_PROJECTS_ROOT, { recursive: true });
console.log('1. Cleared Test Projects/');

let failures = 0;
const summary: string[] = [];

for (const fixture of USABILITY_EXAMPLE_TESTS) {
  const seeded = fixture.create();
  const projectDir = join(TEST_PROJECTS_ROOT, folderSlug(fixture.title));
  mkdirSync(projectDir, { recursive: true });
  saveProjectSnapshotToPath(projectDir, seeded);
  console.log(`2. Seeded ${fixture.title} → ${folderSlug(fixture.title)}/`);

  const snapshot = loadProjectSnapshotFromPath(projectDir);
  if (!snapshot) {
    failures += 1;
    summary.push(`  FAIL ${fixture.id}: could not load snapshot from ${projectDir}`);
    continue;
  }
  console.log(`2b. Loaded ${fixture.title} from disk`);

  for (const lang of LANGS) {
    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: lang });
    for (const file of result.files) {
      writeText(join(projectDir, file.path), file.content);
    }

    const preview = homePreviewText(snapshot, lang);
    const previewPath = join(projectDir, `_HOME_GRAPH_PREVIEW.${lang}.txt`);
    writeText(previewPath, preview);

    const goldenPath = join(GOLDEN_ROOT, fixture.id, lang, '_HOME_GRAPH_PREVIEW.txt');
    if (UPDATE_GOLDENS) {
      mkdirSync(dirname(goldenPath), { recursive: true });
      writeFileSync(goldenPath, preview, 'utf8');
      summary.push(`  ${fixture.id} × ${lang}: updated golden`);
      continue;
    }

    if (!existsSync(goldenPath)) {
      failures += 1;
      summary.push(`  FAIL ${fixture.id} × ${lang}: missing golden ${goldenPath}`);
      continue;
    }
    const expected = readFileSync(goldenPath, 'utf8');
    if (preview !== expected) {
      failures += 1;
      summary.push(`  FAIL ${fixture.id} × ${lang}: home preview ≠ golden (disk-loaded)`);
    } else {
      summary.push(`  ok   ${fixture.id} × ${lang} (disk-loaded)`);
    }
  }
}

console.log('3. Emitted codegen from disk-loaded snapshots into each project folder');
console.log('4. Compared home previews to test_project_goldens/');
console.log(summary.join('\n'));

if (failures > 0) {
  console.error(`\n${failures} mismatch(es)`);
  process.exit(1);
}

console.log(
  UPDATE_GOLDENS
    ? '\nGoldens refreshed; Test Projects/ seeded from current fixtures.'
    : '\nValidation cycle passed (emit from on-disk load).'
);
