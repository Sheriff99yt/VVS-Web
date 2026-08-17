import { describe, expect, test } from 'bun:test';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID, type TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';
import { classExtendsSuffix, renderClassModuleOpen } from './emit/shell';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function implementsGraph(
  lang: TargetLanguage,
  options?: { form?: 'class' | 'interface' | 'trait'; implementsTypes?: string[]; extendsType?: string }
) {
  const implementsTypes = options?.implementsTypes ?? ['IFoo', 'IBar'];
  const extendsType = options?.extendsType ?? 'Base';
  const form = options?.form;
  return {
    moduleName: 'Child',
    extendsType,
    targetLanguage: lang,
    variables: [],
    functions: [],
    projectEvents: [],
    classes: [
      {
        kind: 'class' as const,
        id: MAIN_CLASS_ID,
        name: 'Child',
        extendsType,
        implementsTypes,
        ...(form && form !== 'class' ? { form } : {}),
        containerId: MAIN_GRAPH_CONTAINER_ID,
      },
      {
        kind: 'class' as const,
        id: 'cls-ifoo',
        name: 'IFoo',
        form: 'interface' as const,
        containerId: MAIN_GRAPH_CONTAINER_ID,
      },
      {
        kind: 'class' as const,
        id: 'cls-ibar',
        name: 'IBar',
        form: lang === 'rust' ? ('trait' as const) : ('interface' as const),
        containerId: MAIN_GRAPH_CONTAINER_ID,
      },
      {
        kind: 'class' as const,
        id: 'cls-base',
        name: 'Base',
        containerId: MAIN_GRAPH_CONTAINER_ID,
      },
    ],
    activeClassId: MAIN_CLASS_ID,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    nodes: [
      {
        id: 'class-1',
        type: 'vvs_standard_node' as const,
        position: { x: 0, y: 0 },
        data: {
          label: 'Class Child',
          category: 'Project',
          kindId: 'class_define',
          inputs: [EXEC_IN],
          outputs: [EXEC_OUT],
          inlineValues: {},
          properties: {
            symbolId: MAIN_CLASS_ID,
            classId: MAIN_CLASS_ID,
            name: 'Child',
            extendsType,
            implementsTypes,
            ...(form && form !== 'class' ? { form } : {}),
          },
        },
      },
    ],
    edges: [],
  };
}

describe('implements list + class form emit', () => {
  test('csharp class prints Extends parent then Implements names', () => {
    const code = transpileGraphCode(implementsGraph('csharp'));
    expect(code).toContain('class Child : Base, IFoo, IBar');
    expect(code).not.toContain('interface Child');
  });

  test('csharp form=interface emits interface, not class', () => {
    const code = transpileGraphCode(
      implementsGraph('csharp', { form: 'interface', extendsType: '', implementsTypes: ['IFoo'] })
    );
    expect(code).toContain('interface Child : IFoo');
    expect(code).not.toMatch(/class Child/);
  });

  test('rust emits impl Trait for Type only when Implements has names', () => {
    const code = transpileGraphCode(
      implementsGraph('rust', { implementsTypes: ['Drawable'], extendsType: '' })
    );
    expect(code).toContain('impl Drawable for Child');
    expect(code).not.toContain('impl Default');
    const none = transpileGraphCode(implementsGraph('rust', { implementsTypes: [], extendsType: '' }));
    expect(none).not.toContain('impl Drawable for Child');
    expect(none).not.toContain('impl Default');
  });

  test('rust form=trait emits trait, not struct, and does not invent impl Default', () => {
    const code = transpileGraphCode(
      implementsGraph('rust', { form: 'trait', implementsTypes: [], extendsType: '' })
    );
    expect(code).toContain('pub trait Child');
    expect(code).not.toContain('pub struct Child');
    expect(code).not.toContain('impl Default');
    expect(code).not.toMatch(/pub fn new\(\)/);
  });

  test('python stores Implements but does not print them', () => {
    const code = transpileGraphCode(implementsGraph('python'));
    expect(code).toContain('class Child(Base):');
    expect(code).not.toContain('IFoo');
    expect(code).not.toContain('IBar');
    expect(code).not.toContain('implements');
  });

  test('shell suffix: csharp extras on Extends stay first-parent; Implements append', () => {
    expect(classExtendsSuffix('csharp', 'Parent', ['Parent', 'Mixin'])).toBe(' : Parent');
    expect(classExtendsSuffix('csharp', 'Parent', ['Parent', 'Mixin'])).not.toContain('Mixin');
    expect(
      classExtendsSuffix('csharp', 'Base', ['Base'], { implementsTypes: ['IFoo', 'IBar'] })
    ).toBe(' : Base, IFoo, IBar');
    expect(classExtendsSuffix('python', 'Base', ['Base'], { implementsTypes: ['IFoo'] })).toBe('(Base)');
    expect(renderClassModuleOpen('csharp', 'Child', 'Base', { implementsTypes: ['IFoo'] })).toBe(
      'class Child : Base, IFoo {'
    );
    expect(
      renderClassModuleOpen('csharp', 'IFoo', '', { form: 'interface', implementsTypes: ['IBar'] })
    ).toBe('interface IFoo : IBar {');
  });
});
