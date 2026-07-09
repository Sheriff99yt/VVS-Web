import { describe, expect, test } from 'bun:test';
import { listGeneratedExports } from './projectTree';
import { generatedFileName } from './graphTabs';
import type { GraphTab } from '@/contexts/ProjectContext';
import type { GraphDocument } from '@/lib/graphDefaults';

describe('per-graph codegen files', () => {
  test('listGeneratedExports uses per-graph language and extension overrides', () => {
    const openTabs: GraphTab[] = [
      { id: 'class-widget', type: 'class', name: 'Widget' },
      { id: 'fn-helper', type: 'function', name: 'Helper' },
    ];
    const documents: Record<string, GraphDocument> = {
      'class-widget': {
        nodes: [],
        edges: [],
        metadata: {
          moduleName: 'Widget',
          extendsType: '',
          description: '',
          targetLanguage: 'cpp',
          targetFileExtension: 'h',
        },
      },
      'fn-helper': {
        nodes: [],
        edges: [],
        metadata: {
          moduleName: 'Helper',
          extendsType: '',
          description: '',
          targetLanguage: 'python',
          targetFileExtension: 'pyi',
        },
      },
    };

    const exports = listGeneratedExports(
      openTabs,
      [{ id: 'fn-helper', name: 'Helper' }],
      documents,
      'MyModule',
      { targetLanguage: 'javascript', targetFileExtensions: { javascript: 'mjs' } }
    );

    expect(exports.find((entry) => entry.graphId === 'class-widget')?.fileName).toBe('widget.h');
    expect(exports.find((entry) => entry.graphId === 'fn-helper')?.fileName).toBe('helper.pyi');
  });

  test('generatedFileName falls back to project defaults when graph has no override', () => {
    const tab: GraphTab = { id: 'main', type: 'main', name: 'Main graph' };
    expect(
      generatedFileName(tab, 'Ship', 'python', { python: 'pyw', javascript: 'mjs' })
    ).toBe('ship.pyw');
  });

  test('generatedFileName respects explicit per-language extension map from graph settings', () => {
    const tab: GraphTab = { id: 'class-ship', type: 'class', name: 'Ship' };
    expect(
      generatedFileName(tab, 'Hull', 'cpp', { cpp: 'hpp' })
    ).toBe('ship.hpp');
  });
});
