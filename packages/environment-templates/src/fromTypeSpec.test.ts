import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildEnvironmentManifest } from './import';
import { importApiSurfaceFromTypeSpec, suggestedTypeSpecEnvId } from './import/fromTypeSpec';
import {
  importTypeSpecFile,
  loadTypeSpecDocument,
} from './import/fromTypeSpec.node';
import { validateEnvironmentManifest } from './validate';
import type { TypeSpecImportDocument } from './import/fromTypeSpec';

const fixtures = join(import.meta.dir, '..', 'fixtures');
const sampleTsp = join(fixtures, 'sample.tsp');

describe('TypeSpec import (compiler)', () => {
  test('fixture compiles to a valid manifest with types and methods', async () => {
    const manifest = await importTypeSpecFile(sampleTsp, {
      id: 'env.test.petstore',
      version: '1.0.0',
    });
    const result = validateEnvironmentManifest(manifest);
    expect(result.ok).toBe(true);
    expect(manifest.displayName).toBe('Pet Store');
    expect(manifest.module.defaultName).toBe('PetStore');
    expect(manifest.hostFiles).toEqual([]);
    expect(manifest.category).toBe('api');

    const typeNames = manifest.apiSurface.types.map((t) => t.displayName);
    expect(typeNames).toContain('Pet');
    expect(typeNames).toContain('CreatePet');

    const methodNames = manifest.apiSurface.methods.map((m) => m.name);
    expect(methodNames).toContain('getPet');
    expect(methodNames).toContain('createPet');

    const getPet = manifest.apiSurface.methods.find((m) => m.name === 'getPet');
    expect(getPet?.parameters.some((p) => p.label === 'petId' && p.type === 'data_number')).toBe(true);
    expect(getPet?.role).toBe('native');
    expect(getPet?.targets.python?.callExpr).toContain('getPet');
  });

  test('loadTypeSpecDocument reads service metadata from the fixture', async () => {
    const doc = await loadTypeSpecDocument(sampleTsp);
    expect(doc.serviceTitle).toBe('Pet Store');
    expect(doc.serviceNamespace).toBe('PetStore');
    expect(doc.models.map((m) => m.name).sort()).toEqual(['CreatePet', 'Pet']);
    expect(doc.operations.map((o) => o.name).sort()).toEqual(['createPet', 'getPet']);
    const pet = doc.models.find((m) => m.name === 'Pet');
    expect(pet?.properties.find((p) => p.name === 'tag')?.optional).toBe(true);
    expect(pet?.properties.find((p) => p.name === 'id')?.pinType).toBe('data_number');
  });
});

describe('TypeSpec import (document mapper)', () => {
  test('maps a hand-built document without the compiler', () => {
    const doc: TypeSpecImportDocument = {
      serviceTitle: 'Demo',
      serviceNamespace: 'Demo',
      models: [{ name: 'Item', properties: [{ name: 'sku', optional: false, typeName: 'string', pinType: 'data_string' }] }],
      operations: [
        {
          name: 'getItem',
          interfaceName: 'Items',
          parameters: [{ name: 'sku', typeName: 'string', pinType: 'data_string' }],
          returnTypeName: 'Item',
        },
      ],
    };
    const surface = importApiSurfaceFromTypeSpec(doc);
    expect(surface.types[0]?.displayName).toBe('Item');
    expect(surface.methods[0]?.name).toBe('getItem');
    expect(suggestedTypeSpecEnvId(doc)).toBe('env.imported.demo');
  });

  test('buildEnvironmentManifest accepts a TypeSpec document', () => {
    const manifest = buildEnvironmentManifest({
      id: 'env.test.typespec-doc',
      version: '1.0.0',
      displayName: 'From Doc',
      description: 'test',
      defaultTarget: 'python',
      supportedTargets: ['python'],
      typespec: {
        serviceTitle: 'From Doc',
        serviceNamespace: 'FromDoc',
        models: [{ name: 'Box', properties: [] }],
        operations: [{ name: 'open', parameters: [] }],
      },
      hostFiles: [],
    });
    expect(manifest.apiSurface.types.some((t) => t.displayName === 'Box')).toBe(true);
    expect(manifest.apiSurface.methods.some((m) => m.name === 'open')).toBe(true);
    expect(validateEnvironmentManifest(manifest).ok).toBe(true);
  });
});

describe('env-import --typespec CLI', () => {
  test('writes a valid manifest from the fixture', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vvs-tsp-cli-'));
    const out = join(dir, 'manifest.json');
    const script = join(import.meta.dir, '..', 'scripts', 'env-import.ts');
    const proc = Bun.spawnSync({
      cmd: [
        'bun',
        'run',
        script,
        '--id',
        'env.test.cli-petstore',
        '--out',
        out,
        '--typespec',
        sampleTsp,
        '--title',
        'CLI Pet Store',
      ],
      cwd: join(import.meta.dir, '..'),
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const stdout = proc.stdout.toString();
    const stderr = proc.stderr.toString();
    expect(proc.exitCode).toBe(0);
    expect(stdout).toContain('Wrote');
    expect(stderr).not.toContain('Provide --openapi');
    const raw = JSON.parse(await readFile(out, 'utf8')) as unknown;
    const result = validateEnvironmentManifest(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.displayName).toBe('CLI Pet Store');
      expect(result.manifest.apiSurface.methods.length).toBeGreaterThan(0);
      expect(result.manifest.apiSurface.types.some((t) => t.displayName === 'Pet')).toBe(true);
    }
    await rm(dir, { recursive: true, force: true });
  });

  test('accepts --tsp as an alias', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vvs-tsp-cli-alias-'));
    const out = join(dir, 'manifest.json');
    const script = join(import.meta.dir, '..', 'scripts', 'env-import.ts');
    const proc = Bun.spawnSync({
      cmd: ['bun', 'run', script, '--id', 'env.test.cli-tsp', '--out', out, '--tsp', sampleTsp],
      cwd: join(import.meta.dir, '..'),
      stdout: 'pipe',
      stderr: 'pipe',
    });
    expect(proc.exitCode).toBe(0);
    const raw = JSON.parse(await readFile(out, 'utf8')) as unknown;
    expect(validateEnvironmentManifest(raw).ok).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });
});
