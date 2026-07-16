import { describe, expect, test } from 'bun:test';
import { analyzeProject, MAIN_GRAPH_CONTAINER_ID, type TargetLanguage } from '@vvs/graph-types';
import { transpileGraph } from './generate';
import { createFirstGraphUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/firstGraphUsabilityTest';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';
import type { CodegenContext } from './generate';

const COVERAGE_LANGS = [
  'python',
  'javascript',
  'cpp',
  'csharp',
  'rust',
  'gdscript',
  'verse',
] as const satisfies readonly TargetLanguage[];

type CoverageLang = (typeof COVERAGE_LANGS)[number];

function transpileMain(
  snapshot: ReturnType<typeof createFirstGraphUsabilityTestSnapshot>,
  targetLanguage: CoverageLang
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

function transpileMachine(
  snapshot: ReturnType<typeof createCoverageLabUsabilityTestSnapshot>,
  targetLanguage: CoverageLang
) {
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  const ctx: CodegenContext = {
    moduleName: 'Machine',
    extendsType: '',
    targetLanguage,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: home.nodes,
    edges: home.edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: MACHINE_CLASS.id,
  };
  return transpileGraph(ctx);
}

/** Line index (0-based) of the Define Boot method header — not Call Boot. */
function findBootDefineLine(lines: string[], lang: CoverageLang): number {
  switch (lang) {
    case 'python':
      return lines.findIndex((l) => l.includes('def Boot(self):'));
    case 'javascript':
      return lines.findIndex((l) => /^\s*Boot\(\)\s*\{/.test(l));
    case 'csharp':
      return lines.findIndex((l) => /void Boot\(\)\s*\{/.test(l));
    case 'rust':
      return lines.findIndex((l) => /fn Boot\(/.test(l));
    case 'gdscript':
      return lines.findIndex((l) => /func Boot\(/.test(l));
    case 'verse':
      return lines.findIndex((l) => /^\s*Boot/.test(l) && l.includes(': void'));
    case 'cpp':
      return lines.findIndex((l) => l.includes('void Machine::Boot()'));
  }
}

const HELLO_WORLD_EXPECTS: Record<CoverageLang, string[]> = {
  python: ['def on_start(self):', 'print('],
  javascript: ['on_start(', 'console.log'],
  cpp: ['void on_start', 'std::cout'],
  csharp: ['void on_start', 'Console.Write'],
  rust: ['fn on_start', 'println!'],
  gdscript: ['func on_start', 'print('],
  verse: ['on_start', 'Print('],
};

const MACHINE_EXPECTS: Record<CoverageLang, string[]> = {
  python: ['def Boot(', 'self.Boot()', 'if ', 'async def Shutdown', 'def on_pulse', 'def on_start'],
  javascript: ['Boot(', 'this.Boot()', 'if ', 'async Shutdown', 'on_pulse', 'on_start'],
  cpp: [
    'virtual void Boot();',
    'void Machine::Boot()',
    'Boot()',
    'if ',
    'void Shutdown();',
    'void Machine::Shutdown()',
    'void on_pulse',
    'void on_start',
    'Diagnose() = 0',
    'inline static',
  ],
  csharp: ['void Boot()', 'this.Boot()', 'if ', 'async void Shutdown', 'on_pulse', 'on_start'],
  rust: ['fn Boot(', 'self.Boot()', 'if ', 'async fn Shutdown', 'fn on_pulse', 'fn on_start'],
  gdscript: ['func Boot(', 'self.Boot()', 'if ', 'func Shutdown', 'func on_pulse', 'func on_start'],
  verse: ['Boot', 'if ', 'Shutdown', 'on_pulse', 'on_start'],
};

describe('usability example test snapshots', () => {
  for (const lang of COVERAGE_LANGS) {
    test(`first graph usability test transpiles for ${lang}`, () => {
      const snapshot = createFirstGraphUsabilityTestSnapshot();
      const result = transpileMain(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of HELLO_WORLD_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      expect(content).toContain('Done.');
      if (lang !== 'gdscript') {
        // GDScript Get User Input uses OS.read_string_from_stdin() without embedding the prompt.
        expect(content).toMatch(/What is your name\?/);
      }
    });

    test(`coverage lab Machine transpiles for ${lang}`, () => {
      const snapshot = createCoverageLabUsabilityTestSnapshot();
      const result = transpileMachine(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of MACHINE_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      if (lang === 'cpp') {
        expect(content).not.toContain('// Declare');
        expect(content).not.toContain('(x) Declare');
        expect(content).toContain('virtual void Boot();');
        expect(content).toContain('Diagnose() = 0');
      } else {
        expect(content).toContain('(x) Declare Boot');
        // Forbid stub-style `# Declare` / `// Declare` without the U66 `(x)` marker.
        expect(content).not.toContain('# Declare');
        expect(content).not.toContain('// Declare');
        if (lang === 'csharp') {
          expect(content).toMatch(/abstract\s+void\s+Diagnose/);
        } else {
          expect(content).toContain('abstract Diagnose');
        }
      }
    });

    if (lang !== 'cpp') {
      test(`coverage lab ${lang}: Declare sourceMap excludes Define Boot line`, () => {
        const snapshot = createCoverageLabUsabilityTestSnapshot();
        const result = transpileMachine(snapshot, lang);
        const lines = result.files[0]!.content.split('\n');
        const xBoot = lines.findIndex((l) => l.includes('(x) Declare Boot')) + 1;
        const defBoot = findBootDefineLine(lines, lang) + 1;
        expect(xBoot).toBeGreaterThan(0);
        expect(defBoot).toBeGreaterThan(0);

        const declareBoot = result.sourceMap['lab-fn-boot']!.map((r) => r.startLine);
        const defineBoot = result.sourceMap['lab-fn-boot-impl']!.map((r) => r.startLine);
        expect(declareBoot).toContain(xBoot);
        expect(declareBoot).not.toContain(defBoot);
        expect(defineBoot).toContain(defBoot);

        if (lang === 'csharp') {
          const absLine = lines.findIndex((l) => /abstract\s+void\s+Diagnose/.test(l)) + 1;
          expect(absLine).toBeGreaterThan(0);
          expect(result.sourceMap['lab-fn-diagnose']!.map((r) => r.startLine)).toContain(absLine);
        } else {
          const absLine = lines.findIndex((l) => l.includes('abstract Diagnose')) + 1;
          expect(absLine).toBeGreaterThan(0);
          expect(result.sourceMap['lab-fn-diagnose']!.map((r) => r.startLine)).toContain(absLine);
        }
      });
    }
  }

  test('coverage lab has no error-level analysis diagnostics', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
