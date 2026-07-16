import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MAIN_GRAPH_CONTAINER_ID, type TargetLanguage } from '@vvs/graph-types';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '@/lib/emitProjectCode';
import { USABILITY_EXAMPLE_TESTS } from '@/lib/usabilityExampleProjects';

const LANGS: TargetLanguage[] = [
  'python',
  'javascript',
  'cpp',
  'csharp',
  'rust',
  'gdscript',
  'verse',
];

const GOLDEN_ROOT = join(import.meta.dir, '../../../test_project_goldens');

function homeGraphPreviewText(
  snapshot: ReturnType<(typeof USABILITY_EXAMPLE_TESTS)[number]['create']>,
  lang: TargetLanguage
): string {
  const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: lang });
  const fileOwners = fileOwnersForEmitResult({ ...snapshot, targetLanguage: lang }, result);
  const homePreview = result.files.filter((f) => fileOwners[f.path] === MAIN_GRAPH_CONTAINER_ID);
  return homePreview.map((f) => `// ===== ${f.path} =====\n${f.content}`).join('\n\n');
}

describe('U65 Test Project goldens (Code panel path)', () => {
  for (const fixture of USABILITY_EXAMPLE_TESTS) {
    for (const lang of LANGS) {
      test(`${fixture.id} × ${lang} home preview matches golden`, () => {
        const goldenPath = join(GOLDEN_ROOT, fixture.id, lang, '_HOME_GRAPH_PREVIEW.txt');
        expect(existsSync(goldenPath), `missing golden ${goldenPath} — run extract with --update-goldens`).toBe(
          true
        );
        const expected = readFileSync(goldenPath, 'utf8');
        const actual = homeGraphPreviewText(fixture.create(), lang);
        expect(actual).toBe(expected);
      });
    }
  }

  test('First Graph teaches Get User Input', () => {
    const simple = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'simple')!;
    const py = homeGraphPreviewText(simple.create(), 'python');
    expect(py).toContain('What is your name?');
    expect(py).toMatch(/input\(/);
  });

  test('Coverage Lab teaches TypeRef map Tags', () => {
    const complex = USABILITY_EXAMPLE_TESTS.find((f) => f.id === 'complex')!;
    const cpp = homeGraphPreviewText(complex.create(), 'cpp');
    expect(cpp).toContain('Tags');
    expect(cpp).toMatch(/std::unordered_map|map</i);
  });
});
