#!/usr/bin/env bun
/**
 * Import industry-standard specs into a VVS ProjectEnvironmentManifest.
 *
 * Usage:
 *   bun run scripts/env-import.ts --id env.custom.my-app --out ./out/manifest.json \
 *     --openapi ./api.openapi.json --asyncapi ./events.asyncapi.json \
 *     --typespec ./api.tsp \
 *     --backstage ./path/to/backstage-template-pack
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  buildEnvironmentManifest,
  importBackstagePack,
  loadTypeSpecDocument,
  type OpenApiDocument,
  type AsyncApiDocument,
  type TypeSpecImportDocument,
} from '../src/node';
import { isEnvironmentManifest } from '../src/loader';
import { mergeImportedManifest } from '../src/hostFiles';

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

async function readJsonFile<T>(path: string): Promise<T> {
  return (await Bun.file(resolve(path)).json()) as T;
}

async function main(): Promise<void> {
  const id = argValue('--id');
  const out = argValue('--out');
  const openapiPath = argValue('--openapi');
  const asyncapiPath = argValue('--asyncapi');
  const backstagePath = argValue('--backstage');
  const typespecPath = argValue('--typespec') ?? argValue('--tsp');
  const displayName = argValue('--title');
  const version = argValue('--version') ?? '1.0.0';
  const defaultTarget = (argValue('--target') ?? 'python') as 'python' | 'javascript';

  if (!id || !out) {
    console.error(`Usage: env-import --id env.slug.name --out manifest.json [options]

Options:
  --openapi <path>     OpenAPI 3.x JSON (methods/natives → apiSurface.methods)
  --asyncapi <path>    AsyncAPI 2.x JSON (channels → apiSurface.events)
  --typespec <path>    TypeSpec .tsp (models + ops → apiSurface.types/methods)
  --tsp <path>         Alias for --typespec
  --backstage <dir>    Backstage template pack (template.yaml + skeleton/)
  --title <string>     Display name (default from spec or id)
  --version <semver>   Manifest version (default 1.0.0)
  --target <lang>      defaultTarget: python | javascript (default python)
`);
    process.exit(1);
  }

  let manifest;
  const supportedTargets = defaultTarget === 'javascript' ? ['javascript' as const] : ['python' as const, 'javascript' as const];
  const openapi = openapiPath ? await readJsonFile<OpenApiDocument>(openapiPath) : undefined;
  const asyncapi = asyncapiPath ? await readJsonFile<AsyncApiDocument>(asyncapiPath) : undefined;
  const typespec: TypeSpecImportDocument | undefined = typespecPath
    ? await loadTypeSpecDocument(resolve(typespecPath))
    : undefined;

  if (backstagePath) {
    manifest = await importBackstagePack({
      packDir: resolve(backstagePath),
      id,
      version,
      defaultTarget,
      supportedTargets,
      openapi,
      asyncapi,
    });
    if (typespec) {
      const fromTsp = buildEnvironmentManifest({
        id,
        version,
        displayName: displayName ?? typespec.serviceTitle ?? manifest.displayName,
        description: typespec.description ?? manifest.description,
        defaultTarget,
        supportedTargets,
        moduleDefaultName: typespec.serviceNamespace ?? manifest.module.defaultName,
        typespec,
        hostFiles: manifest.hostFiles,
        extraMethods: manifest.apiSurface.methods,
        extraEvents: manifest.apiSurface.events,
        extraTypes: manifest.apiSurface.types,
      });
      manifest = fromTsp;
    }
    if (displayName) manifest.displayName = displayName;
  } else {
    if (!openapi && !asyncapi && !typespec) {
      console.error('Provide --openapi, --asyncapi, --typespec/--tsp, and/or --backstage');
      process.exit(1);
    }
    const titleFromSpec =
      displayName ??
      typespec?.serviceTitle ??
      (openapi?.info?.title || asyncapi?.info?.title) ??
      id;
    const descriptionFromSpec =
      typespec?.description ??
      openapi?.info?.description ??
      asyncapi?.info?.description ??
      (typespec
        ? `Generated from TypeSpec${typespec.serviceNamespace ? ` (${typespec.serviceNamespace})` : ''}`
        : 'Generated from OpenAPI/AsyncAPI import');
    manifest = buildEnvironmentManifest({
      id,
      version,
      displayName: titleFromSpec,
      description: descriptionFromSpec,
      defaultTarget,
      supportedTargets,
      moduleDefaultName: typespec?.serviceNamespace,
      openapi,
      asyncapi,
      typespec,
      hostFiles: [],
    });
    if (typespec) manifest.category = 'api';
  }

  const outPath = resolve(out);
  if (existsSync(outPath)) {
    try {
      const previous = JSON.parse(await readFile(outPath, 'utf8')) as unknown;
      if (isEnvironmentManifest(previous)) {
        manifest = mergeImportedManifest(previous, manifest);
        console.log(`Merged with existing entry at ${outPath}`);
      }
    } catch (err) {
      console.error(`Could not merge existing entry at ${outPath}:`, err);
      process.exit(1);
    }
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`  methods: ${manifest.apiSurface.methods.length}`);
  console.log(`  events: ${manifest.apiSurface.events.length}`);
  console.log(`  types: ${manifest.apiSurface.types.length}`);
  console.log(`  hostFiles: ${manifest.hostFiles.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
