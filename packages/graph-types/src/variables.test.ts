import { describe, expect, test } from 'bun:test';
import {
  createVariableSymbol,
  migrateLegacyVariable,
  normalizeVariableSymbols,
  portabilityFeaturesForVariable,
  collectPortabilityFeatures,
} from './symbols';
import { analyzeProject, variablePortabilityFeatureSets } from './analyze';
import { normalizeProjectSnapshot } from './snapshot';

describe('VariableSymbol', () => {
  test('migrates legacy string type to data_string', () => {
    const variable = migrateLegacyVariable({
      id: 'v1',
      name: 'Score',
      type: 'string',
      readonly: true,
    });
    expect(variable.kind).toBe('variable');
    expect(variable.type).toBe('data_string');
    expect(variable.flags?.readonly).toBe(true);
    expect(variable.binding).toBe('instance');
  });

  test('migrates enumType overlay into typeRef', () => {
    const variable = migrateLegacyVariable({
      id: 'v2',
      name: 'Status',
      type: 'data_any',
      enumType: 'SensorStatus',
      defaultValue: 'OK',
    });
    expect(variable.typeRef).toEqual({ kind: 'enum', name: 'SensorStatus' });
    expect(variable.enumType).toBe('SensorStatus');
    expect(variable.type).toBe('data_any');
  });

  test('collects datatype and binding portability features', () => {
    const variable = createVariableSymbol('Items', {
      type: 'data_array',
      binding: 'static',
    });
    variable.flags = { readonly: true };
    const features = portabilityFeaturesForVariable(variable);
    expect(features).toContain('type.data_array');
    expect(features).toContain('variable.static');
    expect(features).toContain('variable.readonly');
  });

  test('flags duplicate variable names as errors', () => {
    const variables = normalizeVariableSymbols([
      createVariableSymbol('Health', { id: 'v1' }),
      createVariableSymbol('Health', { id: 'v2' }),
    ]);
    const result = analyzeProject({
      documents: { main: { nodes: [], edges: [] } },
      functions: [],
      events: [],
      variables,
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'DUPLICATE_VARIABLE_NAME')).toBe(true);
  });

  test('readonly Set node is an error', () => {
    const variable = createVariableSymbol('Lives');
    variable.flags = { readonly: true };
    const result = analyzeProject({
      documents: {
        main: {
          nodes: [
            {
              id: 'set-1',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Set Lives',
                category: 'Variables',
                kindId: 'variable_set',
                graphBinding: { kind: 'variable_ref', symbolId: variable.id },
                inputs: [],
                outputs: [],
                inlineValues: {},
              },
            },
          ],
          edges: [],
        },
      },
      functions: [],
      events: [],
      variables: [variable],
      projectDetails: { extendsType: '' },
      targetLanguage: 'python',
    });
    expect(result.diagnostics.some((d) => d.code === 'READONLY_VARIABLE_WRITE')).toBe(true);
  });
});

describe('normalizeProjectSnapshot variables', () => {
  test('normalizes legacy variables on load', () => {
    const snap = normalizeProjectSnapshot({
      version: 2,
      savedAt: new Date().toISOString(),
      projectDetails: { moduleName: 'Test', extendsType: '', description: '' },
      variables: [{ id: 'v1', name: 'X', type: 'number' }],
      events: [],
      functions: [],
      openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
      activeGraphTab: 'main',
      targetLanguage: 'python',
      autoCompile: true,
      autoSave: false,
      documents: { main: { nodes: [], edges: [] } },
      installedLibrary: [],
    });
    expect(snap?.variables[0]?.type).toBe('data_number');
    expect(snap?.variables[0]?.kind).toBe('variable');
  });
});

describe('variablePortabilityFeatureSets', () => {
  test('returns per-symbol feature bundles', () => {
    const variable = createVariableSymbol('Config', { type: 'data_object' });
    const sets = variablePortabilityFeatureSets([variable]);
    expect(sets[0]?.features).toContain('type.data_object');
  });
});

describe('collectPortabilityFeatures', () => {
  test('includes variable features in project scan', () => {
    const features = collectPortabilityFeatures({
      projectDetails: { extendsType: '' },
      functions: [],
      variables: [createVariableSymbol('AnyVal', { type: 'data_any', binding: 'module' })],
    });
    expect(features).toContain('type.data_any');
    expect(features).toContain('variable.module');
  });
});
