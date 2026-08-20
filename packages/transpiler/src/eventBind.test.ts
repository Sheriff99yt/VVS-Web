import { describe, expect, test } from 'bun:test';
import type { TargetLanguage } from '@vvs/graph-types';
import { list } from '@vvs/syntax-registry';
import { transpileGraphCode } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function bindNode(id = 'bind-1') {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      kindId: 'event_bind',
      label: 'Bind go',
      category: 'Events',
      inputs: [
        EXEC_IN,
        { id: 'target', label: 'Target', type: 'data_any' as const },
        { id: 'event', label: 'Event', type: 'data_any' as const },
        { id: 'handler', label: 'Handler', type: 'data_any' as const },
      ],
      outputs: [EXEC_OUT],
      properties: { eventId: 'evt-go', eventName: 'go' },
      inlineValues: {},
    },
  };
}

function bindGraph(lang: TargetLanguage) {
  return withTestEntryGraph({
    moduleName: 'Demo',
    extendsType: '',
    targetLanguage: lang,
    variables: [],
    functions: [],
    nodes: [bindNode()],
    edges: [],
  });
}

describe('event_bind honest registration', () => {
  test('csharp prints one += line', () => {
    const code = transpileGraphCode(bindGraph('csharp'));
    expect(code).toContain('this.go += this.on_go;');
    expect(code.split('this.go += this.on_go;')).toHaveLength(2);
    expect(code).not.toContain('_subscribe');
    expect(code).not.toContain('_emit');
  });

  test('javascript prints one .on line', () => {
    const code = transpileGraphCode(bindGraph('javascript'));
    expect(code).toContain('this.on("go", this.on_go);');
    expect(code.split('this.on("go", this.on_go);')).toHaveLength(2);
    expect(code).not.toContain('addEventListener');
    expect(code).not.toContain('_subscribe');
  });

  test('gdscript prints one .connect line', () => {
    const code = transpileGraphCode(bindGraph('gdscript'));
    expect(code).toContain('self.connect("go", self.on_go)');
    expect(code.split('self.connect("go", self.on_go)')).toHaveLength(2);
    expect(code).not.toContain('_subscribe');
  });

  test('python does not invent multicast syntax when a Bind node is placed', () => {
    const code = transpileGraphCode(bindGraph('python'));
    expect(code).toContain('(x) Bind');
    expect(code).not.toContain(' += ');
    expect(code).not.toMatch(/\.on\(/);
    expect(code).not.toMatch(/\.connect\(/);
    expect(code).not.toContain('_subscribe');
  });

  test('spawn lists Bind on csharp/js/gdscript only', () => {
    for (const lang of ['csharp', 'javascript', 'gdscript'] as const) {
      const cats = list({
        currentGraphId: 'main',
        functions: [],
        events: [],
        targetLanguage: lang,
      });
      expect(cats.some((c) => c.items.some((i) => i.kindId === 'event_bind'))).toBe(true);
    }
    const python = list({
      currentGraphId: 'main',
      functions: [],
      events: [],
      targetLanguage: 'python',
    });
    expect(python.some((c) => c.items.some((i) => i.kindId === 'event_bind'))).toBe(false);
  });

  test('event_emit and event_subscribe stay spawn-excluded', () => {
    const cats = list({
      currentGraphId: 'main',
      functions: [],
      events: [],
      targetLanguage: 'csharp',
    });
    const kindIds = cats.flatMap((c) => c.items.map((i) => i.kindId));
    expect(kindIds).not.toContain('event_emit');
    expect(kindIds).not.toContain('event_subscribe');
  });
});
