import { describe, expect, it } from 'vitest';
import type { ClassSymbol, GraphContainer } from '@vvs/graph-types';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import {
  buildExtendsClassPickerOptions,
  classContainerId,
  classGraphTabId,
  classesForContainer,
  containerMatchesFilter,
} from './classScope';
import { classVisibleSymbols, createVariableSymbol } from '@vvs/graph-types';

const mainClass: ClassSymbol = {
  kind: 'class',
  id: MAIN_CLASS_ID,
  name: 'Main',
  graphTabId: 'main',
  containerId: MAIN_GRAPH_CONTAINER_ID,
};

const extraClass: ClassSymbol = {
  kind: 'class',
  id: 'class-extra',
  name: 'Calculator',
  graphTabId: 'class-extra',
  containerId: 'graph-container-extra',
};

describe('classScope container helpers', () => {
  const containers: GraphContainer[] = [
    { id: MAIN_GRAPH_CONTAINER_ID, name: 'Main graph' },
    { id: 'graph-container-extra', name: 'Utilities' },
  ];

  it('resolves class container and home graph id', () => {
    expect(classContainerId(mainClass)).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(classContainerId(extraClass)).toBe('graph-container-extra');
    expect(classGraphTabId(mainClass)).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(classGraphTabId(extraClass)).toBe('graph-container-extra');
  });

  it('lists classes per graph container', () => {
    const classes = [mainClass, extraClass];
    expect(classesForContainer(classes, MAIN_GRAPH_CONTAINER_ID).map((c) => c.id)).toEqual([
      MAIN_CLASS_ID,
    ]);
    expect(classesForContainer(classes, 'graph-container-extra').map((c) => c.id)).toEqual([
      'class-extra',
    ]);
  });

  it('matches containers by name or child class', () => {
    const classes = [mainClass, extraClass];
    const matches = (value: string, query: string) =>
      value.toLowerCase().includes(query.toLowerCase());
    expect(
      containerMatchesFilter(containers[0]!, classes, 'main', matches)
    ).toBe(true);
    expect(
      containerMatchesFilter(containers[1]!, classes, 'calc', matches)
    ).toBe(true);
    expect(
      containerMatchesFilter(containers[0]!, classes, 'utilities', matches)
    ).toBe(false);
  });
});

describe('class inheritance listing (U106)', () => {
  it('lists inherited members and builds an Extends class picker', () => {
    const parent: ClassSymbol = {
      kind: 'class',
      id: MAIN_CLASS_ID,
      name: 'Machine',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    };
    const child: ClassSymbol = {
      kind: 'class',
      id: 'class-sensor',
      name: 'Sensor',
      extendsType: 'Machine',
      containerId: MAIN_GRAPH_CONTAINER_ID,
    };
    const power = createVariableSymbol('Power', { id: 'var-power', classId: MAIN_CLASS_ID });
    const visible = classVisibleSymbols(child.id, [parent, child], {
      variables: [power],
      functions: [],
      events: [],
    });
    expect(visible.variables.map((v) => v.name)).toEqual(['Power']);
    expect(visible.inherited.get(power.id)?.inheritedFromClassName).toBe('Machine');

    const options = buildExtendsClassPickerOptions([parent, child], child.id);
    expect(options.some((o) => o.value === 'Machine')).toBe(true);
    expect(options.some((o) => o.value === 'Sensor')).toBe(false);
  });
});
