/**
 * Validation cycle for StartScreen Test Projects (folder-backed):
 *   1. Clear repo-root `Test Projects/`
 *   2. Materialize First Graph + Coverage Lab as on-disk `.vvs/` projects
 *   3. Emit Code-panel codegen into each folder
 *   4. Compare home-graph preview to `test_project_goldens/`
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
  VVS_DIR,
  VVS_GITIGNORE_LINES,
  VVS_INTEGRATION_FILE,
  VVS_PROJECT_FILE,
  buildFolderGraphManifest,
  classGraphRelativePath,
  createDefaultIntegration,
  functionGraphRelativePath,
  toPersistedSnapshot,
  type TargetLanguage,
  type ProjectSnapshot,
  type VvsProjectManifest,
} from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '../src/lib/emitProjectCode';
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

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function buildManifest(snapshot: ProjectSnapshot): VvsProjectManifest {
  return {
    format: 'vvs.project',
    formatVersion: 2,
    name: snapshot.projectDetails.moduleName || 'Untitled',
    description: snapshot.projectDetails.description,
    defaultTarget: snapshot.targetLanguage,
    module: {
      name: snapshot.projectDetails.moduleName,
      extends: snapshot.projectDetails.extendsType,
    },
    settings: {
      autoCompile: snapshot.autoCompile,
      autoSave: snapshot.autoSave ?? false,
      activeClassId: snapshot.activeClassId,
    },
    graphContainers: snapshot.graphContainers,
    graphs: buildFolderGraphManifest(snapshot),
    ...(snapshot.syntaxPackLock ? { syntaxPackLock: snapshot.syntaxPackLock } : {}),
    ...(snapshot.codegenCapabilities
      ? { codegenCapabilities: snapshot.codegenCapabilities }
      : {}),
  };
}

/** Persist snapshot as a Node `.vvs/` folder project (mirrors saveProjectToFolder). */
function saveSnapshotToDisk(projectDir: string, snapshot: ProjectSnapshot) {
  const persisted = toPersistedSnapshot(snapshot);
  const integration =
    persisted.integration ??
    createDefaultIntegration({
      moduleName: persisted.projectDetails.moduleName,
      defaultTarget: persisted.targetLanguage,
      adoptExisting: true,
    });
  const enriched = { ...persisted, integration };
  const manifest = buildManifest(enriched);
  const graphs = manifest.graphs;
  const savedContainers = new Set(Object.keys(graphs.containers ?? {}));

  writeJson(join(projectDir, VVS_PROJECT_FILE), manifest);
  writeJson(join(projectDir, VVS_INTEGRATION_FILE), integration);
  writeText(join(projectDir, '.gitignore'), VVS_GITIGNORE_LINES.join('\n') + '\n');

  for (const [containerId, relPath] of Object.entries(graphs.containers ?? {})) {
    const doc = enriched.documents[containerId];
    if (!doc) continue;
    writeJson(join(projectDir, VVS_DIR, relPath), doc);
  }

  // Function body tabs — include docs even when not in openTabs (fixture pattern).
  const writtenFn = new Set<string>();
  for (const [tabId, relPath] of Object.entries(graphs.functions)) {
    const doc = enriched.documents[tabId];
    if (!doc) continue;
    writeJson(join(projectDir, VVS_DIR, relPath), doc);
    writtenFn.add(tabId);
  }
  for (const func of enriched.functions) {
    const tabId = func.overloads[0]?.graphTabId ?? func.id;
    if (writtenFn.has(tabId)) continue;
    const doc = enriched.documents[tabId];
    if (!doc) continue;
    const rel = functionGraphRelativePath({
      id: tabId,
      type: 'function',
      name: func.name,
    });
    writeJson(join(projectDir, VVS_DIR, rel), doc);
    writtenFn.add(tabId);
  }

  for (const tab of enriched.openTabs) {
    if (tab.type !== 'class') continue;
    if (savedContainers.has(tab.id)) continue;
    const doc = enriched.documents[tab.id];
    if (!doc) continue;
    writeJson(join(projectDir, VVS_DIR, classGraphRelativePath(tab.name)), doc);
  }

  writeJson(join(projectDir, VVS_DIR, 'symbols', 'variables.json'), enriched.variables);
  writeJson(join(projectDir, VVS_DIR, 'symbols', 'events.json'), enriched.events ?? []);
  writeJson(join(projectDir, VVS_DIR, 'symbols', 'functions.json'), enriched.functions);
  writeJson(join(projectDir, VVS_DIR, 'symbols', 'classes.json'), enriched.classes);
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
console.log('Validation cycle: clear → seed → emit → compare');
console.log(`Root: ${TEST_PROJECTS_ROOT}`);

rmSync(TEST_PROJECTS_ROOT, { recursive: true, force: true });
mkdirSync(TEST_PROJECTS_ROOT, { recursive: true });
console.log('1. Cleared Test Projects/');

let failures = 0;
const summary: string[] = [];

for (const fixture of USABILITY_EXAMPLE_TESTS) {
  const snapshot = fixture.create();
  const projectDir = join(TEST_PROJECTS_ROOT, folderSlug(fixture.title));
  mkdirSync(projectDir, { recursive: true });
  saveSnapshotToDisk(projectDir, snapshot);
  console.log(`2. Seeded ${fixture.title} → ${folderSlug(fixture.title)}/`);

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
      summary.push(`  FAIL ${fixture.id} × ${lang}: home preview ≠ golden`);
    } else {
      summary.push(`  ok   ${fixture.id} × ${lang}`);
    }
  }
}

console.log('3. Emitted codegen into each project folder');
console.log('4. Compared home previews to test_project_goldens/');
console.log(summary.join('\n'));

if (failures > 0) {
  console.error(`\n${failures} mismatch(es)`);
  process.exit(1);
}

console.log(
  UPDATE_GOLDENS
    ? '\nGoldens refreshed; Test Projects/ seeded from current fixtures.'
    : '\nValidation cycle passed.'
);
