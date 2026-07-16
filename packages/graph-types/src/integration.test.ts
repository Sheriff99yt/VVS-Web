import { describe, expect, test } from 'bun:test';
import {
  createDefaultIntegration,
  normalizeIntegrationConfig,
  resolveModuleEmitPath,
  shouldEmitHostFile,
  resolveHostEmitPath,
  formatEmitPreview,
} from './integration';

describe('ProjectIntegrationConfig', () => {
  test('createDefaultIntegration skips host files when adopting existing repo', () => {
    const cfg = createDefaultIntegration({
      adoptExisting: true,
      hostFilePaths: ['main.py', 'index.html'],
      moduleName: 'App',
      defaultTarget: 'python',
    });
    expect(cfg.hostFiles['main.py']?.strategy).toBe('skip');
    expect(cfg.emit.python?.moduleDir).toBe('src');
  });

  test('resolveModuleEmitPath uses settings moduleDir and moduleFile', () => {
    const cfg = createDefaultIntegration({ moduleName: 'App', defaultTarget: 'python' });
    cfg.emit.python = { moduleDir: 'src/myapp/vvs', moduleFile: 'logic.py' };
    expect(
      resolveModuleEmitPath(cfg, 'python', {
        tabKind: 'main',
        moduleName: 'App',
        fallbackFileName: 'App.py',
      })
    ).toBe('src/myapp/vvs/logic.py');
  });

  test('resolveModuleEmitPath prefers class file when preferFallbackOverModuleFile', () => {
    const cfg = createDefaultIntegration({
      moduleName: 'CoverageLab',
      defaultTarget: 'python',
      adoptExisting: true,
    });
    expect(
      resolveModuleEmitPath(cfg, 'python', {
        tabKind: 'main',
        moduleName: 'Machine',
        fallbackFileName: 'machine.py',
        preferFallbackOverModuleFile: true,
      })
    ).toBe('src/machine.py');
    expect(
      resolveModuleEmitPath(cfg, 'python', {
        tabKind: 'main',
        moduleName: 'Sensor',
        fallbackFileName: 'sensor.py',
        preferFallbackOverModuleFile: true,
      })
    ).toBe('src/sensor.py');
  });

  test('resolveModuleEmitPath applies container subdir prefix', () => {
    expect(
      resolveModuleEmitPath(undefined, 'python', {
        tabKind: 'main',
        moduleName: 'Widget',
        fallbackFileName: 'Widget.py',
        subdirPrefix: 'ui',
      })
    ).toBe('ui/Widget.py');
  });

  test('shouldEmitHostFile respects skip strategy', () => {
    const cfg = normalizeIntegrationConfig({
      hostFiles: { 'main.py': { strategy: 'skip' } },
    });
    expect(shouldEmitHostFile(cfg, 'main.py')).toBe(false);
    expect(shouldEmitHostFile(cfg, 'other.py')).toBe(true);
  });

  test('resolveHostEmitPath uses custom path', () => {
    const cfg = normalizeIntegrationConfig({
      hostFiles: { 'main.py': { strategy: 'emit', path: 'scripts/run.py' } },
    });
    expect(resolveHostEmitPath(cfg, 'main.py')).toBe('scripts/run.py');
  });

  test('formatEmitPreview', () => {
    const cfg = createDefaultIntegration({ moduleName: 'Player', defaultTarget: 'javascript' });
    cfg.emit.javascript = { moduleDir: 'src', moduleFile: 'Player.js' };
    expect(formatEmitPreview(cfg, 'javascript', 'Player')).toBe('src/Player.js');
  });
});
