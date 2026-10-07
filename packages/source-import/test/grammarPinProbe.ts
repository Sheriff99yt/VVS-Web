import * as runtime from 'web-tree-sitter';
import { readFileSync } from 'node:fs';
import { configureNativeParserAssets, loadNativeParser } from '../src/nativeParser';
const grammar = readFileSync(new URL('../node_modules/tree-sitter-rust/tree-sitter-rust.wasm', import.meta.url));
const corrupted = new Uint8Array(grammar); corrupted[100] ^= 1;
configureNativeParserAssets({ runtime,
  runtimeWasm: readFileSync(new URL('../node_modules/web-tree-sitter/web-tree-sitter.wasm', import.meta.url)), rustGrammar: corrupted });
try { await loadNativeParser('rust'); throw new Error('Corrupt grammar was accepted'); }
catch (error) { if (!(error instanceof Error) || !error.message.includes('GRAMMAR_PIN')) throw error; }
const shared = new Uint8Array(grammar.length + 4); shared.set(grammar, 2);
configureNativeParserAssets({ rustGrammar: shared.subarray(2, grammar.length + 2) });
await loadNativeParser('rust');
console.log('Corrupt grammar blocked; pinned late reconfiguration recovered');
