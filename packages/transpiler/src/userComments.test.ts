import { describe, expect, test } from 'bun:test';
import { transpileGraph, transpileProject } from './generate';
import type { GraphEdge, GraphNode } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { createCoverageLabUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';

function baseNodes(): GraphNode[] {
  const classNode: GraphNode = {
    id: 'cls',
    type: 'vvs_standard_node',
    position: { x: 0, y: 0 },
    data: {
      label: 'Declare Main',
      category: 'Project',
      kindId: 'class_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      properties: { name: 'Main', symbolId: 'main' },
    },
  };
  const varNode: GraphNode = {
    id: 'var-score',
    type: 'vvs_standard_node',
    position: { x: 40, y: 40 },
    data: {
      label: 'Declare Score',
      category: 'Variables',
      kindId: 'var_define',
      inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
      outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
      inlineValues: {},
      properties: { name: 'Score', symbolId: 'var-score' },
    },
  };
  const comment: GraphNode = {
    id: 'comment-1',
    type: 'vvs_comment_node',
    position: { x: 0, y: -20 },
    data: {
      label: 'score field',
      category: 'Comment',
      inputs: [],
      outputs: [],
      inlineValues: {},
      commentColor: '#6366f1',
      properties: {
        commentText: 'score field',
        commentLocked: false,
        commentMemberIds: ['var-score'],
      },
    },
  };
  return [comment, classNode, varNode];
}

const edges: GraphEdge[] = [
  {
    id: 'e1',
    source: 'cls',
    target: 'var-score',
    sourceHandle: 'exec_out',
    targetHandle: 'exec_in',
    data: { pinType: 'execution' },
  },
];

describe('user comments (U68/U69)', () => {
  test('emits pack comment before wrapped member; no (x) marker', () => {
    const code =
      transpileGraph({
        moduleName: 'Main',
        extendsType: '',
        targetLanguage: 'python',
        variables: [
          {
            id: 'var-score',
            name: 'Score',
            type: 'data_number',
            defaultValue: 0,
            classId: 'main',
          },
        ],
        projectEvents: [],
        functions: [],
        nodes: baseNodes(),
        edges,
        tabId: 'main',
        classes: [{ id: 'main', name: 'Main', containerId: 'main' }],
        activeClassId: 'main',
        emitUserComments: true,
        emitUnsupportedComments: true,
      }).files[0]?.content ?? '';

    expect(code).toContain('# score field');
    expect(code).not.toContain('(x) score field');
    expect(code.indexOf('# score field')).toBeLessThan(code.indexOf('Score'));
    // Same indent as the member line it annotates.
    expect(code).toMatch(/^[ \t]+# score field$/m);
    const commentLine = code.split('\n').find((l) => l.includes('# score field')) ?? '';
    const scoreLine = code.split('\n').find((l) => /^\s*Score\s*=/.test(l)) ?? '';
    expect(commentLine.match(/^\s*/)?.[0]).toBe(scoreLine.match(/^\s*/)?.[0]);
  });

  test('emitUserComments false omits author lines; (x) still works independently', () => {
    const withUserOff =
      transpileGraph({
        moduleName: 'Main',
        extendsType: '',
        targetLanguage: 'python',
        variables: [
          {
            id: 'var-score',
            name: 'Score',
            type: 'data_number',
            defaultValue: 0,
            classId: 'main',
          },
        ],
        projectEvents: [],
        functions: [],
        nodes: baseNodes(),
        edges,
        tabId: 'main',
        classes: [{ id: 'main', name: 'Main', containerId: 'main' }],
        activeClassId: 'main',
        emitUserComments: false,
        emitUnsupportedComments: true,
      }).files[0]?.content ?? '';

    expect(withUserOff).not.toContain('# score field');
    expect(withUserOff).toContain('Score');
  });

  test('orphan comment emits as file-scope line', () => {
    const nodes: GraphNode[] = [
      {
        id: 'cls',
        type: 'vvs_standard_node',
        position: { x: 0, y: 0 },
        data: {
          label: 'Declare Main',
          category: 'Project',
          kindId: 'class_define',
          inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues: {},
          properties: { name: 'Main', symbolId: 'main' },
        },
      },
      {
        id: 'comment-orphan',
        type: 'vvs_comment_node',
        position: { x: 0, y: -80 },
        data: {
          label: 'file note',
          category: 'Comment',
          inputs: [],
          outputs: [],
          inlineValues: {},
          properties: { commentText: 'file note' },
        },
      },
    ];
    const code =
      transpileGraph({
        moduleName: 'Main',
        extendsType: '',
        targetLanguage: 'python',
        variables: [],
        projectEvents: [],
        functions: [],
        nodes,
        edges: [],
        tabId: 'main',
        classes: [{ id: 'main', name: 'Main', containerId: 'main' }],
        activeClassId: 'main',
        emitUserComments: true,
      }).files[0]?.content ?? '';

    expect(code).toContain('# file note');
    expect(code.indexOf('# file note')).toBeLessThan(code.indexOf('class Main'));
  });

  test('U79: soft-member comment attaches before topmost member by absolute Y', () => {
    const nodes: GraphNode[] = [
      {
        id: 'cls',
        type: 'vvs_standard_node',
        position: { x: 0, y: 0 },
        data: {
          label: 'Declare Main',
          category: 'Project',
          kindId: 'class_define',
          inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues: {},
          properties: { name: 'Main', symbolId: 'main' },
        },
      },
      {
        id: 'var-high',
        type: 'vvs_standard_node',
        position: { x: 40, y: 200 },
        data: {
          label: 'Declare High',
          category: 'Variables',
          kindId: 'var_define',
          inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues: {},
          properties: { name: 'High', symbolId: 'var-high' },
        },
      },
      {
        id: 'var-low',
        type: 'vvs_standard_node',
        position: { x: 40, y: 80 },
        data: {
          label: 'Declare Low',
          category: 'Variables',
          kindId: 'var_define',
          inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues: {},
          properties: { name: 'Low', symbolId: 'var-low' },
        },
      },
      {
        id: 'comment-1',
        type: 'vvs_comment_node',
        position: { x: 0, y: 900 },
        data: {
          label: 'about low',
          category: 'Comment',
          inputs: [],
          outputs: [],
          inlineValues: {},
          properties: {
            commentText: 'about low',
            commentMemberIds: ['var-high', 'var-low'],
          },
        },
      },
    ];
    const wire = (
      source: string,
      target: string,
      i: number
    ): GraphEdge => ({
      id: `e${i}`,
      source,
      target,
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      data: { pinType: 'execution' },
    });
    const code =
      transpileGraph({
        moduleName: 'Main',
        extendsType: '',
        targetLanguage: 'python',
        variables: [
          { id: 'var-high', name: 'High', type: 'data_number', defaultValue: 0, classId: 'main' },
          { id: 'var-low', name: 'Low', type: 'data_number', defaultValue: 0, classId: 'main' },
        ],
        projectEvents: [],
        functions: [],
        nodes,
        edges: [wire('cls', 'var-low', 1), wire('var-low', 'var-high', 2)],
        tabId: 'main',
        classes: [{ id: 'main', name: 'Main', containerId: 'main' }],
        activeClassId: 'main',
        emitUserComments: true,
      }).files[0]?.content ?? '';

    expect(code).toContain('# about low');
    // Topmost member is Low (y=80); comment must appear before Low, not only before High.
    expect(code.indexOf('# about low')).toBeLessThan(code.indexOf('Low'));
    expect(code.indexOf('Low')).toBeLessThan(code.indexOf('High'));
  });

  test('comment on unwired flow peers still emits via remaining flush', () => {
    const nodes: GraphNode[] = [
      {
        id: 'print',
        type: 'vvs_standard_node',
        position: { x: 40, y: 40 },
        data: {
          label: 'Print',
          category: 'Flow',
          kindId: 'action_print',
          inputs: [
            { id: 'exec_in', label: '', type: 'execution' },
            { id: 'value', label: '', type: 'string' },
          ],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
          inlineValues: { value: 'hi' },
          properties: {},
        },
      },
      {
        id: 'comment-flow',
        type: 'vvs_comment_node',
        position: { x: 0, y: 0 },
        data: {
          label: 'says hi',
          category: 'Comment',
          inputs: [],
          outputs: [],
          inlineValues: {},
          properties: {
            commentText: 'says hi',
            commentMemberIds: ['print'],
          },
        },
      },
    ];
    const code =
      transpileGraph({
        moduleName: 'Main',
        extendsType: '',
        targetLanguage: 'python',
        variables: [],
        projectEvents: [],
        functions: [],
        nodes,
        edges: [],
        tabId: 'main',
        classes: [{ id: 'main', name: 'Main', containerId: 'main' }],
        activeClassId: 'main',
        emitUserComments: true,
      }).files[0]?.content ?? '';

    expect(code).toContain('# says hi');
  });

  test('nested if-body Print: one comment, same indent as print (Coverage Lab)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = structuredClone(snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!);
    home.nodes.push({
      id: 'comment-testing',
      type: 'vvs_comment_node',
      position: { x: 1400, y: 80 },
      data: {
        label: 'Testing',
        category: 'Comment',
        inputs: [],
        outputs: [],
        inlineValues: {},
        properties: {
          commentText: 'Testing',
          commentLocked: true,
          commentMemberIds: ['lab-print-not-ready'],
        },
      },
    });

    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: { ...snapshot.documents!, [MAIN_GRAPH_CONTAINER_ID]: home },
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
      emitUserComments: true,
    });
    const code = result.files.find((f) => f.path.endsWith('.py'))?.content ?? '';
    const occurrences = code.match(/# Testing/g) ?? [];
    expect(occurrences).toHaveLength(1);

    const lines = code.split('\n');
    const commentIdx = lines.findIndex((l) => l.includes('# Testing'));
    const printIdx = lines.findIndex((l) => /print\(.*Not ready/.test(l));
    expect(commentIdx).toBeGreaterThan(0);
    expect(printIdx).toBe(commentIdx + 1);
    expect(lines[commentIdx]!.match(/^\s*/)?.[0]).toBe(lines[printIdx]!.match(/^\s*/)?.[0]);
    expect((lines[commentIdx]!.match(/^\s*/)?.[0] ?? '').length).toBeGreaterThan(0);
  });
});
