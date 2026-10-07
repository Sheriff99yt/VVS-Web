import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { listNodeDocs } from '../src/lib/nodeDocCatalog';
import { createHash } from 'node:crypto';
import { NATIVE_GRAMMARS, type NativeGrammar } from '../../../packages/source-import/src/nativeGrammarContracts';
const output = join(import.meta.dir, '../out');
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
for (const node of listNodeDocs()) {
  const candidates = [join(output, 'docs/nodes', `${node.kindId}.html`), join(output, 'docs/nodes', node.kindId, 'index.html')];
  const file = candidates.find(existsSync);
  if (!file) throw new Error(`Missing exported node page: ${node.kindId}`);
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<h1') || !html.includes(node.kindId)) throw new Error(`Missing no-JS content: ${node.kindId}`);
  for (const [direction, pins] of [['in', node.inputs], ['out', node.outputs]] as const) for (const pin of pins) {
    if (!html.includes(`id="${escape(direction + '-' + pin.id)}"`)) throw new Error(`Missing port anchor: ${node.kindId}/${pin.id}`);
  }
  for (const option of node.options) if (!html.includes(`id="${escape('opt-' + option.key)}"`)) throw new Error(`Missing option anchor: ${node.kindId}/${option.key}`);
  const twin = JSON.parse(readFileSync(join(output, 'docs/data', `${node.kindId}.json`), 'utf8'));
  if (JSON.stringify(twin.inputs) !== JSON.stringify(node.inputs) || JSON.stringify(twin.outputs) !== JSON.stringify(node.outputs) || JSON.stringify(twin.options) !== JSON.stringify(node.options)) throw new Error(`Registry twin drift: ${node.kindId}`);
}
console.log(`Verified ${listNodeDocs().length} exported HTML pages, port/option anchors and registry twins.`);
const parsers = join(output, 'source-parsers');
const manifest = JSON.parse(readFileSync(join(parsers, 'manifest.json'), 'utf8'));
if (manifest.versions.runtime !== '0.27.0' || manifest.versions.go !== '0.25.0' || manifest.goAbi !== 15 || manifest.versions.csharp !== '0.23.5' || manifest.csharpAbi !== 15) throw new Error('Exported parser pins changed');
if (manifest.files.find((file: { name: string }) => file.name === 'tree-sitter-c_sharp.wasm')?.sha256 !== '6f69e1cae44e1c32c1eccc170dc5a9778fb94ff716f71113fe1f8c4299aa2f40') throw new Error('Exported C# grammar identity changed');
for (const kind of Object.keys(NATIVE_GRAMMARS) as NativeGrammar[]) {
  const pin = NATIVE_GRAMMARS[kind];
  if (manifest.versions[kind] !== pin.version || manifest.abis[kind] !== pin.abi || manifest.files.find((file: { name: string }) => file.name === pin.file)?.sha256 !== pin.sha256) throw new Error(`Exported grammar identity changed: ${kind}`);
}
for (const file of manifest.files) {
  const bytes = readFileSync(join(parsers, file.name));
  if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`Exported parser asset drift: ${file.name}`);
}
const smoke = Bun.spawn(['python', '-u', join(import.meta.dir, 'verify-go-parser-export.py')], { stdout: 'inherit', stderr: 'inherit' });
if (await smoke.exited !== 0) throw new Error('Exported Go worker/base-path verification failed');
