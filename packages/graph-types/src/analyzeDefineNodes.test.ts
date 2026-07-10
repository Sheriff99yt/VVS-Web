import { describe, expect, it } from 'vitest';
import {
  analyzeProject,
  createClassSymbol,
  createVariableSymbol,
  MAIN_GRAPH_CONTAINER_ID,
} from './index';

const HOME_GRAPH = MAIN_GRAPH_CONTAINER_ID;

describe('analyzeProject define node sync', () => {
  it('emits DEFINE_NODE_MISSING as error for symbols without canvas define nodes', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
    const variable = createVariableSymbol('Score', { id: 'var-score', classId: cls.id });

    const result = analyzeProject({
      documents: { [HOME_GRAPH]: { nodes: [], edges: [] } },
      functions: [],
      events: [],
      variables: [variable],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    const missing = result.diagnostics.filter((d) => d.code === 'DEFINE_NODE_MISSING');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.symbolId).toBe(variable.id);
    expect(missing.every((d) => d.level === 'error')).toBe(true);
    expect(result.diagnostics.some((d) => d.code === 'DECLARATION_NOT_ON_CANVAS')).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('emits ORPHAN_DEFINE_NODE when canvas has define nodes for unknown symbols', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });

    const result = analyzeProject({
      documents: {
        [HOME_GRAPH]: {
          nodes: [
            {
              id: 'class',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Declare App',
                category: 'Project',
                kindId: 'class_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: { symbolId: cls.id, classId: cls.id },
              },
            },
            {
              id: 'vd',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Define X',
                category: 'Variables',
                kindId: 'var_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: { symbolId: 'var-x' },
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    expect(result.diagnostics.some((d) => d.code === 'DEFINE_NODE_MISSING')).toBe(false);
    const orphan = result.diagnostics.filter((d) => d.code === 'ORPHAN_DEFINE_NODE');
    expect(orphan).toHaveLength(1);
    expect(orphan[0]?.level).toBe('error');
    expect(orphan[0]?.nodeId).toBe('vd');
    expect(result.ok).toBe(false);
  });

  it('emits DECLARATION_NOT_ON_CANVAS when class has symbols but no define nodes', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
    const variable = createVariableSymbol('Score', { id: 'var-score', classId: cls.id });

    const result = analyzeProject({
      documents: { [HOME_GRAPH]: { nodes: [], edges: [] } },
      functions: [],
      events: [],
      variables: [variable],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    const notOnCanvas = result.diagnostics.filter((d) => d.code === 'DECLARATION_NOT_ON_CANVAS');
    expect(notOnCanvas).toHaveLength(1);
    expect(notOnCanvas[0]?.level).toBe('error');
    expect(
      result.diagnostics.some(
        (d) => d.code === 'DEFINE_NODE_MISSING' && d.symbolId === cls.id
      )
    ).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('does not require class_define for blank class with no symbols or member defines', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });

    const result = analyzeProject({
      documents: { [HOME_GRAPH]: { nodes: [], edges: [] } },
      functions: [],
      events: [],
      variables: [],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    expect(result.diagnostics.filter((d) => d.code === 'DEFINE_NODE_MISSING')).toHaveLength(0);
    expect(result.ok).toBe(true);
  });

  it('emits DEFINE_NODE_MISSING when class_define is deleted but member defines remain', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
    const variable = createVariableSymbol('Score', { id: 'var-score', classId: cls.id });

    const result = analyzeProject({
      documents: {
        [HOME_GRAPH]: {
          nodes: [
            {
              id: 'vd',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Declare Score',
                category: 'Variables',
                kindId: 'var_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: { symbolId: variable.id },
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [variable],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    const missing = result.diagnostics.filter((d) => d.code === 'DEFINE_NODE_MISSING');
    expect(missing.some((d) => d.symbolId === cls.id)).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('emits ORPHAN_DEFINE_NODE for class_define referencing unknown class', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });

    const result = analyzeProject({
      documents: {
        [HOME_GRAPH]: {
          nodes: [
            {
              id: 'cd',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Declare Other',
                category: 'Project',
                kindId: 'class_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: { symbolId: 'unknown-class', classId: 'unknown-class' },
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    const orphan = result.diagnostics.filter((d) => d.code === 'ORPHAN_DEFINE_NODE');
    expect(orphan).toHaveLength(1);
    expect(orphan[0]?.nodeId).toBe('cd');
    expect(result.ok).toBe(false);
  });

  it('does not emit DECLARATION_NOT_ON_CANVAS for blank class with no symbols', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });

    const result = analyzeProject({
      documents: { [HOME_GRAPH]: { nodes: [], edges: [] } },
      functions: [],
      events: [],
      variables: [],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    expect(result.diagnostics.some((d) => d.code === 'DECLARATION_NOT_ON_CANVAS')).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'DEFINE_NODE_MISSING')).toBe(false);
    expect(result.ok).toBe(true);
  });

  it('passes analysis when symbols have matching define nodes on the class graph', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });
    const variable = createVariableSymbol('Score', { id: 'var-score', classId: cls.id });
    const entry = { id: 'evt-start', name: 'start', role: 'entry' as const, parameters: [], classId: cls.id };

    const result = analyzeProject({
      documents: {
        [HOME_GRAPH]: {
          nodes: [
            {
              id: 'class',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Class App',
                category: 'Project',
                kindId: 'class_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
              },
            },
            {
              id: 'entry-member',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Declare start',
                category: 'Events',
                kindId: 'event_member_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: { symbolId: entry.id, eventId: entry.id, name: 'start' },
              },
            },
            {
              id: 'vd',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Define Score',
                category: 'Variables',
                kindId: 'var_define',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
                properties: { symbolId: variable.id },
              },
            },
          ],
          edges: [
            {
              id: 'e-class-entry',
              source: 'class',
              target: 'entry-member',
              sourceHandle: 'exec_out',
              targetHandle: 'exec_in',
              type: 'vvs_wire_edge',
              data: { pinType: 'execution' },
            },
            {
              id: 'e-class-vd',
              source: 'entry-member',
              target: 'vd',
              sourceHandle: 'exec_out',
              targetHandle: 'exec_in',
              type: 'vvs_wire_edge',
              data: { pinType: 'execution' },
            },
          ],
        },
      },
      functions: [],
      events: [entry],
      variables: [variable],
      classes: [cls],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });

    expect(result.diagnostics.filter((d) => d.code === 'DEFINE_NODE_MISSING')).toHaveLength(0);
    expect(result.diagnostics.filter((d) => d.code === 'DECLARATION_NOT_ON_CANVAS')).toHaveLength(0);
    expect(result.diagnostics.filter((d) => d.code === 'ORPHAN_DEFINE_NODE')).toHaveLength(0);
    expect(result.ok).toBe(true);
  });
});
