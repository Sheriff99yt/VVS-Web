import { readFileSync } from 'node:fs';
import * as runtime from 'web-tree-sitter';
import { configureNativeParserAssets } from '../src/nativeParser';

export function configureNativeInventoryRuntime() {
  configureNativeParserAssets({ runtime,
    runtimeWasm: readFileSync(new URL('../node_modules/web-tree-sitter/web-tree-sitter.wasm', import.meta.url)),
    rustGrammar: readFileSync(new URL('../node_modules/tree-sitter-rust/tree-sitter-rust.wasm', import.meta.url)),
    cppGrammar: readFileSync(new URL('../node_modules/tree-sitter-cpp/tree-sitter-cpp.wasm', import.meta.url)),
    gdscriptGrammar: readFileSync(new URL('../vendor/gdscript/tree-sitter-gdscript.wasm', import.meta.url)),
  });
}
