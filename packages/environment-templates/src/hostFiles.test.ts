import { describe, expect, test } from 'bun:test';
import {
  createDefaultIntegration,
  createEmptyProjectSnapshot,
  type ProjectSnapshot,
} from '@vvs/graph-types';
import {
  adoptHostFileRules,
  filterGeneratedFilesForHostPolicy,
  hashHostContent,
  mergeImportedManifest,
  planHostFileWrites,
  refreshLinkedEnvironment,
} from './hostFiles';
import { normalizeBackstageTemplate, inferHostFileRole } from './import';
import { loadEnvironmentManifest } from './loader';

describe('normalizeBackstageTemplate Nunjucks → {moduleName}', () => {
  test('maps name-like Backstage/Nunjucks slots only', () => {
    expect(normalizeBackstageTemplate('from ${{ values.name }} import X')).toBe(
      'from {moduleName} import X'
    );
    expect(normalizeBackstageTemplate('mod={{ parameters.moduleName }}')).toBe(
      'mod={moduleName}'
    );
    expect(normalizeBackstageTemplate('owned by ${{ values.owner }}')).toBe(
      'owned by ${{ values.owner }}'
    );
  });

  test('strips Nunjucks control tags and keeps filters on name keys', () => {
    const raw = '{% if values.name %}{{ values.name | dump }}{% endif %}';
    expect(normalizeBackstageTemplate(raw)).toBe('{moduleName}');
  });
});

describe('inferHostFileRole', () => {
  test('treats rust/csharp entries as entry files', () => {
    expect(inferHostFileRole('src/main.rs')).toBe('entry');
    expect(inferHostFileRole('Program.cs')).toBe('entry');
    expect(inferHostFileRole('Cargo.toml')).toBe('config');
  });
});

describe('adoptHostFileRules', () => {
  test('skips existing main.py / main.rs and emits missing files', () => {
    const rules = adoptHostFileRules(
      ['main.py', 'src/main.rs', 'Cargo.toml'],
      ['main.py', 'src/main.rs']
    );
    expect(rules['main.py']?.strategy).toBe('skip');
    expect(rules['src/main.rs']?.strategy).toBe('skip');
    expect(rules['Cargo.toml']?.strategy).toBe('emit');
  });
});

describe('planHostFileWrites', () => {
  const hostFiles = [
    { path: 'main.py', role: 'entry' as const, template: 'from {moduleName} import {moduleName}\n' },
    { path: 'Cargo.toml', role: 'config' as const, template: 'name = "{moduleName}"\n' },
  ];

  test('writes missing files and skips policy-skip entries', () => {
    const integration = createDefaultIntegration({
      hostFilePaths: ['main.py', 'Cargo.toml'],
      existingHostFilePaths: ['main.py'],
    });
    const plan = planHostFileWrites({
      hostFiles,
      moduleName: 'App',
      existingContents: { 'main.py': 'print("user")\n' },
      integration,
    });
    expect(plan.skipped.some((s) => s.path === 'main.py' && s.reason === 'policy')).toBe(true);
    expect(plan.writes.some((w) => w.path === 'Cargo.toml' && w.content.includes('App'))).toBe(true);
  });

  test('keeps user-changed files and surfaces drift', () => {
    const integration = createDefaultIntegration({
      hostFilePaths: ['main.py'],
    });
    integration.hostFiles['main.py'] = { strategy: 'emit' };
    integration.appliedHostFiles = { 'main.py': hashHostContent('from App import App\n') };
    const plan = planHostFileWrites({
      hostFiles,
      moduleName: 'App',
      existingContents: { 'main.py': 'print("hand edited")\n' },
      integration,
    });
    expect(plan.writes.some((w) => w.path === 'main.py')).toBe(false);
    expect(plan.drift.some((d) => d.path === 'main.py' && d.reason === 'user-changed')).toBe(true);
  });

  test('re-applies when the on-disk file still matches the last applied hash', () => {
    const previous = 'from App import App\n';
    const integration = createDefaultIntegration({ hostFilePaths: ['main.py'] });
    integration.hostFiles['main.py'] = { strategy: 'emit' };
    integration.appliedHostFiles = { 'main.py': hashHostContent(previous) };
    const plan = planHostFileWrites({
      hostFiles: [{ path: 'main.py', role: 'entry', template: 'from {moduleName} import Boot\n' }],
      moduleName: 'App',
      existingContents: { 'main.py': previous },
      integration,
    });
    expect(plan.writes).toEqual([
      { path: 'main.py', content: 'from App import Boot\n' },
    ]);
    expect(plan.drift).toEqual([]);
  });
});

describe('filterGeneratedFilesForHostPolicy', () => {
  test('drops skipped host emit paths from generate output', () => {
    const integration = createDefaultIntegration({
      hostFilePaths: ['main.py', 'src/main.rs'],
      existingHostFilePaths: ['main.py', 'src/main.rs'],
    });
    const kept = filterGeneratedFilesForHostPolicy(
      [
        { path: 'main.py', content: 'clobber' },
        { path: 'src/main.rs', content: 'clobber' },
        { path: 'src/App.py', content: 'ok' },
      ],
      integration
    );
    expect(kept.map((f) => f.path)).toEqual(['src/App.py']);
  });
});

describe('refreshLinkedEnvironment', () => {
  test('updates version and preserves user graphs', () => {
    const manifest = loadEnvironmentManifest('env.python.console-app')!;
    const snapshot: ProjectSnapshot = {
      ...createEmptyProjectSnapshot(),
      environmentId: manifest.id,
      environmentVersion: '0.9.0',
      installedLibrary: [{ assetId: manifest.id, installedAt: '2020-01-01T00:00:00.000Z', environmentVersion: '0.9.0' }],
    };
    const graphJson = JSON.stringify(snapshot.documents);
    const next = refreshLinkedEnvironment(snapshot, manifest);
    expect(next.environmentVersion).toBe(manifest.version);
    expect(JSON.stringify(next.documents)).toBe(graphJson);
    expect(next.installedLibrary[0]?.environmentVersion).toBe(manifest.version);
  });
});

describe('mergeImportedManifest', () => {
  test('keeps extra methods from an existing entry and replaces host files by path', () => {
    const existing = loadEnvironmentManifest('env.python.console-app')!;
    const incoming = {
      ...existing,
      version: '2.0.0',
      hostFiles: [{ path: 'main.py', role: 'entry' as const, template: '# new\n' }],
      apiSurface: {
        ...existing.apiSurface,
        methods: [
          {
            id: 'native.extra',
            name: 'extra',
            parameters: [],
            role: 'native' as const,
            targets: { python: { callExpr: 'extra()' } },
          },
        ],
      },
    };
    const merged = mergeImportedManifest(existing, incoming);
    expect(merged.version).toBe('2.0.0');
    expect(merged.hostFiles.find((f) => f.path === 'main.py')?.template).toBe('# new\n');
    expect(merged.apiSurface.methods.some((m) => m.id === 'native.print')).toBe(true);
    expect(merged.apiSurface.methods.some((m) => m.id === 'native.extra')).toBe(true);
  });
});
