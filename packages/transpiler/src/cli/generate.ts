#!/usr/bin/env bun
/**
 * Transpiler CLI: read ProjectSnapshot JSON from stdin, write TranspileResult JSON to stdout.
 *
 * Usage:
 *   echo '{...}' | bun run generate:cli
 *   bun run generate:cli < snapshot.json
 */
import { normalizeProjectSnapshot, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { transpileGraph } from '../generate';

async function readInput(): Promise<string> {
  const fileArg = process.argv[2];
  if (fileArg && fileArg !== '-') {
    return await Bun.file(fileArg).text();
  }
  // Bun.stdin.text() can be empty on some Windows shells; fall back to stream read.
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

  const tabId = snapshot.activeGraphTab || MAIN_GRAPH_CONTAINER_ID;
  const doc = snapshot.documents[tabId];
  if (!doc) {
    console.error(JSON.stringify({ error: `Graph document not found for tab: ${tabId}` }));
    process.exit(1);
  }

  const tab = snapshot.openTabs.find((t) => t.id === tabId);

  const result = transpileGraph({
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType,
    targetLanguage: snapshot.targetLanguage,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: doc.nodes,
    edges: doc.edges,
    tabLabel: tab?.name,
    tabId,
    documents: snapshot.documents,
    environmentId: snapshot.environmentId,
    integration: snapshot.integration,
  });

  process.stdout.write(JSON.stringify(result));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: String(err) }));
  process.exit(1);
});
