#!/usr/bin/env bun
/**
 * Transpiler CLI: read ProjectSnapshot JSON from stdin, write TranspileResult JSON to stdout.
 *
 * Usage:
 *   echo '{...}' | bun run generate:cli
 *   bun run generate:cli < snapshot.json
 *
 * Uses transpileProject — same graph→file emit as the Code panel (U56).
 */
import { normalizeProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from '../generate';

async function readInput(): Promise<string> {
  const fileArg = process.argv[2];
  if (fileArg && fileArg !== '-') {
    return await Bun.file(fileArg).text();
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return '';
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged);
}

async function main(): Promise<void> {
  const input = await readInput();
  if (!input.trim()) {
    console.error(JSON.stringify({ error: 'Expected ProjectSnapshot JSON on stdin' }));
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch {
    console.error(JSON.stringify({ error: 'Invalid JSON input' }));
    process.exit(1);
  }

  const snapshot = normalizeProjectSnapshot(raw);
  if (!snapshot) {
    console.error(JSON.stringify({ error: 'Invalid ProjectSnapshot' }));
    process.exit(1);
  }

  const result = transpileProject({
    projectDetails: snapshot.projectDetails,
    targetLanguage: snapshot.targetLanguage,
    targetFileExtensions: snapshot.targetFileExtensions,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
    openTabs: snapshot.openTabs,
    environmentId: snapshot.environmentId,
    integration: snapshot.integration,
  });

  process.stdout.write(JSON.stringify(result));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: String(err) }));
  process.exit(1);
});
