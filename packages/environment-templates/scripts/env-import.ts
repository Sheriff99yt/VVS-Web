#!/usr/bin/env bun
/**
 * Import industry-standard specs into a VVS ProjectEnvironmentManifest.
 *
 * Usage:
 *   bun run scripts/env-import.ts --id env.custom.my-app --out ./out/manifest.json \
 *     --openapi ./api.openapi.json --asyncapi ./events.asyncapi.json \
 *     --backstage ./path/to/backstage-template-pack
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  buildEnvironmentManifest,
  importBackstagePack,
  type OpenApiDocument,
  type AsyncApiDocument,
} from '../src/node';

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
  const displayName = argValue('--title');
  const version = argValue('--version') ?? '1.0.0';
  const defaultTarget = (argValue('--target') ?? 'python') as 'python' | 'javascript';

  if (!id || !out) {
    console.error(`Usage: env-import --id env.slug.name --out manifest.json [options]

Options:
  --openapi <path>     OpenAPI 3.x JSON (methods/natives → apiSurface.methods)
  --asyncapi <path>    AsyncAPI 2.x JSON (channels → apiSurface.events)
  --backstage <dir>    Backstage template pack (template.yaml + skeleton/)
  --title <string>     Display name (default from Backstage or id)
  --version <semver>   Manifest version (default 1.0.0)
  --target <lang>      defaultTarget: python | javascript (default python)
`);
    process.exit(1);
  }

  let manifest;

  if (backstagePath) {
    const openapi = openapiPath ? await readJsonFile<OpenApiDocument>(openapiPath) : undefined;
    const asyncapi = asyncapiPath ? await readJsonFile<AsyncApiDocument>(asyncapiPath) : undefined;
    manifest = await importBackstagePack({
      packDir: resolve(backstagePath),
      id,
      version,
      defaultTarget,
      supportedTargets: defaultTarget === 'javascript' ? ['javascript'] : ['python', 'javascript'],
      openapi,
      asyncapi,
    });
    if (displayName) manifest.displayName = displayName;
  } else {
    const openapi = openapiPath ? await readJsonFile<OpenApiDocument>(openapiPath) : undefined;
    const asyncapi = asyncapiPath ? await readJsonFile<AsyncApiDocument>(asyncapiPath) : undefined;
    if (!openapi && !asyncapi) {
      console.error('Provide --openapi, --asyncapi, and/or --backstage');
      process.exit(1);
    }
    manifest = buildEnvironmentManifest({
      id,
      version,
      displayName: displayName ?? id,
      description: `Generated from OpenAPI/AsyncAPI import`,
      defaultTarget,
      supportedTargets: defaultTarget === 'javascript' ? ['javascript'] : ['python', 'javascript'],
      openapi,
      asyncapi,
      hostFiles: [],
    });
  }

  const outPath = resolve(out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`  methods: ${manifest.apiSurface.methods.length}`);
  console.log(`  events: ${manifest.apiSurface.events.length}`);
  console.log(`  hostFiles: ${manifest.hostFiles.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
