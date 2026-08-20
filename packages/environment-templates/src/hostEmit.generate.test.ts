import { describe, expect, test } from 'bun:test';
import { createDefaultIntegration } from '@vvs/graph-types';
import { generateHostFiles } from './hostFiles';
import type { ProjectEnvironmentManifest } from './types';

function hostManifest(): ProjectEnvironmentManifest {
  return {
    id: 'env.test.host-emit',
    version: '1.0.0',
    displayName: 'Host emit',
    description: 'test',
    defaultTarget: 'python',
    supportedTargets: ['python'],
    module: { defaultName: 'App' },
    apiSurface: { types: [], methods: [], events: [] },
    hostFiles: [
      {
        path: 'main.py',
        role: 'entry',
        template: 'from {moduleName} import {moduleName}\n',
      },
    ],
  };
}

describe('generate host-file emit (skip vs emit)', () => {
  test('adoptExisting / strategy skip does not emit or clobber main.py', () => {
    const integration = createDefaultIntegration({
      adoptExisting: true,
      hostFilePaths: ['main.py'],
      moduleName: 'App',
    });
    expect(integration.hostFiles['main.py']?.strategy).toBe('skip');
    const files = generateHostFiles(hostManifest(), 'App', integration);
    expect(files.some((f) => f.path === 'main.py')).toBe(false);
    expect(files).toEqual([]);
  });

  test('strategy emit does emit main.py', () => {
    const integration = createDefaultIntegration({
      hostFilePaths: ['main.py'],
      moduleName: 'App',
    });
    expect(integration.hostFiles['main.py']?.strategy).toBe('emit');
    const files = generateHostFiles(hostManifest(), 'App', integration);
    const main = files.find((f) => f.path === 'main.py');
    expect(main).toBeDefined();
    expect(main?.content).toBe('from App import App\n');
  });

  test('custom path on a host file uses that emit path', () => {
    const integration = createDefaultIntegration({
      hostFilePaths: ['main.py'],
      moduleName: 'App',
    });
    integration.hostFiles['main.py'] = { strategy: 'emit', path: 'scripts/run.py' };
    const files = generateHostFiles(hostManifest(), 'App', integration);
    expect(files.some((f) => f.path === 'main.py')).toBe(false);
    expect(files.find((f) => f.path === 'scripts/run.py')?.content).toBe(
      'from App import App\n'
    );
  });

  test('emit uses persisted in-editor contents instead of the template', () => {
    const integration = createDefaultIntegration({
      hostFilePaths: ['main.py'],
      moduleName: 'App',
    });
    integration.hostFiles['main.py'] = {
      strategy: 'emit',
      contents: 'print("edited host")\n',
    };
    const files = generateHostFiles(hostManifest(), 'App', integration);
    expect(files.find((f) => f.path === 'main.py')?.content).toBe('print("edited host")\n');
  });

  test('skip still omits the file when contents are set', () => {
    const integration = createDefaultIntegration({
      adoptExisting: true,
      hostFilePaths: ['main.py'],
      moduleName: 'App',
    });
    integration.hostFiles['main.py'] = {
      strategy: 'skip',
      contents: 'print("edited host")\n',
    };
    const files = generateHostFiles(hostManifest(), 'App', integration);
    expect(files).toEqual([]);
  });
});
