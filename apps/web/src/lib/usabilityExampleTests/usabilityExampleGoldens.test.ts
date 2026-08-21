import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MAIN_GRAPH_CONTAINER_ID, type TargetLanguage } from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '@/lib/emitProjectCode';
import {
  loadProjectSnapshotFromPath,
  saveProjectSnapshotToPath,
} from '@/lib/projectFolder/nodeIo';
import { USABILITY_EXAMPLE_TESTS } from '@/lib/usabilityExampleProjects';

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

const GOLDEN_ROOT = join(import.meta.dir, '../../../test_project_goldens');

function homeGraphPreviewText(
  snapshot: NonNullable<ReturnType<typeof loadProjectSnapshotFromPath>>,
  lang: TargetLanguage
): string {
  const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: lang });
  const fileOwners = fileOwnersForEmitResult({ ...snapshot, targetLanguage: lang }, result);
  const homePreview = result.files.filter((f) => fileOwners[f.path] === MAIN_GRAPH_CONTAINER_ID);
  return homePreview.map((f) => `// ===== ${f.path} =====\n${f.content}`).join('\n\n');
}

/** Seed → load-from-disk → emit (same honesty as validate_test_projects_folder.ts). */
function emitFixtureFromDisk(
  fixture: (typeof USABILITY_EXAMPLE_TESTS)[number],
  lang: TargetLanguage
): string {
  const dir = mkdtempSync(join(tmpdir(), `vvs-golden-${fixture.id}-`));
  try {
    saveProjectSnapshotToPath(dir, fixture.create());
    const loaded = loadProjectSnapshotFromPath(dir);
    if (!loaded) throw new Error(`failed to load ${fixture.id} from ${dir}`);
    return homeGraphPreviewText(loaded, lang);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('U65 Test Project goldens (Code panel path, disk-loaded)', () => {
  for (const fixture of USABILITY_EXAMPLE_TESTS) {
    for (const lang of LANGS) {
      test(`${fixture.id} × ${lang} home preview matches golden`, () => {
        const goldenPath = join(GOLDEN_ROOT, fixture.id, lang, '_HOME_GRAPH_PREVIEW.txt');
        expect(
          existsSync(goldenPath),
          `missing golden ${goldenPath} — run validate_test_projects_folder.ts --update-goldens`
        ).toBe(true);
        const expected = readFileSync(goldenPath, 'utf8');
        const actual = emitFixtureFromDisk(fixture, lang);
        expect(actual).toBe(expected);
      });
    }
  }

  test('Simple greets Ada with no leftover', () => {
    const simple = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'simple')!;
    const py = emitFixtureFromDisk(simple, 'python');
    expect(py).toContain('Hello, ');
    expect(py).toContain('Ada');
    expect(py).toContain('def Greet(');
    expect(py).not.toContain('(x)');
    expect(py).not.toMatch(/input\(/);
  });

  test('Complex teaches branch / for / switch on all-lang path', () => {
    const complex = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'complex')!;
    const py = emitFixtureFromDisk(complex, 'python');
    expect(py).toContain('print("go")');
    expect(py).toContain('def Add(');
    expect(py).toMatch(/for /);
    expect(py).not.toContain('(x)');
  });

  test('Advanced teaches override Diagnose, GetInput, and Wait', () => {
    const advanced = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'advanced')!;
    const py = emitFixtureFromDisk(advanced, 'python');
    expect(py).toContain('print("sensor")');
    expect(py).toContain('super().Diagnose()');
    expect(py).toMatch(/input\(/);
    expect(py).toMatch(/async def on_start/);
    expect(py).toMatch(/sleep|asyncio|delay/);
    const parentBlock = py.split('class Sensor')[0] ?? '';
    expect(parentBlock).toContain('def Diagnose(');
    expect(parentBlock).not.toContain('print("sensor")');
  });
});
