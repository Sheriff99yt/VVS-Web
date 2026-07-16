import { describe, expect, it } from 'bun:test';
import { analyzeProject } from './analyze';
import { validateCanvasOrderYHints } from './canvasOrderY';
import type { GraphDocument } from './nodes';

function execEdge(id: string, source: string, target: string) {
  return {
    id,
    source,
    target,
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    data: { pinType: 'execution' as const },
  };
}

function memberNode(
  id: string,
  kindId: string,
  y: number,
  label: string,
  symbolId?: string
) {
  return {
    id,
    type: 'vvs_standard_node' as const,
    position: { x: 0, y },
    data: {
      label,
      category: 'Project',
      kindId,
      inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
      inlineValues: {},
      properties: symbolId ? { symbolId } : {},
    },
  };
}

describe('validateCanvasOrderYHints (U79)', () => {
  it('warns CHAIN_ORDER_Y_MISMATCH when wired successor sits higher', () => {
    const doc: GraphDocument = {
      nodes: [
        memberNode('a', 'var_define', 100, 'Declare a', 'var-a'),
        memberNode('b', 'var_define', 0, 'Declare b', 'var-b'),
      ],
      edges: [execEdge('e1', 'a', 'b')],
    };
    const hints = validateCanvasOrderYHints({ main: doc });
    expect(hints.some((d) => d.code === 'CHAIN_ORDER_Y_MISMATCH')).toBe(true);
    expect(hints[0]?.level).toBe('warning');
    expect(hints[0]?.nodeId).toBe('b');
  });

  it('does not warn when chain and vertical height agree', () => {
    const doc: GraphDocument = {
      nodes: [
        memberNode('a', 'var_define', 0, 'Declare a', 'var-a'),
        memberNode('b', 'var_define', 100, 'Declare b', 'var-b'),
      ],
      edges: [execEdge('e1', 'a', 'b')],
    };
    expect(validateCanvasOrderYHints({ main: doc })).toEqual([]);
  });

  it('warns EVENT_PEER_Y_ORDER when event wire disagrees with Y peers', () => {
    const doc: GraphDocument = {
      nodes: [
        memberNode('start', 'event_member_define', 100, 'Declare start', 'evt-start'),
        memberNode('pulse', 'event_member_define', 0, 'Declare pulse', 'evt-pulse'),
      ],
      edges: [execEdge('e1', 'start', 'pulse')],
    };
    const hints = validateCanvasOrderYHints({ main: doc });
    expect(hints.some((d) => d.code === 'EVENT_PEER_Y_ORDER')).toBe(true);
    expect(hints.every((d) => d.code !== 'CHAIN_ORDER_Y_MISMATCH')).toBe(true);
  });

  it('does not warn for unconnected heads (Y is the supported secondary key)', () => {
    const doc: GraphDocument = {
      nodes: [
        memberNode('a', 'var_define', 100, 'Declare a', 'var-a'),
        memberNode('b', 'var_define', 0, 'Declare b', 'var-b'),
      ],
      edges: [],
    };
    expect(validateCanvasOrderYHints({ main: doc })).toEqual([]);
  });

  it('analyzeProject surfaces Y hints as warnings (does not fail ok for the hint alone)', () => {
    const result = analyzeProject({
      documents: {
        main: {
          nodes: [
            memberNode('a', 'function_define', 80, 'Declare Boot', 'fn-boot'),
            memberNode('b', 'function_define', 10, 'Declare Tick', 'fn-tick'),
          ],
          edges: [execEdge('e1', 'a', 'b')],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    const yHints = result.diagnostics.filter((d) => d.code === 'CHAIN_ORDER_Y_MISMATCH');
    expect(yHints).toHaveLength(1);
    expect(yHints[0]?.level).toBe('warning');
    expect(result.diagnostics.some((d) => d.code === 'CHAIN_ORDER_Y_MISMATCH' && d.level === 'error')).toBe(
      false
    );
  });
});
