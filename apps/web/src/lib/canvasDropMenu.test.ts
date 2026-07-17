import { describe, expect, test } from 'bun:test';
import {
  buildEventDropActions,
  buildFunctionDropActions,
  buildVariableDropActions,
  canvasDropLabel,
  toCanvasDropMenuItems,
} from './canvasDropMenu';

describe('canvasDropLabel', () => {
  test('uses Call / Declare / Define vocabulary', () => {
    expect(canvasDropLabel('call', 'pulse')).toBe('Call pulse');
    expect(canvasDropLabel('declare', 'pulse')).toBe('Declare pulse');
    expect(canvasDropLabel('define', 'pulse')).toBe('Define pulse');
  });
});

describe('buildEventDropActions', () => {
  test('orders Call → Declare → Define on class graph', () => {
    const actions = buildEventDropActions({
      name: 'pulse',
      onActiveClassGraph: true,
      declareExists: false,
      defineExists: false,
      onCall: () => {},
      onDeclare: () => {},
      onDefine: () => {},
    });
    expect(actions.map((a) => a.role)).toEqual(['call', 'declare', 'define']);
    const { items, dividersBefore } = toCanvasDropMenuItems(actions);
    expect(items.map((i) => i.label)).toEqual([
      'Call pulse',
      'Declare pulse',
      'Define pulse',
    ]);
    expect(dividersBefore.length).toBe(2);
  });

  test('omits Declare off class graph', () => {
    const actions = buildEventDropActions({
      name: 'pulse',
      onActiveClassGraph: false,
      declareExists: false,
      defineExists: true,
      onCall: () => {},
      onDeclare: () => {},
      onDefine: () => {},
    });
    expect(actions.map((a) => a.role)).toEqual(['call', 'define']);
  });
});

describe('buildFunctionDropActions', () => {
  test('matches event Call / Declare / Define shape', () => {
    const actions = buildFunctionDropActions({
      name: 'Boot',
      onActiveClassGraph: true,
      declareExists: true,
      onCall: () => {},
      onDeclare: () => {},
      onDefine: () => {},
    });
    expect(actions.map((a) => a.role)).toEqual(['call', 'declare', 'define']);
    expect(actions[1]?.disabled).toBe(true);
  });
});

describe('buildVariableDropActions', () => {
  test('Get / Set / Declare', () => {
    const actions = buildVariableDropActions({
      name: 'Power',
      onActiveClassGraph: true,
      declareExists: false,
      onGet: () => {},
      onSet: () => {},
      onDeclare: () => {},
    });
    expect(actions.map((a) => a.role)).toEqual(['get', 'set', 'declare']);
  });
});
