import { describe, expect, test } from 'bun:test';
import { analyzePortability } from './profiles';
import { collectPortabilityFeatures } from '@vvs/graph-types';
import type { FunctionSymbol } from '@vvs/graph-types';

describe('analyzePortability', () => {
  test('warns on static function for Python', () => {
    const features = collectPortabilityFeatures({
      projectDetails: { extendsType: '' },
      functions: [
        {
          kind: 'function',
          id: 'f1',
          name: 'Util',
          binding: 'static',
          visibility: 'public',
          overloads: [{ id: 'o1', parameters: [], returnType: 'void' }],
        } satisfies FunctionSymbol,
      ],
    });
    const diags = analyzePortability(features, 'python');
    expect(diags.some((d) => d.code?.includes('STATIC'))).toBe(true);
  });

  test('C++ supports overload natively', () => {
    const features: import('@vvs/graph-types').PortabilityFeature[] = ['function.overload'];
    const diags = analyzePortability(features, 'cpp');
    expect(diags.filter((d) => d.level === 'warning')).toHaveLength(0);
  });

  test('GDScript supports static functions natively', () => {
    const diags = analyzePortability(['function.static'], 'gdscript');
    expect(diags.filter((d) => d.level === 'warning')).toHaveLength(0);
  });

  test('GDScript warns on unsupported overload', () => {
    const diags = analyzePortability(['function.overload'], 'gdscript');
    expect(diags.some((d) => d.code?.includes('OVERLOAD'))).toBe(true);
  });

  test('Python static is emulated emit honesty warning', () => {
    const diags = analyzePortability(['function.static'], 'python');
    const staticWarn = diags.find((d) => d.code?.includes('STATIC'));
    expect(staticWarn?.message.startsWith('Emulated emit (Python):')).toBe(true);
  });

  test('includeEmulated false keeps unsupported only', () => {
    const diags = analyzePortability(['function.static', 'function.overload'], 'python', {
      includeEmulated: false,
    });
    expect(diags.some((d) => d.code?.includes('STATIC'))).toBe(false);
    expect(diags.some((d) => d.code?.includes('OVERLOAD'))).toBe(true);
  });
});
