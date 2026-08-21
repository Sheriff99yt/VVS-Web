import { describe, expect, test } from 'bun:test';
import { transpileProject } from './generate';
import { createSimpleSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/simpleUsabilityTest';
import { createComplexSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/complexUsabilityTest';
import { createAdvancedSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest';
import type { ProjectSnapshot, TargetLanguage } from '@vvs/graph-types';

function emit(snapshot: ProjectSnapshot, lang: TargetLanguage): string {
  const result = transpileProject({
    projectDetails: snapshot.projectDetails,
    targetLanguage: lang,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    documents: snapshot.documents!,
    classes: snapshot.classes,
    openTabs: snapshot.openTabs,
  });
  return result.files.map((f) => f.content).join('\n');
}

const ALL_LANGS = ['python', 'javascript', 'cpp', 'csharp', 'rust', 'gdscript', 'verse', 'go'] as const;

describe('lab completeness pass (no leftover fakes)', () => {
  test('Simple + Complex: zero leftover (x) on all 8 languages', () => {
    for (const create of [createSimpleSnapshot, createComplexSnapshot]) {
      const snapshot = create();
      for (const lang of ALL_LANGS) {
        const code = emit(snapshot, lang);
        expect(code).not.toContain('(x)');
      }
    }
  });

  test('Simple greets via Greet / concat and has a real entry', () => {
    const snapshot = createSimpleSnapshot();
    const py = emit(snapshot, 'python');
    expect(py).toContain('def Greet(');
    expect(py).toContain('self.Greet()');
    expect(py).toContain('Hello, ');
    expect(py).toContain('Ada');
    expect(emit(snapshot, 'go')).toContain('import "fmt"');
  });

  test('Complex: Add returns Total+n; Ready branch; Go if/for/switch', () => {
    const snapshot = createComplexSnapshot();
    const py = emit(snapshot, 'python');
    expect(py).toContain('def Add(self, n):');
    expect(py).toMatch(/self\.Total\s*=/);
    expect(py).toContain('print("go")');
    expect(py).toContain('self.Add(');

    const go = emit(snapshot, 'go');
    expect(go).toContain('import "fmt"');
    expect(go).toContain('if self.Ready');
    expect(go).toMatch(/for /);
    expect(go).toContain('switch ');
    expect(go).not.toContain('// if (');
    expect(go).not.toContain('// switch');
  });

  test('Advanced: GetInput stored in Operator; Diagnose + super; Wait', () => {
    const snapshot = createAdvancedSnapshot();
    const py = emit(snapshot, 'python');
    expect(py).toContain('self.Operator = _vvs_input_ad_get_input');
    expect(py).toContain('self.Diagnose()');
    expect(py).toContain('print("sensor")');
    expect(py).toContain('super().Diagnose()');
    expect(py).toMatch(/async def on_start/);
    expect(py).toMatch(/sleep|asyncio/);

    const verse = emit(snapshot, 'verse');
    expect(verse).toContain('(x)');
    expect(verse).not.toContain('Player.GetInput');
    expect(verse).not.toContain('.GetInput(');

    expect(emit(snapshot, 'go')).toContain('import "fmt"');
  });
});
