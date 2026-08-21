import { describe, expect, test } from 'bun:test';
import { transpileGraph } from './generate';
import {
  createAdvancedSnapshot,
  MACHINE_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest';
import { createComplexSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/complexUsabilityTest';
import type { TargetLanguage } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

function transpileHome(
  snapshot: ReturnType<typeof createAdvancedSnapshot>,
  lang: TargetLanguage,
  activeClassId?: string
): string {
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  return (
    transpileGraph({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
      targetLanguage: lang,
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: home.nodes,
      edges: home.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: activeClassId ?? snapshot.activeClassId,
    }).files[0]?.content ?? ''
  );
}

describe('example modifier rollout (U52)', () => {
  test('Advanced C++ — virtual Diagnose prototype + out-of-line Define (U82)', () => {
    const code = transpileHome(createAdvancedSnapshot(), 'cpp', MACHINE_CLASS.id);
    expect(code).toContain('virtual void Diagnose();');
    expect(code).toContain('void Machine::Diagnose() {');
    expect(code).not.toContain('virtual void Diagnose() {');
  });

  test('Advanced Python — Diagnose is a real def, no leftover declare', () => {
    const code = transpileHome(createAdvancedSnapshot(), 'python', MACHINE_CLASS.id);
    expect(code).toContain('def Diagnose(self):');
    expect(code).not.toContain('(x) Declare Diagnose');
    expect(code).not.toContain('# abstract Diagnose');
  });

  test('Complex public members emit without invented keywords (python)', () => {
    const code = transpileHome(createComplexSnapshot(), 'python');
    expect(code).toContain('def Add(self, n):');
    expect(code).not.toContain('virtual');
    expect(code).not.toContain('protected');
    expect(code).not.toContain('(x)');
  });

  test('unset visibility does not invent public keyword (csharp/rust Complex)', () => {
    const cs = transpileHome(createComplexSnapshot(), 'csharp');
    expect(cs).not.toContain('impl Default');
    expect(cs).not.toContain('#include');
    const rs = transpileHome(createComplexSnapshot(), 'rust');
    expect(rs).not.toContain('impl Default');
    expect(rs).not.toContain('#include');
  });
});
