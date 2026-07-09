import { describe, expect, test } from 'bun:test';
import type { GraphContainer } from '@vvs/graph-types';
import {
  displayEmitTreeForContainer,
  unwrapEmitContainerRoot,
  vvsDisplayTree,
  vvsRelativePaths,
} from '@/lib/mergedStructureTree';
import { buildGeneratedFileTree } from '@/lib/generatedFileTree';

describe('mergedStructureTree display helpers', () => {
  test('vvsRelativePaths strips the .vvs prefix', () => {
    expect(vvsRelativePaths(['.vvs/project.json', '.vvs/graphs/main.json'])).toEqual([
      'project.json',
      'graphs/main.json',
    ]);
  });

  test('vvsDisplayTree avoids nested .vvs folder under the header', () => {
    const tree = vvsDisplayTree(['.vvs/project.json', '.vvs/graphs/containers/a.json']);
    expect(tree.some((node) => node.name === '.vvs')).toBe(false);
    expect(tree.some((node) => node.name === 'project.json')).toBe(true);
    expect(tree.some((node) => node.name === 'graphs')).toBe(true);
  });

  test('unwrapEmitContainerRoot removes duplicate container slug folder', () => {
    const container: GraphContainer = { id: 'ui-flow', name: 'UI flow' };
    const tree = buildGeneratedFileTree(['UI_flow/src/Calculator.py']);
    const unwrapped = unwrapEmitContainerRoot(tree, container);
    expect(unwrapped.map((node) => node.name)).toEqual(['src']);
  });

  test('displayEmitTreeForContainer returns children directly under container row', () => {
    const container: GraphContainer = { id: 'calc', name: 'Calculator' };
    const tree = displayEmitTreeForContainer(
      container,
      [],
      [],
      { 'Calculator/src/Add.py': 'fn-add' },
      ['Calculator/src/Add.py', 'Calculator/Calculator.py']
    );
    expect(tree.map((node) => node.name)).toContain('src');
    expect(tree.some((node) => node.name === 'Calculator')).toBe(false);
  });
});
