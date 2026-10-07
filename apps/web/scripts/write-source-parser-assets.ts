import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { NATIVE_GRAMMARS, type NativeGrammar } from '../../../packages/source-import/src/nativeGrammarContracts';

const require = createRequire(new URL('../../../packages/source-import/package.json', import.meta.url));
const runtime = dirname(require.resolve('web-tree-sitter'));
const out = join(import.meta.dir, '../public/source-parsers');
mkdirSync(out, { recursive: true });
const entries = [
  ['web-tree-sitter.js', join(runtime, 'web-tree-sitter.js')],
  ['web-tree-sitter.wasm', join(runtime, 'web-tree-sitter.wasm')],
  ['web-tree-sitter.LICENSE', join(runtime, 'LICENSE')],
];
const versions: Record<string, string> = { runtime: JSON.parse(readFileSync(join(runtime, 'package.json'), 'utf8')).version };
const abis: Record<string, number> = {};
if (versions.runtime !== '0.27.0') throw new Error('Parser runtime pin changed');
for (const kind of Object.keys(NATIVE_GRAMMARS) as NativeGrammar[]) {
  const contract = NATIVE_GRAMMARS[kind];
  const root = dirname(dirname(dirname(require.resolve(contract.package))));
  versions[kind] = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  if (versions[kind] !== contract.version) throw new Error(`Parser package pin changed: ${kind}`);
  abis[kind] = contract.abi;
  const source = kind === 'gdscript' ? join(import.meta.dir, '../../../packages/source-import/vendor/gdscript') : root;
  const bytes = readFileSync(join(source, contract.file));
  if (createHash('sha256').update(bytes).digest('hex') !== contract.sha256) throw new Error(`Pinned grammar bytes changed: ${kind}`);
  entries.push([contract.file, join(source, contract.file)], [`${contract.package}.LICENSE`, join(source, 'LICENSE')]);
}
const files = entries.map(([name, source]) => {
  const bytes = readFileSync(source);
  writeFileSync(join(out, name), bytes);
  return { name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ versions, abis, goAbi: abis.go, csharpAbi: abis.csharp, files }, null, 2) + '\n');
console.log(`Pinned source parser assets: ${files.reduce((sum, file) => sum + file.bytes, 0)} bytes`);
