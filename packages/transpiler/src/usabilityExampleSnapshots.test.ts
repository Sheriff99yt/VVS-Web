import { describe, expect, test } from 'bun:test';
import { analyzeProject, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { transpileGraph } from './generate';
import { createFirstGraphUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/firstGraphUsabilityTest';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';
import type { CodegenContext } from './generate';

type TargetLanguage = 'python' | 'javascript' | 'cpp' | 'verse';

function transpileMain(
  snapshot: ReturnType<typeof createFirstGraphUsabilityTestSnapshot>,
  targetLanguage: TargetLanguage
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
  targetLanguage: TargetLanguage
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

const HELLO_WORLD_EXPECTS: Record<TargetLanguage, string[]> = {
  python: ['def on_start(self):', 'print('],
  javascript: ['on_start(', 'console.log'],
  cpp: ['void on_start', 'std::cout'],
  verse: ['on_start', 'Print('],
};

const MACHINE_EXPECTS: Record<TargetLanguage, string[]> = {
  python: ['def Boot(', 'self.Boot()', 'if ', 'async def Shutdown', 'def on_pulse', 'def on_start'],
  javascript: ['Boot(', 'this.Boot()', 'if ', 'async Shutdown', 'on_pulse', 'on_start'],
  cpp: [
    'void Boot(',
    'Boot()',
    'if ',
    'void Shutdown',
    'void on_pulse',
    'void on_start',
    'virtual void Boot',
    'Diagnose() = 0',
    'inline static',
  ],
  verse: ['Boot', 'if ', 'Shutdown', 'on_pulse', 'on_start'],
};

describe('usability example test snapshots', () => {
  for (const lang of ['python', 'javascript', 'cpp', 'verse'] as const) {
    test(`first graph usability test transpiles for ${lang}`, () => {
      const snapshot = createFirstGraphUsabilityTestSnapshot();
      const result = transpileMain(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of HELLO_WORLD_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      expect(content).toContain('Done.');
      expect(content).toMatch(/What is your name\?/);
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
      }
      expect(content).not.toContain('# Declare');
    });
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
