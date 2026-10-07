import { readFileSync } from 'node:fs';
import * as runtime from 'web-tree-sitter';
import { configureNativeParserAssets } from '../src/nativeParser';
export function configureCSharpTestRuntime() {
  configureNativeParserAssets({ runtime, runtimeWasm: readFileSync(new URL('../node_modules/web-tree-sitter/web-tree-sitter.wasm', import.meta.url)), csharpGrammar: readFileSync(new URL('../node_modules/tree-sitter-c-sharp/tree-sitter-c_sharp.wasm', import.meta.url)) });
}
