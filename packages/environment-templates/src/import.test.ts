import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import {
  buildEnvironmentManifest,
  importEventsFromAsyncApi,
  importMethodsFromOpenApi,
  normalizeBackstageTemplate,
  parseBackstageTemplateYaml,
} from './import';
import {
  importBackstagePack,
  importHostFilesFromSkeleton,
} from './import/node';
import { validateEnvironmentManifest } from './validate';
import { registerEnvironmentManifest, loadEnvironmentManifest } from './loader';
import type { OpenApiDocument } from './import/fromOpenApi';
import type { AsyncApiDocument } from './import/fromAsyncApi';

const fixtures = join(import.meta.dir, '..', 'fixtures');

describe('validateEnvironmentManifest', () => {
  test('accepts built-in python manifest shape', async () => {
    const raw = await Bun.file(
      join(import.meta.dir, 'manifests', 'env.python.console-app.json')
    ).json();
    const result = validateEnvironmentManifest(raw);
    expect(result.ok).toBe(true);
  });

  test('rejects invalid id', () => {
    const result = validateEnvironmentManifest({ id: 'not-valid' });
    expect(result.ok).toBe(false);
  });
});

describe('importMethodsFromOpenApi', () => {
  test('imports operations with x-vvs bindings', async () => {
    const doc = (await Bun.file(join(fixtures, 'sample.openapi.json')).json()) as OpenApiDocument;
    const methods = importMethodsFromOpenApi(doc);
    expect(methods.length).toBe(2);
    const getPet = methods.find((m) => m.name === 'getPet');
    expect(getPet?.targets.python?.callExpr).toContain('get_pet');
    expect(getPet?.parameters.some((p) => p.type === 'data_number')).toBe(true);
  });
});

describe('importEventsFromAsyncApi', () => {
  test('imports publish channels as events', async () => {
    const doc = (await Bun.file(join(fixtures, 'sample.asyncapi.json')).json()) as AsyncApiDocument;
    const events = importEventsFromAsyncApi(doc);
    expect(events.length).toBe(1);
    expect(events[0]!.parameters.length).toBe(2);
  });
});

describe('Backstage skeleton import', () => {
  test('parses template.yaml metadata', async () => {
    const yaml = await Bun.file(join(fixtures, 'backstage-pack', 'template.yaml')).text();
    const meta = parseBackstageTemplateYaml(yaml);
    expect(meta.name).toBe('demo-python-service');
    expect(meta.title).toBe('Demo Python Service');
  });

  test('normalizes Backstage placeholders', () => {
    const out = normalizeBackstageTemplate('from ${{ values.name }} import X');
    expect(out).toContain('{moduleName}');
  });

  test('normalizes Nunjucks values.name from fixture README', async () => {
    const readme = await Bun.file(join(fixtures, 'backstage-pack', 'skeleton', 'README.md')).text();
    expect(readme).toContain('${{ values.name }}');
    const out = normalizeBackstageTemplate(readme);
    expect(out).toContain('{moduleName}');
    expect(out).toContain('${{ values.owner }}');
    expect(out).not.toContain('{%');
  });

  test('imported skeleton README stores {moduleName} not Nunjucks braces', async () => {
    const files = await importHostFilesFromSkeleton({
      skeletonDir: join(fixtures, 'backstage-pack', 'skeleton'),
    });
    const readme = files.find((f) => f.path === 'README.md');
    expect(readme?.template).toContain('{moduleName}');
    expect(readme?.template).not.toContain('{{ moduleName }}');
  });

  test('imports skeleton host files', async () => {
    const files = await importHostFilesFromSkeleton({
      skeletonDir: join(fixtures, 'backstage-pack', 'skeleton'),
    });
    expect(files.some((f) => f.path === 'main.py' && f.role === 'entry')).toBe(true);
  });

  test('importBackstagePack merges skeleton + specs', async () => {
    const manifest = await importBackstagePack({
      packDir: join(fixtures, 'backstage-pack'),
      id: 'env.test.demo-service',
      openapi: (await Bun.file(join(fixtures, 'sample.openapi.json')).json()) as OpenApiDocument,
      asyncapi: (await Bun.file(join(fixtures, 'sample.asyncapi.json')).json()) as AsyncApiDocument,
    });
    expect(manifest.hostFiles.length).toBeGreaterThan(0);
    expect(manifest.apiSurface.methods.length).toBeGreaterThan(0);
    expect(manifest.apiSurface.events.length).toBeGreaterThan(0);
    expect(validateEnvironmentManifest(manifest).ok).toBe(true);
  });
});

describe('buildEnvironmentManifest', () => {
  test('produces valid manifest from specs only', async () => {
    const manifest = buildEnvironmentManifest({
      id: 'env.test.spec-only',
      version: '1.0.0',
      displayName: 'Spec Only',
      description: 'test',
      defaultTarget: 'python',
      supportedTargets: ['python'],
      openapi: (await Bun.file(join(fixtures, 'sample.openapi.json')).json()) as OpenApiDocument,
      hostFiles: [],
    });
    expect(manifest.apiSurface.methods.length).toBe(2);
  });
});

describe('registerEnvironmentManifest', () => {
  test('registers imported manifest for loadEnvironmentManifest', async () => {
    const manifest = buildEnvironmentManifest({
      id: 'env.test.registered',
      version: '1.0.0',
      displayName: 'Registered',
      description: 'test',
      defaultTarget: 'python',
      supportedTargets: ['python'],
      hostFiles: [
        { path: 'main.py', role: 'entry', template: '# empty\n' },
      ],
    });
    registerEnvironmentManifest(manifest);
    expect(loadEnvironmentManifest('env.test.registered')?.displayName).toBe('Registered');
  });
});

describe('devcontainer linkage', () => {
  test('accepts rust console pack with matching host file', async () => {
    const raw = await Bun.file(
      join(import.meta.dir, 'manifests', 'env.rust.console-app.json')
    ).json();
    const result = validateEnvironmentManifest(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.devcontainer?.path).toBe('.devcontainer/devcontainer.json');
    }
  });

  test('rejects devcontainer path that is not a host file', async () => {
    const raw = (await Bun.file(
      join(import.meta.dir, 'manifests', 'env.python.console-app.json')
    ).json()) as Record<string, unknown>;
    raw.devcontainer = { path: '.devcontainer/devcontainer.json' };
    const result = validateEnvironmentManifest(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'devcontainer.path')).toBe(true);
    }
  });

  test('accepts manifests with no devcontainer field', async () => {
    const raw = await Bun.file(
      join(import.meta.dir, 'manifests', 'env.python.console-app.json')
    ).json();
    const result = validateEnvironmentManifest(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.devcontainer).toBeUndefined();
    }
  });
});

describe('Backstage Nunjucks skeleton files', () => {
  test('importHostFilesFromSkeleton converts name placeholders in fixture files', async () => {
    const files = await importHostFilesFromSkeleton({
      skeletonDir: join(fixtures, 'backstage-pack', 'skeleton'),
    });
    const readme = files.find((f) => f.path === 'README.md');
    expect(readme).toBeDefined();
    expect(readme!.template).toContain('{moduleName}');
    expect(readme!.template).toContain('${{ values.owner }}');
    expect(readme!.template).not.toContain('{%');
    expect(readme!.role).toBe('asset');
  });
});
