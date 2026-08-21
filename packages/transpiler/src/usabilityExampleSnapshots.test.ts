import { describe, expect, test } from 'bun:test';
import { analyzeProject, MAIN_GRAPH_CONTAINER_ID, type TargetLanguage } from '@vvs/graph-types';
import { transpileGraph, transpileProject } from './generate';
import { createSimpleSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/simpleUsabilityTest';
import { createComplexSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/complexUsabilityTest';
import { createAdvancedSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest';
import type { CodegenContext } from './generate';

const LANGS = [
  'python',
  'javascript',
  'cpp',
  'csharp',
  'rust',
  'gdscript',
  'verse',
] as const satisfies readonly TargetLanguage[];

type ExampleLang = (typeof LANGS)[number];

function transpileHome(
  snapshot: ReturnType<typeof createSimpleSnapshot>,
  targetLanguage: ExampleLang
) {
  const main = snapshot.documents![MAIN_GRAPH_CONTAINER_ID];
  if (!main) throw new Error(`missing ${MAIN_GRAPH_CONTAINER_ID}`);
  const ctx: CodegenContext = {
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType,
    targetLanguage,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: main.nodes,
    edges: main.edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
  };
  return transpileGraph(ctx);
}

/** Line index (0-based) of the Define Add method header — not Call Add. */
function findAddDefineLine(lines: string[], lang: ExampleLang): number {
  switch (lang) {
    case 'python':
      return lines.findIndex((l) => l.includes('def Add(self, n):'));
    case 'javascript':
      return lines.findIndex((l) => /^\s*Add\(/.test(l) && l.includes('{'));
    case 'csharp':
      return lines.findIndex((l) => /Add\(/.test(l) && l.includes('{'));
    case 'rust':
      return lines.findIndex((l) => /fn Add\(/.test(l));
    case 'gdscript':
      return lines.findIndex((l) => /func Add\(/.test(l));
    case 'verse':
      return lines.findIndex((l) => /^\s*Add/.test(l));
    case 'cpp':
      return lines.findIndex((l) => l.includes('Counter::Add('));
  }
}

const SIMPLE_EXPECTS: Record<ExampleLang, string[]> = {
  python: ['def on_start(self):', 'print(', 'def Greet('],
  javascript: ['on_start(', 'console.log', 'Greet('],
  cpp: ['void on_start', 'std::cout', 'Greet'],
  csharp: ['void on_start', 'Console.Write', 'Greet'],
  rust: ['fn on_start', 'println!', 'fn Greet'],
  gdscript: ['func on_start', 'print(', 'func Greet'],
  verse: ['on_start', 'Print(', 'Greet'],
};

const COMPLEX_EXPECTS: Record<ExampleLang, string[]> = {
  python: ['def Add(', 'self.Add(', 'if ', 'def on_start'],
  javascript: ['Add(', 'this.Add(', 'if ', 'on_start'],
  cpp: ['Add(', 'if ', 'void on_start'],
  csharp: ['Add(', 'if ', 'on_start'],
  rust: ['fn Add(', 'if ', 'fn on_start'],
  gdscript: ['func Add(', 'if ', 'func on_start'],
  verse: ['Add', 'if ', 'on_start'],
};

describe('usability example test snapshots', () => {
  for (const lang of LANGS) {
    test(`Simple transpiles for ${lang}`, () => {
      const snapshot = createSimpleSnapshot();
      const result = transpileHome(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of SIMPLE_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      expect(content).toContain('Hello, ');
      expect(content).not.toContain('(x)');
    });

    test(`Complex transpiles for ${lang}`, () => {
      const snapshot = createComplexSnapshot();
      const result = transpileHome(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of COMPLEX_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      expect(content).not.toContain('(x)');
    });

    if (lang !== 'cpp') {
      test(`Complex ${lang}: Declare sourceMap excludes Define Add line`, () => {
        const snapshot = createComplexSnapshot();
        const result = transpileHome(snapshot, lang);
        const lines = result.files[0]!.content.split('\n');
        const defAdd = findAddDefineLine(lines, lang) + 1;
        expect(defAdd).toBeGreaterThan(0);

        const declareAdd = (result.sourceMap['cx-fn-add'] ?? []).map((r) => r.startLine);
        const defineAdd = result.sourceMap['cx-fn-add-impl']!.map((r) => r.startLine);
        expect(declareAdd).not.toContain(defAdd);
        expect(defineAdd).toContain(defAdd);
      });
    }
  }

  test('Advanced: two classes, same method name, distinct bodies', () => {
    const snapshot = createAdvancedSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents ?? {},
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
    });
    const code = result.files.map((f) => f.content).join('\n');
    expect(code).toContain('print("sensor")');
    expect(code).toContain('super().Diagnose()');
    const parentBlock = code.split('class Sensor')[0] ?? '';
    expect(parentBlock).toContain('def Diagnose(self):');
    expect(parentBlock).not.toContain('print("sensor")');
  });

  test('Complex has no error-level analysis diagnostics', () => {
    const snapshot = createComplexSnapshot();
    const result = analyzeProject({
      documents: snapshot.documents!,
      variables: snapshot.variables,
      functions: snapshot.functions,
      events: snapshot.events,
      openTabs: snapshot.openTabs,
      projectDetails: { extendsType: snapshot.projectDetails.extendsType },
      targetLanguage: 'python',
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });

    const errors = result.diagnostics.filter((d) => d.level === 'error');
    expect(errors).toEqual([]);
  });
});
