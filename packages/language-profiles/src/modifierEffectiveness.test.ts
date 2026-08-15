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

  test('isOverride is effective only where the language has a construct', () => {
    expect(modifierEffectiveness('cpp', 'isOverride')).toBe('effective');
    expect(modifierEffectiveness('csharp', 'isOverride')).toBe('effective');
    expect(modifierEffectiveness('verse', 'isOverride')).toBe('effective');
    expect(isModifierInteractive('cpp', 'isOverride')).toBe(true);
    expect(isModifierInteractive('csharp', 'isOverride')).toBe(true);
    expect(isModifierInteractive('verse', 'isOverride')).toBe(true);
    for (const lang of ['python', 'javascript', 'rust', 'gdscript', 'go'] as const) {
      expect(modifierEffectiveness(lang, 'isOverride')).toBe('ineffective');
      expect(isModifierInteractive(lang, 'isOverride')).toBe(false);
      expect(modifierIneffectiveTooltip(lang, 'isOverride')).toContain('no effect');
    }
  });

  test('Go has no virtual/abstract/override construct', () => {
    expect(modifierEffectiveness('go', 'isVirtual')).toBe('ineffective');
    expect(modifierEffectiveness('go', 'isAbstract')).toBe('ineffective');
    expect(isModifierInteractive('go', 'isOverride')).toBe(false);
  });

  test('function async is dimmed where the language has no await/async construct', () => {
    expect(modifierEffectiveness('cpp', 'isAsync')).toBe('ineffective');
    expect(modifierEffectiveness('go', 'isAsync')).toBe('ineffective');
    expect(modifierEffectiveness('verse', 'isAsync')).toBe('ineffective');
    expect(modifierEffectiveness('gdscript', 'isAsync')).toBe('ineffective');
    expect(isModifierInteractive('cpp', 'isAsync')).toBe(false);
    expect(isModifierInteractive('go', 'isAsync')).toBe(false);
    expect(isModifierInteractive('verse', 'isAsync')).toBe(false);
    expect(isModifierInteractive('gdscript', 'isAsync')).toBe(false);
    // Rust has no Tokio runtime — async fn and Wait.isAsync are both no-ops.
    expect(modifierEffectiveness('rust', 'isAsync')).toBe('ineffective');
    expect(isModifierInteractive('rust', 'isAsync')).toBe(false);
  });

  test('Wait.isAsync is dimmed where sleep/await emit is the same or fake', () => {
    expect(modifierEffectiveness('python', 'waitIsAsync')).toBe('effective');
    expect(modifierEffectiveness('javascript', 'waitIsAsync')).toBe('effective');
    expect(modifierEffectiveness('csharp', 'waitIsAsync')).toBe('effective');
    expect(modifierEffectiveness('gdscript', 'waitIsAsync')).toBe('effective');
    expect(isModifierInteractive('gdscript', 'waitIsAsync')).toBe(true);

    expect(modifierEffectiveness('cpp', 'waitIsAsync')).toBe('ineffective');
    expect(modifierEffectiveness('rust', 'waitIsAsync')).toBe('ineffective');
    expect(modifierEffectiveness('go', 'waitIsAsync')).toBe('ineffective');
    expect(modifierEffectiveness('verse', 'waitIsAsync')).toBe('ineffective');
    expect(isModifierInteractive('cpp', 'waitIsAsync')).toBe(false);
    expect(isModifierInteractive('rust', 'waitIsAsync')).toBe(false);
    expect(isModifierInteractive('go', 'waitIsAsync')).toBe(false);
    expect(isModifierInteractive('verse', 'waitIsAsync')).toBe(false);
    expect(modifierIneffectiveTooltip('rust', 'waitIsAsync')).toContain('no effect');
  });

});
