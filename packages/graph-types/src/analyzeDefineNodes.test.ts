import { describe, expect, it } from 'vitest';
import {
  analyzeProject,
  createClassSymbol,
  createVariableSymbol,
  MAIN_GRAPH_CONTAINER_ID,
} from './index';

const HOME_GRAPH = MAIN_GRAPH_CONTAINER_ID;

describe('analyzeProject define node sync', () => {
  it('emits DEFINE_NODE_MISSING for symbols without canvas define nodes', () => {
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
  });

  it('does not emit DEFINE_NODE_MISSING when canvas has only orphan define nodes', () => {
    const cls = createClassSymbol('App', { id: 'main-class', containerId: HOME_GRAPH });

    const result = analyzeProject({
      documents: {
        [HOME_GRAPH]: {
          nodes: [
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
  });
});
