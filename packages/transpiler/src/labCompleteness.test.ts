import { describe, expect, test } from 'bun:test';
import { transpileProject } from './generate';
import { createNewFeaturesUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/newFeaturesUsabilityTest';
import { createCoverageLabUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';
import { createInheritanceLabUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/inheritanceLabUsabilityTest';
import { createBranchLabUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/branchLabUsabilityTest';
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

describe('lab completeness pass (no leftover fakes)', () => {
  test('New Features: Call return pin is a real expression, not a return_val comment', () => {
    const snapshot = createNewFeaturesUsabilityTestSnapshot();
    for (const lang of ['python', 'javascript', 'cpp', 'csharp', 'rust', 'gdscript', 'verse', 'go'] as const) {
      const code = emit(snapshot, lang);
      expect(code).not.toContain('return_val');
      expect(code).toContain('ProcessData(');
    }
    const py = emit(snapshot, 'python');
    expect(py).toContain('print(self.ProcessData(');
    expect(py).toContain('# (x) Implement ProcessData');
    expect(py).not.toContain('@overload');
  });

  test('Coverage: gated Import json is real on Python and silent-skipped elsewhere', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const py = emit(snapshot, 'python');
    expect(py).toMatch(/else:\s*\n\s+import json\s*\n\s+print\("Not ready"\)/);
    for (const lang of ['javascript', 'cpp', 'csharp', 'rust', 'gdscript', 'verse', 'go'] as const) {
      const code = emit(snapshot, lang);
      expect(code).not.toContain('(x) Import json');
    }
  });

  test('Inheritance: empty Parent ctor does not leak (x) Implement Parent', () => {
    const snapshot = createInheritanceLabUsabilityTestSnapshot();
    const rust = emit(snapshot, 'rust');
    expect(rust).toContain('pub fn new()');
    expect(rust).not.toContain('(x) Implement Parent');
    expect(emit(snapshot, 'go')).not.toContain('(x) Implement Parent');
    expect(emit(snapshot, 'verse')).not.toContain('(x) Implement Parent');
  });

  test('Coverage Go: real if / switch / for range / append + fmt import', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const code = emit(snapshot, 'go');
    expect(code).toContain('import "fmt"');
    expect(code).toContain('if self.Ready');
    expect(code).toContain('switch ');
    expect(code).toContain('for _, val := range');
    expect(code).toContain(' = append(');
    expect(code).not.toContain('// if (');
    expect(code).not.toContain('// switch');
    expect(code).not.toContain('// foreach');
    expect(code).not.toContain('// push');
    expect(code).not.toContain('match ');
  });

  test('Branch Go: real if, not a profile stub', () => {
    const snapshot = createBranchLabUsabilityTestSnapshot();
    const code = emit(snapshot, 'go');
    expect(code).toContain('if false');
    expect(code).not.toContain('// if (');
  });

  test('New Features: string ProcessData does not leak Concat leftover after valued return', () => {
    const snapshot = createNewFeaturesUsabilityTestSnapshot();
    for (const lang of ['cpp', 'csharp', 'javascript', 'verse'] as const) {
      const code = emit(snapshot, lang);
      expect(code).not.toMatch(/Concat Strings/);
      expect(code).not.toMatch(/String Concat/);
    }
    const cpp = emit(snapshot, 'cpp');
    expect(cpp.match(/return \(a \+ b\);/g)?.length).toBe(2);
  });

  test('Coverage: Calculate returns Math Add of parameters', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const cpp = emit(snapshot, 'cpp');
    expect(cpp).toContain('float Machine::Calculate(float a, float b)');
    expect(cpp).toMatch(/float Machine::Calculate\(float a, float b\) \{[\s\S]*?return \(a \+ b\);/);
    expect(cpp).not.toMatch(/float Machine::Calculate\(float a, float b\) \{[\s\S]*?return;\s*\n\}/);
    const py = emit(snapshot, 'python');
    expect(py).toMatch(/def Calculate\(self, a, b\):[\s\S]*?return \(a \+ b\)/);
  });

  test('Inheritance / New Features Go include fmt when Print is used', () => {
    expect(emit(createInheritanceLabUsabilityTestSnapshot(), 'go')).toContain('import "fmt"');
    expect(emit(createNewFeaturesUsabilityTestSnapshot(), 'go')).toContain('import "fmt"');
  });
});
