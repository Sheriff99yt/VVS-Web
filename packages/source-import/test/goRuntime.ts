import { readFileSync } from 'node:fs';
import * as runtime from 'web-tree-sitter';
import { configureNativeParserAssets } from '../src/nativeParser';
export function configureGoTestRuntime() {
  configureNativeParserAssets({ runtime, runtimeWasm: readFileSync(new URL('../node_modules/web-tree-sitter/web-tree-sitter.wasm', import.meta.url)), goGrammar: readFileSync(new URL('../node_modules/tree-sitter-go/tree-sitter-go.wasm', import.meta.url)) });
}
