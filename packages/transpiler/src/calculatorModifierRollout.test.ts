import { describe, expect, test } from 'bun:test';
import { transpileGraph } from './generate';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';
import type { TargetLanguage } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

function transpileMachine(lang: TargetLanguage): string {
  const snapshot = createCoverageLabUsabilityTestSnapshot();
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  return (
    transpileGraph({
      moduleName: 'Machine',
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
      activeClassId: MACHINE_CLASS.id,
    }).files[0]?.content ?? ''
  );
}

describe('Coverage Lab modifier rollout (U52)', () => {
  test('C# — visibility, static, virtual, abstract prototype, async', () => {
    const code = transpileMachine('csharp');
    expect(code).toContain('using System;');
    expect(code).toContain('protected float Power');
    expect(code).toContain('public static float Serial');
    expect(code).toContain('public readonly float MaxPower');
    expect(code).toContain('public virtual void Boot()');
    expect(code).toContain('public async void Shutdown()');
    expect(code).toContain('protected abstract void Diagnose();');
    expect(code).not.toContain('protected abstract void Diagnose() {');
  });

  test('C++ — Declare prototype + out-of-line Define (U82)', () => {
    const code = transpileMachine('cpp');
    expect(code).toContain('virtual void Boot();');
    expect(code).toContain('void Machine::Boot() {');
    expect(code).toContain('virtual void Diagnose() = 0');
    expect(code).toContain('void Shutdown();');
    expect(code).toContain('void Machine::Shutdown() {');
    expect(code).not.toContain('virtual void Boot() {');
  });

  test('Python — async Shutdown; abstract Diagnose → (x) (no invented body)', () => {
    const code = transpileMachine('python');
    expect(code).toContain('async def Shutdown(self):');
    expect(code).toContain('def Boot(self):');
    expect(code).toContain('# (x) Declare Diagnose');
    expect(code).not.toContain('# abstract Diagnose');
    expect(code).not.toContain('def Diagnose(self):');
    expect(code).not.toContain('virtual');
    expect(code).not.toContain('protected');
    // Shared imports (incl. enum) live on the Machine chain at file top in Coverage Lab.
    expect(code).toContain('from enum import Enum');
  });

  test('JavaScript — static Serial and async Shutdown; abstract Diagnose → (x)', () => {
    const code = transpileMachine('javascript');
    expect(code).toContain('static Serial = 0');
    expect(code).toContain('async Shutdown()');
    expect(code).toContain('// (x) Declare Diagnose');
    expect(code).not.toContain('// abstract Diagnose');
    expect(code).not.toContain('virtual');
  });

  test('Rust — pub only for public members; async Shutdown', () => {
    const code = transpileMachine('rust');
    expect(code).toContain('pub Serial: f32');
    expect(code).toMatch(/^\s+Power: f32,/m);
    expect(code).toContain('pub async fn Shutdown');
  });

  test('GDScript — static var Serial; no async keyword', () => {
    const code = transpileMachine('gdscript');
    expect(code).toContain('static var Serial');
    expect(code).toContain('func Shutdown()');
    expect(code).not.toContain('async');
  });

  test('Verse — visibility tags on public members', () => {
    const code = transpileMachine('verse');
    expect(code).toContain('var Serial<public>');
    expect(code).toContain('var MaxPower<public>');
    expect(code).toContain('var Power : float');
    expect(code).not.toContain('var Power<public>');
  });

  test('no invented public/async without define-node properties (python)', () => {
    const code = transpileMachine('python');
    expect(code).toMatch(/^\s+def Boot\(self\):/m);
    expect(code).not.toMatch(/async def Boot/);
    expect(code).toContain('async def Shutdown(self):');
  });

  test('unset visibility does not invent public keyword (csharp/rust)', () => {
    const cs = transpileMachine('csharp');
    expect(cs).not.toContain('impl Default');
    expect(cs).not.toContain('#include');
    const rs = transpileMachine('rust');
    expect(rs).not.toContain('impl Default');
    expect(rs).not.toContain('#include');
    expect(rs).toContain('pub Serial');
    expect(rs).toMatch(/^\s+Power: f32,/m);
    expect(rs).not.toMatch(/^\s+pub Power:/m);
  });
});
