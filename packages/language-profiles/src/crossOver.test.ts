import { describe, expect, test } from 'bun:test';
import { createVariableSymbol } from '@vvs/graph-types';
import {
  analyzeCrossOverDiagnostics,
  analyzeVariablePortabilityDiagnostics,
  featuresSupportedInAllLanguages,
} from './crossOver';

describe('variable portability diagnostics', () => {
  test('warns for static variable on Python', () => {
    const variable = createVariableSymbol('Count', { binding: 'static' });
    const diagnostics = analyzeVariablePortabilityDiagnostics(
      [{ symbolId: variable.id, name: variable.name, features: ['variable.static'] }],
      'python'
    );
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0]?.symbolId).toBe(variable.id);
    expect(diagnostics[0]?.message).toContain('Count');
  });

  test('warns for data_any on Verse', () => {
    const variable = createVariableSymbol('Loose', { type: 'data_any' });
    const diagnostics = analyzeVariablePortabilityDiagnostics(
      [{ symbolId: variable.id, name: variable.name, features: ['type.data_any'] }],
      'verse'
    );
    expect(diagnostics.some((d) => d.message.includes('Loose'))).toBe(true);
  });
});

describe('Cross Over Architecture', () => {
  test('featuresSupportedInAllLanguages excludes unsafe features', () => {
    const safe = featuresSupportedInAllLanguages(['python', 'javascript', 'cpp']);
    expect(safe).not.toContain('function.virtual');
    expect(safe).toContain('type.data_object');
  });

  test('COA mode errors when feature is unsupported in an allowed language', () => {
    const variable = createVariableSymbol('Locked', { type: 'data_string' });
    variable.flags = { readonly: true };
    const diagnostics = analyzeCrossOverDiagnostics(
      { enabled: true, allowedLanguages: ['json', 'cpp'] },
      [],
      [{ symbolId: variable.id, name: variable.name, features: ['variable.readonly'] }]
    );
    expect(diagnostics.some((d) => d.level === 'error')).toBe(true);
    expect(diagnostics[0]?.symbolId).toBe(variable.id);
  });
});
