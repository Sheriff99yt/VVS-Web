import { describe, expect, test } from 'bun:test';
import { createClassSymbol, createVariableSymbol, MAIN_CLASS_ID } from './symbols';
import {
  classExtendsTargetMissing,
  classVisibleSymbols,
  inheritedVariables,
  listClassAncestors,
  resolveExtendsClass,
  wouldCreateExtendsCycle,
} from './inheritance';

const machine = createClassSymbol('Machine', { id: MAIN_CLASS_ID });
const sensor = createClassSymbol('Sensor', {
  id: 'class-sensor',
  extendsType: 'Machine',
});
const probe = createClassSymbol('Probe', {
  id: 'class-probe',
  extendsType: 'Sensor',
});

const power = createVariableSymbol('Power', { id: 'var-power', classId: MAIN_CLASS_ID });
const readings = createVariableSymbol('Readings', { id: 'var-readings', classId: 'class-sensor' });

describe('inheritance helpers', () => {
  test('resolves Extends by class name or id', () => {
    const classes = [machine, sensor];
    expect(resolveExtendsClass(classes, 'Machine')?.id).toBe(MAIN_CLASS_ID);
    expect(resolveExtendsClass(classes, MAIN_CLASS_ID)?.name).toBe('Machine');
    expect(resolveExtendsClass(classes, 'missing')).toBeUndefined();
    expect(resolveExtendsClass(classes, '  ')).toBeUndefined();
  });

  test('walks ancestors with inheritedDepth (nearest first)', () => {
    const chain = listClassAncestors([machine, sensor, probe], 'class-probe');
    expect(chain.map((entry) => [entry.symbol.name, entry.inheritedDepth])).toEqual([
      ['Sensor', 1],
      ['Machine', 2],
    ]);
  });

  test('stops on cycle without looping', () => {
    const a = createClassSymbol('A', { id: 'a', extendsType: 'B' });
    const b = createClassSymbol('B', { id: 'b', extendsType: 'A' });
    expect(listClassAncestors([a, b], 'a').map((e) => e.symbol.id)).toEqual(['b']);
    expect(wouldCreateExtendsCycle([a, b], 'a', 'B')).toBe(true);
    expect(wouldCreateExtendsCycle([machine, sensor], sensor.id, 'Machine')).toBe(false);
    expect(wouldCreateExtendsCycle([machine, sensor], sensor.id, sensor.id)).toBe(true);
  });

  test('lists inherited fields with inheritedDepth for child', () => {
    const inherited = inheritedVariables([machine, sensor], sensor.id, [power, readings]);
    expect(inherited).toHaveLength(1);
    expect(inherited[0]?.symbol.name).toBe('Power');
    expect(inherited[0]?.inheritedDepth).toBe(1);
    expect(inherited[0]?.inheritedFromClassName).toBe('Machine');
  });

  test('classVisibleSymbols shows own then inherited', () => {
    const visible = classVisibleSymbols(sensor.id, [machine, sensor], {
      variables: [power, readings],
      functions: [],
      events: [],
    });
    expect(visible.variables.map((v) => v.name)).toEqual(['Readings', 'Power']);
    expect(visible.inherited.get(power.id)?.inheritedFromClassName).toBe('Machine');
    expect(visible.inherited.has(readings.id)).toBe(false);
  });

  test('classExtendsTargetMissing is true only for unknown parent', () => {
    expect(classExtendsTargetMissing([machine, sensor], sensor)).toBe(false);
    const broken = createClassSymbol('Ghost', { id: 'g', extendsType: 'NoSuchClass' });
    expect(classExtendsTargetMissing([machine, broken], broken)).toBe(true);
  });
});
