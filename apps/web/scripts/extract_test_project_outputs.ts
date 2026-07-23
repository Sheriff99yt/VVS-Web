/**
 * Extract generated code for StartScreen Test Projects — same path as Code panel / Generate (U56).
 *
 * Usage:
 *   bun scripts/extract_test_project_outputs.ts
 *   bun scripts/extract_test_project_outputs.ts --update-goldens
 *
 * Output: apps/web/test_project_outputs/<fixture>/<lang>/
 * Goldens: apps/web/test_project_goldens/<fixture>/<lang>/_HOME_GRAPH_PREVIEW.txt (with --update-goldens)
 */
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '../src/lib/emitProjectCode';
import {
  loadProjectSnapshotFromPath,
  saveProjectSnapshotToPath,
} from '../src/lib/projectFolder/nodeIo';
import { USABILITY_EXAMPLE_TESTS } from '../src/lib/usabilityExampleProjects';
import type { TargetLanguage } from '@vvs/graph-types';
import type { TranspileResult } from '../src/types/transpile';

const LANGS: TargetLanguage[] = [
  'python',
  'javascript',
  'cpp',
  'csharp',
  'rust',
  'gdscript',
  'verse',
  'go',
];

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = join(SCRIPT_DIR, '..', 'test_project_outputs');
const GOLDEN_ROOT = join(SCRIPT_DIR, '..', 'test_project_goldens');
const UPDATE_GOLDENS = process.argv.includes('--update-goldens');

function homeGraphPreviewFiles(
  result: TranspileResult,
  fileOwners: Record<string, string>,
  homeTabId: string
) {
  return result.files.filter((f) => fileOwners[f.path] === homeTabId);
}

function writeBundle(
  dir: string,
  result: TranspileResult,
  fileOwners: Record<string, string>,
  extras?: { homePreviewPaths?: string[] }
) {
  mkdirSync(dir, { recursive: true });
  const index: string[] = [
    `# Generated like Code panel / Generate (emitProjectLikeCodePanel)`,
    `# language: ${result.language}`,
    `# files: ${result.files.length}`,
    '',
  ];

  for (const file of result.files) {
    const owner = fileOwners[file.path] ?? '?';
    const safeName = file.path.replace(/[\\/]/g, '__');
    writeFileSync(join(dir, safeName), file.content, 'utf8');
    index.push(`- ${file.path}  (owner tab: ${owner})`);
  }

  if (extras?.homePreviewPaths) {
    index.push('', '## Home graph Code panel (owned files)');
    for (const p of extras.homePreviewPaths) index.push(`- ${p}`);
  }

  writeFileSync(join(dir, '_INDEX.md'), index.join('\n') + '\n', 'utf8');
  writeFileSync(
    join(dir, '_manifest.json'),
    JSON.stringify(
      {
        language: result.language,
        files: result.files.map((f) => ({
          path: f.path,
          ownerTab: fileOwners[f.path],
          lines: f.content.split('\n').length,
        })),
        homePreviewPaths: extras?.homePreviewPaths ?? [],
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
}

rmSync(OUT_ROOT, { recursive: true, force: true });
mkdirSync(OUT_ROOT, { recursive: true });
if (UPDATE_GOLDENS) {
  mkdirSync(GOLDEN_ROOT, { recursive: true });
}

const summary: string[] = [
  '# Test Project generated code (Code panel + Generate path)',
  '',
  'Extracted via disk seed→load→`emitProjectLikeCodePanel` — **one graph → one file**.',
  UPDATE_GOLDENS ? 'Also refreshed `test_project_goldens/` home previews.' : '',
  '',
];

for (const fixture of USABILITY_EXAMPLE_TESTS) {
  const tmpDir = mkdtempSync(join(tmpdir(), `vvs-extract-${fixture.id}-`));
  let snapshot: NonNullable<ReturnType<typeof loadProjectSnapshotFromPath>>;
  try {
    saveProjectSnapshotToPath(tmpDir, fixture.create());
    const loaded = loadProjectSnapshotFromPath(tmpDir);
    if (!loaded) throw new Error(`failed to load ${fixture.id} from disk`);
    snapshot = loaded;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
  const fixtureDir = join(OUT_ROOT, fixture.id);
  summary.push(`## ${fixture.title} (\`${fixture.id}\`)`);
  summary.push('');

  for (const lang of LANGS) {
    const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: lang });
    const fileOwners = fileOwnersForEmitResult(
      { ...snapshot, targetLanguage: lang },
      result
    );
    const homePreview = homeGraphPreviewFiles(result, fileOwners, MAIN_GRAPH_CONTAINER_ID);
    const langDir = join(fixtureDir, lang);
    writeBundle(langDir, result, fileOwners, {
      homePreviewPaths: homePreview.map((f) => f.path),
    });

    if (homePreview.length > 0) {
      const combined = homePreview
        .map((f) => `// ===== ${f.path} =====\n${f.content}`)
        .join('\n\n');
      writeFileSync(join(langDir, '_HOME_GRAPH_PREVIEW.txt'), combined, 'utf8');
      if (UPDATE_GOLDENS) {
        const goldenDir = join(GOLDEN_ROOT, fixture.id, lang);
        mkdirSync(goldenDir, { recursive: true });
        writeFileSync(join(goldenDir, '_HOME_GRAPH_PREVIEW.txt'), combined, 'utf8');
      }
    }

    summary.push(
      `- **${lang}**: ${result.files.map((f) => f.path).join(', ') || '(none)'}`
    );
  }
  summary.push('');
}

writeFileSync(join(OUT_ROOT, 'README.md'), summary.join('\n') + '\n', 'utf8');
console.log(`Wrote ${OUT_ROOT}`);
if (UPDATE_GOLDENS) console.log(`Updated goldens ${GOLDEN_ROOT}`);
console.log(summary.join('\n'));
