import { describe, expect, test } from 'bun:test';
import {
  isNodeEffectiveForLanguage,
  nodeEffectiveness,
  nodeIneffectiveTooltip,
  parseNodeTargetLanguages,
} from './nodeEffectiveness';

describe('nodeEffectiveness', () => {
  test('empty gate → effective', () => {
    expect(nodeEffectiveness('vvs.project.import_module', {}, 'python')).toBe('effective');
    expect(
      nodeEffectiveness('vvs.project.import_module', { targetLanguages: '' }, 'python')
    ).toBe('effective');
    expect(isNodeEffectiveForLanguage('vvs.project.import_module', {}, 'cpp')).toBe(true);
  });

  test('cpp gate + python → ineffective', () => {
    expect(
      nodeEffectiveness(
        'vvs.project.import_module',
        { targetLanguages: 'cpp' },
        'python'
      )
    ).toBe('ineffective');
    expect(
      isNodeEffectiveForLanguage(
        'vvs.project.import_module',
        { targetLanguages: ['cpp'] },
        'python'
      )
    ).toBe(false);
  });

  test('case-insensitive match', () => {
    expect(
      isNodeEffectiveForLanguage(
        'vvs.project.import_module',
        { targetLanguages: 'CPP, CSharp' },
        'cpp'
      )
    ).toBe(true);
    expect(
      isNodeEffectiveForLanguage(
        'vvs.project.import_module',
        { targetLanguages: ['Python'] },
        'PYTHON'
      )
    ).toBe(true);
  });

  test('non-import kinds stay effective', () => {
    expect(
      nodeEffectiveness('function_define', { targetLanguages: 'cpp' }, 'python')
    ).toBe('effective');
  });

  test('parseNodeTargetLanguages accepts string and array', () => {
    expect(parseNodeTargetLanguages({ targetLanguages: 'cpp, csharp' })).toEqual([
      'cpp',
      'csharp',
    ]);
    expect(parseNodeTargetLanguages({ targetLanguages: ['Python'] })).toEqual(['python']);
    expect(parseNodeTargetLanguages(undefined)).toEqual([]);
  });

  test('tooltip explains gated imports', () => {
    const tip = nodeIneffectiveTooltip(
      'vvs.project.import_module',
      { targetLanguages: 'cpp' },
      'python'
    );
    expect(tip).toContain('python');
    expect(tip).toContain('cpp');
    expect(
      nodeIneffectiveTooltip('vvs.project.import_module', { targetLanguages: 'cpp' }, 'cpp')
    ).toBe('');
  });
});
