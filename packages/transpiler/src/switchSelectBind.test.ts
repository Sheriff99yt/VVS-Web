import { describe, expect, test } from 'bun:test';
import type { IrSwitch } from './ir/types';
import { createPrintContext, printStatement } from './print';

const switchWithInstanceRef: IrSwitch = {
  kind: 'Switch',
  sourceGraphNodeId: 'switch-1',
  selector: { kind: 'InstanceRef', sourceGraphNodeId: 'get-status', name: 'Status' },
  cases: [{ label: 'OK', body: [] }],
  defaultBody: [],
};

describe('SwitchSelectBind / selector expressionSpans (U64a revision)', () => {
  test('python match line maps selector node into value span', () => {
    const printed = printStatement(switchWithInstanceRef, createPrintContext('python', [], '        '));
    expect(printed.text).toContain('match self.Status:');
    const span = printed.expressionSpans.find((s) => s.nodeId === 'get-status');
    expect(span).toBeDefined();
    const sliced = printed.text.slice(span!.start, span!.end);
    expect(sliced).toBe('self.Status');
  });

  test('gdscript still binds the selector; rust match spans it', () => {
    const gd = printStatement(switchWithInstanceRef, createPrintContext('gdscript', [], '        '));
    const gdSpan = gd.expressionSpans.find((s) => s.nodeId === 'get-status');
    expect(gdSpan).toBeDefined();
    expect(gd.text.slice(gdSpan!.start, gdSpan!.end)).toContain('Status');

    const rust = printStatement(switchWithInstanceRef, createPrintContext('rust', [], '        '));
    expect(rust.text).toContain('match ');
    const rustSpan = rust.expressionSpans.find((s) => s.nodeId === 'get-status');
    expect(rustSpan).toBeDefined();
    expect(rust.text.slice(rustSpan!.start, rustSpan!.end)).toContain('Status');
  });

  test('cpp / javascript / csharp span selector inside switch (...)', () => {
    for (const family of ['cpp', 'javascript', 'csharp'] as const) {
      const printed = printStatement(switchWithInstanceRef, createPrintContext(family, [], '        '));
      expect(printed.text).toContain('switch (');
      const span = printed.expressionSpans.find((s) => s.nodeId === 'get-status');
      expect(span, family).toBeDefined();
      expect(printed.text.slice(span!.start, span!.end)).toContain('Status');
    }
  });
});
