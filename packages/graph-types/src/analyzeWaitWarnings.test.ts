import { describe, expect, it } from 'bun:test';
import { analyzeProject } from './analyze';

function waitNode(id: string, kindId: 'action_wait' | 'action_await_wait') {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y: 0 },
    data: {
      label: kindId === 'action_wait' ? 'Wait' : 'Await Wait',
      category: 'Flow',
      kindId,
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: {},
    },
  };
}

const emptyDoc: GraphDocument = { nodes: [], edges: [] };

describe('validateWaitAndAsyncNodes', () => {
  it('does not warn BLOCKING_WAIT on python (real sleep emit)', () => {
    const result = analyzeProject({
      documents: {
        main: {
          nodes: [waitNode('w1', 'action_wait')],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    expect(result.diagnostics.some((d) => d.code === 'BLOCKING_WAIT_ON_TARGET')).toBe(false);
  });

  it('warns BLOCKING_WAIT on javascript (stub comment emit)', () => {
    const result = analyzeProject({
      documents: {
        main: {
          nodes: [waitNode('w1', 'action_wait')],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [],
      projectDetails: { extendsType: '' },
      targetLanguage: 'javascript',
    });
    expect(result.diagnostics.some((d) => d.code === 'BLOCKING_WAIT_ON_TARGET')).toBe(true);
  });

  it('errors WAIT_IN_ASYNC_FUNCTION when blocking wait is inside async function', () => {
    const result = analyzeProject({
      documents: {
        'fn-async': {
          nodes: [waitNode('w1', 'action_wait')],
          edges: [],
        },
      },
      functions: [
        {
          kind: 'function',
          id: 'fn-async',
          name: 'Go',
          binding: 'instance',
          visibility: 'public',
          flags: { async: true },
          overloads: [{ id: 'o1', parameters: [], returnType: 'void', graphTabId: 'fn-async' }],
        },
      ],
      events: [],
      variables: [],
      classes: [],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    const err = result.diagnostics.find((d) => d.code === 'WAIT_IN_ASYNC_FUNCTION');
    expect(err?.level).toBe('error');
    expect(err?.message).toContain('async function');
  });

  it('does not warn Main graph missing On Start (obsolete)', () => {
    const result = analyzeProject({
      documents: {
        main: {
          nodes: [
            {
              id: 'print-1',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Print',
                category: 'Debug',
                kindId: 'debug_print',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: {},
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    expect(
      result.diagnostics.some((d) => d.message.includes('Main graph has no event entry'))
    ).toBe(false);
  });
});
