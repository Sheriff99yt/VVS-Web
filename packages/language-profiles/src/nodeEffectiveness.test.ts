import { describe, expect, test } from 'bun:test';
import { isModifierEffective } from './modifierEffectiveness';
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

  test('unrelated kinds stay effective even with targetLanguages', () => {
    expect(
      nodeEffectiveness('print', { targetLanguages: 'cpp' }, 'python')
    ).toBe('effective');
  });

  test('Function Declare: non-abstract effective only on C++', () => {
    expect(nodeEffectiveness('function_define', {}, 'cpp')).toBe('effective');
    expect(nodeEffectiveness('function_define', {}, 'python')).toBe('ineffective');
    expect(nodeEffectiveness('function_define', {}, 'javascript')).toBe('ineffective');
    expect(
      nodeEffectiveness('function_define', { targetLanguages: 'cpp' }, 'python')
    ).toBe('ineffective');
    expect(
      nodeEffectiveness('function_define', { targetLanguages: 'python' }, 'python')
    ).toBe('ineffective');
    expect(
      nodeEffectiveness('function_define', { targetLanguages: 'cpp' }, 'cpp')
    ).toBe('effective');
  });

  test('Function Declare: abstract effective only on C++/C#', () => {
    expect(
      nodeEffectiveness('function_define', { isAbstract: true }, 'python')
    ).toBe('ineffective');
    expect(
      nodeEffectiveness('function_define', { isAbstract: true }, 'javascript')
    ).toBe('ineffective');
    expect(
      nodeEffectiveness('function_define', { isAbstract: true }, 'cpp')
    ).toBe('effective');
    expect(
      nodeEffectiveness('function_define', { isAbstract: true }, 'csharp')
    ).toBe('effective');
    expect(
      nodeEffectiveness('function_define', { isAbstract: 'false' }, 'python')
    ).toBe('ineffective');
  });

  test('lock: abstract Declare effectiveness === isAbstract modifier table', () => {
    const langs = [
      'python',
      'javascript',
      'cpp',
      'csharp',
      'rust',
      'gdscript',
      'verse',
      'json',
    ] as const;
    for (const lang of langs) {
      const nodeEff =
        nodeEffectiveness('function_define', { isAbstract: true }, lang) === 'effective';
      expect(nodeEff).toBe(isModifierEffective(lang, 'isAbstract'));
    }
  });

  test('Event Declare: unpaired is ineffective', () => {
    expect(
      nodeEffectiveness('event_member_define', {}, 'python', { eventHasHandler: false })
    ).toBe('ineffective');
    expect(
      nodeEffectiveness('event_member_define', {}, 'python', { eventHasHandler: true })
    ).toBe('effective');
    expect(nodeEffectiveness('event_member_define', {}, 'python')).toBe('effective');
  });

  test('parseNodeTargetLanguages accepts string and array', () => {
    expect(parseNodeTargetLanguages({ targetLanguages: 'cpp, csharp' })).toEqual([
      'cpp',
      'csharp',
    ]);
    expect(parseNodeTargetLanguages({ targetLanguages: ['Python'] })).toEqual(['python']);
    expect(parseNodeTargetLanguages(undefined)).toEqual([]);
  });

  test('tooltip explains gated imports and Declare', () => {
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
    const declareTip = nodeIneffectiveTooltip('function_define', {}, 'python');
    expect(declareTip).toContain('Declare');
    expect(declareTip).toContain('python');
    expect(declareTip).toContain('prototype');
    expect(nodeIneffectiveTooltip('function_define', {}, 'cpp')).toBe('');
  });
});
