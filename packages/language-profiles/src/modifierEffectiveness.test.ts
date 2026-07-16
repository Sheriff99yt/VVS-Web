import { describe, expect, test } from 'bun:test';
import {
  isModifierEffective,
  isModifierInteractive,
  modifierEffectiveness,
  modifierIneffectiveTooltip,
} from './modifierEffectiveness';

describe('modifierEffectiveness', () => {
  test('C++ async is ineffective', () => {
    expect(modifierEffectiveness('cpp', 'isAsync')).toBe('ineffective');
    expect(isModifierEffective('cpp', 'isAsync')).toBe(false);
    expect(isModifierInteractive('cpp', 'isAsync')).toBe(false);
  });

  test('C++ visibility and virtual are effective', () => {
    expect(modifierEffectiveness('cpp', 'visibility')).toBe('effective');
    expect(modifierEffectiveness('cpp', 'isVirtual')).toBe('effective');
    expect(isModifierEffective('cpp', 'isVirtual')).toBe(true);
    expect(isModifierInteractive('cpp', 'isVirtual')).toBe(true);
  });

  test('Python async is effective', () => {
    expect(modifierEffectiveness('python', 'isAsync')).toBe('effective');
    expect(isModifierInteractive('python', 'isAsync')).toBe(true);
  });

  test('partial modifiers stay interactive', () => {
    expect(modifierEffectiveness('javascript', 'visibility')).toBe('partial');
    expect(isModifierInteractive('javascript', 'visibility')).toBe(true);
    expect(isModifierEffective('javascript', 'visibility')).toBe(false);
  });

  test('tooltip explains ineffective modifiers', () => {
    expect(modifierIneffectiveTooltip('cpp', 'isAsync')).toContain('cpp');
    expect(modifierIneffectiveTooltip('cpp', 'isAsync')).toContain('no effect');
    expect(modifierIneffectiveTooltip('cpp', 'visibility')).toBe('');
  });

  test('switching language changes interactivity', () => {
    expect(isModifierInteractive('python', 'isVirtual')).toBe(false);
    expect(isModifierInteractive('cpp', 'isVirtual')).toBe(true);
    expect(isModifierInteractive('python', 'isAsync')).toBe(true);
    expect(isModifierInteractive('cpp', 'isAsync')).toBe(false);
  });

  test('gdscript const and verse async are ineffective until packs emit them', () => {
    expect(modifierEffectiveness('gdscript', 'isConst')).toBe('ineffective');
    expect(isModifierInteractive('gdscript', 'isConst')).toBe(false);
    expect(modifierEffectiveness('verse', 'isAsync')).toBe('ineffective');
    expect(isModifierInteractive('verse', 'isAsync')).toBe(false);
  });
});
