import { describe, expect, test } from 'bun:test';
import { groupEnvironmentsByCategory, resolveEnvironmentCategory } from './categories';
import { listBuiltinEnvironments } from './loader';

describe('environment categories', () => {
  test('resolves category from manifest', () => {
    const python = listBuiltinEnvironments().find((m) => m.id === 'env.python.console-app');
    expect(python).toBeDefined();
    expect(resolveEnvironmentCategory(python!)).toBe('console');
  });

  test('defaults missing category to console', () => {
    expect(resolveEnvironmentCategory({})).toBe('console');
  });

  test('groups built-in manifests by category', () => {
    const manifests = listBuiltinEnvironments();
    const groups = groupEnvironmentsByCategory(manifests);
    const total = [...groups.values()].reduce((n, arr) => n + arr.length, 0);
    expect(total).toBe(manifests.length);
    expect((groups.get('console') ?? []).length).toBeGreaterThanOrEqual(2);
    expect((groups.get('web') ?? []).length).toBeGreaterThanOrEqual(2);
  });

  test('includes api and data templates', () => {
    const ids = listBuiltinEnvironments().map((m) => m.id);
    expect(ids).toContain('env.python.api-service');
    expect(ids).toContain('env.python.data-script');
    expect(ids).toContain('env.cpp.game-loop');
    expect(ids).toContain('env.gdscript.godot-game');
  });
});
