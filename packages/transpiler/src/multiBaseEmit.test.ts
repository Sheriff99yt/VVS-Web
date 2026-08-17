import { describe, expect, test } from 'bun:test';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID, type TargetLanguage } from '@vvs/graph-types';
import { transpileGraphCode } from './generate';

const EXEC_IN = { id: 'exec_in', label: '', type: 'execution' as const };
const EXEC_OUT = { id: 'exec_out', label: '', type: 'execution' as const };

function twoBaseGraph(lang: TargetLanguage) {
  return {
    moduleName: 'Child',
    extendsType: 'Parent',
    targetLanguage: lang,
    variables: [],
    functions: [],
    projectEvents: [],
    classes: [
      {
        kind: 'class' as const,
        id: MAIN_CLASS_ID,
        name: 'Child',
        extendsType: 'Parent',
        extendsTypes: ['Parent', 'Mixin'],
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
            extendsType: 'Parent',
            extendsTypes: ['Parent', 'Mixin'],
          },
        },
      },
    ],
    edges: [],
  };
}

describe('multi-base Extends emit', () => {
  test('python prints every Extends row', () => {
    const code = transpileGraphCode(twoBaseGraph('python'));
    expect(code).toContain('class Child(Parent, Mixin):');
  });

  test('cpp prints every Extends row as public bases', () => {
    const code = transpileGraphCode(twoBaseGraph('cpp'));
    expect(code).toContain('class Child : public Parent, public Mixin');
  });

  test('csharp / javascript / gdscript still print the first parent only', () => {
    expect(transpileGraphCode(twoBaseGraph('csharp'))).toContain('class Child : Parent');
    expect(transpileGraphCode(twoBaseGraph('csharp'))).not.toContain('Mixin');
    expect(transpileGraphCode(twoBaseGraph('javascript'))).toContain('class Child extends Parent');
    expect(transpileGraphCode(twoBaseGraph('javascript'))).not.toContain('Mixin');
    expect(transpileGraphCode(twoBaseGraph('gdscript'))).toContain('extends Parent');
    expect(transpileGraphCode(twoBaseGraph('gdscript'))).not.toContain('Mixin');
  });
});
