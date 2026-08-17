import { describe, expect, test } from 'bun:test';
import {
  analyzeProject,
  createClassSymbol,
  createVariableSymbol,
  MAIN_CLASS_ID,
  MAIN_GRAPH_CONTAINER_ID,
} from './index';

const HOME = MAIN_GRAPH_CONTAINER_ID;

function classDefineNode(id: string, cls: { id: string; name: string; extendsType?: string }) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: 'Declare',
      category: 'Project',
      kindId: 'class_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: {
        symbolId: cls.id,
        classId: cls.id,
        name: cls.name,
        extendsType: cls.extendsType ?? '',
      },
    },
  };
}

function varDefineNode(id: string, variable: { id: string; name: string }) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 40 },
    data: {
      label: 'Declare',
      category: 'Variables',
      kindId: 'var_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: { symbolId: variable.id, name: variable.name },
      graphBinding: { kind: 'variable_ref' as const, symbolId: variable.id },
    },
  };
}

describe('analyzeProject inheritance (U106)', () => {
  test('errors when Extends points at a missing class', () => {
    const machine = createClassSymbol('Machine', { id: MAIN_CLASS_ID, containerId: HOME });
    const sensor = createClassSymbol('Sensor', {
      id: 'class-sensor',
      containerId: HOME,
      extendsType: 'NoSuchClass',
    });

    const result = analyzeProject({
      documents: {
        [HOME]: {
          nodes: [classDefineNode('n-machine', machine), classDefineNode('n-sensor', sensor)],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [machine, sensor],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    const missing = result.diagnostics.filter((d) => d.code === 'EXTENDS_CLASS_MISSING');
    expect(missing.length).toBeGreaterThanOrEqual(1);
    expect(missing[0]?.level).toBe('error');
    expect(missing[0]?.message).toContain('Sensor');
    expect(missing[0]?.message).toContain('NoSuchClass');
    expect(result.ok).toBe(false);
  });

  test('Get of an ancestor field is valid (not UNRESOLVED_SYMBOL_REF)', () => {
    const machine = createClassSymbol('Machine', { id: MAIN_CLASS_ID, containerId: HOME });
    const sensor = createClassSymbol('Sensor', {
      id: 'class-sensor',
      containerId: HOME,
      extendsType: 'Machine',
    });
    const power = createVariableSymbol('Power', { id: 'var-power', classId: MAIN_CLASS_ID });

    const result = analyzeProject({
      documents: {
        [HOME]: {
          nodes: [
            classDefineNode('n-machine', machine),
            varDefineNode('n-power', power),
            classDefineNode('n-sensor', sensor),
            {
              id: 'n-get-power',
              type: 'vvs_standard_node',
              position: { x: 200, y: 200 },
              data: {
                label: 'Get Power',
                category: 'Variables',
                kindId: 'variable_get',
                inputs: [],
                outputs: [{ id: 'val', label: 'Power', type: 'data_string' }],
                inlineValues: {},
                properties: { variableName: 'Power' },
                graphBinding: { kind: 'variable_ref', symbolId: power.id },
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [power],
      classes: [machine, sensor],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    expect(result.diagnostics.some((d) => d.code === 'UNRESOLVED_SYMBOL_REF')).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'EXTENDS_CLASS_MISSING')).toBe(false);
  });
});

describe('analyzeProject extends list', () => {
  test('errors when an extra stored base is missing', () => {
    const machine = createClassSymbol('Machine', { id: MAIN_CLASS_ID, containerId: HOME });
    const sensor = createClassSymbol('Sensor', {
      id: 'class-sensor',
      containerId: HOME,
      extendsType: 'Machine',
      extendsTypes: ['Machine', 'NoSuchMixin'],
    });

    const result = analyzeProject({
      documents: {
        [HOME]: {
          nodes: [classDefineNode('n-machine', machine), classDefineNode('n-sensor', sensor)],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [machine, sensor],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    const missing = result.diagnostics.filter((d) => d.code === 'EXTENDS_CLASS_MISSING');
    expect(missing.some((d) => d.message.includes('NoSuchMixin'))).toBe(true);
  });
});

describe('analyzeProject implements list', () => {
  test('errors when Implements points at a missing class', () => {
    const machine = createClassSymbol('Machine', { id: MAIN_CLASS_ID, containerId: HOME });
    const sensor = createClassSymbol('Sensor', {
      id: 'class-sensor',
      containerId: HOME,
      implementsTypes: ['INoSuch'],
    });

    const result = analyzeProject({
      documents: {
        [HOME]: {
          nodes: [classDefineNode('n-machine', machine), classDefineNode('n-sensor', sensor)],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [machine, sensor],
      projectDetails: { extendsType: '' },
      targetLanguage: 'csharp',
    });

    const missing = result.diagnostics.filter((d) => d.code === 'IMPLEMENTS_CLASS_MISSING');
    expect(missing.length).toBeGreaterThanOrEqual(1);
    expect(missing[0]?.message).toContain('Sensor');
    expect(missing[0]?.message).toContain('INoSuch');
    expect(result.ok).toBe(false);
  });

  test('accepts Implements of a form=interface class', () => {
    const ifoo = createClassSymbol('IFoo', { id: 'class-ifoo', containerId: HOME, form: 'interface' });
    const child = createClassSymbol('Child', {
      id: 'class-child',
      containerId: HOME,
      implementsTypes: ['IFoo'],
    });

    const result = analyzeProject({
      documents: {
        [HOME]: {
          nodes: [classDefineNode('n-ifoo', ifoo), classDefineNode('n-child', child)],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [ifoo, child],
      projectDetails: { extendsType: '' },
      targetLanguage: 'csharp',
    });

    expect(result.diagnostics.some((d) => d.code === 'IMPLEMENTS_CLASS_MISSING')).toBe(false);
  });
});
