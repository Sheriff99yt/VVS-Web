import { describe, expect, test } from 'bun:test';
import {
  loadEnvironmentManifest,
  listBuiltinEnvironments,
  isEnvironmentManifest,
} from './loader';
import { resolveApiSurface, substituteCallExpr, renderHostFileTemplate } from './resolveApiSurface';
import { expandEnvironmentSymbols } from './expandEnvironmentSymbols';
import { createProjectFromEnvironment } from './createProjectFromEnvironment';

describe('environment-templates loader', () => {
  test('lists built-in environments', () => {
    const envs = listBuiltinEnvironments();
    expect(envs.length).toBeGreaterThanOrEqual(2);
    expect(envs.some((e) => e.id === 'env.python.console-app')).toBe(true);
    expect(envs.some((e) => e.id === 'env.javascript.browser-app')).toBe(true);
  });

  test('loads python console manifest', () => {
    const manifest = loadEnvironmentManifest('env.python.console-app');
    expect(manifest).toBeDefined();
    expect(manifest!.displayName).toBe('Python Console App');
    expect(manifest!.hostFiles.some((f) => f.path === 'main.py')).toBe(true);
    expect(isEnvironmentManifest(manifest)).toBe(true);
  });
});

describe('resolveApiSurface', () => {
  test('resolves python extends and natives', () => {
    const manifest = loadEnvironmentManifest('env.python.console-app')!;
    const surface = resolveApiSurface(manifest, 'python');
    expect(surface.extendsType).toBe('object');
    expect(surface.natives.some((m) => m.id === 'native.print')).toBe(true);
    expect(surface.events.some((e) => e.id === 'event.on_ready')).toBe(true);
  });

  test('filters unsupported natives for verse alert', () => {
    const manifest = loadEnvironmentManifest('env.javascript.browser-app')!;
    const jsSurface = resolveApiSurface(manifest, 'javascript');
    const pySurface = resolveApiSurface(manifest, 'python');
    expect(jsSurface.natives.some((m) => m.id === 'native.alert')).toBe(true);
    expect(pySurface.natives.some((m) => m.id === 'native.alert')).toBe(false);
  });

  test('substituteCallExpr replaces placeholders', () => {
    expect(substituteCallExpr('print({msg})', { msg: '"hello"' })).toBe('print("hello")');
  });

  test('renderHostFileTemplate substitutes module name', () => {
    const manifest = loadEnvironmentManifest('env.python.console-app')!;
    const main = renderHostFileTemplate(manifest.hostFiles[0]!.template, 'Calculator');
    expect(main).toContain('from Calculator import Calculator');
    expect(main).toContain('Calculator().on_start()');
  });
});

describe('expandEnvironmentSymbols', () => {
  test('produces native and event spawn templates', () => {
    const manifest = loadEnvironmentManifest('env.python.console-app')!;
    const categories = expandEnvironmentSymbols({
      environmentId: manifest.id,
      manifest,
      targetLanguage: 'python',
      currentGraphId: 'main',
    });
    expect(categories.length).toBeGreaterThan(0);
    const allItems = categories.flatMap((c) => c.items);
    expect(allItems.some((i) => i.graphBinding?.kind === 'env_native')).toBe(true);
    expect(allItems.some((i) => i.graphBinding?.kind === 'env_event')).toBe(true);
  });
});

describe('createProjectFromEnvironment', () => {
  test('creates snapshot with environment linkage', () => {
    const snapshot = createProjectFromEnvironment('env.python.console-app');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.environmentId).toBe('env.python.console-app');
    expect(snapshot!.environmentVersion).toBe('1.0.0');
    expect(snapshot!.projectDetails.moduleName).toBe('App');
    expect(snapshot!.projectDetails.extendsType).toBe('object');
    expect(snapshot!.installedLibrary[0]?.environmentVersion).toBe('1.0.0');
  });
});
