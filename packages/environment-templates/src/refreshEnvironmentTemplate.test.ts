import { describe, expect, test } from 'bun:test';
import { createDefaultIntegration } from '@vvs/graph-types';
import { refreshEnvironmentTemplate } from './refreshEnvironmentTemplate';
import type { ProjectEnvironmentManifest } from './types';

function manifest(overrides?: Partial<ProjectEnvironmentManifest>): ProjectEnvironmentManifest {
  return {
    id: 'env.test.refresh',
    version: '2.0.0',
    displayName: 'Refresh Test',
    description: 'test',
    defaultTarget: 'python',
    supportedTargets: ['python'],
    module: { defaultName: 'App' },
    apiSurface: { types: [], methods: [], events: [] },
    hostFiles: [
      {
        path: 'main.py',
        role: 'entry',
        template: 'from {moduleName} import {moduleName}\n# v2\n',
      },
      {
        path: 'README.md',
        role: 'asset',
        template: '# {moduleName}\n',
      },
    ],
    ...overrides,
  };
}

const previousMain = 'from App import App\n# v1\n';
const nextMain = 'from App import App\n# v2\n';

describe('refreshEnvironmentTemplate', () => {
  test('does not touch graph-shaped fields (returns no snapshot documents)', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py', 'README.md'],
    });
    integration.hostFiles['main.py'] = {
      strategy: 'emit',
      appliedTemplate: previousMain,
    };
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'main.py': previousMain, 'README.md': '# App' },
    });
    expect(result.environmentVersion).toBe('2.0.0');
    expect(result.writeFiles.some((f) => f.path === 'main.py')).toBe(true);
    expect(Object.keys(result)).not.toContain('documents');
    expect(Object.keys(result)).not.toContain('classes');
  });

  test('overwrites host files that still match the previous template', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    integration.hostFiles['main.py'] = {
      strategy: 'emit',
      appliedTemplate: previousMain,
    };
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'main.py': previousMain },
    });
    const written = result.writeFiles.find((f) => f.path === 'main.py');
    expect(written?.content).toBe(nextMain);
    expect(result.notes.find((n) => n.path === 'main.py')?.action).toBe('applied');
    expect(result.integration.hostFiles['main.py']?.appliedTemplate).toBe(nextMain);
    expect(result.integration.hostFiles['main.py']?.strategy).toBe('emit');
  });

  test('keeps user-edited host files and marks them skip', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    integration.hostFiles['main.py'] = {
      strategy: 'emit',
      appliedTemplate: previousMain,
    };
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'main.py': 'from App import App\n# user edit\n' },
    });
    expect(result.writeFiles.some((f) => f.path === 'main.py')).toBe(false);
    expect(result.notes.find((n) => n.path === 'main.py')?.action).toBe('kept-yours');
    expect(result.integration.hostFiles['main.py']?.strategy).toBe('skip');
  });

  test('without a previous baseline, skip overwrite and report kept-yours', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'main.py': 'from App import App\n# maybe user, maybe old template\n' },
    });
    expect(result.writeFiles.some((f) => f.path === 'main.py')).toBe(false);
    expect(result.notes.find((n) => n.path === 'main.py')?.action).toBe('kept-yours');
    expect(result.integration.hostFiles['main.py']?.strategy).toBe('skip');
  });

  test('applies new host files that are missing on disk', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: {},
    });
    expect(result.writeFiles.some((f) => f.path === 'main.py')).toBe(true);
    expect(result.writeFiles.some((f) => f.path === 'README.md')).toBe(true);
    expect(result.notes.every((n) => n.action === 'applied')).toBe(true);
  });

  test('honors skip strategy from adopt-existing integration', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      adoptExisting: true,
      hostFilePaths: ['main.py'],
    });
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'main.py': previousMain },
    });
    expect(result.writeFiles.some((f) => f.path === 'main.py')).toBe(false);
    expect(result.notes.find((n) => n.path === 'main.py')?.action).toBe('kept-yours');
    expect(result.integration.hostFiles['main.py']?.strategy).toBe('skip');
  });

  test('in-memory refresh (no disk contents) updates version and appliedTemplate', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    integration.hostFiles['main.py'] = {
      strategy: 'emit',
      appliedTemplate: previousMain,
    };
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
    });
    expect(result.environmentVersion).toBe('2.0.0');
    expect(result.writeFiles).toEqual([]);
    expect(result.integration.hostFiles['main.py']?.appliedTemplate).toBe(nextMain);
    expect(result.notes.find((n) => n.path === 'main.py')?.action).toBe('applied');
  });

  test('updates installed library environmentVersion for the linked pack', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
    });
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      installedLibrary: [
        { assetId: 'env.test.refresh', installedAt: '2026-01-01T00:00:00.000Z', environmentVersion: '1.0.0' },
        { assetId: 'other', installedAt: '2026-01-01T00:00:00.000Z', environmentVersion: '9.0.0' },
      ],
    });
    expect(result.installedLibrary[0]?.environmentVersion).toBe('2.0.0');
    expect(result.installedLibrary[1]?.environmentVersion).toBe('9.0.0');
  });

  test('already-current files are not rewritten', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'main.py': nextMain },
    });
    expect(result.writeFiles.some((f) => f.path === 'main.py')).toBe(false);
    expect(result.notes.find((n) => n.path === 'main.py')?.action).toBe('already-current');
  });

  test('uses custom emit path from integration', () => {
    const integration = createDefaultIntegration({
      environmentId: 'env.test.refresh',
      environmentVersion: '1.0.0',
      moduleName: 'App',
      hostFilePaths: ['main.py'],
    });
    integration.hostFiles['main.py'] = {
      strategy: 'emit',
      path: 'scripts/run.py',
      appliedTemplate: previousMain,
    };
    const result = refreshEnvironmentTemplate({
      moduleName: 'App',
      integration,
      nextManifest: manifest(),
      currentHostFiles: { 'scripts/run.py': previousMain },
    });
    expect(result.writeFiles[0]?.path).toBe('scripts/run.py');
    expect(result.notes[0]?.emitPath).toBe('scripts/run.py');
  });
});
