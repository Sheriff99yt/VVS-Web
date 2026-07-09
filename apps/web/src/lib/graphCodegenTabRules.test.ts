import { describe, expect, test } from 'bun:test';
import { isCodegenMetadataPatch } from './graphDefaults';
import { isOrgOnlyGraphTab } from './graphTabs';
import { MAIN_GRAPH_CONTAINER_ID, MAIN_CLASS_ID } from '@vvs/graph-types';

describe('graph codegen tab rules', () => {
  test('isCodegenMetadataPatch accepts only language and extension keys', () => {
    expect(isCodegenMetadataPatch({ targetLanguage: 'cpp' })).toBe(true);
    expect(isCodegenMetadataPatch({ targetFileExtension: 'h' })).toBe(true);
    expect(isCodegenMetadataPatch({ moduleName: 'Foo' })).toBe(false);
    expect(isCodegenMetadataPatch({ targetLanguage: 'cpp', moduleName: 'Foo' })).toBe(false);
  });

  test('main-graph is codegen-eligible when a class homes there', () => {
    expect(
      isOrgOnlyGraphTab(MAIN_GRAPH_CONTAINER_ID, [
        { kind: 'class', id: MAIN_CLASS_ID, name: 'Untitled', containerId: MAIN_GRAPH_CONTAINER_ID },
      ])
    ).toBe(false);
  });

  test('main-graph is org-only when no class homes there', () => {
    expect(isOrgOnlyGraphTab(MAIN_GRAPH_CONTAINER_ID, [])).toBe(true);
  });
});
