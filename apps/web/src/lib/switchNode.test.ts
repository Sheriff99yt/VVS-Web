import { describe, expect, test } from 'bun:test';
import type { VVSNodeData } from '@vvs/graph-types';
import {
  addSwitchCase,
  removeSwitchCase,
  setSwitchCaseLabel,
  switchCaseIndices,
  switchCaseLabel,
} from './switchNode';

type SwitchData = Pick<VVSNodeData, 'outputs' | 'inputs' | 'properties' | 'inlineValues'>;

function schemaSwitch(): SwitchData {
  return {
    properties: { enumType: '' },
    inlineValues: { case0: '', case1: '' },
    inputs: [
      { id: 'exec_in', label: '', type: 'execution' },
      { id: 'selector', label: 'Selector', type: 'data_any' },
      { id: 'case0', label: 'Case 0 value', type: 'data_any' },
      { id: 'case1', label: 'Case 1 value', type: 'data_any' },
    ],
    outputs: [
      { id: 'case_0', label: 'Case 0', type: 'execution' },
      { id: 'case_1', label: 'Case 1', type: 'execution' },
      { id: 'default_exec', label: 'Default', type: 'execution' },
      { id: 'exec_out', label: '', type: 'execution' },
    ],
  };
}

function merge(base: SwitchData, patch: Partial<VVSNodeData>): SwitchData {
  return {
    properties: patch.properties ?? base.properties,
    inlineValues: patch.inlineValues ?? base.inlineValues,
    inputs: patch.inputs ?? base.inputs,
    outputs: patch.outputs ?? base.outputs,
  };
}

describe('switchNode cases', () => {
  test('lists schema case_* outputs when properties.caseN are missing', () => {
    const data = schemaSwitch();
    expect(switchCaseIndices(data)).toEqual([0, 1]);
    expect(switchCaseLabel(data, 0)).toBe('0');
    expect(switchCaseLabel(data, 1)).toBe('1');
  });

  test('addSwitchCase appends case_2 and does not duplicate case_0', () => {
    const base = schemaSwitch();
    const next = merge(base, addSwitchCase(base, 'OK'));
    expect(switchCaseIndices(next)).toEqual([0, 1, 2]);
    expect((next.outputs ?? []).filter((pin) => pin.id.startsWith('case_')).map((pin) => pin.id)).toEqual([
      'case_0',
      'case_1',
      'case_2',
    ]);
    expect(next.properties?.case2).toBe('OK');
    expect(next.inlineValues?.case2).toBe('OK');
    expect((next.inputs ?? []).some((pin) => pin.id === 'case2')).toBe(true);
    expect((next.outputs ?? []).filter((pin) => pin.id === 'case_0')).toHaveLength(1);
  });

  test('setSwitchCaseLabel writes property, inline, and output label', () => {
    const next = setSwitchCaseLabel(schemaSwitch(), 0, 'Red');
    expect(next.properties?.case0).toBe('Red');
    expect(next.inlineValues?.case0).toBe('Red');
    expect((next.outputs ?? []).find((pin) => pin.id === 'case_0')?.label).toBe('Red');
  });

  test('removeSwitchCase reindexes remaining pins and keeps enumType', () => {
    const base = merge(schemaSwitch(), addSwitchCase(schemaSwitch(), 'Two'));
    const labeled = merge(base, {
      properties: { ...(base.properties ?? {}), enumType: 'Color', case0: 'Zero' },
      inlineValues: { ...(base.inlineValues ?? {}), case0: 'Zero' },
      outputs: (base.outputs ?? []).map((pin) =>
        pin.id === 'case_0' ? { ...pin, label: 'Zero' } : pin
      ),
    });
    const next = removeSwitchCase(labeled, 1);
    expect(switchCaseIndices(next)).toEqual([0, 1]);
    expect(next.properties?.enumType).toBe('Color');
    expect(next.properties?.case0).toBe('Zero');
    expect(next.properties?.case1).toBe('Two');
    expect((next.outputs ?? []).filter((pin) => pin.id.startsWith('case_')).map((pin) => pin.id)).toEqual([
      'case_0',
      'case_1',
    ]);
    expect((next.outputs ?? []).some((pin) => pin.id === 'default_exec')).toBe(true);
  });
});
