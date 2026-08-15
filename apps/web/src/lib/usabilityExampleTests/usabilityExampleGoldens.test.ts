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

  test('First Graph teaches Get User Input', () => {
    const simple = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'simple')!;
    const py = emitFixtureFromDisk(simple, 'python');
    expect(py).toContain('What is your name?');
    expect(py).toMatch(/input\(/);
  });

  test('Coverage Lab teaches TypeRef map Tags', () => {
    const complex = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'complex')!;
    const cpp = emitFixtureFromDisk(complex, 'cpp');
    expect(cpp).toContain('Tags');
    expect(cpp).toMatch(/std::unordered_map|map</i);
  });

  test('Inheritance Lab teaches parent/child Speak and Wait async', () => {
    const inheritance = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'inheritance')!;
    const py = emitFixtureFromDisk(inheritance, 'python');
    expect(py).toContain('print("parent")');
    expect(py).toContain('super().Speak()');
    expect(py).toContain('print("child")');
    const parentBlock = py.split('class Child')[0] ?? '';
    expect(parentBlock).toContain('print("parent")');
    expect(parentBlock).not.toContain('print("child")');
    expect(py).toMatch(/async def on_start/);
    expect(py).toMatch(/sleep|asyncio|delay/);
  });
});
