import { describe, expect, test } from 'bun:test';
import {
  PackRenderError,
  renderLego,
  renderQuasi,
  renderTemplate,
} from './render';
import { LAYOUT_NEWLINE, LAYOUT_SEMICOLON } from './schema';

describe('renderQuasi', () => {
  test('replaces single slot', () => {
    const result = renderQuasi('print({value})', { value: '42' });
    expect(result.text).toBe('print(42)');
    expect(result.expressionSpans).toEqual([]);
  });

  test('accumulates expression spans with offset', () => {
    const result = renderQuasi('print({value})', {
      value: { text: 'x', spans: [{ nodeId: 'n1', start: 0, end: 1 }] },
    });
    expect(result.text).toBe('print(x)');
    expect(result.expressionSpans).toEqual([{ nodeId: 'n1', start: 6, end: 7 }]);
  });

  test('multi-slot quasi offsets spans independently', () => {
    const result = renderQuasi('{a} + {b}', {
      a: { text: '1', spans: [{ nodeId: 'a', start: 0, end: 1 }] },
      b: { text: '2', spans: [{ nodeId: 'b', start: 0, end: 1 }] },
    });
    expect(result.text).toBe('1 + 2');
    expect(result.expressionSpans).toEqual([
      { nodeId: 'a', start: 0, end: 1 },
      { nodeId: 'b', start: 4, end: 5 },
    ]);
  });

  test('throws on missing slot when strict', () => {
    expect(() => renderQuasi('print({value})', {})).toThrow(PackRenderError);
  });
});

describe('renderLego', () => {
  test('joins static and slot rows', () => {
    const result = renderLego(
      [
        { kind: 'static', name: 'if ' },
        { kind: 'slot', name: 'cond' },
        { kind: 'static', name: ':' },
      ],
      { cond: 'True' }
    );
    expect(result.text).toBe('if True:');
  });

  test('handles newline and semicolon layout tokens', () => {
    const result = renderLego(
      [
        { kind: 'slot', name: 'callee' },
        { kind: 'static', name: '()' },
        { kind: 'static', name: LAYOUT_SEMICOLON },
        { kind: 'static', name: LAYOUT_NEWLINE },
      ],
      { callee: 'Greet' },
      { indentUnit: '    ', statementSuffix: ';' }
    );
    expect(result.text).toBe('Greet();');
  });
});

describe('renderTemplate', () => {
  test('dispatches quasi rows', () => {
    const result = renderTemplate({ quasi: 'self.{name} = {default}' }, {
      name: 'Count',
      default: '0',
    });
    expect(result.text).toBe('self.Count = 0');
  });
});
